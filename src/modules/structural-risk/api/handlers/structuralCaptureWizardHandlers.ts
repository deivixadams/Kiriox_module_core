import { NextResponse } from 'next/server';
import type { AccessContext } from '@/shared/http/withAccess';
import { PrismaStructuralWizardRepository } from '@/modules/structural-risk/infrastructure/repositories/PrismaStructuralWizardRepository';

function toUuid(value: unknown): string | null {
  const v = String(value ?? '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

export async function getStructuralRunWizardHandler(request: Request, access: AccessContext) {
  const url = new URL(request.url);
  const runSaId = toUuid(url.searchParams.get('runSaId'));
  const repo = new PrismaStructuralWizardRepository();

  const [catalogs, runs] = await Promise.all([
    repo.getCatalogs(),
    repo.getRunsByCompany(access.company.id),
  ]);

  const currentRun = runSaId
    ? (runs.find((r) => r.id === runSaId) ?? null)
    : (runs[0] ?? null);
  const lifecycleHistory = currentRun ? await repo.getLifecycleHistory(currentRun.id) : [];

  return NextResponse.json({ runs, currentRun, lifecycleHistory, catalogs });
}

export async function postStructuralRunWizardHandler(request: Request, access: AccessContext) {
  const body = (await request.json()) as {
    runSaId?: string;
    title?: string;
    scope_type?: string;
    methodology?: string;
    lifecycle_id?: string;
    fromLinearEvalId?: string;
  };

  const repo = new PrismaStructuralWizardRepository();
  const runSaId = toUuid(body.runSaId);

  if (runSaId) {
    const run = await repo.verifyRun(runSaId, access.company.id);
    if (!run) return NextResponse.json({ error: 'Run estructural no encontrado.' }, { status: 404 });
    return NextResponse.json({ selected: true, runSaId: run.id, code: run.code });
  }

  const catalogs = await repo.getCatalogs();
  const defaultLifecycle   = catalogs.lifecycle[0];
  const defaultScope       = catalogs.scopeTypes[0];
  const defaultMethodology = catalogs.methodologies[0];
  if (!defaultLifecycle || !defaultScope || !defaultMethodology) {
    return NextResponse.json({ error: 'Faltan catálogos graph para crear el run estructural.' }, { status: 400 });
  }

  let finalTitle = body.title;
  let fromLinearActivities: string[] = [];

  const fromLinearEvalId = toUuid(body.fromLinearEvalId);
  if (fromLinearEvalId) {
    const linearRows = await repo.getLinearContextFromEval(fromLinearEvalId);
    if (linearRows.length > 0) {
      const obj = linearRows.find((r) => r.objective)?.objective;
      if (obj && !finalTitle) finalTitle = obj;
      fromLinearActivities = Array.from(
        new Set(linearRows.filter((r) => r.activity_id).map((r) => r.activity_id as string)),
      );
    }
  }

  const code  = `GSA-${Date.now().toString().slice(-8)}`;
  const title = String(finalTitle ?? 'Nueva evaluación estructural').trim() || 'Nueva evaluación estructural';

  const created = await repo.createRun({
    companyId: access.company.id,
    userId: access.user.id,
    code,
    title,
    scopeCode: defaultScope.code,
    methodologyCode: defaultMethodology.code,
    lifecycleId: defaultLifecycle.id,
    lifecycleCode: defaultLifecycle.code,
    fromLinearActivities,
  });

  return NextResponse.json({ created: true, runSaId: created.id, code: created.code });
}

export async function patchStructuralRunWizardHandler(request: Request, access: AccessContext) {
  const body = (await request.json()) as {
    runSaId?: string;
    title?: string;
    scope_type?: string;
    methodology?: string;
    lifecycle_id?: string;
    change_reason?: string;
  };

  const runSaId = toUuid(body.runSaId);
  if (!runSaId) return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });

  const repo = new PrismaStructuralWizardRepository();
  const run = await repo.verifyRun(runSaId, access.company.id);
  if (!run) return NextResponse.json({ error: 'Run estructural no encontrado.' }, { status: 404 });

  await repo.updateRun({
    runSaId,
    companyId: access.company.id,
    userId: access.user.id,
    title: body.title,
    scope_type: body.scope_type,
    methodology: body.methodology,
    lifecycleId: toUuid(body.lifecycle_id),
    changeReason: body.change_reason,
  });

  return NextResponse.json({ ok: true });
}

export async function deleteStructuralRunWizardHandler(request: Request, access: AccessContext) {
  const body = (await request.json()) as { runSaId?: string };
  const runSaId = toUuid(body.runSaId);
  if (!runSaId) return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });

  const repo = new PrismaStructuralWizardRepository();
  const ok = await repo.deleteRun(runSaId, access.company.id, access.user.id);
  if (!ok) return NextResponse.json({ error: 'Evaluación no encontrada o sin permiso.' }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function getStructuralWizardActivitiesHandler(request: Request, access: AccessContext) {
  const url = new URL(request.url);
  const runSaId = toUuid(url.searchParams.get('runSaId'));

  const repo = new PrismaStructuralWizardRepository();
  const bridgeExists = await repo.bridgeTableExists();
  if (!bridgeExists) {
    return NextResponse.json({ error: 'Falta tabla public.graph_map_run_sa_activities.' }, { status: 400 });
  }

  const selected = runSaId ? await repo.getSelectedActivities(runSaId, access.company.id) : [];
  const data = await repo.getActivitiesData(access.company.id, runSaId ?? '');

  const selectedSet = new Set(selected);
  const filteredDependencies = selectedSet.size
    ? data.dependencies.filter((d) => selectedSet.has(d.activity_id) || (d.dependency_activity_id ? selectedSet.has(d.dependency_activity_id) : false))
    : data.dependencies;
  const filteredSharedResources = selectedSet.size
    ? data.sharedResources.filter((r) => selectedSet.has(r.activity_id))
    : data.sharedResources;
  const filteredLinearRiskContext = selectedSet.size
    ? data.linearRiskContext.filter((r) => selectedSet.has(r.activity_id))
    : data.linearRiskContext;
  const filteredLinearControlContext = data.linearControlContext.filter((c) =>
    filteredLinearRiskContext.some((r) => r.risk_id === c.risk_id),
  );

  return NextResponse.json({
    activities: data.activities,
    people: data.people,
    selected_activity_ids: selected,
    catalogs: {
      dependencyResources: data.resources,
      failureEffects: data.effects,
      dependencyStrengths: data.strengths,
      alternativeLevels: data.alternatives,
      impacts: data.impacts,
      criticalities: data.criticalities,
    },
    dependencies: filteredDependencies,
    shared_resources: filteredSharedResources,
    linear_risk_context: filteredLinearRiskContext,
    risk_cascade_catalog: data.cascadeCatalog,
    risk_resource_catalog: data.resourceCatalog,
    risk_cascades: data.riskCascades,
    linear_control_context: filteredLinearControlContext,
  });
}

export async function patchStructuralWizardActivitiesHandler(request: Request, access: AccessContext) {
  const body = (await request.json()) as {
    runSaId?: string;
    selectedActivityIds?: string[];
    dependencyDeleteId?: string;
    sharedResourceDelete?: { activityId?: string; resourceId?: string };
    riskCascadeDeleteId?: string;
    riskCascadeInput?: {
      riskCascadeId?: string;
      riskId?: string;
      cascadeCode?: string;
      affectedResourceId?: string;
      notes?: string;
    };
    dependencyInput?: {
      dependencyId?: string;
      activityId?: string;
      impactCode?: string;
      criticalityCode?: string;
      dependencyActivityId?: string;
      dependencyResourceId?: string;
      failureEffectId?: string;
      dependencyStrengthId?: string;
      alternativeLevelId?: string;
      dependencySystemName?: string;
      dependencyDataName?: string;
      dependencyPersonId?: string;
      dependencyProviderName?: string;
      dependencyDocumentName?: string;
    };
    sharedResourceInput?: {
      mode?: 'create' | 'update';
      activityId?: string;
      resourceId?: string;
      resourceName?: string;
      resourceTypeId?: string;
      ownerId?: string;
      failureEffectId?: string;
      dependencyStrengthId?: string;
      alternativeLevelId?: string;
      criticalityCode?: string;
    };
  };

  const runSaId = toUuid(body.runSaId);
  if (!runSaId) return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });

  const repo = new PrismaStructuralWizardRepository();

  const bridgeExists = await repo.bridgeTableExists();
  const run = await repo.verifyRun(runSaId, access.company.id);
  if (!run) return NextResponse.json({ error: 'Run estructural no encontrado.' }, { status: 404 });
  if (!bridgeExists) return NextResponse.json({ error: 'Falta tabla public.graph_map_run_sa_activities.' }, { status: 400 });

  // ── Delete operations ────────────────────────────────────────────────────

  if (body.dependencyDeleteId) {
    const id = toUuid(body.dependencyDeleteId);
    if (!id) return NextResponse.json({ error: 'Dependencia inválida.' }, { status: 400 });
    await repo.deleteDependency(id, access.company.id);
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (body.sharedResourceDelete) {
    const activityId = toUuid(body.sharedResourceDelete.activityId);
    const resourceId = toUuid(body.sharedResourceDelete.resourceId);
    if (!activityId || !resourceId) return NextResponse.json({ error: 'Parámetros de eliminación inválidos.' }, { status: 400 });
    await repo.deleteSharedResource(activityId, resourceId);
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (body.riskCascadeDeleteId) {
    const id = toUuid(body.riskCascadeDeleteId);
    if (!id) return NextResponse.json({ error: 'Registro de cascada inválido.' }, { status: 400 });
    await repo.deleteRiskCascade(id, runSaId);
    return NextResponse.json({ ok: true, deleted: true });
  }

  // ── Upsert riskCascade ───────────────────────────────────────────────────

  if (body.riskCascadeInput) {
    const riskId      = toUuid(body.riskCascadeInput.riskId);
    const cascadeCode = String(body.riskCascadeInput.cascadeCode ?? '').trim();
    if (!riskId || !cascadeCode) return NextResponse.json({ error: 'Riesgo y tipo de cascada son obligatorios.' }, { status: 400 });

    const validation = await repo.validateCatalogCodes({
      riskId, cascadeCode,
      affectedResourceId: toUuid(body.riskCascadeInput.affectedResourceId),
      companyId: access.company.id,
    });
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

    const { riskCascadeId, created } = await repo.upsertRiskCascade({
      riskCascadeId: toUuid(body.riskCascadeInput.riskCascadeId),
      runSaId,
      riskId,
      cascadeCode,
      affectedResourceId: toUuid(body.riskCascadeInput.affectedResourceId),
      notes: String(body.riskCascadeInput.notes ?? '').trim() || null,
      companyId: access.company.id,
    });
    return NextResponse.json({ ok: true, [created ? 'created' : 'updated']: true, risk_cascade_id: riskCascadeId });
  }

  // ── Upsert sharedResource ────────────────────────────────────────────────

  if (body.sharedResourceInput) {
    const input = body.sharedResourceInput;
    const activityId       = toUuid(input.activityId);
    const resourceTypeId   = toUuid(input.resourceTypeId);
    const failureEffectId  = toUuid(input.failureEffectId);
    const dependencyStrengthId = toUuid(input.dependencyStrengthId);
    const alternativeLevelId   = toUuid(input.alternativeLevelId);
    const criticalityCode  = String(input.criticalityCode ?? '').trim().toUpperCase();
    const resourceName     = String(input.resourceName ?? '').trim();

    if (!activityId || !resourceTypeId || !failureEffectId || !dependencyStrengthId || !alternativeLevelId || !resourceName || !criticalityCode) {
      return NextResponse.json({ error: 'Completa los campos requeridos del recurso compartido.' }, { status: 400 });
    }

    const validation = await repo.validateCatalogCodes({
      resourceTypeId, failureEffectId, dependencyStrengthId, alternativeLevelId, criticalityCode,
    });
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 400 });

    const inRun = await repo.verifyActivityInRun(runSaId, access.company.id, activityId);
    if (!inRun) return NextResponse.json({ error: 'La actividad no está incluida en la corrida activa.' }, { status: 400 });

    const { resourceId } = await repo.upsertSharedResource({
      mode: input.mode === 'update' ? 'update' : 'create',
      activityId,
      resourceId: toUuid(input.resourceId),
      resourceName,
      resourceTypeCode: validation.resourceTypeCode!,
      failureEffectCode: validation.failureEffectCode!,
      dependencyStrengthCode: validation.dependencyStrengthCode!,
      alternativeCode: validation.alternativeCode!,
      criticalityCode,
      ownerId: toUuid(input.ownerId),
      runSaId,
      companyId: access.company.id,
      userId: access.user.id,
    });

    return NextResponse.json({ ok: true, resource_id: resourceId });
  }

  // ── Upsert dependency ────────────────────────────────────────────────────

  if (body.dependencyInput) {
    const input = body.dependencyInput;
    const activityId = toUuid(input.activityId);
    if (!activityId) return NextResponse.json({ error: 'Actividad inválida.' }, { status: 400 });

    const dependencyResourceId  = toUuid(input.dependencyResourceId);
    const failureEffectId       = toUuid(input.failureEffectId);
    const dependencyStrengthId  = toUuid(input.dependencyStrengthId);
    const alternativeLevelId    = toUuid(input.alternativeLevelId);

    // Impact/criticality step — no dependency fields needed
    if (!dependencyResourceId && !failureEffectId && !dependencyStrengthId && !alternativeLevelId) {
      await repo.updateActivityImpactCriticality(runSaId, activityId, access.company.id, input.impactCode, input.criticalityCode);
      return NextResponse.json({ ok: true });
    }

    if (!dependencyResourceId || !failureEffectId || !dependencyStrengthId || !alternativeLevelId) {
      return NextResponse.json({ error: 'Completa recurso, efecto de falla, fuerza de dependencia y nivel de alternativa.' }, { status: 400 });
    }

    const inRun = await repo.verifyActivityInRun(runSaId, access.company.id, activityId);
    if (!inRun) return NextResponse.json({ error: 'La actividad X no está incluida en la corrida activa.' }, { status: 400 });

    const dependencyActivityId = toUuid(input.dependencyActivityId);
    if (dependencyActivityId) {
      const exists = await repo.verifyActivityExists(dependencyActivityId, access.company.id);
      if (!exists) return NextResponse.json({ error: 'La actividad Y no es válida para la compañía.' }, { status: 400 });
    }

    const { id, created } = await repo.upsertDependency({
      dependencyId: toUuid(input.dependencyId) ?? undefined,
      activityId,
      companyId: access.company.id,
      runSaId,
      dependencyActivityId,
      dependencyResourceId,
      failureEffectId,
      dependencyStrengthId,
      alternativeLevelId,
      dependencyPersonId: toUuid(input.dependencyPersonId),
      dependencySystemName: String(input.dependencySystemName ?? '').trim() || null,
      dependencyDataName: String(input.dependencyDataName ?? '').trim() || null,
      dependencyProviderName: String(input.dependencyProviderName ?? '').trim() || null,
      dependencyDocumentName: String(input.dependencyDocumentName ?? '').trim() || null,
    });

    return NextResponse.json({ ok: true, [created ? 'created' : (id ? 'updated' : 'reused')]: true, id });
  }

  // ── Bulk activity selection ───────────────────────────────────────────────

  const selectedActivityIds = Array.isArray(body.selectedActivityIds)
    ? body.selectedActivityIds.map((v) => toUuid(v)).filter((v): v is string => Boolean(v))
    : [];

  await repo.updateActivitySelection(runSaId, access.company.id, access.user.id, selectedActivityIds);
  return NextResponse.json({ ok: true, selected_activity_ids: selectedActivityIds });
}
