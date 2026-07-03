import { PrismaClient } from "@prisma/client";

// Client Prisma dédié aux écritures qui nécessitent le rôle neondb_owner.
// Ne jamais exposer ni importer ce fichier côté client.
// Requiert DATABASE_URL_ADMIN dans .env.local (voir README ou doc Neon).

const globalForPrismaAdmin = globalThis as unknown as {
  prismaAdmin: PrismaClient | undefined;
};

export const prismaAdmin =
  globalForPrismaAdmin.prismaAdmin ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL_ADMIN,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrismaAdmin.prismaAdmin = prismaAdmin;
}
