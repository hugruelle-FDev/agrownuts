"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SechageFormState = { error?: string; success?: string };

/* --------------------------- Réglages du séchoir --------------------------- */

const sechoirSchema = z.object({
  temperatureC: z.coerce.number().min(-50).max(200).optional(),
  soufflerie: z.coerce.number().int().min(0).max(100).optional(),
  humiditeCible: z.coerce.number().min(0).max(100),
  vitesseTheorique: z.coerce.number().positive("Vitesse invalide"),
});

export async function updateSechoir(
  _prev: SechageFormState,
  formData: FormData,
): Promise<SechageFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") return { error: "Vos droits ne permettent pas cette action." };

  const raw: Record<string, unknown> = Object.fromEntries(formData);
  for (const k of ["temperatureC", "soufflerie"]) if (raw[k] === "") delete raw[k];
  const parsed = sechoirSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const { temperatureC, soufflerie, humiditeCible, vitesseTheorique } = parsed.data;

  const sechoir = await prisma.sechoir.findFirst();
  if (!sechoir) {
    await prisma.sechoir.create({
      data: {
        temperatureC: temperatureC ?? null,
        soufflerie: soufflerie ?? null,
        humiditeCible,
        vitesseTheorique,
      },
    });
  } else {
    await prisma.sechoir.update({
      where: { id: sechoir.id },
      data: {
        temperatureC: temperatureC ?? null,
        soufflerie: soufflerie ?? null,
        humiditeCible,
        vitesseTheorique,
      },
    });
  }

  revalidatePath("/sechage");
  return { success: "Réglages du séchoir enregistrés." };
}

/* --------------------------- Placement des caisses --------------------------- */

/** Assigne un lot (au séchoir) à un emplacement libre. */
export async function placerCaisse(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;

  const lotId = String(formData.get("lotId") ?? "");
  const place = Number(formData.get("place"));
  if (!lotId || !Number.isInteger(place)) return;

  const lot = await prisma.lot.findUnique({ where: { id: lotId } });
  if (!lot || lot.statut !== "SECHOIR") return;

  // Emplacement déjà occupé ? on ne fait rien.
  const occupe = await prisma.lot.findFirst({ where: { sechoirPlace: place } });
  if (occupe) return;

  await prisma.lot.update({ where: { id: lotId }, data: { sechoirPlace: place } });
  revalidatePath("/sechage");
}

/** Retire une caisse du séchoir (libère l'emplacement, le lot reste « au séchoir »). */
export async function retirerCaisse(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role === "LECTURE") return;

  const lotId = String(formData.get("lotId") ?? "");
  if (!lotId) return;

  await prisma.lot.update({ where: { id: lotId }, data: { sechoirPlace: null } });
  revalidatePath("/sechage");
}

/* --------------------------- Relevés d'humidité --------------------------- */

const releveSchema = z.object({
  lotId: z.string().min(1),
  humidite: z.coerce.number().min(0, "Humidité invalide").max(100, "Humidité invalide"),
});

export async function ajouterReleve(
  _prev: SechageFormState,
  formData: FormData,
): Promise<SechageFormState> {
  const session = await auth();
  if (!session?.user) return { error: "Session expirée." };
  if (session.user.role === "LECTURE") return { error: "Vos droits ne permettent pas cette action." };

  const parsed = releveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Relevé invalide." };

  const { lotId, humidite } = parsed.data;
  const lot = await prisma.lot.findUnique({ where: { id: lotId } });
  if (!lot) return { error: "Caisse introuvable." };

  await prisma.releveSechage.create({
    data: { lotId, humidite, createdById: session.user.id },
  });

  await prisma.auditLog
    .create({
      data: {
        entite: "Séchage",
        entiteId: lotId,
        action: "RELEVE",
        nouvelleValeur: `${humidite} % — ${lot.reference}`,
        userId: session.user.id,
      },
    })
    .catch(() => {});

  revalidatePath("/sechage");
  return { success: `Relevé ${humidite} % enregistré.` };
}
