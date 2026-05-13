
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  try {
    const evaluations = await prisma.run_ra.findMany({
      take: 10,
      orderBy: { created_at: 'desc' }
    });
    console.log('Evaluations found:', evaluations.length);
    if (evaluations.length > 0) {
      console.log('Sample evaluation:', JSON.stringify(evaluations[0], null, 2));
    }
    
    const count = await prisma.run_ra.count();
    console.log('Total evaluations in run_ra:', count);

    const companies = await prisma.run_ra.groupBy({
      by: ['company_id'],
      _count: {
        id: true
      }
    });
    console.log('Evaluations per company:', JSON.stringify(companies, null, 2));

  } catch (err) {
    console.error('Error during database check:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
