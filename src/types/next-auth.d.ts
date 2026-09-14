import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * On enrichit les types d'Auth.js pour transporter l'identifiant et le rôle
 * de l'utilisateur dans la session et dans le token JWT.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
  }
}
