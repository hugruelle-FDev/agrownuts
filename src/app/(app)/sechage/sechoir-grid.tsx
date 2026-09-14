"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDateFr } from "@/lib/format";
import type { CaisseView } from "@/lib/sechage";
import { ajouterReleve, placerCaisse, retirerCaisse } from "./actions";

type Cell = { place: number; caisse: CaisseView | null };
type UnplacedLot = { id: string; reference: string };

function progression(c: CaisseView, cible: number): number {
  const denom = c.humiditeInitiale - cible;
  if (denom <= 0) return 1;
  return Math.min(1, Math.max(0, (c.humiditeInitiale - c.humiditeActuelle) / denom));
}

function ReleveSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "…" : "Ajouter le relevé"}
    </Button>
  );
}

function ReleveForm({ lotId }: { lotId: string }) {
  const [state, formAction] = useFormState(ajouterReleve, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="lotId" value={lotId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="humidite">Nouveau relevé d&apos;humidité</Label>
        <Input id="humidite" name="humidite" type="number" step="0.1" min="0" max="100" placeholder="%" className="w-32" required />
      </div>
      <ReleveSubmit />
      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-success">{state.success}</p>}
    </form>
  );
}

export function SechoirGrid({
  cells,
  unplaced,
  cible,
  vitesseTheorique,
}: {
  cells: Cell[];
  unplaced: UnplacedLot[];
  cible: number;
  vitesseTheorique: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const cell = cells.find((c) => c.place === selected) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {cells.map((c) => {
          const actif = selected === c.place;
          const caisse = c.caisse;
          const prog = caisse ? progression(caisse, cible) : 0;
          return (
            <button
              key={c.place}
              onClick={() => setSelected(actif ? null : c.place)}
              className={cn(
                "flex aspect-square flex-col rounded-lg border-2 p-2 text-left transition-colors",
                caisse ? "bg-card-elevated" : "border-dashed bg-transparent",
                actif ? "border-primary" : "border-border hover:border-muted-foreground",
              )}
            >
              <span className="font-mono text-[10px] text-muted-foreground">#{c.place}</span>
              {caisse ? (
                <>
                  <span className="mt-1 break-all font-mono text-[10px] leading-tight">{caisse.reference}</span>
                  <span className="mt-auto font-mono text-sm font-semibold text-accent">
                    {caisse.humiditeActuelle.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                  </span>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${prog * 100}%` }} />
                  </div>
                  {caisse.termine && <span className="mt-1 text-[10px] text-success">Terminé</span>}
                </>
              ) : (
                <span className="m-auto text-xs text-muted-foreground">Vide</span>
              )}
            </button>
          );
        })}
      </div>

      {selected !== null && cell && (
        <Card style={cell.caisse ? { borderColor: "var(--primary)" } : undefined}>
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Emplacement #{cell.place}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)} aria-label="Fermer">
                ✕
              </Button>
            </div>

            {cell.caisse ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Info label="Caisse" value={cell.caisse.reference} mono />
                  <Info label="Humidité initiale" value={`${cell.caisse.humiditeInitiale.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`} />
                  <Info label="Humidité actuelle" value={`${cell.caisse.humiditeActuelle.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`} accent />
                  <Info
                    label="Vitesse retenue"
                    value={`${(cell.caisse.vitesseObservee ?? vitesseTheorique).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %/j${cell.caisse.vitesseObservee ? " (observée)" : " (théorique)"}`}
                  />
                </div>

                <div className="rounded-md border border-border bg-card-elevated px-4 py-3 text-sm">
                  {cell.caisse.termine ? (
                    <span className="text-success">Séchage terminé (humidité ≤ cible).</span>
                  ) : cell.caisse.dateFin ? (
                    <span>
                      Fin de séchage prévue le{" "}
                      <strong>{formatDateFr(cell.caisse.dateFin)}</strong>
                      {cell.caisse.joursRestants !== null && (
                        <span className="text-muted-foreground">
                          {" "}
                          (~{Math.ceil(cell.caisse.joursRestants)} j)
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Prévision indisponible — ajoutez un relevé ou définissez une vitesse théorique.
                    </span>
                  )}
                </div>

                <ReleveForm key={cell.caisse.lotId} lotId={cell.caisse.lotId} />

                {cell.caisse.releves.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Historique</span>
                    <div className="flex flex-wrap gap-2">
                      {cell.caisse.releves.map((r) => (
                        <span key={r.id} className="rounded-md border border-border px-2 py-1 font-mono text-xs">
                          {formatDateFr(r.date)} · {r.humidite.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <form action={retirerCaisse} className="border-t border-border pt-3">
                  <input type="hidden" name="lotId" value={cell.caisse.lotId} />
                  <Button type="submit" variant="ghost" size="sm" className="text-danger hover:bg-muted">
                    Retirer du séchoir
                  </Button>
                </form>
              </>
            ) : unplaced.length > 0 ? (
              <form action={placerCaisse} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="place" value={cell.place} />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lotId">Placer une caisse</Label>
                  <Select id="lotId" name="lotId" defaultValue="" required className="min-w-[220px]">
                    <option value="" disabled>
                      Choisir un lot au séchoir…
                    </option>
                    {unplaced.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.reference}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button type="submit">Placer</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune caisse au séchoir à placer. Les lots créés (statut « au séchoir ») apparaîtront ici.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-sm", mono && "font-mono", accent && "font-semibold text-accent")}>{value}</div>
    </div>
  );
}
