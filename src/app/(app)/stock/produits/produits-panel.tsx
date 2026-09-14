"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatKg } from "@/lib/format";
import { createProduit, deleteProduit, updateProduit } from "./actions";

type ProduitView = {
  id: string;
  code: string;
  label: string;
  couleur: string;
  quantite: number;
  capacite: number;
  palox: number | null;
  bigBag: number | null;
  note: string | null;
};

/* --------------------------- Jauge SVG semi-circulaire --------------------------- */
const R = 74;
const CX = 100;
const CY = 100;
const START = 200;
const SWEEP = 220;

function polar(angleDeg: number): [number, number] {
  const a = ((angleDeg - 180) * Math.PI) / 180;
  return [CX + R * Math.cos(a), CY + R * Math.sin(a)];
}
function arcPath(fromDeg: number, toDeg: number): string {
  const [x1, y1] = polar(fromDeg);
  const [x2, y2] = polar(toDeg);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
}
const FULL_PATH = arcPath(-START + 180, -START + 180 + SWEEP);
const CIRC = (SWEEP / 360) * 2 * Math.PI * R;

function Jauge({ produit, actif, onClick }: { produit: ProduitView; actif: boolean; onClick: () => void }) {
  const pct = produit.capacite > 0 ? Math.min(produit.quantite / produit.capacite, 1) : 0;
  const offset = CIRC * (1 - pct);
  const palox = produit.palox ? produit.quantite / produit.palox : null;
  const bigBag = produit.bigBag ? produit.quantite / produit.bigBag : null;

  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-lg border bg-card-elevated p-4 text-left transition-colors ${
        actif ? "border-primary" : "border-border hover:border-muted-foreground"
      }`}
      style={{ borderColor: actif ? produit.couleur : undefined }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{produit.label}</span>
      </div>
      <svg viewBox="0 0 200 150" className="w-full" aria-hidden="true">
        <path d={FULL_PATH} fill="none" stroke="var(--muted)" strokeWidth={14} strokeLinecap="round" />
        <path
          d={FULL_PATH}
          fill="none"
          stroke={produit.couleur}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)" }}
        />
        <text x="100" y="96" textAnchor="middle" className="fill-foreground font-display" style={{ fontSize: 30, fontWeight: 800 }}>
          {Math.round(pct * 100)}%
        </text>
        <text x="100" y="116" textAnchor="middle" className="fill-muted-foreground font-mono" style={{ fontSize: 11 }}>
          {produit.quantite.toLocaleString("fr-FR")} / {produit.capacite.toLocaleString("fr-FR")} kg
        </text>
      </svg>
      <div className="flex flex-col gap-0.5 font-mono text-xs" style={{ color: produit.couleur }}>
        <span>{palox !== null ? `≈ ${palox.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} palox` : "palox : —"}</span>
        <span>{bigBag !== null ? `≈ ${bigBag.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} big bag` : "big bag : —"}</span>
      </div>
    </button>
  );
}

/* --------------------------- Panneau d'édition d'un produit --------------------------- */
function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement…" : "Enregistrer"}
    </Button>
  );
}

function DetailPanel({ produit, onClose }: { produit: ProduitView; onClose: () => void }) {
  const [state, formAction] = useFormState(updateProduit, {});
  const [q, setQ] = useState(String(produit.quantite));

  const parseQ = () => Number.parseFloat(q.replace(",", ".")) || 0;
  const adjust = (delta: number) => setQ(String(Math.max(0, parseQ() + delta)));

  return (
    <Card style={{ borderColor: produit.couleur }}>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">{produit.label}</h3>
            {produit.note && <p className="text-sm text-muted-foreground">{produit.note}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fermer">
            ✕
          </Button>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={produit.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantiteKg">Quantité en stock</Label>
              <Input
                id="quantiteKg"
                name="quantiteKg"
                type="number"
                step="0.01"
                min="0"
                placeholder="kg"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="capaciteKg">Capacité max</Label>
              <Input id="capaciteKg" name="capaciteKg" type="number" step="0.01" min="1" placeholder="kg" defaultValue={produit.capacite} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="paloxKg">Poids d&apos;un palox</Label>
              <Input id="paloxKg" name="paloxKg" type="number" step="1" min="1" placeholder="kg" defaultValue={produit.palox ?? ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bigBagKg">Poids d&apos;un big bag</Label>
              <Input id="bigBagKg" name="bigBagKg" type="number" step="1" min="1" placeholder="kg" defaultValue={produit.bigBag ?? ""} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {produit.palox && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => adjust(produit.palox as number)}>
                  + 1 palox
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => adjust(-(produit.palox as number))}>
                  − 1 palox
                </Button>
              </>
            )}
            {produit.bigBag && (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => adjust(produit.bigBag as number)}>
                  + 1 big bag
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => adjust(-(produit.bigBag as number))}>
                  − 1 big bag
                </Button>
              </>
            )}
          </div>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          {state.success && <p className="text-sm text-success">{state.success}</p>}

          <SaveButton />
        </form>

        <form action={deleteProduit} className="border-t border-border pt-3">
          <input type="hidden" name="id" value={produit.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-muted"
            onClick={(e) => {
              if (!window.confirm(`Supprimer la catégorie « ${produit.label} » ?`)) e.preventDefault();
            }}
          >
            Supprimer la catégorie
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* --------------------------- Formulaire d'ajout de catégorie --------------------------- */
function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Ajout…" : "Ajouter la catégorie"}
    </Button>
  );
}

function AddForm() {
  const [state, formAction] = useFormState(createProduit, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-label">Nom de la catégorie</Label>
        <Input id="new-label" name="label" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-couleur">Couleur</Label>
        <input
          id="new-couleur"
          name="couleur"
          type="color"
          defaultValue="#8fa678"
          className="h-10 w-16 rounded-md border border-border bg-muted"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-palox">Palox</Label>
        <Input id="new-palox" name="paloxKg" type="number" min="1" step="1" placeholder="kg" className="w-24" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-bigbag">Big bag</Label>
        <Input id="new-bigbag" name="bigBagKg" type="number" min="1" step="1" placeholder="kg" className="w-24" />
      </div>
      <AddButton />
      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-success">{state.success}</p>}
    </form>
  );
}

/* --------------------------- Panneau principal --------------------------- */
export function ProduitsPanel({ produits, totalBrutKg }: { produits: ProduitView[]; totalBrutKg: number }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = produits.find((p) => p.id === selectedId) ?? null;

  const totaux = useMemo(() => {
    const kg = produits.reduce((s, p) => s + p.quantite, 0);
    const palox = produits.reduce((s, p) => s + (p.palox ? p.quantite / p.palox : 0), 0);
    const bigBag = produits.reduce((s, p) => s + (p.bigBag ? p.quantite / p.bigBag : 0), 0);
    return { kg, palox, bigBag };
  }, [produits]);

  const rendement = totalBrutKg > 0 ? (totaux.kg / totalBrutKg) * 100 : null;
  const base = Math.max(totalBrutKg, totaux.kg, 1);

  const kpis = [
    { label: "Matière brute", valeur: formatKg(totalBrutKg) },
    { label: "Produits transformés", valeur: formatKg(totaux.kg) },
    { label: "Total palox", valeur: totaux.palox.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) },
    { label: "Total big bag", valeur: totaux.bigBag.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Produits transformés</h1>
        <p className="text-muted-foreground">
          Niveaux par produit, décompte en kg, palox et big bag, et comparaison avec la matière brute.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="bg-card-elevated">
            <CardContent className="p-5">
              <div className="font-mono text-2xl font-semibold text-accent">{k.valeur}</div>
              <div className="mt-1 text-sm text-muted-foreground">{k.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparaison produits vs matière brute */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              Produits transformés vs matière brute
            </span>
            {rendement !== null && (
              <span className="font-mono text-sm text-accent">
                Rendement {rendement.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Matière brute</span>
                <span>{formatKg(totalBrutKg)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-muted-foreground/60" style={{ width: `${(totalBrutKg / base) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Produits transformés</span>
                <span>{formatKg(totaux.kg)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(totaux.kg / base) * 100}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jauges */}
      {produits.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune catégorie de produit. Ajoutez-en une ci-dessous.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {produits.map((p) => (
            <Jauge key={p.id} produit={p} actif={selectedId === p.id} onClick={() => setSelectedId(selectedId === p.id ? null : p.id)} />
          ))}
        </div>
      )}

      {/* Édition du produit sélectionné */}
      {selected && <DetailPanel key={selected.id} produit={selected} onClose={() => setSelectedId(null)} />}

      {/* Ajout de catégorie */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">Ajouter une catégorie</span>
          <AddForm />
        </CardContent>
      </Card>
    </div>
  );
}
