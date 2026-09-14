"use client";

import { Button } from "@/components/ui/button";
import { regenererJeton } from "./actions";

export function QrActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        Imprimer
      </Button>
      <form action={regenererJeton}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="text-danger hover:bg-muted"
          onClick={(e) => {
            if (!window.confirm("Régénérer le jeton invalidera l'ancien QR code imprimé. Continuer ?"))
              e.preventDefault();
          }}
        >
          Régénérer le jeton
        </Button>
      </form>
    </div>
  );
}
