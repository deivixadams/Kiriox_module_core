
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const evaluations = await prisma.run_ra.findMany({
    take: 10,
    orderBy: { created_at: 'desc' }
  });
  console.log('Evaluations:', JSON.stringify(evaluations, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
