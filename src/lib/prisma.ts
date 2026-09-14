import { PrismaClient } from "@prisma/client";

/**
 * Client Prisma en singleton.
 * En développement, Next.js recharge le code à chaque modification ; sans ce
 * singleton on ouvrirait une nouvelle connexion à chaque fois.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
