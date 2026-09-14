import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatKg } from "@/lib/format";
import { ConditionnerForm } from "./conditionner-form";

export const dynamic = "force-dynamic";

export default async function ConditionnerPage({ params }: { params: { id: string } }) {
  const lot = await prisma.lot.findUnique({ where: { id: params.id } });
  if (!lot) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Conditionner un lot</h1>
        <p className="font-mono text-sm text-muted-foreground">
          {lot.reference} · {formatKg(Number(lot.poidsKg))} brut
        </p>
      </div>
      <Card className="max-w-2xl">
        <CardContent className="pt-5">
          <ConditionnerForm lotId={lot.id} />
        </CardContent>
      </Card>
    </div>
  );
}
