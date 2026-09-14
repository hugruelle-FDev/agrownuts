import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatKg } from "@/lib/format";
import { TransformerForm } from "./transformer-form";

export const dynamic = "force-dynamic";

export default async function TransformerPage({ params }: { params: { id: string } }) {
  const [lot, produits] = await Promise.all([
    prisma.lot.findUnique({ where: { id: params.id }, include: { parcelle: true } }),
    prisma.produit.findMany({
      orderBy: [{ ordre: "asc" }, { code: "asc" }],
      select: { id: true, label: true, couleur: true },
    }),
  ]);

  if (!lot) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Transformer un lot</h1>
        <p className="font-mono text-sm text-muted-foreground">
          {lot.reference} · {formatKg(Number(lot.poidsKg))} brut
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardContent className="pt-5">
          <TransformerForm lotId={lot.id} produits={produits} />
        </CardContent>
      </Card>
    </div>
  );
}
