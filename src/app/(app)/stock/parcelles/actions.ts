"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const parcelleSchema = z.object({
  code: z.string().trim().min(1, "Le code est requis").max(10, "Code trop long (10 max)"),
  nom: z.string().trim().max(100).optional(),
});

export type ParcelleFormState = { error?: string; success?: string };

/** Vrai si l'erreur Prisma est une violation de contrainte d'unicité. */
function estConflitUnicite(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

/** Crée une parcelle (code unique, en majuscules). */
export async function createParcelle(
  _prev: ParcelleFormState,
  formData: FormData,
): Promise<ParcelleFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") return { error: "Vos droits ne permettent pas cette action." };

  const parsed = parcelleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const code = parsed.data.code.toUpperCase();
  const nom = parsed.data.nom && parsed.data.nom.length > 0 ? parsed.data.nom : null;

  try {
    await prisma.parcelle.create({ data: { code, nom } });
  } catch (e) {
    if (estConflitUnicite(e)) return { error: `La parcelle « ${code} » existe déjà.` };
    return { error: "Erreur lors de la création de la parcelle." };
  }

  revalidatePath("/stock/parcelles");
  revalidatePath("/stock/lots/nouveau");
  return { success: `Parcelle « ${code} » ajoutée.` };
}

/** Active / désactive une parcelle (une parcelle inactive n'apparaît plus dans le formulaire de lot). */
export async function toggleParcelle(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;

  const id = String(formData.get("id") ?? "");
  const parcelle = await prisma.parcelle.findUnique({ where: { id } });
  if (!parcelle) return;

  await prisma.parcelle.update({ where: { id }, data: { actif: !parcelle.actif } });
  revalidatePath("/stock/parcelles");
  revalidatePath("/stock/lots/nouveau");
}
