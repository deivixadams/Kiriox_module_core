import { getAuthContext } from '@/core/auth/auth-server';
import { redirect } from 'next/navigation';
import { GetMonitoringDatesUseCase } from '@/modules/monitoring/application/use-cases/GetMonitoringDatesUseCase';
import { PrismaMonitoringRepository } from '@/modules/monitoring/infrastructure/PrismaMonitoringRepository';
import { MonitoringDatesClient } from '@/modules/monitoring/ui/MonitoringDatesClient';

export default async function DefinirPage() {
  const auth = await getAuthContext();
  if (!auth) redirect('/login');

  const useCase = new GetMonitoringDatesUseCase(new PrismaMonitoringRepository());
  const { risks, controls, tests, evidences } = await useCase.execute({ companyId: auth.tenantId });

  return (
    <MonitoringDatesClient
      risks={risks}
      controls={controls}
      tests={tests}
      evidences={evidences}
    />
  );
}
