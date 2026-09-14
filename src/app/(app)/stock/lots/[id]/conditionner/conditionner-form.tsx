"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { conditionnerLot } from "../../actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement…" : "Conditionner"}
    </Button>
  );
}

export function ConditionnerForm({ lotId }: { lotId: string }) {
  const [state, formAction] = useFormState(conditionnerLot, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="lotId" value={lotId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nbBigBag">Nombre de big bag</Label>
          <Input id="nbBigBag" name="nbBigBag" type="number" min="1" step="1" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="localisation">Localisation (chambre froide)</Label>
          <Input id="localisation" name="localisation" className="uppercase" placeholder="ex. A3" required />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Le lot sort du séchoir : il passe en « brut · chambre froide » et apparaîtra dans l&apos;onglet
        Matière première, avec sa place sur le plan.
      </p>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <div className="flex gap-3">
        <SubmitButton />
        <Link href="/stock" className={buttonVariants({ variant: "outline" })}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
