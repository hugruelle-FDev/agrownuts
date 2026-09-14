import { cn } from "@/lib/utils";

/**
 * Marque AGROWNUTS : la graine stylisée en « 8 » au trait (deux cercles
 * superposés en contour), d'après le concept vert forêt & terracotta.
 * La couleur du trait s'adapte au thème via --logo-stroke.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 56"
      className={className}
      role="img"
      aria-label="AGROWNUTS"
      fill="none"
      stroke="var(--logo-stroke)"
      strokeWidth={3}
    >
      <circle cx="20" cy="16" r="12" />
      <circle cx="20" cy="37" r="14" />
    </svg>
  );
}

/** Logo complet : marque + mot AGROWNUTS. */
export function Logo({
  className,
  markClassName = "h-8",
  textClassName = "text-xl",
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className={cn("font-display font-extrabold tracking-tight leading-none", textClassName)}>
        AGROWNUTS
      </span>
    </span>
  );
}
