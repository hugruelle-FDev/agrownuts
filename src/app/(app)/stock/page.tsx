import { prisma } from "@/lib/prisma";
import type { LotView } from "@/lib/lots";
import type { LotStatut } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { LotsTable } from "./lots/lots-table";
import { RepartitionBar, type Segment } from "@/components/repartition-bar";
import { STATUT_INFO, STATUT_ORDRE } from "@/lib/lot-statut";
import { formatKg } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUT_COULEUR: Record<LotStatut, string> = {
  DECLARE: "var(--muted-foreground)",
  SECHOIR: "var(--warning)",
  BRUT_CHAMBRE_FROIDE: "var(--muted-foreground)",
  TRANSFORME_CHAMBRE_FROIDE: "var(--accent)",
  PRODUIT_FINI: "var(--success)",
};

export default async function StockOverview() {
  const [allLots, nbParcelles, produits] = await Promise.all([
    prisma.lot.findMany({
      where: { statut: { not: "DECLARE" } },
      orderBy: { createdAt: "desc" },
      include: { parcelle: true },
    }),
    prisma.parcelle.count({ where: { actif: true } }),
    prisma.produit.findMany({
      orderBy: [{ ordre: "asc" }, { code: "asc" }],
      select: { id: true, label: true, couleur: true, quantiteKg: true },
    }),
  ]);

  const nbLots = allLots.length;
  const nbSechoir = allLots.filter((l) => l.statut === "SECHOIR").length;
  const poidsTotal = allLots.reduce((s, l) => s + Number(l.poidsKg), 0);
  const poidsTransforme = produits.reduce((s, p) => s + Number(p.quantiteKg), 0);

  const rows: LotView[] = allLots.map((l) => ({
    id: l.id,
    reference: l.reference,
    parcelle: l.parcelle.code,
    dateRecolte: l.dateRecolte.toISOString(),
    remorque: l.remorque,
    numero: l.numeroChargement,
    poidsKg: Number(l.poidsKg),
    humidite: Number(l.humiditeAvant),
    statut: l.statut,
    nbBigBag: l.nbBigBag,
    localisation: l.localisation,
  }));

  const statutSegments: Segment[] = STATUT_ORDRE.map((s) => ({
    label: STATUT_INFO[s].label,
    value: allLots.filter((l) => l.statut === s).reduce((a, l) => a + Number(l.poidsKg), 0),
    color: STATUT_COULEUR[s],
  }));

  const produitSegments: Segment[] = produits.map((p) => ({
    label: p.label,
    value: Number(p.quantiteKg),
    color: p.couleur,
  }));

  const kpis = [
    { label: "Lots enregistrés", valeur: nbLots.toLocaleString("fr-FR") },
    { label: "Lots au séchoir", valeur: nbSechoir.toLocaleString("fr-FR") },
    { label: "Matière brute", valeur: formatKg(poidsTotal) },
    { label: "Produits transformés", valeur: formatKg(poidsTransforme) },
    { label: "Parcelles actives", valeur: nbParcelles.toLocaleString("fr-FR") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Vue d&apos;ensemble</h1>
        <p className="text-muted-foreground">Tous les lots, du séchoir au produit fini.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="bg-card-elevated">
            <CardContent className="p-5">
              <div className="font-mono text-2xl font-semibold text-accent">{k.valeur}</div>
              <div className="mt-1 text-sm text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-5">
          <RepartitionBar title="Matière par statut" segments={statutSegments} />
          <RepartitionBar title="Produits transformés par catégorie" segments={produitSegments} />
        </CardContent>
      </Card>

      <LotsTable lots={rows} context="overview" />
    </div>
  );
}
