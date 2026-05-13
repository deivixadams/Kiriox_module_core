
import { PrismaLinearRiskRepository } from '../src/modules/linear-risk/infrastructure/repositories/PrismaLinearRiskRepository';

async function main() {
  const repo = new PrismaLinearRiskRepository();
  const companyId = process.env.DEV_AUTH_TENANT_ID || '22222222-2222-2222-2222-222222222222';
  
  console.log('Testing with companyId:', companyId);
  try {
    const result = await repo.getEvaluations(companyId);
    console.log('Final result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
