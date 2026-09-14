"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transformerLot } from "../../actions";

type ProduitOpt = { id: string; label: string; couleur: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Transformation…" : "Transformer"}
    </Button>
  );
}

export function TransformerForm({ lotId, produits }: { lotId: string; produits: ProduitOpt[] }) {
  const [state, formAction] = useFormState(transformerLot, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="lotId" value={lotId} />

      <div className="grid gap-4 sm:grid-cols-2">
        {produits.map((p) => (
          <div key={p.id} className="flex flex-col gap-2">
            <Label htmlFor={`qty_${p.id}`} className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.couleur }} />
              {p.label}
            </Label>
            <Input id={`qty_${p.id}`} name={`qty_${p.id}`} type="number" step="0.01" min="0" placeholder="kg" />
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Indiquez les quantités obtenues. Le stock de chaque produit sera crédité, et le lot passera
        au statut « transformé » (la traçabilité brut → produits est conservée).
      </p>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-3">
        <SubmitButton />
        <Link href="/stock/lots" className={buttonVariants({ variant: "outline" })}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
