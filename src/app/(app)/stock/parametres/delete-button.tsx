"use client";

import { Button } from "@/components/ui/button";

/**
 * Bouton de suppression sur une ligne. Demande confirmation avant d'exécuter
 * l'action serveur passée en prop.
 */
export function DeleteButton({
  action,
  id,
  confirmation,
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  confirmation: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-danger hover:bg-muted"
        onClick={(e) => {
          if (!window.confirm(confirmation)) e.preventDefault();
        }}
      >
        Supprimer
      </Button>
    </form>
  );
}
