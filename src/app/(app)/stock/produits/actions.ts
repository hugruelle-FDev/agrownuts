"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ProduitFormState = { error?: string; success?: string };

function estConflitUnicite(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

function revalider() {
  revalidatePath("/stock/produits");
  revalidatePath("/stock");
}

/** Transforme un libellé en code court sans accents ni espaces. */
function slug(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const couleurSchema = z
  .string()
  .trim()
  .regex(/^#?[0-9a-fA-F]{6}$/, "Couleur invalide")
  .optional();

/* ----------------------- Mise à jour d'un produit ----------------------- */

const majSchema = z.object({
  id: z.string().min(1),
  quantiteKg: z.coerce.number().min(0, "Quantité invalide"),
  capaciteKg: z.coerce.number().positive("Capacité invalide"),
  paloxKg: z.coerce.number().int().positive().optional(),
  bigBagKg: z.coerce.number().int().positive().optional(),
});

export async function updateProduit(
  _prev: ProduitFormState,
  formData: FormData,
): Promise<ProduitFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") return { error: "Vos droits ne permettent pas cette action." };

  const raw: Record<string, unknown> = Object.fromEntries(formData);
  for (const k of ["paloxKg", "bigBagKg"]) if (raw[k] === "") delete raw[k];
  const parsed = majSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { id, quantiteKg, capaciteKg, paloxKg, bigBagKg } = parsed.data;

  const produit = await prisma.produit.findUnique({ where: { id } });
  if (!produit) return { error: "Produit introuvable." };

  await prisma.produit.update({
    where: { id },
    data: {
      quantiteKg,
      capaciteKg,
      paloxKg: paloxKg ?? null,
      bigBagKg: bigBagKg ?? null,
    },
  });

  await prisma.auditLog
    .create({
      data: {
        entite: "Produit",
        entiteId: id,
        action: "UPDATE",
        ancienneValeur: `${produit.label}: ${produit.quantiteKg} kg`,
        nouvelleValeur: `${produit.label}: ${quantiteKg} kg`,
        userId: session.user.id,
      },
    })
    .catch(() => {});

  revalider();
  return { success: `${produit.label} mis à jour.` };
}

/* ----------------------- Création d'une catégorie ----------------------- */

const createSchema = z.object({
  label: z.string().trim().min(1, "Le nom est requis").max(60, "Nom trop long"),
  couleur: couleurSchema,
  paloxKg: z.coerce.number().int().positive().optional(),
  bigBagKg: z.coerce.number().int().positive().optional(),
});

export async function createProduit(
  _prev: ProduitFormState,
  formData: FormData,
): Promise<ProduitFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") return { error: "Vos droits ne permettent pas cette action." };

  const raw: Record<string, unknown> = Object.fromEntries(formData);
  for (const k of ["paloxKg", "bigBagKg", "couleur"]) if (raw[k] === "") delete raw[k];
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { label, couleur, paloxKg, bigBagKg } = parsed.data;
  let code = slug(label) || "produit";

  // Ordre = dernier + 1.
  const dernier = await prisma.produit.findMany({ orderBy: { ordre: "desc" }, take: 1 });
  const ordre = (dernier[0]?.ordre ?? 0) + 1;

  const couleurNorm = couleur ? (couleur.startsWith("#") ? couleur : `#${couleur}`) : "#8FA678";

  // Code unique : on suffixe si déjà pris.
  for (let i = 0; i < 5; i++) {
    const candidat = i === 0 ? code : `${code}-${i}`;
    try {
      await prisma.produit.create({
        data: {
          code: candidat,
          label,
          couleur: couleurNorm,
          paloxKg: paloxKg ?? null,
          bigBagKg: bigBagKg ?? null,
          ordre,
        },
      });
      revalider();
      return { success: `Catégorie « ${label} » ajoutée.` };
    } catch (e) {
      if (estConflitUnicite(e)) {
        code = slug(label) || "produit";
        continue;
      }
      return { error: "Erreur lors de la création de la catégorie." };
    }
  }
  return { error: "Impossible de générer un code unique." };
}

/* ----------------------- Suppression d'une catégorie ----------------------- */

export async function deleteProduit(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;

  const id = String(formData.get("id") ?? "");
  await prisma.produit.delete({ where: { id } }).catch(() => {});
  revalider();
}
