import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Configuration Auth.js "légère" (sans Prisma ni bcrypt) : elle peut tourner
 * dans le middleware (runtime Edge). La partie qui touche la base de données
 * (vérification du mot de passe) vit dans auth.ts.
 */
export const authConfig = {
  // Nécessaire derrière un hébergeur comme Vercel (sinon erreur UntrustedHost).
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [], // renseignés dans auth.ts
  callbacks: {
    /** Contrôle d'accès global appliqué par le middleware. */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);

      // Formulaire public de déclaration de caisse (QR) : accessible sans session.
      if (nextUrl.pathname.startsWith("/declarer")) return true;

      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        // Déjà connecté → on renvoie vers l'app.
        if (isLoggedIn) return Response.redirect(new URL("/stock", nextUrl));
        return true;
      }
      // Toute autre page exige une session.
      return isLoggedIn;
    },
    /** On glisse l'id et le rôle dans le token à la connexion. */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    /** On expose id et rôle côté session (utilisables dans les composants). */
    session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      if (token.role) session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
