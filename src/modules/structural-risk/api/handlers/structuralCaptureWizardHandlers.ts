import { NextResponse } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { AccessContext } from '@/shared/http/withAccess';

type WizardCatalogOption = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
};

function toUuid(value: unknown): string | null {
  const v = String(value ?? '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

async function getCatalogs() {
  const [lifecycle, scopeTypes, methodologies] = await Promise.all([
    prisma.$queryRaw<WizardCatalogOption[]>(Prisma.sql`
      SELECT id::text, code, name, description, sort_order
      FROM public.graph_catalog_run_lifecycle
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `),
    prisma.$queryRaw<WizardCatalogOption[]>(Prisma.sql`
      SELECT id::text, code, name, description, sort_order
      FROM public.graph_catalog_run_scope_type
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `),
    prisma.$queryRaw<WizardCatalogOption[]>(Prisma.sql`
      SELECT id::text, code, name, description, sort_order
      FROM public.graph_catalog_run_methodology
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `),
  ]);

  return { lifecycle, scopeTypes, methodologies };
}

async function getRunsByCompany(companyId: string) {
  return prisma.$queryRaw<Array<{
    id: string;
    code: string;
    title: string;
    scope_type: string;
    methodology: string;
    status: string;
    version: number;
    assessment_date: string;
    created_at: string;
    updated_at: string;
    lifecycle_id: string | null;
    lifecycle_code: string | null;
    lifecycle_name: string | null;
  }>>(Prisma.sql`
    SELECT
      r.id::text,
      r.code,
      r.title,
      r.scope_type,
      r.methodology,
      r.status,
      r.version,
      to_char(r.assessment_date, 'YYYY-MM-DD') AS assessment_date,
      to_char(r.created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
      to_char(r.updated_at, 'YYYY-MM-DD HH24:MI') AS updated_at,
      h.to_lifecycle_id::text AS lifecycle_id,
      l.code AS lifecycle_code,
      l.name AS lifecycle_name
    FROM public.graph_run_sa r
    LEFT JOIN public.graph_run_lifecycle_history h
      ON h.run_sa_id = r.id
      AND h.is_current = true
    LEFT JOIN public.graph_catalog_run_lifecycle l
      ON l.id = h.to_lifecycle_id
    WHERE r.company_id = ${companyId}::uuid
    ORDER BY r.updated_at DESC
  `);
}

async function getLifecycleHistory(runSaId: string) {
  return prisma.$queryRaw<Array<{
    id: string;
    changed_at: string;
    progress_percent: number;
    change_reason: string | null;
    completion_reason: string | null;
    from_lifecycle_code: string | null;
    to_lifecycle_code: string | null;
    to_lifecycle_name: string | null;
    changed_by_name: string | null;
  }>>(Prisma.sql`
    SELECT
      h.id::text,
      to_char(h.changed_at, 'YYYY-MM-DD HH24:MI') AS changed_at,
      h.progress_percent::float8 AS progress_percent,
      h.change_reason,
      h.completion_reason,
      lf.code AS from_lifecycle_code,
      lt.code AS to_lifecycle_code,
      lt.name AS to_lifecycle_name,
      trim(concat_ws(' ', u.name, u.last_name)) AS changed_by_name
    FROM public.graph_run_lifecycle_history h
    LEFT JOIN public.graph_catalog_run_lifecycle lf ON lf.id = h.from_lifecycle_id
    LEFT JOIN public.graph_catalog_run_lifecycle lt ON lt.id = h.to_lifecycle_id
    LEFT JOIN public.users u ON u.id = h.changed_by
    WHERE h.run_sa_id = ${runSaId}::uuid
    ORDER BY h.changed_at DESC
  `);
}

export async function getStructuralRunWizardHandler(request: Request, access: AccessContext) {
  const url = new URL(request.url);
  const runSaId = toUuid(url.searchParams.get('runSaId'));
  const [catalogs, runs] = await Promise.all([
    getCatalogs(),
    getRunsByCompany(access.company.id),
  ]);

  const currentRun = runSaId
    ? runs.find((r) => r.id === runSaId) ?? null
    : (runs[0] ?? null);
  const lifecycleHistory = currentRun ? await getLifecycleHistory(currentRun.id) : [];

  return NextResponse.json({
    runs,
    currentRun,
    lifecycleHistory,
    catalogs,
  });
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

  const runSaId = toUuid(body.runSaId);
  if (runSaId) {
    const rows = await prisma.$queryRaw<Array<{ id: string; code: string }>>(Prisma.sql`
      SELECT id::text, code
      FROM public.graph_run_sa
      WHERE id = ${runSaId}::uuid
        AND company_id = ${access.company.id}::uuid
      LIMIT 1
    `);
    if (!rows[0]) {
      return NextResponse.json({ error: 'Run estructural no encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ selected: true, runSaId: rows[0].id, code: rows[0].code });
  }

  const catalogs = await getCatalogs();
  const defaultLifecycle = catalogs.lifecycle[0];
  const defaultScope = catalogs.scopeTypes[0];
  const defaultMethodology = catalogs.methodologies[0];
  if (!defaultLifecycle || !defaultScope || !defaultMethodology) {
    return NextResponse.json({ error: 'Faltan catálogos graph para crear el run estructural.' }, { status: 400 });
  }

  let finalTitle = body.title;
  let fromLinearActivities: string[] = [];

  const fromLinearEvalId = toUuid(body.fromLinearEvalId);
  if (fromLinearEvalId) {
    const linearRows = await prisma.$queryRaw<Array<{ objective: string | null; scope: string | null; activity_id: string | null }>>(Prisma.sql`
      SELECT objective, scope, activity_id::text
      FROM public.run_ra_contexto_evaluacion
      WHERE run_ra_id = ${fromLinearEvalId}::uuid
    `);
    
    if (linearRows.length > 0) {
      const obj = linearRows.find((r) => r.objective)?.objective;
      if (obj && !finalTitle) finalTitle = obj;

      const activities = linearRows
        .filter((r) => r.activity_id)
        .map((r) => r.activity_id as string);
      fromLinearActivities = Array.from(new Set(activities));
    }
  }

  const code = `GSA-${Date.now().toString().slice(-8)}`;
  const title = String(finalTitle ?? 'Nueva evaluación estructural').trim() || 'Nueva evaluación estructural';

  const created = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string; code: string }>>(Prisma.sql`
      INSERT INTO public.graph_run_sa (
        id, company_id, code, title, scope_type, methodology, model_version, status, created_by, assessment_date, created_at, updated_at
      ) VALUES (
        gen_random_uuid(),
        ${access.company.id}::uuid,
        ${code},
        ${title},
        ${defaultScope.code},
        ${defaultMethodology.code},
        'v1',
        ${defaultLifecycle.code},
        ${access.user.id}::uuid,
        CURRENT_DATE,
        now(),
        now()
      )
      RETURNING id::text, code
    `);

    const run = rows[0];

    for (const activityId of fromLinearActivities) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO public.graph_map_run_sa_activities (
          id, company_id, run_sa_id, activity_id, selected_by, selected_at, is_active, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${access.company.id}::uuid,
          ${run.id}::uuid,
          ${activityId}::uuid,
          ${access.user.id}::uuid,
          now(),
          true,
          now(),
          now()
        )
        ON CONFLICT (run_sa_id, activity_id) DO NOTHING
      `);
    }

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO public.graph_run_lifecycle_history (
        id, run_sa_id, from_lifecycle_id, to_lifecycle_id, progress_percent, change_reason, completion_reason, changed_by, changed_at, is_current, metadata
      ) VALUES (
        gen_random_uuid(),
        ${run.id}::uuid,
        NULL,
        ${defaultLifecycle.id}::uuid,
        0,
        'Creación inicial del run estructural',
        NULL,
        ${access.user.id}::uuid,
        now(),
        true,
        jsonb_build_object('source', 'wizard_structural_base')
      )
    `);
    return run;
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
  const lifecycleId = toUuid(body.lifecycle_id);
  if (!runSaId) return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });

  const runRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id::text
    FROM public.graph_run_sa
    WHERE id = ${runSaId}::uuid
      AND company_id = ${access.company.id}::uuid
    LIMIT 1
  `);
  if (!runRows[0]) return NextResponse.json({ error: 'Run estructural no encontrado.' }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE public.graph_run_sa
      SET
        title = COALESCE(${String(body.title ?? '').trim() || null}, title),
        scope_type = COALESCE(${String(body.scope_type ?? '').trim() || null}, scope_type),
        methodology = COALESCE(${String(body.methodology ?? '').trim() || null}, methodology),
        updated_at = now()
      WHERE id = ${runSaId}::uuid
    `);

    if (lifecycleId) {
      const lifecycleRows = await tx.$queryRaw<Array<{ id: string; code: string }>>(Prisma.sql`
        SELECT id::text, code
        FROM public.graph_catalog_run_lifecycle
        WHERE id = ${lifecycleId}::uuid
          AND is_active = true
        LIMIT 1
      `);
      const lifecycle = lifecycleRows[0];
      if (!lifecycle) throw new Error('Lifecycle inválido');

      const currentRows = await tx.$queryRaw<Array<{ id: string; to_lifecycle_id: string }>>(Prisma.sql`
        SELECT id::text, to_lifecycle_id::text
        FROM public.graph_run_lifecycle_history
        WHERE run_sa_id = ${runSaId}::uuid
          AND is_current = true
        ORDER BY changed_at DESC
        LIMIT 1
      `);
      const current = currentRows[0];

      if (!current || current.to_lifecycle_id !== lifecycle.id) {
        if (current) {
          await tx.$executeRaw(Prisma.sql`
            UPDATE public.graph_run_lifecycle_history
            SET is_current = false
            WHERE id = ${current.id}::uuid
          `);
        }
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public.graph_run_lifecycle_history (
            id, run_sa_id, from_lifecycle_id, to_lifecycle_id, progress_percent, change_reason, completion_reason, changed_by, changed_at, is_current, metadata
          ) VALUES (
            gen_random_uuid(),
            ${runSaId}::uuid,
            ${current ? Prisma.sql`${current.to_lifecycle_id}::uuid` : Prisma.sql`NULL`},
            ${lifecycle.id}::uuid,
            0,
            ${String(body.change_reason ?? '').trim() || 'Cambio de estado desde wizard estructural'},
            NULL,
            ${access.user.id}::uuid,
            now(),
            true,
            jsonb_build_object('source', 'wizard_structural_base')
          )
        `);
        await tx.$executeRaw(Prisma.sql`
          UPDATE public.graph_run_sa
          SET status = ${lifecycle.code}, updated_at = now()
          WHERE id = ${runSaId}::uuid
        `);
      }
    }
  });

  return NextResponse.json({ ok: true });
}

export async function deleteStructuralRunWizardHandler(request: Request, access: AccessContext) {
  const body = (await request.json()) as { runSaId?: string };
  const runSaId = toUuid(body.runSaId);
  if (!runSaId) return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });

  const rows = await prisma.$queryRaw<Array<{ result: boolean }>>(Prisma.sql`
    SELECT public.sp_delete_graph_run_sa_cascade(
      ${runSaId}::uuid,
      ${access.company.id}::uuid,
      ${access.user.id}::uuid
    ) AS result
  `);

  if (!rows[0]?.result) {
    return NextResponse.json({ error: 'Evaluación no encontrada o sin permiso.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function getStructuralWizardActivitiesHandler(request: Request, access: AccessContext) {
  const url = new URL(request.url);
  const runSaId = toUuid(url.searchParams.get('runSaId'));

  const bridgeExistsRows = await prisma.$queryRaw<Array<{ exists: boolean }>>(Prisma.sql`
    SELECT to_regclass('public.graph_map_run_sa_activities') IS NOT NULL AS exists
  `);
  const bridgeExists = Boolean(bridgeExistsRows[0]?.exists);
  if (!bridgeExists) {
    return NextResponse.json({ error: 'Falta tabla public.graph_map_run_sa_activities.' }, { status: 400 });
  }

  let selected: string[] = [];
  if (runSaId) {
    const selectedRows = await prisma.$queryRaw<Array<{ activity_id: string }>>(Prisma.sql`
      SELECT activity_id::text
      FROM public.graph_map_run_sa_activities
      WHERE run_sa_id = ${runSaId}::uuid
        AND company_id = ${access.company.id}::uuid
        AND is_active = true
      ORDER BY updated_at DESC
    `);
    selected = selectedRows.map((r) => r.activity_id);
  }

  const [
    activities,
    people,
    resources,
    effects,
    strengths,
    alternatives,
    dependencies,
    sharedResources,
    linearRiskContext,
    cascadeCatalog,
    resourceCatalog,
    riskCascades,
    impacts,
    criticalities,
    linearControlContext,
  ] = await Promise.all([
    prisma.$queryRaw<Array<{
      id: string;
      company_id: string;
      element_id: string;
      code: string | null;
      name: string;
      description: string | null;
      element_name: string;
      owner_name: string | null;
      owner_email: string | null;
      impact_code: string | null;
      criticality_code: string | null;
    }>>(Prisma.sql`
      SELECT 
        a.id::text,
        a.company_id::text,
        a.element_id::text,
        a.code,
        a.name,
        a.description,
        e.name AS element_name,
        COALESCE(
          (
            SELECT NULLIF(rr.description, '')
            FROM public.run_ra_contexto_evaluacion rrc
            JOIN public.run_ra rr ON rr.id = rrc.run_ra_id
            WHERE rrc.activity_id = a.id
            ORDER BY rr.created_at DESC
            LIMIT 1
          ),
          NULLIF(trim(concat_ws(' ', u.name, u.last_name)), '')
        ) AS owner_name,
        u.email AS owner_email,
        ra.impact_code::text AS impact_code,
        ra.criticality_code::text AS criticality_code
      FROM public.activities a
      JOIN public.elements e ON e.id = a.element_id
      LEFT JOIN public.users u ON u.id = a.owner_id
      LEFT JOIN public.graph_map_run_sa_activities ra 
        ON ra.activity_id = a.id 
        AND ra.run_sa_id = ${runSaId}::uuid
      WHERE a.company_id = ${access.company.id}::uuid
        AND a.is_active = true
      ORDER BY a.name ASC
    `),
    prisma.$queryRaw<Array<{ id: string; full_name: string; email: string | null }>>(Prisma.sql`
      SELECT
        u.id::text,
        trim(concat_ws(' ', u.name, u.last_name)) AS full_name,
        u.email
      FROM public.users u
      WHERE u.company_id = ${access.company.id}::uuid
        AND coalesce(u.is_active, true) = true
      ORDER BY full_name ASC NULLS LAST, u.email ASC
    `),
    prisma.$queryRaw<Array<{ id: string; code: string; name: string }>>(Prisma.sql`
      SELECT id_resource::text AS id, id_resource::text AS code, nombre AS name FROM public.company_resource_catalog ORDER BY nombre ASC
    `),
    prisma.$queryRaw<Array<{ id: string; code: string; name: string }>>(Prisma.sql`
      SELECT id::text, code, name FROM public.graph_activities_failure_effect WHERE is_active = true ORDER BY sort_order ASC
    `),
    prisma.$queryRaw<Array<{ id: string; code: string; name: string }>>(Prisma.sql`
      SELECT id::text, code, name FROM public.graph_activities_dependency_strength WHERE is_active = true ORDER BY sort_order ASC
    `),
    prisma.$queryRaw<Array<{ id: string; code: string; name: string }>>(Prisma.sql`
      SELECT id::text, code, name FROM public.graph_activities_alternative_level WHERE is_active = true ORDER BY sort_order ASC
    `),
    prisma.$queryRaw<Array<{
      id: string;
      activity_id: string;
      activity_name: string;
      dependency_activity_id: string | null;
      dependency_activity_name: string | null;
      dependency_resource_id: string;
      dependency_resource_name: string;
      failure_effect_id: string;
      failure_effect_name: string;
      dependency_strength_id: string;
      dependency_strength_name: string;
      alternative_level_id: string;
      alternative_level_name: string;
      dependency_person_id: string | null;
      dependency_person_name: string | null;
      is_active: boolean;
    }>>(Prisma.sql`
      SELECT
        d.id::text,
        d.activity_id::text,
        a.name AS activity_name,
        d.dependency_activity_id::text,
        da.name AS dependency_activity_name,
        d.dependency_resource_id::text,
        r.nombre AS dependency_resource_name,
        d.failure_effect_id::text,
        fe.name AS failure_effect_name,
        d.dependency_strength_id::text,
        ds.name AS dependency_strength_name,
        d.alternative_level_id::text,
        al.name AS alternative_level_name,
        d.dependency_person_id::text,
        trim(concat_ws(' ', up.name, up.last_name)) AS dependency_person_name,
        d.is_active
      FROM public.graph_activities_dependencies d
      JOIN public.activities a ON a.id = d.activity_id
      LEFT JOIN public.activities da ON da.id = d.dependency_activity_id
      LEFT JOIN public.users up ON up.id = d.dependency_person_id
      JOIN public.company_resource_catalog r ON r.id_resource = d.dependency_resource_id
      JOIN public.graph_activities_failure_effect fe ON fe.id = d.failure_effect_id
      JOIN public.graph_activities_dependency_strength ds ON ds.id = d.dependency_strength_id
      JOIN public.graph_activities_alternative_level al ON al.id = d.alternative_level_id
      WHERE d.company_id = ${access.company.id}::uuid
        AND d.is_active = true
      ORDER BY d.updated_at DESC
      LIMIT 300
    `),
    prisma.$queryRaw<Array<{
      activity_id: string;
      activity_name: string;
      resource_id: string;
      resource_name: string;
      resource_type_code: string;
      resource_type_name: string | null;
      owner_id: string | null;
      owner_name: string | null;
      failure_effect_code: string;
      failure_effect_name: string | null;
      dependency_strength_code: string;
      dependency_strength_name: string | null;
      alternative_level_code: string;
      alternative_level_name: string | null;
      criticality_code: string;
      criticality_label: string | null;
      created_at: string;
    }>>(Prisma.sql`
      SELECT
        m.activity_id::text,
        a.name AS activity_name,
        r.resource_id::text,
        r.name AS resource_name,
        r.resource_type AS resource_type_code,
        tr.nombre AS resource_type_name,
        r.owner_id::text,
        trim(concat_ws(' ', u.name, u.last_name)) AS owner_name,
        m.failure_effect AS failure_effect_code,
        fe.name AS failure_effect_name,
        m.dependency_strength AS dependency_strength_code,
        ds.name AS dependency_strength_name,
        m.substitutability AS alternative_level_code,
        al.name AS alternative_level_name,
        r.criticality AS criticality_code,
        cr.label AS criticality_label,
        to_char(m.created_at, 'YYYY-MM-DD HH24:MI') AS created_at
      FROM public.graph_map_activity_resource_dependency m
      JOIN public.activities a ON a.id = m.activity_id
      JOIN public.graph_activity_resource r ON r.resource_id = m.resource_id
      LEFT JOIN public.users u ON u.id = r.owner_id
      LEFT JOIN public.company_resource_catalog tr ON tr.id_resource::text = r.resource_type
      LEFT JOIN public.graph_activities_failure_effect fe ON fe.code = m.failure_effect
      LEFT JOIN public.graph_activities_dependency_strength ds ON ds.code = m.dependency_strength
      LEFT JOIN public.graph_activities_alternative_level al ON al.code = m.substitutability
      LEFT JOIN public.graph_activity_catalog_criticality cr ON cr.code = r.criticality
      WHERE a.company_id = ${access.company.id}::uuid
      ORDER BY m.created_at DESC
      LIMIT 500
    `),
    prisma.$queryRaw<Array<{
      activity_id: string;
      run_ra_id: string;
      run_ra_code: string;
      risk_id: string;
      risk_name: string;
      risk_description: string | null;
      consequence: string | null;
      impact_score: number | null;
      probability_score: number | null;
      inherent_risk_score: number | null;
      created_at: string;
    }>>(Prisma.sql`
      SELECT
        rr.activity_id::text AS activity_id,
        rr.run_ra_id::text AS run_ra_id,
        r.code AS run_ra_code,
        rr.id::text AS risk_id,
        rr.name AS risk_name,
        rr.description AS risk_description,
        rr.consequence,
        ra.impact_score::float8 AS impact_score,
        ra.probability_score::float8 AS probability_score,
        ra.inherent_risk_score::float8 AS inherent_risk_score,
        to_char(r.created_at, 'YYYY-MM-DD HH24:MI') AS created_at
      FROM public.run_ra_risks rr
      JOIN public.run_ra r ON r.id = rr.run_ra_id
      LEFT JOIN public.run_ra_risk_analysis ra ON ra.run_ra_risk_id = rr.id
      WHERE r.company_id = ${access.company.id}::uuid
        AND rr.activity_id IS NOT NULL
      ORDER BY rr.activity_id, r.created_at DESC, ra.updated_at DESC, rr.created_at DESC
    `),
    prisma.$queryRaw<Array<{ code: string; label: string; operational_definition: string; decision_signal: string }>>(Prisma.sql`
      SELECT code, label, operational_definition, decision_signal
      FROM public.graph_risk_catalog_cascade
      ORDER BY label ASC
    `),
    prisma.$queryRaw<Array<{ id: string; name: string }>>(Prisma.sql`
      SELECT id_resource::text AS id, nombre AS name
      FROM public.company_resource_catalog
      ORDER BY nombre ASC
    `),
    prisma.$queryRaw<Array<{
      risk_cascade_id: string;
      run_sa_id: string;
      risk_id: string;
      risk_name: string;
      cascade_code: string;
      cascade_label: string | null;
      affected_resource_id: string | null;
      resource_name: string | null;
      notes: string | null;
      created_at: string;
    }>>(Prisma.sql`
      SELECT
        rc.risk_cascade_id::text,
        rc.run_sa_id::text,
        rc.risk_id::text,
        rr.name AS risk_name,
        rc.cascade_code,
        cc.label AS cascade_label,
        rc.affected_resource_id::text,
        cr.nombre AS resource_name,
        rc.notes,
        to_char(rc.created_at, 'YYYY-MM-DD HH24:MI') AS created_at
      FROM public.graph_risk_cascade rc
      JOIN public.run_ra_risks rr ON rr.id = rc.risk_id
      LEFT JOIN public.graph_risk_catalog_cascade cc ON cc.code = rc.cascade_code
      LEFT JOIN public.company_resource_catalog cr ON cr.id_resource = rc.affected_resource_id
      WHERE rc.run_sa_id = ${runSaId}::uuid
      ORDER BY rc.created_at DESC
    `),
    prisma.$queryRaw<Array<{ code: string; label: string; operational_definition: string; time_to_impact_reference: string; effect_profile: string }>>(Prisma.sql`
      SELECT 
        code, 
        label, 
        operational_definition::text, 
        time_to_impact_reference::text, 
        effect_profile::text 
      FROM public.graph_activity_catalog_impact 
      ORDER BY code ASC
    `),
    prisma.$queryRaw<Array<{ code: string; label: string; operational_definition: string; decision_signal: string }>>(Prisma.sql`
      SELECT 
        code, 
        label, 
        operational_definition::text, 
        decision_signal::text
      FROM public.graph_activity_catalog_criticality 
      ORDER BY code ASC
    `),
    prisma.$queryRaw<Array<{
      risk_id: string;
      control_id: string;
      control_code: string | null;
      control_name: string;
      control_type_name: string | null;
      owner_name: string | null;
      mitigation_strength: number | null;
      reduces_probability: boolean;
      reduces_impact: boolean;
    }>>(Prisma.sql`
      SELECT
        c.id_risk::text AS risk_id,
        c.id::text AS control_id,
        c.code AS control_code,
        c.name AS control_name,
        ct.name AS control_type_name,
        NULLIF(trim(concat_ws(' ', u.name, u.last_name)), '') AS owner_name,
        (c.cobertura::float8 / 100.0) AS mitigation_strength,
        true AS reduces_probability,
        true AS reduces_impact
      FROM public.run_ra_controls c
      JOIN public.run_ra_risks rr ON rr.id = c.id_risk
      JOIN public.run_ra r ON r.id = rr.run_ra_id
      LEFT JOIN public.catalog_control_type ct ON ct.id = c.control_type
      LEFT JOIN public.users u ON u.id = c.owner_id
      WHERE r.company_id = ${access.company.id}::uuid
    `),
  ]);

  const selectedSet = new Set(selected);
  const filteredDependencies = selectedSet.size
    ? dependencies.filter((d) => selectedSet.has(d.activity_id) || (d.dependency_activity_id ? selectedSet.has(d.dependency_activity_id) : false))
    : dependencies;
  const filteredSharedResources = selectedSet.size
    ? sharedResources.filter((r) => selectedSet.has(r.activity_id))
    : sharedResources;
  const filteredLinearRiskContext = selectedSet.size
    ? linearRiskContext.filter((r) => selectedSet.has(r.activity_id))
    : linearRiskContext;

  const filteredLinearControlContext = linearControlContext.filter((c) => 
    filteredLinearRiskContext.some((r) => r.risk_id === c.risk_id)
  );

  return NextResponse.json({
    activities,
    people,
    selected_activity_ids: selected,
    catalogs: {
      dependencyResources: resources,
      failureEffects: effects,
      dependencyStrengths: strengths,
      alternativeLevels: alternatives,
      impacts: impacts,
      criticalities: criticalities,
    },
    dependencies: filteredDependencies,
    shared_resources: filteredSharedResources,
    linear_risk_context: filteredLinearRiskContext,
    risk_cascade_catalog: cascadeCatalog,
    risk_resource_catalog: resourceCatalog,
    risk_cascades: riskCascades,
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
  if (!runSaId) {
    return NextResponse.json({ error: 'runSaId inválido.' }, { status: 400 });
  }

  const selectedActivityIds = Array.isArray(body.selectedActivityIds)
    ? body.selectedActivityIds.map((v) => toUuid(v)).filter((v): v is string => Boolean(v))
    : [];

  const bridgeExistsRows = await prisma.$queryRaw<Array<{ exists: boolean }>>(Prisma.sql`
    SELECT to_regclass('public.graph_map_run_sa_activities') IS NOT NULL AS exists
  `);
  const bridgeExists = Boolean(bridgeExistsRows[0]?.exists);

  const runRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id::text
    FROM public.graph_run_sa
    WHERE id = ${runSaId}::uuid
      AND company_id = ${access.company.id}::uuid
    LIMIT 1
  `);
  if (!runRows[0]) {
    return NextResponse.json({ error: 'Run estructural no encontrado.' }, { status: 404 });
  }

  if (!bridgeExists) {
    return NextResponse.json({ error: 'Falta tabla public.graph_map_run_sa_activities.' }, { status: 400 });
  }

  if (body.dependencyDeleteId) {
    const dependencyDeleteId = toUuid(body.dependencyDeleteId);
    if (!dependencyDeleteId) return NextResponse.json({ error: 'Dependencia inválida.' }, { status: 400 });
    await prisma.$executeRaw(Prisma.sql`
      UPDATE public.graph_activities_dependencies
      SET is_active = false, updated_at = now()
      WHERE id = ${dependencyDeleteId}::uuid
        AND company_id = ${access.company.id}::uuid
    `);
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (body.sharedResourceDelete) {
    const activityId = toUuid(body.sharedResourceDelete.activityId);
    const resourceId = toUuid(body.sharedResourceDelete.resourceId);
    if (!activityId || !resourceId) return NextResponse.json({ error: 'Parámetros de eliminación inválidos.' }, { status: 400 });
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM public.graph_map_activity_resource_dependency
      WHERE activity_id = ${activityId}::uuid
        AND resource_id = ${resourceId}::uuid
    `);
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (body.riskCascadeDeleteId) {
    const riskCascadeDeleteId = toUuid(body.riskCascadeDeleteId);
    if (!riskCascadeDeleteId) return NextResponse.json({ error: 'Registro de cascada inválido.' }, { status: 400 });
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM public.graph_risk_cascade
      WHERE risk_cascade_id = ${riskCascadeDeleteId}::uuid
        AND run_sa_id = ${runSaId}::uuid
    `);
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (body.riskCascadeInput) {
    const riskCascadeId = toUuid(body.riskCascadeInput.riskCascadeId);
    const riskId = toUuid(body.riskCascadeInput.riskId);
    const cascadeCode = String(body.riskCascadeInput.cascadeCode ?? '').trim();
    const affectedResourceId = toUuid(body.riskCascadeInput.affectedResourceId);
    const notes = String(body.riskCascadeInput.notes ?? '').trim() || null;
    if (!riskId || !cascadeCode) {
      return NextResponse.json({ error: 'Riesgo y tipo de cascada son obligatorios.' }, { status: 400 });
    }

    const [riskRows, cascadeRows] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT rr.id::text
        FROM public.run_ra_risks rr
        JOIN public.run_ra r ON r.id = rr.run_ra_id
        WHERE rr.id = ${riskId}::uuid
          AND r.company_id = ${access.company.id}::uuid
        LIMIT 1
      `),
      prisma.$queryRaw<Array<{ code: string }>>(Prisma.sql`
        SELECT code
        FROM public.graph_risk_catalog_cascade
        WHERE code = ${cascadeCode}
        LIMIT 1
      `),
    ]);
    if (!riskRows[0] || !cascadeRows[0]) {
      return NextResponse.json({ error: 'Riesgo o tipo de cascada inválido.' }, { status: 400 });
    }
    if (affectedResourceId) {
      const resourceRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id_resource::text AS id
        FROM public.company_resource_catalog
        WHERE id_resource = ${affectedResourceId}::uuid
        LIMIT 1
      `);
      if (!resourceRows[0]) {
        return NextResponse.json({ error: 'Recurso afectado inválido.' }, { status: 400 });
      }
    }

    if (riskCascadeId) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE public.graph_risk_cascade
        SET
          risk_id = ${riskId}::uuid,
          cascade_code = ${cascadeCode},
          affected_resource_id = ${affectedResourceId}::uuid,
          notes = ${notes},
          updated_at = now()
        WHERE risk_cascade_id = ${riskCascadeId}::uuid
          AND run_sa_id = ${runSaId}::uuid
      `);
      return NextResponse.json({ ok: true, updated: true, risk_cascade_id: riskCascadeId });
    }

    const createdRows = await prisma.$queryRaw<Array<{ risk_cascade_id: string }>>(Prisma.sql`
      INSERT INTO public.graph_risk_cascade (
        risk_cascade_id, run_sa_id, risk_id, cascade_code, affected_resource_id, notes, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${runSaId}::uuid, ${riskId}::uuid, ${cascadeCode}, ${affectedResourceId}::uuid, ${notes}, now(), now()
      )
      RETURNING risk_cascade_id::text
    `);
    return NextResponse.json({ ok: true, created: true, risk_cascade_id: createdRows[0]?.risk_cascade_id || null });
  }

  if (body.sharedResourceInput) {
    const input = body.sharedResourceInput;
    const activityId = toUuid(input.activityId);
    const resourceId = toUuid(input.resourceId);
    const resourceTypeId = toUuid(input.resourceTypeId);
    const failureEffectId = toUuid(input.failureEffectId);
    const dependencyStrengthId = toUuid(input.dependencyStrengthId);
    const alternativeLevelId = toUuid(input.alternativeLevelId);
    const ownerId = toUuid(input.ownerId);
    const criticalityCode = String(input.criticalityCode ?? '').trim().toUpperCase();
    const resourceName = String(input.resourceName ?? '').trim();
    if (!activityId || !resourceTypeId || !failureEffectId || !dependencyStrengthId || !alternativeLevelId || !resourceName || !criticalityCode) {
      return NextResponse.json({ error: 'Completa los campos requeridos del recurso compartido.' }, { status: 400 });
    }

    const [resourceTypeRows, failureEffectRows, dependencyStrengthRows, alternativeRows] = await Promise.all([
      prisma.$queryRaw<Array<{ code: string }>>(Prisma.sql`SELECT id_resource::text AS code FROM public.company_resource_catalog WHERE id_resource = ${resourceTypeId}::uuid LIMIT 1`),
      prisma.$queryRaw<Array<{ code: string }>>(Prisma.sql`SELECT code FROM public.graph_activities_failure_effect WHERE id = ${failureEffectId}::uuid LIMIT 1`),
      prisma.$queryRaw<Array<{ code: string }>>(Prisma.sql`SELECT code FROM public.graph_activities_dependency_strength WHERE id = ${dependencyStrengthId}::uuid LIMIT 1`),
      prisma.$queryRaw<Array<{ code: string }>>(Prisma.sql`SELECT code FROM public.graph_activities_alternative_level WHERE id = ${alternativeLevelId}::uuid LIMIT 1`),
    ]);
    const resourceTypeCode = resourceTypeRows[0]?.code;
    const failureEffectCode = failureEffectRows[0]?.code;
    const dependencyStrengthCode = dependencyStrengthRows[0]?.code;
    const alternativeCode = alternativeRows[0]?.code;
    if (!resourceTypeCode || !failureEffectCode || !dependencyStrengthCode || !alternativeCode) {
      return NextResponse.json({ error: 'Catálogos inválidos para recurso compartido.' }, { status: 400 });
    }
    const criticalityRows = await prisma.$queryRaw<Array<{ code: string }>>(Prisma.sql`
      SELECT code
      FROM public.graph_activity_catalog_criticality
      WHERE code = ${criticalityCode}
      LIMIT 1
    `);
    if (!criticalityRows[0]) {
      return NextResponse.json({ error: 'Nivel de criticidad inválido.' }, { status: 400 });
    }

    const selectedActivityRows = await prisma.$queryRaw<Array<{ activity_id: string }>>(Prisma.sql`
      SELECT activity_id::text
      FROM public.graph_map_run_sa_activities
      WHERE run_sa_id = ${runSaId}::uuid
        AND company_id = ${access.company.id}::uuid
        AND activity_id = ${activityId}::uuid
        AND is_active = true
      LIMIT 1
    `);
    if (!selectedActivityRows[0]) {
      return NextResponse.json({ error: 'La actividad no está incluida en la corrida activa.' }, { status: 400 });
    }

    const finalResourceId = resourceId ?? crypto.randomUUID();
    await prisma.$transaction(async (tx) => {
      if (resourceId) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE public.graph_activity_resource
          SET
            name = ${resourceName},
            resource_type = ${resourceTypeCode},
            owner_id = ${ownerId}::uuid,
            substitutability = ${alternativeCode},
            criticality = ${criticalityCode},
            updated_at = now()
          WHERE resource_id = ${resourceId}::uuid
        `);
        await tx.$executeRaw(Prisma.sql`
          DELETE FROM public.graph_map_activity_resource_dependency
          WHERE resource_id = ${resourceId}::uuid
        `);
      } else {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public.graph_activity_resource (
            resource_id, name, resource_type, owner_id, substitutability, criticality, created_at, updated_at
          ) VALUES (
            ${finalResourceId}::uuid, ${resourceName}, ${resourceTypeCode}, ${ownerId}::uuid, ${alternativeCode}, ${criticalityCode}, now(), now()
          )
        `);
      }

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO public.graph_map_activity_resource_dependency (
          activity_id, resource_id, dependency_strength, substitutability, failure_effect, created_at
        ) VALUES (
          ${activityId}::uuid, ${finalResourceId}::uuid, ${dependencyStrengthCode}, ${alternativeCode}, ${failureEffectCode}, now()
        )
      `);

      const verifyResource = await tx.$queryRaw<Array<{ ok: boolean }>>(Prisma.sql`
        SELECT EXISTS (
          SELECT 1
          FROM public.graph_activity_resource r
          WHERE r.resource_id = ${finalResourceId}::uuid
            AND r.name = ${resourceName}
            AND r.resource_type = ${resourceTypeCode}
            AND (r.owner_id IS NOT DISTINCT FROM ${ownerId}::uuid)
            AND r.substitutability = ${alternativeCode}
            AND r.criticality = ${criticalityCode}
        ) AS ok
      `);
      if (!verifyResource[0]?.ok) {
        throw new Error('No se pudo verificar persistencia en graph_activity_resource.');
      }

      const verifyMapping = await tx.$queryRaw<Array<{ ok: boolean }>>(Prisma.sql`
        SELECT EXISTS (
          SELECT 1
          FROM public.graph_map_activity_resource_dependency m
          WHERE m.activity_id = ${activityId}::uuid
            AND m.resource_id = ${finalResourceId}::uuid
            AND m.dependency_strength = ${dependencyStrengthCode}
            AND m.substitutability = ${alternativeCode}
            AND m.failure_effect = ${failureEffectCode}
        ) AS ok
      `);
      if (!verifyMapping[0]?.ok) {
        throw new Error('No se pudo verificar persistencia en graph_map_activity_resource_dependency.');
      }
    });

    return NextResponse.json({ ok: true, resource_id: finalResourceId });
  }

  if (body.dependencyInput) {
    const input = body.dependencyInput;
    const dependencyId = toUuid(input.dependencyId);
    const activityId = toUuid(input.activityId);
    if (!activityId) return NextResponse.json({ error: 'Actividad inválida.' }, { status: 400 });

    const dependencyResourceId = toUuid(input.dependencyResourceId);
    const failureEffectId = toUuid(input.failureEffectId);
    const dependencyStrengthId = toUuid(input.dependencyStrengthId);
    const alternativeLevelId = toUuid(input.alternativeLevelId);

    // Modo impacto/criticidad (paso impacto)
    if (!dependencyResourceId && !failureEffectId && !dependencyStrengthId && !alternativeLevelId) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE public.graph_map_run_sa_activities
        SET 
          impact_code = COALESCE(${input.impactCode || null}, impact_code),
          criticality_code = COALESCE(${input.criticalityCode || null}, criticality_code),
          updated_at = now()
        WHERE run_sa_id = ${runSaId}::uuid
          AND activity_id = ${activityId}::uuid
          AND company_id = ${access.company.id}::uuid
      `);

      return NextResponse.json({ ok: true });
    }

    // Modo dependencia (tab Dependencias)
    if (!dependencyResourceId || !failureEffectId || !dependencyStrengthId || !alternativeLevelId) {
      return NextResponse.json({ error: 'Completa recurso, efecto de falla, fuerza de dependencia y nivel de alternativa.' }, { status: 400 });
    }

    const dependencyActivityId = toUuid(input.dependencyActivityId);
    const dependencyPersonId = toUuid(input.dependencyPersonId);

    const selectedActivityRows = await prisma.$queryRaw<Array<{ activity_id: string }>>(Prisma.sql`
      SELECT activity_id::text
      FROM public.graph_map_run_sa_activities
      WHERE run_sa_id = ${runSaId}::uuid
        AND company_id = ${access.company.id}::uuid
        AND activity_id = ${activityId}::uuid
        AND is_active = true
      LIMIT 1
    `);
    if (!selectedActivityRows[0]) {
      return NextResponse.json({ error: 'La actividad X no está incluida en la corrida activa.' }, { status: 400 });
    }

    if (dependencyActivityId) {
      const dependencyActivityRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id::text
        FROM public.activities
        WHERE id = ${dependencyActivityId}::uuid
          AND company_id = ${access.company.id}::uuid
          AND is_active = true
        LIMIT 1
      `);
      if (!dependencyActivityRows[0]) {
        return NextResponse.json({ error: 'La actividad Y no es válida para la compañía.' }, { status: 400 });
      }
    }

    if (dependencyId) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE public.graph_activities_dependencies
        SET
          activity_id = ${activityId}::uuid,
          dependency_activity_id = ${dependencyActivityId}::uuid,
          dependency_resource_id = ${dependencyResourceId}::uuid,
          failure_effect_id = ${failureEffectId}::uuid,
          dependency_strength_id = ${dependencyStrengthId}::uuid,
          alternative_level_id = ${alternativeLevelId}::uuid,
          dependency_person_id = ${dependencyPersonId}::uuid,
          updated_at = now()
        WHERE id = ${dependencyId}::uuid
          AND company_id = ${access.company.id}::uuid
      `);
      return NextResponse.json({ ok: true, updated: true, id: dependencyId });
    }

    const existing = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id::text
      FROM public.graph_activities_dependencies
      WHERE company_id = ${access.company.id}::uuid
        AND activity_id = ${activityId}::uuid
        AND (
          (${dependencyActivityId}::uuid IS NULL AND dependency_activity_id IS NULL)
          OR dependency_activity_id = ${dependencyActivityId}::uuid
        )
        AND dependency_resource_id = ${dependencyResourceId}::uuid
        AND failure_effect_id = ${failureEffectId}::uuid
        AND dependency_strength_id = ${dependencyStrengthId}::uuid
        AND alternative_level_id = ${alternativeLevelId}::uuid
      LIMIT 1
    `);

    if (existing[0]?.id) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE public.graph_activities_dependencies
        SET is_active = true, updated_at = now()
        WHERE id = ${existing[0].id}::uuid
      `);
      return NextResponse.json({ ok: true, reused: true, id: existing[0].id });
    }

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO public.graph_activities_dependencies (
        id, company_id, activity_id, dependency_resource_id, dependency_activity_id,
        dependency_system_name, dependency_data_name, dependency_person_id, dependency_provider_name, dependency_document_name,
        failure_effect_id, dependency_strength_id, alternative_level_id,
        control_id, description, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), ${access.company.id}::uuid, ${activityId}::uuid, ${dependencyResourceId}::uuid, ${dependencyActivityId}::uuid,
        ${String(input.dependencySystemName ?? '').trim() || null}, ${String(input.dependencyDataName ?? '').trim() || null}, ${dependencyPersonId}::uuid, ${String(input.dependencyProviderName ?? '').trim() || null}, ${String(input.dependencyDocumentName ?? '').trim() || null},
        ${failureEffectId}::uuid, ${dependencyStrengthId}::uuid, ${alternativeLevelId}::uuid,
        NULL, NULL, true, now(), now()
      )
    `);

    return NextResponse.json({ ok: true, created: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw(Prisma.sql`
      UPDATE public.graph_map_run_sa_activities
      SET is_active = false, updated_at = now()
      WHERE run_sa_id = ${runSaId}::uuid
        AND company_id = ${access.company.id}::uuid
    `);

    for (const activityId of selectedActivityIds) {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO public.graph_map_run_sa_activities (
          id, company_id, run_sa_id, activity_id, selected_by, selected_at, is_active, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          ${access.company.id}::uuid,
          ${runSaId}::uuid,
          ${activityId}::uuid,
          ${access.user.id}::uuid,
          now(),
          true,
          now(),
          now()
        )
        ON CONFLICT (run_sa_id, activity_id)
        DO UPDATE SET
          selected_by = EXCLUDED.selected_by,
          selected_at = EXCLUDED.selected_at,
          is_active = true,
          updated_at = now()
      `);
    }
  });

  return NextResponse.json({ ok: true, selected_activity_ids: selectedActivityIds });
}
