"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LotStatut } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STATUTS_VALIDES = [
  "DECLARE",
  "SECHOIR",
  "BRUT_CHAMBRE_FROIDE",
  "TRANSFORME_CHAMBRE_FROIDE",
  "PRODUIT_FINI",
] as const;

const lotSchema = z.object({
  parcelleId: z.string().min(1, "Choisissez une parcelle"),
  dateRecolte: z.string().min(1, "La date de récolte est requise"),
  remorque: z.string().trim().min(1, "Choisissez une remorque").max(20),
  poidsKg: z.coerce.number().positive("Le poids doit être positif"),
  humiditeAvant: z.coerce
    .number()
    .min(0, "Humidité invalide")
    .max(100, "L'humidité ne peut dépasser 100 %"),
});

export type LotFormState = { error?: string; success?: string };

function estConflitUnicite(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

/** Bornes du mois d'une date (1er du mois → 1er du mois suivant). */
function bornesMois(date: Date): { debut: Date; fin: Date; periode: string } {
  const debut = new Date(date.getFullYear(), date.getMonth(), 1);
  const fin = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const periode = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  return { debut, fin, periode };
}

/**
 * Propose le prochain numéro de chargement pour une parcelle et une date
 * (rang de la caisse dans la récolte du mois). Utilisé par le formulaire pour
 * pré-remplir le champ — l'utilisateur peut ensuite le modifier.
 */
export async function suggererNumero(parcelleId: string, dateRecolte: string): Promise<number> {
  if (!parcelleId || !dateRecolte) return 1;
  const date = new Date(dateRecolte);
  if (Number.isNaN(date.getTime())) return 1;
  const { debut, fin } = bornesMois(date);
  const dejaCreees = await prisma.lot.count({
    where: { parcelleId, dateRecolte: { gte: debut, lt: fin } },
  });
  return dejaCreees + 1;
}

/**
 * Crée un lot. La référence LOT-<Parcelle>-<MM/AAAA>-<Remorque>-<Numéro> est
 * générée automatiquement. Le numéro est proposé automatiquement (une caisse =
 * un numéro) mais peut être imposé par l'utilisateur via le formulaire.
 */
export async function createLot(
  _prev: LotFormState,
  formData: FormData,
): Promise<LotFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") {
    return { error: "Vos droits ne permettent pas de créer un lot." };
  }

  const parsed = lotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { parcelleId, dateRecolte, remorque, poidsKg, humiditeAvant } = parsed.data;

  // Numéro éventuellement imposé par l'utilisateur (champ éditable).
  const numeroRaw = formData.get("numeroChargement");
  let numeroImpose: number | null = null;
  if (typeof numeroRaw === "string" && numeroRaw.trim() !== "") {
    const n = Number(numeroRaw);
    if (!Number.isInteger(n) || n <= 0) return { error: "Numéro de chargement invalide." };
    numeroImpose = n;
  }

  const parcelle = await prisma.parcelle.findUnique({ where: { id: parcelleId } });
  if (!parcelle) return { error: "Parcelle introuvable." };

  const date = new Date(dateRecolte);
  if (Number.isNaN(date.getTime())) return { error: "Date de récolte invalide." };

  const { debut, fin, periode } = bornesMois(date);
  const remorqueNorm = remorque.toUpperCase();

  // Enregistre un lot avec un numéro donné (référence + audit).
  const creer = async (numero: number) => {
    const reference = `LOT-${parcelle.code}-${periode}-${remorqueNorm}-${numero}`;
    const lot = await prisma.lot.create({
      data: {
        reference,
        parcelleId,
        dateRecolte: date,
        remorque: remorqueNorm,
        numeroChargement: numero,
        poidsKg,
        humiditeAvant,
        createdById: session.user.id,
      },
    });
    await prisma.auditLog
      .create({
        data: {
          entite: "Lot",
          entiteId: lot.id,
          action: "CREATE",
          nouvelleValeur: reference,
          userId: session.user.id,
        },
      })
      .catch(() => {});
    return reference;
  };

  // Cas 1 : l'utilisateur a imposé un numéro → on le respecte, sans l'incrémenter.
  if (numeroImpose !== null) {
    try {
      const reference = await creer(numeroImpose);
      revalidatePath("/stock");
      revalidatePath("/stock/lots");
      return { success: `Lot ${reference} créé.` };
    } catch (e) {
      if (estConflitUnicite(e)) {
        return {
          error: `Le numéro ${numeroImpose} est déjà utilisé pour ${parcelle.code} en ${periode}.`,
        };
      }
      return { error: "Erreur lors de la création du lot." };
    }
  }

  // Cas 2 : numéro automatique → on compte puis on retente en cas de collision.
  for (let tentative = 0; tentative < 5; tentative++) {
    const dejaCreees = await prisma.lot.count({
      where: { parcelleId, dateRecolte: { gte: debut, lt: fin } },
    });
    const numero = dejaCreees + 1 + tentative;
    try {
      const reference = await creer(numero);
      revalidatePath("/stock");
      revalidatePath("/stock/lots");
      return { success: `Lot ${reference} créé.` };
    } catch (e) {
      if (estConflitUnicite(e)) continue;
      return { error: "Erreur lors de la création du lot." };
    }
  }

  return { error: "Impossible de générer un numéro unique, veuillez réessayer." };
}

/**
 * Modifie un lot existant. Si la parcelle, la date, la remorque ou le numéro
 * changent, la référence est régénérée en conséquence. En cas de succès, on
 * redirige vers la liste des lots.
 */
export async function updateLot(
  _prev: LotFormState,
  formData: FormData,
): Promise<LotFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") {
    return { error: "Vos droits ne permettent pas de modifier un lot." };
  }

  const id = String(formData.get("lotId") ?? "");
  if (!id) return { error: "Lot introuvable." };

  const parsed = lotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { parcelleId, dateRecolte, remorque, poidsKg, humiditeAvant } = parsed.data;

  const numeroRaw = formData.get("numeroChargement");
  const numero = typeof numeroRaw === "string" ? Number(numeroRaw) : Number.NaN;
  if (!Number.isInteger(numero) || numero <= 0) {
    return { error: "Numéro de chargement invalide." };
  }

  const parcelle = await prisma.parcelle.findUnique({ where: { id: parcelleId } });
  if (!parcelle) return { error: "Parcelle introuvable." };

  const date = new Date(dateRecolte);
  if (Number.isNaN(date.getTime())) return { error: "Date de récolte invalide." };

  const { periode } = bornesMois(date);
  const remorqueNorm = remorque.toUpperCase();
  const reference = `LOT-${parcelle.code}-${periode}-${remorqueNorm}-${numero}`;

  const statutRaw = String(formData.get("statut") ?? "");
  const statut = (STATUTS_VALIDES as readonly string[]).includes(statutRaw)
    ? (statutRaw as LotStatut)
    : undefined;

  try {
    await prisma.lot.update({
      where: { id },
      data: {
        reference,
        parcelleId,
        dateRecolte: date,
        remorque: remorqueNorm,
        numeroChargement: numero,
        poidsKg,
        humiditeAvant,
        ...(statut ? { statut } : {}),
      },
    });
  } catch (e) {
    if (estConflitUnicite(e)) return { error: `La référence ${reference} existe déjà.` };
    return { error: "Erreur lors de la modification du lot." };
  }

  await prisma.auditLog
    .create({
      data: {
        entite: "Lot",
        entiteId: id,
        action: "UPDATE",
        nouvelleValeur: reference,
        userId: session.user.id,
      },
    })
    .catch(() => {});

  revalidatePath("/stock");
  revalidatePath("/stock/lots");
  redirect("/stock/lots");
}

/** Supprime un lot (avec trace dans le journal d'audit). */
export async function deleteLot(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;

  const id = String(formData.get("id") ?? "");
  const lot = await prisma.lot.findUnique({ where: { id } });
  if (!lot) return;

  // On ne supprime pas un lot déjà transformé (traçabilité brut → produits).
  const nbTransfo = await prisma.transformation.count({ where: { lotId: id } });
  if (nbTransfo > 0) return;

  await prisma.lot.delete({ where: { id } }).catch(() => {});
  await prisma.auditLog
    .create({
      data: {
        entite: "Lot",
        entiteId: id,
        action: "DELETE",
        ancienneValeur: lot.reference,
        userId: session.user.id,
      },
    })
    .catch(() => {});

  revalidatePath("/stock");
  revalidatePath("/stock/lots");
}

/**
 * Transforme un lot brut en produits : crée une transformation traçable
 * (quelles quantités de quels produits), crédite le stock de chaque produit,
 * et passe le lot au statut « transformé ». Redirige vers la liste des lots.
 */
export async function transformerLot(
  _prev: LotFormState,
  formData: FormData,
): Promise<LotFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") {
    return { error: "Vos droits ne permettent pas de transformer un lot." };
  }

  const lotId = String(formData.get("lotId") ?? "");
  const lot = await prisma.lot.findUnique({ where: { id: lotId } });
  if (!lot) return { error: "Lot introuvable." };

  // Une quantité par produit (champ "qty_<produitId>").
  const produits = await prisma.produit.findMany();
  const lignes: { produitId: string; quantiteKg: number }[] = [];
  for (const p of produits) {
    const raw = formData.get(`qty_${p.id}`);
    if (typeof raw === "string" && raw.trim() !== "") {
      const n = Number(raw.replace(",", "."));
      if (Number.isNaN(n) || n < 0) return { error: `Quantité invalide pour ${p.label}.` };
      if (n > 0) lignes.push({ produitId: p.id, quantiteKg: n });
    }
  }
  if (lignes.length === 0) return { error: "Indiquez au moins une quantité de produit." };

  const transfo = await prisma.transformation.create({
    data: { lotId, createdById: session.user.id },
  });

  for (const l of lignes) {
    await prisma.transformationLigne.create({
      data: { transformationId: transfo.id, produitId: l.produitId, quantiteKg: l.quantiteKg },
    });
    await prisma.produit.update({
      where: { id: l.produitId },
      data: { quantiteKg: { increment: l.quantiteKg } },
    });
  }

  await prisma.lot.update({
    where: { id: lotId },
    data: { statut: "TRANSFORME_CHAMBRE_FROIDE" as LotStatut },
  });

  const totalProduit = lignes.reduce((s, l) => s + l.quantiteKg, 0);
  await prisma.auditLog
    .create({
      data: {
        entite: "Lot",
        entiteId: lotId,
        action: "TRANSFORM",
        ancienneValeur: lot.reference,
        nouvelleValeur: `${totalProduit} kg de produits`,
        userId: session.user.id,
      },
    })
    .catch(() => {});

  revalidatePath("/stock");
  revalidatePath("/stock/lots");
  revalidatePath("/stock/produits");
  redirect("/stock/lots");
}

const conditionnementSchema = z.object({
  lotId: z.string().min(1),
  nbBigBag: z.coerce.number().int().positive("Nombre de big bag invalide"),
  localisation: z.string().trim().min(1, "La localisation est requise").max(30, "Localisation trop longue"),
});

/**
 * Conditionnement : sortie du séchoir → mise en big bag + rangement en chambre
 * froide. Le lot passe au statut « brut chambre froide » et apparaît alors dans
 * l'onglet Matière première. Redirige vers cette liste.
 */
export async function conditionnerLot(
  _prev: LotFormState,
  formData: FormData,
): Promise<LotFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") {
    return { error: "Vos droits ne permettent pas cette action." };
  }

  const parsed = conditionnementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { lotId, nbBigBag, localisation } = parsed.data;

  const lot = await prisma.lot.findUnique({ where: { id: lotId } });
  if (!lot) return { error: "Lot introuvable." };

  await prisma.lot.update({
    where: { id: lotId },
    data: {
      statut: "BRUT_CHAMBRE_FROIDE" as LotStatut,
      nbBigBag,
      localisation: localisation.toUpperCase(),
    },
  });

  await prisma.auditLog
    .create({
      data: {
        entite: "Lot",
        entiteId: lotId,
        action: "CONDITIONNEMENT",
        nouvelleValeur: `${nbBigBag} big bag · ${localisation.toUpperCase()}`,
        userId: session.user.id,
      },
    })
    .catch(() => {});

  revalidatePath("/stock");
  revalidatePath("/stock/lots");
  redirect("/stock/lots");
}
