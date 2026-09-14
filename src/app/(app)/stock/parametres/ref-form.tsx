"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RefFormState } from "./actions";

type Action = (prev: RefFormState, formData: FormData) => Promise<RefFormState>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Ajout…" : "Ajouter"}
    </Button>
  );
}

/** Formulaire générique d'ajout (parcelle ou remorque). */
export function RefForm({ action, prefix }: { action: Action; prefix: string }) {
  const [state, formAction] = useFormState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${prefix}-code`}>Code</Label>
        <Input id={`${prefix}-code`} name="code" className="w-28 uppercase" required />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor={`${prefix}-nom`}>Nom (facultatif)</Label>
        <Input id={`${prefix}-nom`} name="nom" />
      </div>
      <SubmitButton />
      {state.error && <p className="w-full text-sm text-danger">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-success">{state.success}</p>}
    </form>
  );
}
