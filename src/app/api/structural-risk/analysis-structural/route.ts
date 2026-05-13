import { nextHandler, withAccess } from '@/shared/http';
import { getStructuralAnalysisResultHandler } from '@/modules/structural-risk/api/handlers/structuralAnalysisHandlers';

export const dynamic = 'force-dynamic';

export const GET = nextHandler(
  withAccess({ module: 'structural-risk', permission: 'risk.structural.read' }, async (req, _ctx, access) =>
    getStructuralAnalysisResultHandler(req, access)
  )
);

