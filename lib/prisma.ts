import { PrismaPg } from "@prisma/adapter-pg";

import {
  PrismaClient,
  type PrismaClient as PrismaClientType,
} from "@/app/generated/prisma/client";
import { normalizeDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientType;
};

function createPrismaClient(): PrismaClientType {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  if (databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: databaseUrl });
  }

  return new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
