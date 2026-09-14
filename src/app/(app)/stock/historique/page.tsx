import { prisma } from "@/lib/prisma";
import { AuditTable, type AuditRow } from "./audit-table";

export const dynamic = "force-dynamic";

export default async function HistoriquePage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { user: true },
  });

  const rows: AuditRow[] = logs.map((l) => ({
    id: l.id,
    date: l.createdAt.toISOString(),
    user: l.user?.name ?? l.user?.email ?? "Système",
    entite: l.entite,
    action: l.action,
    ancienne: l.ancienneValeur,
    nouvelle: l.nouvelleValeur,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Historique</h1>
        <p className="text-muted-foreground">
          Journal d&apos;audit : chaque création, modification, conditionnement, transformation et
          suppression, avec l&apos;auteur, la date et les valeurs.
        </p>
      </div>
      <AuditTable entries={rows} />
    </div>
  );
}
