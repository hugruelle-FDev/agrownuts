import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { formatDateFr, formatKg, formatPourcent } from "@/lib/format";
import { DeclarationActions } from "./declaration-actions";

export const dynamic = "force-dynamic";

export default async function DeclarationsPage() {
  const lots = await prisma.lot.findMany({
    where: { statut: "DECLARE" },
    orderBy: { createdAt: "desc" },
    include: { parcelle: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">À valider</h1>
        <p className="text-muted-foreground">
          Caisses déclarées au champ (via QR) en attente de votre contrôle.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[980px] text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
          <thead className="bg-card-elevated text-left text-muted-foreground">
            <tr>
              <th>Référence</th>
              <th>Chauffeur</th>
              <th>Parcelle</th>
              <th>Récolte</th>
              <th>Heure</th>
              <th>Remorque</th>
              <th className="text-right">Poids</th>
              <th className="text-right">Humidité</th>
              <th>Commentaire</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lots.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="font-mono text-xs">
                  <Link href={`/stock/lots/${l.id}/modifier`} className="underline-offset-2 hover:underline">
                    {l.reference}
                  </Link>
                </td>
                <td>{l.chauffeur ?? "—"}</td>
                <td className="font-mono">{l.parcelle.code}</td>
                <td>{formatDateFr(l.dateRecolte)}</td>
                <td className="font-mono">{l.heureSaisie ?? "—"}</td>
                <td className="font-mono">{l.remorque}</td>
                <td className="text-right">{formatKg(Number(l.poidsKg))}</td>
                <td className="text-right">{formatPourcent(Number(l.humiditeAvant))}</td>
                <td className="max-w-[220px] truncate text-muted-foreground" title={l.commentaire ?? ""}>
                  {l.commentaire ?? "—"}
                </td>
                <td>
                  <DeclarationActions lotId={l.id} lotRef={l.reference} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {lots.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Aucune déclaration en attente.</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        « Valider » fait passer la caisse en stock (au séchoir). « Modifier » (via la référence) permet de
        corriger avant validation. « Rejeter » supprime la déclaration.
      </p>
    </div>
  );
}
