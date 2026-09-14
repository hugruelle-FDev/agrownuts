import { cn } from "@/lib/utils";

/** Marque AGROWNUTS : une graine (terracotta) surmontée d'une feuille (vert forêt). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label="AGROWNUTS" fill="none">
      {/* Graine */}
      <ellipse cx="16" cy="19" rx="8.2" ry="10.5" fill="var(--brand-terracotta)" />
      {/* Nervure centrale */}
      <path d="M16 10.5 L16 28" stroke="rgba(0,0,0,.18)" strokeWidth="1.4" strokeLinecap="round" />
      {/* Feuille */}
      <path
        d="M16 11 C 16.5 5.5 20.5 2.8 26 3.4 C 25.2 8.7 21 11.6 16 11 Z"
        fill="var(--brand-green)"
      />
      {/* Tige de la feuille */}
      <path d="M16.4 11 C 18.5 8.8 21.5 6.7 24.5 5.4" stroke="rgba(0,0,0,.16)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

/** Logo complet : marque + mot AGROWNUTS. */
export function Logo({
  className,
  markClassName = "h-7 w-7",
  textClassName = "text-xl",
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span className={cn("font-display font-extrabold tracking-tight leading-none", textClassName)}>
        AGROW<span className="text-primary">NUTS</span>
      </span>
    </span>
  );
}
