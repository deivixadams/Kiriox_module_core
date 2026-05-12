
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking Companies:');
  const companies = await prisma.company.findMany();
  console.log(JSON.stringify(companies, null, 2));

  console.log('\nChecking Elements Count:');
  const elementsCount = await prisma.elements.count();
  console.log('Total elements:', elementsCount);

  if (elementsCount > 0) {
    console.log('\nSample Elements (first 5):');
    const elements = await prisma.elements.findMany({ take: 5 });
    console.log(JSON.stringify(elements, null, 2));
  }

  console.log('\nChecking Activities Count:');
  const activitiesCount = await prisma.activities.count();
  console.log('Total activities:', activitiesCount);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
