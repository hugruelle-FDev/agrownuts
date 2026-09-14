import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LotForm } from "../lot-form";

export const dynamic = "force-dynamic";

export default async function NouveauLotPage() {
  const [parcelles, remorques] = await Promise.all([
    prisma.parcelle.findMany({
      where: { actif: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, nom: true },
    }),
    prisma.remorque.findMany({
      where: { actif: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, nom: true },
    }),
  ]);

  const manque: string[] = [];
  if (parcelles.length === 0) manque.push("une parcelle");
  if (remorques.length === 0) manque.push("une remorque");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Nouveau lot</h1>
        <p className="text-muted-foreground">Une caisse = un lot. Un numéro est attribué automatiquement.</p>
      </div>

      {manque.length > 0 ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Configuration à compléter</CardTitle>
            <CardDescription>
              Ajoutez d&apos;abord au moins {manque.join(" et ")} pour pouvoir créer un lot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/stock/parametres" className={buttonVariants()}>
              Ouvrir les paramètres
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardContent className="pt-5">
            <LotForm parcelles={parcelles} remorques={remorques} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
