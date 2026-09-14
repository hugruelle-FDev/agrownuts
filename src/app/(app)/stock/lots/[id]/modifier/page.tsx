import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { EditLotForm } from "./edit-lot-form";

export const dynamic = "force-dynamic";

export default async function ModifierLotPage({ params }: { params: { id: string } }) {
  const [lot, parcelles, remorques] = await Promise.all([
    prisma.lot.findUnique({ where: { id: params.id } }),
    prisma.parcelle.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, nom: true } }),
    prisma.remorque.findMany({
      where: { actif: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, nom: true },
    }),
  ]);

  if (!lot) notFound();

  const lotEdit = {
    id: lot.id,
    parcelleId: lot.parcelleId,
    dateRecolte: lot.dateRecolte.toISOString().slice(0, 10),
    remorque: lot.remorque,
    numero: lot.numeroChargement,
    poidsKg: Number(lot.poidsKg),
    humidite: Number(lot.humiditeAvant),
    statut: lot.statut,
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Modifier le lot</h1>
        <p className="font-mono text-sm text-muted-foreground">{lot.reference}</p>
      </div>
      <Card className="max-w-2xl">
        <CardContent className="pt-5">
          <EditLotForm lot={lotEdit} parcelles={parcelles} remorques={remorques} />
        </CardContent>
      </Card>
    </div>
  );
}
