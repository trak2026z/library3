import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export async function checkDbReady(): Promise<boolean> {
  try {
    const p = getPrisma();
    await p.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function disconnectPrisma(): Promise<void> {
  if (!prisma) return;
  await prisma.$disconnect();
  prisma = null;
}