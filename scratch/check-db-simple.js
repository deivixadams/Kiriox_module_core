
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const companies = await prisma.company.findMany();
    console.log('Companies:', JSON.stringify(companies, null, 2));

    const elements = await prisma.elements.findMany({ take: 5 });
    console.log('Elements:', JSON.stringify(elements, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
