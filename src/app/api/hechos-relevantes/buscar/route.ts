import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/core/auth/auth-server';
import { BuscarHechosRelevantesUseCase } from '@/modules/hechos-relevantes/application/use-cases/BuscarHechosRelevantesUseCase';
import { BraveSearchHechosRepository } from '@/modules/hechos-relevantes/infrastructure/BraveSearchHechosRepository';

export async function POST(req: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ ok: false, error: 'Unauthorized', results: [] }, { status: 401 });
  }

  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'BRAVE_SEARCH_API_KEY no configurada en .env', results: [] },
      { status: 503 },
    );
  }

  try {
    const body = await req.json().catch(() => ({})) as {
      queries?: string[];
      fechaDesde?: string;
      fechaHasta?: string;
    };

    const repo = new BraveSearchHechosRepository(apiKey);
    const useCase = new BuscarHechosRelevantesUseCase(repo);
    const { results, total } = await useCase.execute({
      queries: body.queries,
      fechaDesde: body.fechaDesde,
      fechaHasta: body.fechaHasta,
    });

    return NextResponse.json({ ok: true, results, total });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), results: [] }, { status: 500 });
  }
}
