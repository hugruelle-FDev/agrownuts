import ExcelJS from "exceljs";
import type { LotStatut } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { STATUT_INFO } from "@/lib/lot-statut";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR");
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response("Non autorisé", { status: 401 });
  }

  const [lots, produits] = await Promise.all([
    prisma.lot.findMany({ orderBy: { createdAt: "desc" }, include: { parcelle: true } }),
    prisma.produit.findMany({ orderBy: [{ ordre: "asc" }, { code: "asc" }] }),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "AGROWNUTS";
  wb.created = new Date();

  const enTete = (ws: ExcelJS.Worksheet) => {
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F3D2F" },
    };
    ws.getRow(1).font = { bold: true, color: { argb: "FFF2ECE0" } };
  };

  /* ----------------------------- Onglet 1 : Tous les lots ----------------------------- */
  const wsLots = wb.addWorksheet("Tous les lots");
  wsLots.columns = [
    { header: "Référence", key: "ref", width: 26 },
    { header: "Statut", key: "statut", width: 24 },
    { header: "Parcelle", key: "parcelle", width: 12 },
    { header: "Date récolte", key: "date", width: 14 },
    { header: "Heure", key: "heure", width: 8 },
    { header: "Remorque", key: "remorque", width: 12 },
    { header: "N°", key: "numero", width: 6 },
    { header: "Poids (kg)", key: "poids", width: 12 },
    { header: "Humidité (%)", key: "humidite", width: 12 },
    { header: "Big bag", key: "bigbag", width: 9 },
    { header: "Localisation", key: "loc", width: 14 },
    { header: "Chauffeur", key: "chauffeur", width: 16 },
    { header: "Commentaire", key: "commentaire", width: 30 },
    { header: "Créé le", key: "cree", width: 14 },
  ];
  for (const l of lots) {
    wsLots.addRow({
      ref: l.reference,
      statut: STATUT_INFO[l.statut as LotStatut].label,
      parcelle: l.parcelle.code,
      date: fmtDate(l.dateRecolte),
      heure: l.heureSaisie ?? "",
      remorque: l.remorque,
      numero: l.numeroChargement,
      poids: Number(l.poidsKg),
      humidite: Number(l.humiditeAvant),
      bigbag: l.nbBigBag ?? "",
      loc: l.localisation ?? "",
      chauffeur: l.chauffeur ?? "",
      commentaire: l.commentaire ?? "",
      cree: fmtDate(l.createdAt),
    });
  }
  enTete(wsLots);

  /* ----------------------------- Onglet 2 : Matière première ----------------------------- */
  const wsMatiere = wb.addWorksheet("Matière première");
  wsMatiere.columns = [
    { header: "Référence", key: "ref", width: 26 },
    { header: "Parcelle", key: "parcelle", width: 12 },
    { header: "Date récolte", key: "date", width: 14 },
    { header: "Poids (kg)", key: "poids", width: 12 },
    { header: "Humidité (%)", key: "humidite", width: 12 },
    { header: "Big bag", key: "bigbag", width: 9 },
    { header: "Localisation", key: "loc", width: 14 },
  ];
  for (const l of lots.filter((x) => x.statut === "BRUT_CHAMBRE_FROIDE")) {
    wsMatiere.addRow({
      ref: l.reference,
      parcelle: l.parcelle.code,
      date: fmtDate(l.dateRecolte),
      poids: Number(l.poidsKg),
      humidite: Number(l.humiditeAvant),
      bigbag: l.nbBigBag ?? "",
      loc: l.localisation ?? "",
    });
  }
  enTete(wsMatiere);

  /* ----------------------------- Onglet 3 : Produits + KPIs ----------------------------- */
  const wsProd = wb.addWorksheet("Produits");

  const nbLots = lots.filter((l) => l.statut !== "DECLARE").length;
  const nbSechoir = lots.filter((l) => l.statut === "SECHOIR").length;
  const brutKg = lots
    .filter((l) => l.statut !== "DECLARE")
    .reduce((s, l) => s + Number(l.poidsKg), 0);
  const produitsKg = produits.reduce((s, p) => s + Number(p.quantiteKg), 0);
  const rendement = brutKg > 0 ? (produitsKg / brutKg) * 100 : 0;
  const totalPalox = produits.reduce(
    (s, p) => s + (p.paloxKg ? Number(p.quantiteKg) / p.paloxKg : 0),
    0,
  );
  const totalBigBag = produits.reduce(
    (s, p) => s + (p.bigBagKg ? Number(p.quantiteKg) / p.bigBagKg : 0),
    0,
  );

  wsProd.addRow(["Indicateurs", ""]);
  wsProd.getRow(1).font = { bold: true, size: 13 };
  wsProd.addRow(["Lots enregistrés", nbLots]);
  wsProd.addRow(["Lots au séchoir", nbSechoir]);
  wsProd.addRow(["Matière brute (kg)", Math.round(brutKg * 100) / 100]);
  wsProd.addRow(["Produits transformés (kg)", Math.round(produitsKg * 100) / 100]);
  wsProd.addRow(["Rendement (%)", Math.round(rendement * 10) / 10]);
  wsProd.addRow(["Total palox", Math.round(totalPalox * 10) / 10]);
  wsProd.addRow(["Total big bag", Math.round(totalBigBag * 10) / 10]);
  wsProd.addRow([]);

  const headerRowIdx = wsProd.rowCount + 1;
  wsProd.addRow(["Produit", "Quantité (kg)", "Capacité (kg)", "Palox (kg)", "Nb palox", "Big bag (kg)", "Nb big bag"]);
  wsProd.getRow(headerRowIdx).font = { bold: true, color: { argb: "FFF2ECE0" } };
  wsProd.getRow(headerRowIdx).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F3D2F" },
  };
  for (const p of produits) {
    const q = Number(p.quantiteKg);
    wsProd.addRow([
      p.label,
      q,
      Number(p.capaciteKg),
      p.paloxKg ?? "",
      p.paloxKg ? Math.round((q / p.paloxKg) * 10) / 10 : "",
      p.bigBagKg ?? "",
      p.bigBagKg ? Math.round((q / p.bigBagKg) * 10) / 10 : "",
    ]);
  }
  wsProd.getColumn(1).width = 22;
  for (let c = 2; c <= 7; c++) wsProd.getColumn(c).width = 14;

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return new Response(buffer as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="agrownuts-stock-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
