import { PrismaQuestionGraphRepository } from '@/modules/structural-risk/infrastructure/repositories/PrismaQuestionGraphRepository';

export async function getFullQuestionGraphHandler(request: Request) {
  const { searchParams } = new URL(request.url);
  const reinoId = searchParams.get('reinoId') ?? undefined;

  const repo = new PrismaQuestionGraphRepository();
  return repo.getFullGraph(reinoId);
}
