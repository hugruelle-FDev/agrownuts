import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/logo";
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
          <Logo markClassName="h-10" textClassName="text-2xl" />
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            Triage · Décorticage · Calibrage
          </p>
          <CardTitle className="mt-2">Déclarer une caisse</CardTitle>
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
