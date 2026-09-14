import { prisma } from "@/lib/prisma";
import type { LotView } from "@/lib/lots";
import { LotsTable } from "./lots-table";

export const dynamic = "force-dynamic";

export default async function MatierePremierePage() {
  // Matière première = lots sortis du séchoir, conditionnés en big bag (chambre froide).
  const lots = await prisma.lot.findMany({
    where: { statut: "BRUT_CHAMBRE_FROIDE" },
    orderBy: { localisation: "asc" },
    include: { parcelle: true },
  });

  const rows: LotView[] = lots.map((l) => ({
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Matière première</h1>
        <p className="text-muted-foreground">
          Lots bruts conditionnés en big bag, rangés en chambre froide.
        </p>
      </div>

      <LotsTable lots={rows} context="matiere" />

      {/* Plan de la chambre froide */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Plan de la chambre froide
        </span>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun emplacement occupé pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {rows.map((l) => (
              <div
                key={l.id}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-2 border-primary bg-card-elevated p-2 text-center"
                title={`${l.reference} — ${l.nbBigBag ?? "?"} big bag`}
              >
                <span className="font-mono text-[10px] uppercase text-accent">{l.localisation ?? "—"}</span>
                <span className="break-all font-mono text-[10px] leading-tight text-foreground">
                  {l.reference}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {l.nbBigBag ?? "?"} bb
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
