"use server";

import { z } from "zod";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const refSchema = z.object({
  code: z.string().trim().min(1, "Le code est requis").max(10, "Code trop long (10 max)"),
  nom: z.string().trim().max(100).optional(),
});

const remorqueSchema = z.object({
  code: z.string().trim().min(1, "Le code est requis").max(10, "Code trop long (10 max)"),
  poidsVide: z.coerce
    .number()
    .int("Le poids à vide doit être un nombre entier")
    .min(0, "Le poids à vide doit être positif")
    .max(100000, "Poids à vide invalide")
    .optional(),
  nom: z.string().trim().max(100).optional(),
});

export type RefFormState = { error?: string; success?: string };

function estConflitUnicite(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

function revalider() {
  revalidatePath("/stock/parametres");
  revalidatePath("/stock/lots/nouveau");
}

/* ----------------------------- Parcelles ----------------------------- */

export async function createParcelle(
  _prev: RefFormState,
  formData: FormData,
): Promise<RefFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") return { error: "Vos droits ne permettent pas cette action." };

  const parsed = refSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const code = parsed.data.code.toUpperCase();
  const nom = parsed.data.nom && parsed.data.nom.length > 0 ? parsed.data.nom : null;

  try {
    await prisma.parcelle.create({ data: { code, nom } });
  } catch (e) {
    if (estConflitUnicite(e)) return { error: `La parcelle « ${code} » existe déjà.` };
    return { error: "Erreur lors de la création de la parcelle." };
  }
  revalider();
  return { success: `Parcelle « ${code} » ajoutée.` };
}

export async function deleteParcelle(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;

  const id = String(formData.get("id") ?? "");
  // Sécurité : on ne supprime pas une parcelle rattachée à des lots (traçabilité).
  const nbLots = await prisma.lot.count({ where: { parcelleId: id } });
  if (nbLots > 0) return;

  await prisma.parcelle.delete({ where: { id } }).catch(() => {});
  revalider();
}

/* ----------------------------- Remorques ----------------------------- */

export async function createRemorque(
  _prev: RefFormState,
  formData: FormData,
): Promise<RefFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") return { error: "Vos droits ne permettent pas cette action." };

  // Un champ « poids à vide » vide ne doit pas être interprété comme 0 :
  // on le retire avant validation pour le stocker en null (pas de tare définie).
  const brut = Object.fromEntries(formData) as Record<string, unknown>;
  if (typeof brut.poidsVide === "string" && brut.poidsVide.trim() === "") delete brut.poidsVide;

  const parsed = remorqueSchema.safeParse(brut);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const code = parsed.data.code.toUpperCase();
  const poidsVideKg = parsed.data.poidsVide ?? null;
  const nom = parsed.data.nom && parsed.data.nom.length > 0 ? parsed.data.nom : null;

  try {
    await prisma.remorque.create({ data: { code, poidsVideKg, nom } });
  } catch (e) {
    if (estConflitUnicite(e)) return { error: `La remorque « ${code} » existe déjà.` };
    return { error: "Erreur lors de la création de la remorque." };
  }
  revalider();
  return { success: `Remorque « ${code} » ajoutée.` };
}

export async function deleteRemorque(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;

  const id = String(formData.get("id") ?? "");
  // Les lots existants conservent le code de la remorque (pas de clé étrangère) :
  // on peut donc supprimer une remorque sans casser l'historique.
  await prisma.remorque.delete({ where: { id } }).catch(() => {});
  revalider();
}

/* ----------------------------- Chauffeurs ----------------------------- */

const chauffeurSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis").max(60, "Nom trop long"),
});

export async function createChauffeur(
  _prev: RefFormState,
  formData: FormData,
): Promise<RefFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") return { error: "Vos droits ne permettent pas cette action." };

  const parsed = chauffeurSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const nom = parsed.data.nom;
  try {
    await prisma.chauffeur.create({ data: { nom } });
  } catch (e) {
    if (estConflitUnicite(e)) return { error: `Le chauffeur « ${nom} » existe déjà.` };
    return { error: "Erreur lors de la création du chauffeur." };
  }
  revalidatePath("/stock/parametres");
  revalidatePath("/declarer");
  return { success: `Chauffeur « ${nom} » ajouté.` };
}

export async function deleteChauffeur(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;
  const id = String(formData.get("id") ?? "");
  await prisma.chauffeur.delete({ where: { id } }).catch(() => {});
  revalidatePath("/stock/parametres");
  revalidatePath("/declarer");
}

/* ----------------------------- Jeton du formulaire public ----------------------------- */

export async function regenererJeton(): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;
  const token = randomBytes(24).toString("hex");
  const config = await prisma.appConfig.findFirst();
  if (config) {
    await prisma.appConfig.update({ where: { id: config.id }, data: { declarationToken: token } });
  } else {
    await prisma.appConfig.create({ data: { declarationToken: token } });
  }
  revalidatePath("/stock/parametres");
}

/* --------------------------- Zone de danger (admin) --------------------------- */

function revaliderTout() {
  for (const p of [
    "/stock",
    "/stock/lots",
    "/stock/produits",
    "/stock/historique",
    "/stock/parametres",
    "/sechage",
  ]) {
    revalidatePath(p);
  }
}

/** Efface toutes les données opérationnelles (lots, relevés, transformations, audit),
 *  remet les stocks produits à 0 et le séchoir à vide. Garde parcelles, remorques,
 *  catégories de produits et comptes. Admin uniquement. */
export async function reinitialiserDonnees(): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  await prisma.releveSechage.deleteMany({});
  await prisma.transformationLigne.deleteMany({});
  await prisma.transformation.deleteMany({});
  await prisma.lot.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.produit.updateMany({ data: { quantiteKg: 0 } });
  await prisma.sechoir.updateMany({ data: { temperatureC: null, soufflerie: null } });

  revaliderTout();
}

/** Réinitialisation totale : en plus de `reinitialiserDonnees`, efface les
 *  parcelles, remorques et catégories de produits. Ne garde que les comptes. */
export async function reinitialiserTout(): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  await prisma.releveSechage.deleteMany({});
  await prisma.transformationLigne.deleteMany({});
  await prisma.transformation.deleteMany({});
  await prisma.lot.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.produit.deleteMany({});
  await prisma.parcelle.deleteMany({});
  await prisma.remorque.deleteMany({});
  await prisma.sechoir.updateMany({ data: { temperatureC: null, soufflerie: null } });

  revaliderTout();
}
