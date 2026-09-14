import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { RefForm } from "./ref-form";
import { ChauffeurForm } from "./chauffeur-form";
import { DeleteButton } from "./delete-button";
import { DangerZone } from "./danger-zone";
import { QrActions } from "./qr-actions";
import { createParcelle, deleteParcelle, createRemorque, deleteRemorque, deleteChauffeur } from "./actions";

export const dynamic = "force-dynamic";

const ROW = "flex flex-wrap items-center gap-3 rounded-md border border-border bg-card-elevated px-4 py-3";

export default async function ParametresPage() {
  const session = await auth();
  const estAdmin = session?.user.role === "ADMIN";

  const [parcelles, remorques, chauffeurs, config] = await Promise.all([
    prisma.parcelle.findMany({
      orderBy: { code: "asc" },
      include: { _count: { select: { lots: true } } },
    }),
    prisma.remorque.findMany({ orderBy: { code: "asc" } }),
    prisma.chauffeur.findMany({ orderBy: { nom: "asc" } }),
    prisma.appConfig.findFirst(),
  ]);

  const base = process.env.APP_URL ?? process.env.AUTH_URL ?? "";
  const token = config?.declarationToken ?? "";
  const declarationUrl = `${base}/declarer?t=${token}`;
  const qrDataUrl = token ? await QRCode.toDataURL(declarationUrl, { width: 240, margin: 1 }) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Les listes utilisées dans le formulaire de lot : parcelles et remorques.
        </p>
      </div>

      {/* ----------------------------- Export Excel ----------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Sauvegarde du stock (Excel)</CardTitle>
          <CardDescription>
            Télécharge un fichier Excel : tous les lots avec leur statut, la matière première, et les
            produits avec les indicateurs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/api/export" className={buttonVariants()}>
            Télécharger l&apos;export Excel
          </a>
        </CardContent>
      </Card>

      {/* ----------------------------- Parcelles ----------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Parcelles</CardTitle>
          <CardDescription>Le code apparaît dans la référence du lot (ex. « BA »).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RefForm action={createParcelle} prefix="parcelle" />
          <div className="flex flex-col gap-2">
            {parcelles.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune parcelle pour l&apos;instant.</p>
            )}
            {parcelles.map((p) => (
              <div key={p.id} className={ROW}>
                <span className="font-mono text-sm font-semibold">{p.code}</span>
                <span className="flex-1 text-sm text-muted-foreground">{p.nom ?? "—"}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {p._count.lots} lot{p._count.lots > 1 ? "s" : ""}
                </span>
                {p._count.lots > 0 ? (
                  <span className="text-xs italic text-muted-foreground">lots rattachés</span>
                ) : (
                  <DeleteButton
                    action={deleteParcelle}
                    id={p.id}
                    confirmation={`Supprimer définitivement la parcelle « ${p.code} » ?`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------- Remorques ----------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Remorques</CardTitle>
          <CardDescription>Le code apparaît dans la référence du lot (ex. « B2 »).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RefForm action={createRemorque} prefix="remorque" />
          <div className="flex flex-col gap-2">
            {remorques.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune remorque pour l&apos;instant.</p>
            )}
            {remorques.map((r) => (
              <div key={r.id} className={ROW}>
                <span className="font-mono text-sm font-semibold">{r.code}</span>
                <span className="flex-1 text-sm text-muted-foreground">{r.nom ?? "—"}</span>
                <DeleteButton
                  action={deleteRemorque}
                  id={r.id}
                  confirmation={`Supprimer définitivement la remorque « ${r.code} » ?`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------- Chauffeurs ----------------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Chauffeurs</CardTitle>
          <CardDescription>Liste proposée dans le formulaire public de déclaration (QR).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ChauffeurForm />
          <div className="flex flex-col gap-2">
            {chauffeurs.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun chauffeur pour l&apos;instant.</p>
            )}
            {chauffeurs.map((c) => (
              <div key={c.id} className={ROW}>
                <span className="flex-1 text-sm">{c.nom}</span>
                <DeleteButton
                  action={deleteChauffeur}
                  id={c.id}
                  confirmation={`Supprimer le chauffeur « ${c.nom} » ?`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ----------------------------- QR de déclaration ----------------------------- */}
      {estAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>QR code de déclaration</CardTitle>
            <CardDescription>
              À imprimer et afficher : les chauffeurs le scannent pour déclarer une caisse, sans connexion.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {qrDataUrl ? (
              <div className="flex flex-wrap items-center gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR code de déclaration"
                  className="h-48 w-48 rounded-md border border-border bg-white p-2"
                />
                <div className="flex max-w-md flex-col gap-2">
                  <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Lien</span>
                  <code className="break-all rounded-md bg-muted px-3 py-2 text-xs">{declarationUrl}</code>
                  {!base && (
                    <p className="text-xs text-danger">
                      Définissez la variable d&apos;environnement APP_URL (ou AUTH_URL) sur l&apos;adresse
                      publique de l&apos;application pour que le QR soit scannable depuis un téléphone.
                    </p>
                  )}
                  <QrActions />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Jeton non initialisé.</p>
            )}
          </CardContent>
        </Card>
      )}

      {estAdmin && (
        <Card className="border-danger">
          <CardHeader>
            <CardTitle className="text-danger">Zone de danger</CardTitle>
            <CardDescription>Réinitialisation de l&apos;application — action irréversible.</CardDescription>
          </CardHeader>
          <CardContent>
            <DangerZone />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
