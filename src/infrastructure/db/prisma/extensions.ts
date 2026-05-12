import type { PrismaClient } from "@/generated/prisma/client";

export function withDefaultExtensions<T extends PrismaClient>(client: T): T {
  return client;
}
