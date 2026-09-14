"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { declarerLot } from "./actions";

type Option = { id: string; code: string; nom: string | null };
type Chauffeur = { id: string; nom: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enregistrement…" : "Déclarer la caisse"}
    </Button>
  );
}

export function DeclarerForm({
  token,
  parcelles,
  remorques,
  chauffeurs,
}: {
  token: string;
  parcelles: Option[];
  remorques: Option[];
  chauffeurs: Chauffeur[];
}) {
  const [state, formAction] = useFormState(declarerLot, {});
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const maintenant = new Date().toTimeString().slice(0, 5);

  if (state.reference) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">✅</div>
        <div>
          <div className="font-display text-lg font-bold">Caisse déclarée !</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Référence provisoire : <span className="font-mono text-foreground">{state.reference}</span>
            <br />
            Vous pouvez déposer la caisse au séchoir. L&apos;administrateur va valider la déclaration.
          </p>
        </div>
        <p className="text-base font-semibold text-accent">Tu peux aller boire une bière 🍺</p>
        <Button className="w-full" onClick={() => window.location.reload()}>
          Déclarer une autre caisse
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-2">
        <Label htmlFor="chauffeur">Chauffeur</Label>
        <Select id="chauffeur" name="chauffeur" defaultValue="" required>
          <option value="" disabled>
            Qui êtes-vous ?
          </option>
          {chauffeurs.map((c) => (
            <option key={c.id} value={c.nom}>
              {c.nom}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="parcelleId">Parcelle</Label>
        <Select id="parcelleId" name="parcelleId" defaultValue="" required>
          <option value="" disabled>
            Choisir une parcelle…
          </option>
          {parcelles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
              {p.nom ? ` — ${p.nom}` : ""}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="remorque">Remorque</Label>
        <Select id="remorque" name="remorque" defaultValue="" required>
          <option value="" disabled>
            Choisir une remorque…
          </option>
          {remorques.map((r) => (
            <option key={r.id} value={r.code}>
              {r.code}
              {r.nom ? ` — ${r.nom}` : ""}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dateRecolte">Date de récolte</Label>
          <Input id="dateRecolte" name="dateRecolte" type="date" defaultValue={aujourdhui} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="heureSaisie">Heure</Label>
          <Input id="heureSaisie" name="heureSaisie" type="time" defaultValue={maintenant} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="poidsKg">Poids</Label>
          <Input id="poidsKg" name="poidsKg" type="number" step="0.01" min="0" placeholder="kg" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="humiditeAvant">Humidité</Label>
          <Input id="humiditeAvant" name="humiditeAvant" type="number" step="0.1" min="0" max="100" placeholder="%" required />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="commentaire">Commentaire (facultatif)</Label>
        <Input id="commentaire" name="commentaire" placeholder="Observation…" />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
