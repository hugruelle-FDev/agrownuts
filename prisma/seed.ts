/**
 * Seed : crée le compte administrateur initial et quelques parcelles d'exemple.
 * Lancé via `npm run db:seed`. Idempotent (upsert) : peut être relancé sans risque.
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@agrownuts.fr";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "AgroNuts2026!";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrateur";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, role: Role.ADMIN },
  });
  console.log(`✓ Admin prêt : ${admin.email} (rôle ${admin.role})`);

  // Parcelles d'exemple (à remplacer par les vôtres dans l'app).
  const parcelles = [
    { code: "DEF", nom: "Parcelle Def" },
    { code: "A1", nom: "Haut du champ" },
    { code: "C3", nom: "Bord de route" },
  ];
  for (const p of parcelles) {
    await prisma.parcelle.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log(`✓ ${parcelles.length} parcelles d'exemple prêtes`);

  // Remorques d'exemple (à adapter à votre parc dans l'app).
  const remorques = ["B1", "B2", "B3", "B4", "B5", "A1", "A2", "A3", "A4", "A5"];
  for (const code of remorques) {
    await prisma.remorque.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
  console.log(`✓ ${remorques.length} remorques d'exemple prêtes`);

  // Produits transformés (catégories de sortie). Quantités à 0 au départ.
  const produits = [
    { code: "entieres", label: "Graines entières", couleur: "#E8B04B", paloxKg: 400, bigBagKg: 500, note: "Calibre premium, prêtes à la vente", ordre: 1 },
    { code: "demies", label: "Demi-graines", couleur: "#D4874E", paloxKg: 400, bigBagKg: 500, note: "Issues du cassage, à conditionner", ordre: 2 },
    { code: "coques", label: "Coques", couleur: "#9C7A5B", paloxKg: 180, bigBagKg: 300, note: "Sous-produit — combustible / paillage", ordre: 3 },
    { code: "miettes", label: "Miettes", couleur: "#8FA678", paloxKg: 200, bigBagKg: 300, note: "Fines issues du tri", ordre: 4 },
  ];
  for (const p of produits) {
    await prisma.produit.upsert({ where: { code: p.code }, update: {}, create: p });
  }
  console.log(`✓ ${produits.length} produits transformés prêts`);

  // Séchoir (configuration unique).
  const sechoir = await prisma.sechoir.findFirst();
  if (!sechoir) {
    await prisma.sechoir.create({ data: {} });
    console.log("✓ Séchoir initialisé (8 emplacements)");
  }

  // Chauffeurs d'exemple.
  for (const nom of ["Jean", "Paul", "Luc"]) {
    await prisma.chauffeur.upsert({ where: { nom }, update: {}, create: { nom } });
  }
  console.log("✓ Chauffeurs d'exemple prêts");

  // Configuration applicative : jeton du formulaire public.
  const config = await prisma.appConfig.findFirst();
  if (!config) {
    await prisma.appConfig.create({ data: { declarationToken: randomBytes(24).toString("hex") } });
    console.log("✓ Jeton de déclaration publique généré");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
