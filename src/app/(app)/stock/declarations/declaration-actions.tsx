"use client";

import { Button } from "@/components/ui/button";
import { validerDeclaration, rejeterDeclaration } from "./actions";

export function DeclarationActions({ lotId, lotRef }: { lotId: string; lotRef: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <form action={validerDeclaration}>
        <input type="hidden" name="id" value={lotId} />
        <Button type="submit" variant="ghost" size="sm" className="text-success hover:bg-muted">
          Valider
        </Button>
      </form>
      <form action={rejeterDeclaration}>
        <input type="hidden" name="id" value={lotId} />
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-muted"
          onClick={(e) => {
            if (!window.confirm(`Rejeter (supprimer) la déclaration ${lotRef} ?`)) e.preventDefault();
          }}
        >
          Rejeter
        </Button>
      </form>
    </div>
  );
}
