import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParcelleForm } from "./parcelle-form";
import { toggleParcelle } from "./actions";

export const dynamic = "force-dynamic";

export default async function ParcellesPage() {
  const parcelles = await prisma.parcelle.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { lots: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Parcelles</h1>
        <p className="text-muted-foreground">
          La liste utilisée dans le formulaire de lot. Le code apparaît dans la référence (ex. « BA »).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une parcelle</CardTitle>
          <CardDescription>Un code court et unique, et un nom facultatif.</CardDescription>
        </CardHeader>
        <CardContent>
          <ParcelleForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{parcelles.length} parcelle{parcelles.length > 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {parcelles.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune parcelle pour l&apos;instant.</p>
          )}
          {parcelles.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card-elevated px-4 py-3"
            >
              <span className="font-mono text-sm font-semibold">{p.code}</span>
              <span className="flex-1 text-sm text-muted-foreground">{p.nom ?? "—"}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {p._count.lots} lot{p._count.lots > 1 ? "s" : ""}
              </span>
              <Badge className={p.actif ? "border-success text-success" : "border-muted-foreground text-muted-foreground"}>
                {p.actif ? "Active" : "Inactive"}
              </Badge>
              <form action={toggleParcelle}>
                <input type="hidden" name="id" value={p.id} />
                <Button type="submit" variant="ghost" size="sm">
                  {p.actif ? "Désactiver" : "Activer"}
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
