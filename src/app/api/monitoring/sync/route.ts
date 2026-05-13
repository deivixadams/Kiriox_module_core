import { NextResponse } from 'next/server';
import { getAuthContext } from '@/core/auth/auth-server';
import { PrismaMonitoringRepository } from '@/modules/monitoring/infrastructure/PrismaMonitoringRepository';

export async function POST() {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const repo = new PrismaMonitoringRepository();
    const result = await repo.syncEvents();
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
