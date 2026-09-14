"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SechoirConfig } from "@/lib/sechage";
import { updateSechoir } from "./actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement…" : "Enregistrer les réglages"}
    </Button>
  );
}

export function SechoirControls({ config }: { config: SechoirConfig }) {
  const [state, formAction] = useFormState(updateSechoir, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="temperatureC">Température de séchage</Label>
          <Input id="temperatureC" name="temperatureC" type="number" step="0.1" placeholder="°C" defaultValue={config.temperatureC ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="soufflerie">Force de soufflerie</Label>
          <Input id="soufflerie" name="soufflerie" type="number" step="1" min="0" max="100" placeholder="%" defaultValue={config.soufflerie ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="humiditeCible">Humidité cible</Label>
          <Input id="humiditeCible" name="humiditeCible" type="number" step="0.1" min="0" max="100" placeholder="%" defaultValue={config.humiditeCible} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="vitesseTheorique">Vitesse théorique</Label>
          <Input id="vitesseTheorique" name="vitesseTheorique" type="number" step="0.1" min="0.1" placeholder="%/jour" defaultValue={config.vitesseTheorique} required />
        </div>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}
      <SaveButton />
    </form>
  );
}
