import type { LotStatut } from "@prisma/client";

/** Libellé et style d'affichage pour chaque statut de lot. */
export const STATUT_INFO: Record<LotStatut, { label: string; className: string }> = {
  DECLARE: { label: "Déclaré · à valider", className: "border-warning text-warning" },
  SECHOIR: { label: "Au séchoir", className: "border-warning text-warning" },
  BRUT_CHAMBRE_FROIDE: {
    label: "Brut · chambre froide",
    className: "border-muted-foreground text-muted-foreground",
  },
  TRANSFORME_CHAMBRE_FROIDE: {
    label: "Transformé · chambre froide",
    className: "border-accent text-accent",
  },
  PRODUIT_FINI: { label: "Produit fini", className: "border-success text-success" },
};

/** Cycle de vie "stock" (hors déclaration) — utilisé pour la répartition. */
export const STATUT_ORDRE: LotStatut[] = [
  "SECHOIR",
  "BRUT_CHAMBRE_FROIDE",
  "TRANSFORME_CHAMBRE_FROIDE",
  "PRODUIT_FINI",
];

/** Tous les statuts (déclaration incluse) — utilisé pour le sélecteur d'édition. */
export const STATUT_TOUS: LotStatut[] = ["DECLARE", ...STATUT_ORDRE];
