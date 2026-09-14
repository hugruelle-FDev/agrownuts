"use server";

import { revalidatePath } from "next/cache";
import type { LotStatut } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function revalider() {
  revalidatePath("/stock");
  revalidatePath("/stock/declarations");
  revalidatePath("/stock/historique");
  revalidatePath("/sechage");
}

/** Valide une déclaration : le lot devient officiel « au séchoir ». */
export async function validerDeclaration(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;

  const id = String(formData.get("id") ?? "");
  const lot = await prisma.lot.findUnique({ where: { id } });
  if (!lot || lot.statut !== "DECLARE") return;

  await prisma.lot.update({ where: { id }, data: { statut: "SECHOIR" as LotStatut } });
  await prisma.auditLog
    .create({
      data: {
        entite: "Lot",
        entiteId: id,
        action: "VALIDATION",
        ancienneValeur: "Déclaré",
        nouvelleValeur: lot.reference,
        userId: session.user.id,
      },
    })
    .catch(() => {});
  revalider();
}

/** Rejette (supprime) une déclaration. */
export async function rejeterDeclaration(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;

  const id = String(formData.get("id") ?? "");
  const lot = await prisma.lot.findUnique({ where: { id } });
  if (!lot || lot.statut !== "DECLARE") return;

  await prisma.lot.delete({ where: { id } }).catch(() => {});
  await prisma.auditLog
    .create({
      data: { entite: "Lot", entiteId: id, action: "REJET", ancienneValeur: lot.reference, userId: session.user.id },
    })
    .catch(() => {});
  revalider();
}
