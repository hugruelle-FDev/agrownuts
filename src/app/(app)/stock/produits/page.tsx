import { prisma } from "@/lib/prisma";
import { ProduitsPanel } from "./produits-panel";

export const dynamic = "force-dynamic";

export default async function ProduitsPage() {
  const [produits, lots] = await Promise.all([
    prisma.produit.findMany({ orderBy: [{ ordre: "asc" }, { code: "asc" }] }),
    prisma.lot.findMany({ select: { poidsKg: true } }),
  ]);

  const rows = produits.map((p) => ({
    id: p.id,
    code: p.code,
    label: p.label,
    couleur: p.couleur,
    quantite: Number(p.quantiteKg),
    capacite: Number(p.capaciteKg),
    palox: p.paloxKg,
    bigBag: p.bigBagKg,
    note: p.note,
  }));

  const totalBrutKg = lots.reduce((s, l) => s + Number(l.poidsKg), 0);

  return <ProduitsPanel produits={rows} totalBrutKg={totalBrutKg} />;
}
