"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

/**
 * Action serveur de connexion, appelée par le formulaire de login.
 * Renvoie un message d'erreur (string) en cas d'échec, sinon redirige.
 */
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/stock",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return "Email ou mot de passe incorrect.";
    }
    // signIn lève une redirection (NEXT_REDIRECT) en cas de succès : on la relance.
    throw error;
  }
}
