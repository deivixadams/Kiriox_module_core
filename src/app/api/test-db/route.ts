import { NextResponse } from 'next/server';
import prisma from "@/infrastructure/db/prisma/client";

export async function GET() {
  try {
    const allEvals = await prisma.run_ra.findMany();
    return NextResponse.json({ ok: true, count: allEvals.length, evals: allEvals });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
