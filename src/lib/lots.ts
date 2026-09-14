import type { LotStatut } from "@prisma/client";

/**
 * Représentation "plate" d'un lot, sérialisable, passée du serveur au client
 * (on convertit les Decimal Prisma en nombres et les dates en chaînes ISO).
 */
export type LotView = {
  id: string;
  reference: string;
  parcelle: string;
  dateRecolte: string;
  remorque: string;
  numero: number;
  poidsKg: number;
  humidite: number;
  statut: LotStatut;
  nbBigBag: number | null;
  localisation: string | null;
};
