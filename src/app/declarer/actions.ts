"use server";

import { z } from "zod";
import type { LotStatut } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(1),
  parcelleId: z.string().min(1, "Choisissez une parcelle"),
  dateRecolte: z.string().min(1, "La date est requise"),
  remorque: z.string().trim().min(1, "Choisissez une remorque").max(20),
  chauffeur: z.string().trim().min(1, "Choisissez un chauffeur").max(60),
  poidsPese: z.coerce.number().positive("Le poids doit être positif"),
  deduireTare: z.string().optional(),
  humiditeAvant: z.coerce.number().min(0, "Humidité invalide").max(100, "Humidité invalide"),
  commentaire: z.string().trim().max(500).optional(),
  heureSaisie: z.string().trim().max(5).optional(),
});

export type DeclarationState = { error?: string; reference?: string };

function estConflitUnicite(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}

/**
 * Déclaration publique d'une caisse par un chauffeur (via QR, sans session).
 * Crée un lot au statut DECLARE (en attente de validation par l'admin).
 */
export async function declarerLot(
  _prev: DeclarationState,
  formData: FormData,
): Promise<DeclarationState> {
  const raw: Record<string, unknown> = Object.fromEntries(formData);
  if (raw.commentaire === "") delete raw.commentaire;

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { token, parcelleId, dateRecolte, remorque, chauffeur, poidsPese, deduireTare, humiditeAvant, commentaire, heureSaisie } = parsed.data;

  // Vérification du jeton (sécurise le formulaire public).
  const config = await prisma.appConfig.findFirst();
  if (!config || token !== config.declarationToken) return { error: "Lien invalide ou expiré." };

  const parcelle = await prisma.parcelle.findUnique({ where: { id: parcelleId } });
  if (!parcelle) return { error: "Parcelle introuvable." };

  const date = new Date(dateRecolte);
  if (Number.isNaN(date.getTime())) return { error: "Date de récolte invalide." };

  const debutMois = new Date(date.getFullYear(), date.getMonth(), 1);
  const debutMoisSuivant = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const periode = `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  const remorqueNorm = remorque.toUpperCase();

  // Poids net : on retire la tare de la remorque si le chauffeur l'a demandé.
  let poidsKg = poidsPese;
  if (deduireTare === "1") {
    const rem = await prisma.remorque.findUnique({ where: { code: remorqueNorm } });
    if (rem?.poidsVideKg != null) {
      const net = poidsPese - rem.poidsVideKg;
      if (net <= 0) {
        return {
          error: `Poids net ≤ 0 : le poids pesé (${poidsPese} kg) est inférieur au poids à vide de la remorque (${rem.poidsVideKg} kg).`,
        };
      }
      poidsKg = Math.round(net * 100) / 100;
    }
  }

  for (let t = 0; t < 5; t++) {
    const dejaCreees = await prisma.lot.count({
      where: { parcelleId, dateRecolte: { gte: debutMois, lt: debutMoisSuivant } },
    });
    const numero = dejaCreees + 1 + t;
    const reference = `LOT-${parcelle.code}-${periode}-${remorqueNorm}-${numero}`;
    try {
      const lot = await prisma.lot.create({
        data: {
          reference,
          parcelleId,
          dateRecolte: date,
          remorque: remorqueNorm,
          numeroChargement: numero,
          poidsKg,
          humiditeAvant,
          statut: "DECLARE" as LotStatut,
          chauffeur,
          commentaire: commentaire ?? null,
          heureSaisie: heureSaisie && heureSaisie.length > 0 ? heureSaisie : null,
        },
      });
      await prisma.auditLog
        .create({
          data: {
            entite: "Lot",
            entiteId: lot.id,
            action: "DECLARATION",
            nouvelleValeur: `${reference} — ${chauffeur}`,
          },
        })
        .catch(() => {});
      return { reference };
    } catch (e) {
      if (estConflitUnicite(e)) continue;
      return { error: "Erreur lors de l'enregistrement, réessayez." };
    }
  }
  return { error: "Impossible de générer un numéro unique, réessayez." };
}
