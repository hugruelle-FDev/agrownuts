import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { calculerPrevision, type CaisseView, type SechoirConfig } from "@/lib/sechage";
import { formatDateFr } from "@/lib/format";
import { SechoirControls } from "./sechoir-controls";
import { SechoirGrid } from "./sechoir-grid";

export const dynamic = "force-dynamic";

export default async function SechagePage() {
  const sechoir = await prisma.sechoir.findFirst();
  const capacite = sechoir?.capacite ?? 8;
  const cible = sechoir ? Number(sechoir.humiditeCible) : 8;
  const vitesseTheorique = sechoir ? Number(sechoir.vitesseTheorique) : 2;
  const config: SechoirConfig = {
    capacite,
    temperatureC: sechoir?.temperatureC != null ? Number(sechoir.temperatureC) : null,
    soufflerie: sechoir?.soufflerie ?? null,
    humiditeCible: cible,
    vitesseTheorique,
  };

  const lots = await prisma.lot.findMany({
    where: { statut: "SECHOIR" },
    include: { parcelle: true, releves: true },
  });

  const caisseByPlace = new Map<number, CaisseView>();
  const unplaced: { id: string; reference: string }[] = [];

  for (const l of lots) {
    const relevesBruts = l.releves as { id: string; humidite: unknown; date: Date }[];
    const releves = relevesBruts.map((r) => ({
      id: r.id,
      humidite: Number(r.humidite),
      date: r.date.toISOString(),
    }));
    if (l.sechoirPlace == null) {
      unplaced.push({ id: l.id, reference: l.reference });
      continue;
    }
    const p = calculerPrevision({
      humiditeInitiale: Number(l.humiditeAvant),
      releves,
      cible,
      vitesseTheorique,
    });
    caisseByPlace.set(l.sechoirPlace, {
      lotId: l.id,
      reference: l.reference,
      parcelle: l.parcelle.code,
      place: l.sechoirPlace,
      humiditeInitiale: Number(l.humiditeAvant),
      humiditeActuelle: p.humiditeActuelle,
      releves: releves.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      vitesseObservee: p.vitesseObservee,
      termine: p.termine,
      joursRestants: p.joursRestants,
      dateFin: p.dateFin,
    });
  }

  const cells = Array.from({ length: capacite }, (_, i) => {
    const place = i + 1;
    return { place, caisse: caisseByPlace.get(place) ?? null };
  });
  const caisses = [...caisseByPlace.values()].sort((a, b) => a.place - b.place);
  const occupees = caisseByPlace.size;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Gestion du séchage</h1>
        <p className="text-muted-foreground">
          Remplissage du séchoir, humidité par caisse et prévision de fin de séchage.
        </p>
      </div>

      {/* Remplissage + état global */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card-elevated">
          <CardContent className="p-5">
            <div className="font-mono text-2xl font-semibold text-accent">
              {occupees} / {capacite}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Emplacements occupés</div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(occupees / capacite) * 100}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card-elevated">
          <CardContent className="p-5">
            <div className="font-mono text-2xl font-semibold text-accent">
              {config.temperatureC != null ? `${config.temperatureC.toLocaleString("fr-FR")} °C` : "—"}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Température de séchage</div>
          </CardContent>
        </Card>
        <Card className="bg-card-elevated">
          <CardContent className="p-5">
            <div className="font-mono text-2xl font-semibold text-accent">
              {config.soufflerie != null ? `${config.soufflerie} %` : "—"}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Force de soufflerie</div>
          </CardContent>
        </Card>
        <Card className="bg-card-elevated">
          <CardContent className="p-5">
            <div className="font-mono text-2xl font-semibold text-accent">{unplaced.length}</div>
            <div className="mt-1 text-sm text-muted-foreground">Caisses à placer</div>
          </CardContent>
        </Card>
      </div>

      {/* Réglages du séchoir */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Réglages du séchoir
          </span>
          <SechoirControls config={config} />
        </CardContent>
      </Card>

      {/* Grille des emplacements */}
      <SechoirGrid cells={cells} unplaced={unplaced} cible={cible} vitesseTheorique={vitesseTheorique} />

      {/* Liste des caisses en séchage */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Caisses en cours de séchage
        </span>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
            <thead className="bg-card-elevated text-left text-muted-foreground">
              <tr>
                <th>Emplacement</th>
                <th>Caisse</th>
                <th className="text-right">Humidité actuelle</th>
                <th className="text-right">Cible</th>
                <th>Fin prévue</th>
              </tr>
            </thead>
            <tbody>
              {caisses.map((c) => (
                <tr key={c.lotId} className="border-t border-border">
                  <td className="font-mono">#{c.place}</td>
                  <td className="font-mono text-xs">{c.reference}</td>
                  <td className="text-right font-mono">
                    {c.humiditeActuelle.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                  </td>
                  <td className="text-right font-mono text-muted-foreground">
                    {cible.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                  </td>
                  <td>
                    {c.termine ? (
                      <span className="text-success">Terminé</span>
                    ) : c.dateFin ? (
                      <span>
                        {formatDateFr(c.dateFin)}
                        {c.joursRestants !== null && (
                          <span className="text-muted-foreground"> (~{Math.ceil(c.joursRestants)} j)</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {caisses.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Aucune caisse dans le séchoir. Placez un lot « au séchoir » dans un emplacement.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
