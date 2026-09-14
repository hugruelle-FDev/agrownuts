"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createLot, suggererNumero } from "./actions";

type Option = { id: string; code: string; nom: string | null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement…" : "Créer le lot"}
    </Button>
  );
}

export function LotForm({
  parcelles,
  remorques,
}: {
  parcelles: Option[];
  remorques: Option[];
}) {
  const [state, formAction] = useFormState(createLot, {});
  const formRef = useRef<HTMLFormElement>(null);

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const [parcelleId, setParcelleId] = useState("");
  const [dateRecolte, setDateRecolte] = useState(aujourdhui);
  const [numero, setNumero] = useState("");

  // Met à jour le numéro proposé quand la parcelle ou la date change.
  useEffect(() => {
    let annule = false;
    if (!parcelleId || !dateRecolte) {
      setNumero("");
      return;
    }
    suggererNumero(parcelleId, dateRecolte).then((n) => {
      if (!annule) setNumero(String(n));
    });
    return () => {
      annule = true;
    };
  }, [parcelleId, dateRecolte]);

  // Après un succès, on réinitialise pour enchaîner la caisse suivante.
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setParcelleId("");
      setDateRecolte(aujourdhui);
      setNumero("");
    }
  }, [state.success, aujourdhui]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="parcelleId">Parcelle</Label>
          <Select
            id="parcelleId"
            name="parcelleId"
            value={parcelleId}
            onChange={(e) => setParcelleId(e.target.value)}
            required
          >
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
          <Label htmlFor="dateRecolte">Date de récolte</Label>
          <Input
            id="dateRecolte"
            name="dateRecolte"
            type="date"
            value={dateRecolte}
            onChange={(e) => setDateRecolte(e.target.value)}
            required
          />
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="numeroChargement">Numéro de chargement</Label>
          <Input
            id="numeroChargement"
            name="numeroChargement"
            type="number"
            min="1"
            step="1"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">
            Proposé automatiquement selon la parcelle et le mois — modifiable si besoin.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="poidsKg">Poids de la remorque</Label>
          <Input id="poidsKg" name="poidsKg" type="number" step="0.01" min="0" placeholder="kg" required />
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
            required
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Référence générée à l&apos;enregistrement, ex.{" "}
        <span className="font-mono">LOT-BA-06/2026-B2-1</span>.
      </p>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-success">
          {state.success}{" "}
          <Link href="/stock/lots" className="underline">
            Voir les lots
          </Link>
        </p>
      )}

      <div className="flex gap-3">
        <SubmitButton />
        <Link href="/stock/lots" className={buttonVariants({ variant: "outline" })}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
