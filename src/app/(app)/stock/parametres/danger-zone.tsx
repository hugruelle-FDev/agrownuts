"use client";

import { Button } from "@/components/ui/button";
import { reinitialiserDonnees, reinitialiserTout } from "./actions";

export function DangerZone() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <form action={reinitialiserDonnees}>
          <Button
            type="submit"
            variant="outline"
            className="border-danger text-danger hover:bg-muted"
            onClick={(e) => {
              if (
                !window.confirm(
                  "Effacer tous les lots, relevés, transformations et l'historique, et remettre les stocks produits à 0 ?\n\nVos parcelles, remorques et catégories de produits sont conservées.\n\nAction IRRÉVERSIBLE.",
                )
              )
                e.preventDefault();
            }}
          >
            Réinitialiser les données
          </Button>
        </form>

        <form action={reinitialiserTout}>
          <Button
            type="submit"
            variant="outline"
            className="border-danger text-danger hover:bg-muted"
            onClick={(e) => {
              if (
                !window.confirm(
                  "TOUT réinitialiser : efface aussi les parcelles, remorques et catégories de produits.\n\nSeuls les comptes utilisateurs sont conservés.\n\nAction IRRÉVERSIBLE. Confirmer ?",
                )
              )
                e.preventDefault();
            }}
          >
            Tout réinitialiser
          </Button>
        </form>
      </div>
      <p className="text-xs text-muted-foreground">
        Réservé aux administrateurs et irréversible — pensé pour la phase de test.
      </p>
    </div>
  );
}
