"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { modulesPourRole } from "@/lib/modules";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

/** Barre latérale de navigation, alimentée par le registre de modules. */
export function AppSidebar({ userRole }: { userRole: Role }) {
  const pathname = usePathname();
  const modules = modulesPourRole(userRole);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {modules.map((m) => {
          const Icon = m.icon;
          const active = pathname === m.href || pathname.startsWith(`${m.href}/`);
          return (
            <Link
              key={m.key}
              href={m.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{m.label}</span>
              {!m.disponible && (
                <span className="rounded-full border border-current px-1.5 py-0.5 font-mono text-[10px] uppercase opacity-70">
                  bientôt
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 font-mono text-xs text-muted-foreground">
        v0.1 — socle
      </div>
    </aside>
  );
}
