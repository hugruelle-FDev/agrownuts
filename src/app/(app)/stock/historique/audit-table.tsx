"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type AuditRow = {
  id: string;
  date: string;
  user: string;
  entite: string;
  action: string;
  ancienne: string | null;
  nouvelle: string | null;
};

const ACTION_INFO: Record<string, { label: string; className: string }> = {
  CREATE: { label: "Création", className: "border-success text-success" },
  UPDATE: { label: "Modification", className: "border-accent text-accent" },
  DELETE: { label: "Suppression", className: "border-danger text-danger" },
  TRANSFORM: { label: "Transformation", className: "border-primary text-primary" },
  CONDITIONNEMENT: { label: "Conditionnement", className: "border-warning text-warning" },
};

function formatDateHeure(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function AuditTable({ entries }: { entries: AuditRow[] }) {
  const [q, setQ] = useState("");

  const resultats = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return entries;
    return entries.filter(
      (e) =>
        e.user.toLowerCase().includes(t) ||
        e.entite.toLowerCase().includes(t) ||
        (e.ancienne ?? "").toLowerCase().includes(t) ||
        (e.nouvelle ?? "").toLowerCase().includes(t),
    );
  }, [q, entries]);

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Rechercher (utilisateur, entité, valeur…)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[820px] text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
          <thead className="bg-card-elevated text-left text-muted-foreground">
            <tr>
              <th>Date &amp; heure</th>
              <th>Utilisateur</th>
              <th>Entité</th>
              <th>Action</th>
              <th>Détail</th>
            </tr>
          </thead>
          <tbody>
            {resultats.map((e) => {
              const info = ACTION_INFO[e.action] ?? { label: e.action, className: "border-muted-foreground text-muted-foreground" };
              return (
                <tr key={e.id} className="border-t border-border">
                  <td className="font-mono text-xs text-muted-foreground">{formatDateHeure(e.date)}</td>
                  <td>{e.user}</td>
                  <td className="text-muted-foreground">{e.entite}</td>
                  <td>
                    <Badge className={info.className}>{info.label}</Badge>
                  </td>
                  <td className="font-mono text-xs">
                    {e.ancienne && e.nouvelle ? (
                      <span>
                        <span className="text-muted-foreground">{e.ancienne}</span> → {e.nouvelle}
                      </span>
                    ) : (
                      <span>{e.nouvelle ?? e.ancienne ?? "—"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {resultats.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {q ? "Aucune entrée ne correspond à la recherche." : "Aucune activité enregistrée."}
          </p>
        )}
      </div>
    </div>
  );
}
