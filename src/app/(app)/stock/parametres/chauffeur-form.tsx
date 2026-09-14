"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createChauffeur } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Ajout…" : "Ajouter"}
    </Button>
  );
}

export function ChauffeurForm() {
  const [state, formAction] = useFormState(createChauffeur, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="chauffeur-nom">Nom du chauffeur</Label>
        <Input id="chauffeur-nom" name="nom" required />
      </div>
      <SubmitButton />
      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-success">{state.success}</p>}
    </form>
  );
}
