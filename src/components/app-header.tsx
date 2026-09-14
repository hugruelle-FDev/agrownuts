"use client";

import Link from "next/link";
import type { Role } from "@prisma/client";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { doSignOut } from "@/app/(app)/actions";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrateur",
  OPERATEUR: "Opérateur",
  LECTURE: "Lecture seule",
};

/** En-tête : identité utilisateur, pastille « à valider », thème, déconnexion. */
export function AppHeader({
  userName,
  userRole,
  nbAValider = 0,
}: {
  userName: string;
  userRole: Role;
  nbAValider?: number;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
      <div className="font-display text-lg font-extrabold tracking-tight md:hidden">
        AGRO<span className="text-accent">NUTS</span>
      </div>
      <div className="flex-1" />
      {nbAValider > 0 && (
        <Link
          href="/stock/declarations"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-border hover:bg-muted"
          aria-label={`${nbAValider} déclaration(s) à valider`}
          title={`${nbAValider} à valider`}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {nbAValider}
          </span>
        </Link>
      )}
      <div className="hidden text-right sm:block">
        <div className="text-sm font-medium leading-tight">{userName}</div>
        <div className="font-mono text-xs text-muted-foreground">{ROLE_LABEL[userRole]}</div>
      </div>
      <ThemeToggle />
      <form action={doSignOut}>
        <Button variant="outline" size="icon" aria-label="Se déconnecter">
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </header>
  );
}
