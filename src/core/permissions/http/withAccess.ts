import { getAuthContext, isDevAuthBypassEnabled } from '@/core/auth/auth-server';
import type { AccessRequirement, ModuleCode } from '@/shared/types';
import { ApiError } from '@/shared/types';

type RouteContext = { params?: unknown } | undefined;
type RouteHandler = (request: Request, context?: RouteContext) => Promise<Response> | Response;

export type RouteAccessContext = {
  auth: { userId: string; tenantId: string; roleCode: string; email?: string };
  user: { id: string; roleCode: string; email?: string };
  company: { id: string };
  access: AccessRequirement;
};

type AccessRouteHandler = (
  request: Request,
  context: RouteContext | undefined,
  access: RouteAccessContext
) => Promise<Response> | Response;

function resolveCompanyId(
  request: Request,
  auth: { tenantId: string }
): string {
  const url = new URL(request.url);
  const selected =
    url.searchParams.get('company_id') ||
    request.headers.get('x-company-id') ||
    auth.tenantId;

  if (!selected) throw ApiError.forbidden('Company context missing');
  return selected;
}

function normalizeModule(module: string): ModuleCode {
  if (module === 'risk') return 'structural-risk';
  return module as ModuleCode;
}

export function withAccess(
  requirement: AccessRequirement,
  handler: AccessRouteHandler
): RouteHandler {
  return async (request: Request, context?: RouteContext) => {
    const auth = await getAuthContext();
    if (!auth) throw ApiError.unauthorized();

    const companyId = resolveCompanyId(request, auth);
    const moduleCode = normalizeModule(requirement.module);

    const routeAccess: RouteAccessContext = {
      auth,
      user: { id: auth.userId, roleCode: auth.roleCode, email: auth.email },
      company: { id: companyId },
      access: { module: moduleCode, permission: requirement.permission },
    };

    if (isDevAuthBypassEnabled()) {
      return handler(request, context, routeAccess);
    }

    return handler(request, context, routeAccess);
  };
}
