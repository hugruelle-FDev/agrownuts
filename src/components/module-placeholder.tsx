import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Écran d'attente cohérent pour les modules pas encore développés. */
export function ModulePlaceholder({
  titre,
  sousTitre,
  etape,
  points,
}: {
  titre: string;
  sousTitre: string;
  etape: string;
  points: string[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">{titre}</h1>
        <p className="text-muted-foreground">{sousTitre}</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Module en préparation</CardTitle>
          <CardDescription>Prévu pour l&apos;{etape}.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {points.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-accent">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
