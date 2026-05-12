
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Checking Companies:');
    const companies = await prisma.company.findMany();
    console.log(JSON.stringify(companies, null, 2));

    console.log('\nChecking Elements Count:');
    const elementsCount = await prisma.elements.count();
    console.log('Total elements:', elementsCount);

    if (elementsCount > 0) {
      const elements = await prisma.elements.findMany({ take: 5 });
      console.log('Sample Elements:', JSON.stringify(elements, null, 2));
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
