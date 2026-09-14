import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Le middleware protège toutes les pages : la fonction `authorized`
// (dans auth.config.ts) redirige vers /login si l'utilisateur n'est pas connecté.
export default NextAuth(authConfig).auth;

export const config = {
  // On applique le middleware partout SAUF sur les routes techniques.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons).*)"],
};
