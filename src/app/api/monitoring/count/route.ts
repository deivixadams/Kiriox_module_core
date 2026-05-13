import { NextResponse } from 'next/server';
import { PrismaMonitoringRepository } from '@/modules/monitoring/infrastructure/PrismaMonitoringRepository';

export async function GET() {
  try {
    const repo = new PrismaMonitoringRepository();
    const count = await repo.getActiveEventCount();
    return NextResponse.json({ ok: true, count });
  } catch {
    return NextResponse.json({ ok: true, count: 0 });
  }
}
