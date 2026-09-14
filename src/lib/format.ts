/** Petites fonctions de formatage en français (affichage). */

export function formatKg(n: number): string {
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kg`;
}

export function formatPourcent(n: number): string {
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export function formatDateFr(d: Date | string): string {
  return new Date(d).toLocaleDateString("fr-FR");
}
