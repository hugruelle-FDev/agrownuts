"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { STATUT_INFO, STATUT_TOUS } from "@/lib/lot-statut";
import type { LotStatut } from "@prisma/client";
import { updateLot } from "../../actions";

type Option = { id: string; code: string; nom: string | null };
type LotEdit = {
  id: string;
  parcelleId: string;
  dateRecolte: string;
  remorque: string;
  numero: number;
  poidsKg: number;
  humidite: number;
  statut: LotStatut;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement…" : "Enregistrer"}
    </Button>
  );
}

export function EditLotForm({
  lot,
  parcelles,
  remorques,
}: {
  lot: LotEdit;
  parcelles: Option[];
  remorques: Option[];
}) {
  const [state, formAction] = useFormState(updateLot, {});

  // Si la remorque actuelle du lot n'est plus dans la liste active, on l'ajoute
  // quand même comme option pour ne pas perdre la valeur.
  const remorqueCodes = remorques.map((r) => r.code);
  const optionsRemorques = remorqueCodes.includes(lot.remorque)
    ? remorques
    : [{ id: "_actuelle", code: lot.remorque, nom: "actuelle" }, ...remorques];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="lotId" value={lot.id} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="parcelleId">Parcelle</Label>
          <Select id="parcelleId" name="parcelleId" defaultValue={lot.parcelleId} required>
            {parcelles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code}
                {p.nom ? ` — ${p.nom}` : ""}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="dateRecolte">Date de récolte</Label>
          <Input id="dateRecolte" name="dateRecolte" type="date" defaultValue={lot.dateRecolte} required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="remorque">Remorque</Label>
          <Select id="remorque" name="remorque" defaultValue={lot.remorque} required>
            {optionsRemorques.map((r) => (
              <option key={r.id} value={r.code}>
                {r.code}
                {r.nom ? ` — ${r.nom}` : ""}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="numeroChargement">Numéro de chargement</Label>
          <Input
            id="numeroChargement"
            name="numeroChargement"
            type="number"
            min="1"
            step="1"
            defaultValue={lot.numero}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="poidsKg">Poids de la remorque</Label>
          <Input
            id="poidsKg"
            name="poidsKg"
            type="number"
            step="0.01"
            min="0"
            placeholder="kg"
            defaultValue={lot.poidsKg}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="humiditeAvant">Humidité avant séchage</Label>
          <Input
            id="humiditeAvant"
            name="humiditeAvant"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="%"
            defaultValue={lot.humidite}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="statut">Statut</Label>
          <Select id="statut" name="statut" defaultValue={lot.statut}>
            {STATUT_TOUS.map((s) => (
              <option key={s} value={s}>
                {STATUT_INFO[s].label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        La référence est recalculée automatiquement si vous changez la parcelle, la date, la
        remorque ou le numéro.
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
