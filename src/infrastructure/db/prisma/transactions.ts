import type { PrismaClient, Prisma } from "@/generated/prisma/client";

export async function runInTransaction<T>(
  client: PrismaClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return client.$transaction((tx) => callback(tx));
}
