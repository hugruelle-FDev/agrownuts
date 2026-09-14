import { Boxes, Wind, Factory, FileText, type LucideIcon } from "lucide-react";
import type { Role } from "@prisma/client";

/**
 * Registre des modules = source unique de la navigation.
 * Pour ajouter un onglet plus tard : ajouter une entrée ici + créer le dossier
 * de page correspondant. Rien d'autre à modifier dans le shell.
 */
export type ModuleDef = {
  key: string;
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
  /** Rôles autorisés. Tableau vide = accessible à tous les rôles. */
  roles: Role[];
  /** false → affiché avec la pastille « bientôt » (module pas encore livré). */
  disponible: boolean;
};

export const MODULES: ModuleDef[] = [
  {
    key: "stock",
    label: "Stock",
    href: "/stock",
    description: "Lots, emplacements, mouvements",
    icon: Boxes,
    roles: [],
    disponible: true,
  },
  {
    key: "sechage",
    label: "Séchage",
    href: "/sechage",
    description: "Séchoir & état des caisses",
    icon: Wind,
    roles: [],
    disponible: true,
  },
  {
    key: "production",
    label: "Production",
    href: "/production",
    description: "Machines, planning, maintenance",
    icon: Factory,
    roles: [],
    disponible: false,
  },
  {
    key: "admin",
    label: "Administratif",
    href: "/admin",
    description: "Contrats, devis, factures",
    icon: FileText,
    roles: ["ADMIN"],
    disponible: false,
  },
];

/** Filtre les modules visibles pour un rôle donné. */
export function modulesPourRole(role: Role): ModuleDef[] {
  return MODULES.filter((m) => m.roles.length === 0 || m.roles.includes(role));
}
