"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LotView } from "@/lib/lots";
import { STATUT_INFO } from "@/lib/lot-statut";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDateFr, formatKg, formatPourcent } from "@/lib/format";
import { deleteLot } from "./actions";

type Context = "overview" | "matiere";

function ActionsCell({ lot, context }: { lot: LotView; context: Context }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {context === "overview" && lot.statut === "SECHOIR" && (
        <Link href={`/stock/lots/${lot.id}/conditionner`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Conditionner
        </Link>
      )}
      {context === "matiere" && (
        <Link href={`/stock/lots/${lot.id}/transformer`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Transformer
        </Link>
      )}
      <Link href={`/stock/lots/${lot.id}/modifier`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
        Modifier
      </Link>
      <form action={deleteLot}>
        <input type="hidden" name="id" value={lot.id} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-muted"
          onClick={(e) => {
            if (!window.confirm(`Supprimer le lot ${lot.reference} ?`)) e.preventDefault();
          }}
        >
          Supprimer
        </Button>
      </form>
    </div>
  );
}

export function LotsTable({ lots, context }: { lots: LotView[]; context: Context }) {
  const [q, setQ] = useState("");

  const resultats = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return lots;
    return lots.filter(
      (l) =>
        l.reference.toLowerCase().includes(t) ||
        l.parcelle.toLowerCase().includes(t) ||
        l.remorque.toLowerCase().includes(t) ||
        (l.localisation ?? "").toLowerCase().includes(t),
    );
  }, [q, lots]);

  const matiere = context === "matiere";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Rechercher (référence, parcelle, remorque…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        {context === "overview" && (
          <Link href="/stock/lots/nouveau" className={buttonVariants()}>
            + Nouveau lot
          </Link>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[1040px] text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
          <thead className="bg-card-elevated text-left text-muted-foreground">
            <tr>
              <th>Référence</th>
              <th>Parcelle</th>
              <th>Récolte</th>
              {!matiere && <th>Remorque</th>}
              {!matiere && <th>N°</th>}
              <th className="text-right">Poids</th>
              <th className="text-right">Humidité</th>
              {matiere && <th className="text-right">Big bag</th>}
              {matiere && <th>Localisation</th>}
              <th>Statut</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resultats.map((l) => {
              const s = STATUT_INFO[l.statut];
              return (
                <tr key={l.id} className="border-t border-border">
                  <td className="font-mono text-xs">{l.reference}</td>
                  <td className="font-mono">{l.parcelle}</td>
                  <td>{formatDateFr(l.dateRecolte)}</td>
                  {!matiere && <td className="font-mono">{l.remorque}</td>}
                  {!matiere && <td className="font-mono">{l.numero}</td>}
                  <td className="text-right">{formatKg(l.poidsKg)}</td>
                  <td className="text-right">{formatPourcent(l.humidite)}</td>
                  {matiere && <td className="text-right font-mono">{l.nbBigBag ?? "—"}</td>}
                  {matiere && <td className="font-mono">{l.localisation ?? "—"}</td>}
                  <td>
                    <Badge className={s.className}>{s.label}</Badge>
                  </td>
                  <td>
                    <ActionsCell lot={l} context={context} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {resultats.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {q
              ? "Aucun lot ne correspond à la recherche."
              : matiere
                ? "Aucun lot en chambre froide. Conditionnez un lot depuis la vue d'ensemble."
                : "Aucun lot pour l'instant."}
          </p>
        )}
      </div>
    </div>
  );
}
