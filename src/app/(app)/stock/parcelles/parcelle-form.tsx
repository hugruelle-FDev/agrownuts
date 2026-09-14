"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createParcelle } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Ajout…" : "Ajouter"}
    </Button>
  );
}

export function ParcelleForm() {
  const [state, formAction] = useFormState(createParcelle, {});
  const formRef = useRef<HTMLFormElement>(null);

  // On vide le formulaire après un ajout réussi.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="code">Code</Label>
        <Input id="code" name="code" placeholder="BA" className="w-28 uppercase" required />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="nom">Nom (facultatif)</Label>
        <Input id="nom" name="nom" placeholder="Baqui" />
      </div>
      <SubmitButton />
      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-success">{state.success}</p>}
    </form>
  );
}
