export { prisma, default } from './client';
export type { PrismaClient, Prisma } from '@/generated/prisma/client';
export { withDefaultExtensions } from './extensions';
export { runInTransaction } from './transactions';
