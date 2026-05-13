import { nextHandler, withAccess } from '@/shared/http';
import {
  getStructuralWizardActivitiesHandler,
  patchStructuralWizardActivitiesHandler,
} from '@/modules/structural-risk/api/handlers/structuralCaptureWizardHandlers';

export const dynamic = 'force-dynamic';

export const GET = nextHandler(
  withAccess({ module: 'structural-risk', permission: 'risk.structural.read' }, async (req, _ctx, access) =>
    getStructuralWizardActivitiesHandler(req, access)
  )
);

export const PATCH = nextHandler(
  withAccess({ module: 'structural-risk', permission: 'risk.structural.write' }, async (req, _ctx, access) =>
    patchStructuralWizardActivitiesHandler(req, access)
  )
);
