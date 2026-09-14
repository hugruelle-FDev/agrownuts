"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Remorque avec sa tare éventuelle, telle que transmise au formulaire. */
export type RemorqueTare = { code: string; poidsVideKg: number | null };

/** Arrondi propre à 2 décimales (évite les 12.340000001). */
function arrondi(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Saisie du poids d'une caisse avec gestion **visible et modulable** de la tare.
 *
 * Objectif : certains chauffeurs retirent déjà le poids de la remorque avant de
 * saisir, d'autres recopient simplement le poids affiché sur la balance. Pour
 * éviter toute ambiguïté, dès qu'un poids à vide est défini pour la remorque
 * sélectionnée, on affiche deux choix explicites et on montre en direct le
 * **poids net** qui sera réellement enregistré.
 *
 * Le composant transmet au serveur :
 *  - `poidsPese`   : le poids saisi par le chauffeur ;
 *  - `deduireTare` : "1" si le poids à vide doit être retiré, sinon "0".
 * Le calcul du poids net final est refait côté serveur (source de vérité).
 */
export function PoidsCaisse({
  remorqueCode,
  remorques,
}: {
  remorqueCode: string;
  remorques: RemorqueTare[];
}) {
  const [poids, setPoids] = useState("");
  // Par défaut, on suppose que le poids saisi inclut la remorque (cas du
  // chauffeur qui recopie la balance sans réfléchir) : la tare est déduite.
  const [deduire, setDeduire] = useState(true);

  const tare = useMemo(() => {
    const r = remorques.find((x) => x.code === remorqueCode);
    return r?.poidsVideKg ?? null;
  }, [remorqueCode, remorques]);

  const saisi = poids.trim() === "" ? null : Number(poids.replace(",", "."));
  const saisiValide = saisi !== null && Number.isFinite(saisi) && saisi > 0;
  const doitDeduire = tare !== null && deduire;
  const net = saisiValide ? (doitDeduire ? saisi! - tare! : saisi!) : null;
  const netInvalide = net !== null && net <= 0;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="poidsPese">
        {tare !== null ? "Poids pesé (lecture balance)" : "Poids de la remorque"}
      </Label>
      <Input
        id="poidsPese"
        name="poidsPese"
        type="number"
        step="0.01"
        min="0"
        placeholder="kg"
        value={poids}
        onChange={(e) => setPoids(e.target.value)}
        required
      />
      {/* Choix transmis au serveur (recalcul du net côté serveur). */}
      <input type="hidden" name="deduireTare" value={doitDeduire ? "1" : "0"} />

      {tare !== null ? (
        <div className="mt-1 flex flex-col gap-2 rounded-md border border-border bg-card-elevated p-3">
          <p className="text-xs text-muted-foreground">
            Remorque <span className="font-mono font-semibold text-foreground">{remorqueCode}</span> —
            poids à vide : <span className="font-semibold text-foreground">{tare} kg</span>
          </p>

          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="radio"
              name="__tareChoice"
              className="mt-1 accent-[var(--primary)]"
              checked={deduire}
              onChange={() => setDeduire(true)}
            />
            <span>
              Le poids que je saisis <strong>inclut le poids de la remorque</strong> — retirer{" "}
              {tare} kg automatiquement.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="radio"
              name="__tareChoice"
              className="mt-1 accent-[var(--primary)]"
              checked={!deduire}
              onChange={() => setDeduire(false)}
            />
            <span>
              J&apos;ai <strong>déjà retiré</strong> le poids de la remorque — enregistrer tel quel.
            </span>
          </label>

          {saisiValide && !netInvalide && (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
              Poids net enregistré : {arrondi(net!)} kg
              {doitDeduire ? ` (${arrondi(saisi!)} − ${tare})` : " (aucune déduction)"}
            </p>
          )}
          {netInvalide && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
              Poids net ≤ 0 : vérifie le poids saisi ou décoche la déduction.
            </p>
          )}
        </div>
      ) : (
        remorqueCode !== "" && (
          <span className="text-xs text-muted-foreground">
            Aucun poids à vide défini pour cette remorque : le poids est enregistré tel quel.
          </span>
        )
      )}
    </div>
  );
}
