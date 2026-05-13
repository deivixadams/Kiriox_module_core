import { NextResponse } from 'next/server';
import { getAuthContext } from '@/core/auth/auth-server';
import { GetMonitoringDashboardUseCase } from '@/modules/monitoring/application/use-cases/GetMonitoringDashboardUseCase';
import { PrismaMonitoringRepository } from '@/modules/monitoring/infrastructure/PrismaMonitoringRepository';

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const useCase = new GetMonitoringDashboardUseCase(new PrismaMonitoringRepository());
    const data = await useCase.execute({ companyId: auth.tenantId });

    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
