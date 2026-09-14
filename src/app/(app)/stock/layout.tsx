"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/stock", label: "Vue d'ensemble" },
  { href: "/stock/declarations", label: "À valider" },
  { href: "/stock/lots", label: "Matière première" },
  { href: "/stock/produits", label: "Produits" },
  { href: "/stock/historique", label: "Historique" },
  { href: "/stock/parametres", label: "Paramètres" },
];

export default function StockLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const active = t.href === "/stock" ? pathname === "/stock" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm transition-colors",
                active
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
