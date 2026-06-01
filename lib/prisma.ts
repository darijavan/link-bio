import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function normalizeDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get("sslmode");

  if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }

  return url.toString();
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL!) });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
