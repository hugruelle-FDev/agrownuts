import { formatKg } from "@/lib/format";

export type Segment = { label: string; value: number; color: string };

/** Barre empilée de répartition (ex. matière par statut, produits par catégorie). */
export function RepartitionBar({ title, segments }: { title: string; segments: Segment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const base = total > 0 ? total : 1;

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{title}</span>
      <div className="flex h-8 gap-0.5 overflow-hidden rounded-md bg-muted">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.label}
              style={{ width: `${(s.value / base) * 100}%`, background: s.color }}
              title={`${s.label} — ${formatKg(s.value)}`}
            />
          ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label} · {total > 0 ? ((s.value / base) * 100).toFixed(1) : "0"} %
          </span>
        ))}
      </div>
      {total === 0 && <p className="text-xs text-muted-foreground">Aucune donnée pour l&apos;instant.</p>}
    </div>
  );
}
