import { NextResponse } from 'next/server';
import { getAuthContext } from '@/core/auth/auth-server';
import { bootstrapCore } from '@/core/core-bootstrap';
import { GetAccessContextUseCase } from '@/core/permissions/application/use-cases/GetAccessContextUseCase';
import { PrismaAccessContextRepository } from '@/core/permissions/infrastructure/PrismaAccessContextRepository';

bootstrapCore();

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const useCase = new GetAccessContextUseCase(new PrismaAccessContextRepository());
  const access = await useCase.execute({
    userId: auth.userId,
    companyId: auth.tenantId,
    fallbackEmail: auth.email,
  });

  return NextResponse.json(access, { status: 200 });
}
