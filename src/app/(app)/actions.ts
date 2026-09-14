"use server";

import { signOut } from "@/auth";

/** Déconnexion puis retour à la page de login. */
export async function doSignOut() {
  await signOut({ redirectTo: "/login" });
}
