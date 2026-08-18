import { PrismaClient } from "@prisma/client";

// Next.js dev-tilassa moduulit ladataan uudelleen usein - tämä estää liian monen
// Prisma-yhteyden avaamisen kehityksessä.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
