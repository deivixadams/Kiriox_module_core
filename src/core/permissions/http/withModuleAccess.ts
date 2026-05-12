import { withAccess } from './withAccess';
import type { ModuleCode } from '@/shared/types';

type LegacyModuleKey = ModuleCode | 'risk';
type RouteContext = { params?: unknown } | undefined;
type RouteHandler = (request: Request, context?: RouteContext) => Promise<Response> | Response;

function normalizeModule(moduleKey: LegacyModuleKey): ModuleCode {
  if (moduleKey === 'risk') return 'structural-risk';
  return moduleKey;
}

function normalizePermission(moduleKey: LegacyModuleKey, permission: string): string {
  if (permission.includes('.')) return permission;
  return `${normalizeModule(moduleKey)}.${permission}`;
}

export function withModuleAccess(
  moduleKey: LegacyModuleKey,
  permission: string,
  handler: RouteHandler
): RouteHandler {
  return withAccess(
    {
      module: normalizeModule(moduleKey),
      permission: normalizePermission(moduleKey, permission),
    },
    (request, context) => handler(request, context)
  );
}
