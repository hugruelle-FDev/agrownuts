import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeclarerForm } from "./declarer-form";

export const dynamic = "force-dynamic";

export default async function DeclarerPage({ searchParams }: { searchParams: { t?: string } }) {
  const token = searchParams.t ?? "";
  const config = await prisma.appConfig.findFirst();
  const valide = Boolean(config && token && token === config.declarationToken);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card-elevated">
        <CardHeader className="items-center text-center">
          <div className="mb-1 font-display text-2xl font-extrabold tracking-tight">
            AGRO<span className="text-accent">NUTS</span>
          </div>
          <CardTitle>Déclarer une caisse</CardTitle>
          <CardDescription>Au chargement, avant dépôt au séchoir.</CardDescription>
        </CardHeader>
        <CardContent>
          {valide ? (
            <DeclarerFormLoader token={token} />
          ) : (
            <p className="text-center text-sm text-danger">
              Lien invalide ou expiré. Demandez le QR code à jour à l&apos;administrateur.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

async function DeclarerFormLoader({ token }: { token: string }) {
  const [parcelles, remorques, chauffeurs] = await Promise.all([
    prisma.parcelle.findMany({ where: { actif: true }, orderBy: { code: "asc" }, select: { id: true, code: true, nom: true } }),
    prisma.remorque.findMany({ where: { actif: true }, orderBy: { code: "asc" }, select: { id: true, code: true, nom: true } }),
    prisma.chauffeur.findMany({ where: { actif: true }, orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
  ]);

  return <DeclarerForm token={token} parcelles={parcelles} remorques={remorques} chauffeurs={chauffeurs} />;
}
