import { Prisma } from "@prisma/client";
import prisma from "@/infrastructure/db/prisma/client";
import {
  LinearRiskRepository,
  LinearRiskDashboardSummary,
  LinearRiskEvaluationsSummary,
  LinearRiskEvaluation,
} from "../../domain/types";

export class PrismaLinearRiskRepository implements LinearRiskRepository {
  async getDashboardRows(): Promise<LinearRiskDashboardSummary> {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT * FROM views.dashboard_top_control
      ORDER BY systemic_impact_score DESC NULLS LAST
      LIMIT 100
    `);

    return {
      rows,
      source: "dashboard_top_control (view)",
    };
  }

  async getEvaluations(
    companyId: string,
    elementId?: string,
    activityId?: string
  ): Promise<LinearRiskEvaluationsSummary> {
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        r.id::text,
        r.code,
        COALESCE(
          (SELECT ce_obj.objective
           FROM public.run_ra_contexto_evaluacion ce_obj
           WHERE ce_obj.run_ra_id = r.id
           ORDER BY ce_obj.updated_at DESC NULLS LAST
           LIMIT 1),
          'Sin objetivo'
        ) AS title,
        r.description,
        to_char(r.created_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI') AS created_at,
        to_char(r.updated_at AT TIME ZONE 'UTC', 'DD/MM/YYYY HH24:MI') AS updated_at,
        (SELECT ce.scope FROM public.run_ra_contexto_evaluacion ce
          WHERE ce.run_ra_id = r.id ORDER BY ce.updated_at DESC NULLS LAST LIMIT 1) AS scope,
        (SELECT COUNT(*) FROM public.run_ra_risks rk WHERE rk.run_ra_id = r.id) AS risk_count,
        (SELECT COUNT(*) FROM public.run_ra_controls rc
          WHERE rc.run_ra_id = r.id AND rc.is_active = true) AS control_count,
        (SELECT COUNT(*) FROM public.run_ra_risk_treatment rt
          JOIN public.run_ra_risks rk2 ON rk2.id = rt.id_risk
          WHERE rk2.run_ra_id = r.id AND rt.is_active = true) AS treatment_count,
        (SELECT COUNT(*) FROM public.run_ra_risks rk3
          WHERE rk3.run_ra_id = r.id AND rk3.id_valoration IS NOT NULL) AS valored_count,
        (SELECT COUNT(*) FROM public.run_ra_contexto_evaluacion ce2
          WHERE ce2.run_ra_id = r.id) AS context_count,
        (SELECT COUNT(*) FROM public.run_ra_risk_analysis ra
          WHERE ra.run_ra_id = r.id) AS analysis_count,
        (SELECT COUNT(*) FROM public.run_ra_evidence ev
          WHERE ev.run_ra_id = r.id) AS evidence_count,
        (
          SELECT cl.code
          FROM public.catalog_ra_lifecycle_history lh
          JOIN public.catalog_ra_lifecycle cl ON cl.id = lh.to_lifecycle_id
          WHERE lh.run_ra_id = r.id
            AND lh.is_current = true
          ORDER BY lh.changed_at DESC
          LIMIT 1
        ) AS lifecycle_code,
        (
          SELECT cl.name
          FROM public.catalog_ra_lifecycle_history lh
          JOIN public.catalog_ra_lifecycle cl ON cl.id = lh.to_lifecycle_id
          WHERE lh.run_ra_id = r.id
            AND lh.is_current = true
          ORDER BY lh.changed_at DESC
          LIMIT 1
        ) AS lifecycle_name,
        (
          SELECT cl.is_terminal
          FROM public.catalog_ra_lifecycle_history lh
          JOIN public.catalog_ra_lifecycle cl ON cl.id = lh.to_lifecycle_id
          WHERE lh.run_ra_id = r.id
            AND lh.is_current = true
          ORDER BY lh.changed_at DESC
          LIMIT 1
        ) AS lifecycle_terminal
      FROM public.run_ra r
      WHERE r.company_id = ${companyId}::uuid
      ${elementId ? Prisma.sql`AND r.id IN (SELECT ce3.run_ra_id FROM public.run_ra_contexto_evaluacion ce3 WHERE ce3.element_id = ${elementId}::uuid)` : Prisma.empty}
      ${activityId ? Prisma.sql`AND r.id IN (SELECT ce4.run_ra_id FROM public.run_ra_contexto_evaluacion ce4 WHERE ce4.activity_id = ${activityId}::uuid)` : Prisma.empty}
      ORDER BY r.created_at DESC
    `);

    const evaluations: LinearRiskEvaluation[] = rows.map((r) => {
      const contextCount = Number(r.context_count);
      const riskCount = Number(r.risk_count);
      const controlCount = Number(r.control_count);
      const valoredCount = Number(r.valored_count);
      const treatmentCount = Number(r.treatment_count);
      const analysisCount = Number(r.analysis_count);
      const evidenceCount = Number(r.evidence_count);

      let progress = 0;
      if (contextCount > 0) progress += 20;
      if (riskCount > 0) progress += 20;
      if (analysisCount > 0) progress += 20;
      if (controlCount > 0) progress += 20;
      if (evidenceCount > 0) progress += 20;
      progress = Math.min(progress, 100);

      const lifecycleCode = String(r.lifecycle_code ?? "DRAFT");
      let statusLabel: string = lifecycleCode;
      let statusColor: string = "#64748b";
      if (lifecycleCode === "IN_PROGRESS") {
        statusLabel = "EN PROCESO";
        statusColor = "#f59e0b";
      } else if (lifecycleCode === "IN_TREATMENT") {
        statusLabel = "EN TRATAMIENTO";
        statusColor = "#ef4444";
      } else if (lifecycleCode === "COMPLETED") {
        statusLabel = "COMPLETADA";
        statusColor = "#a78bfa";
      } else if (lifecycleCode === "CANCELLED") {
        statusLabel = "CANCELADA";
        statusColor = "#f43f5e";
      } else if (lifecycleCode === "REOPENED") {
        statusLabel = "REABIERTA";
        statusColor = "#22d3ee";
      } else if (lifecycleCode === "DELETED") {
        statusLabel = "ELIMINADA";
        statusColor = "#475569";
      } else if (lifecycleCode === "DRAFT") {
        statusLabel = "BORRADOR";
        statusColor = "#64748b";
      }

      const responsible = r.description?.trim() || "";
      const initials =
        responsible
          .split(" ")
          .filter(Boolean)
          .map((w: string) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "??";

      return {
        id: r.id,
        code: r.code || "",
        title: r.title || "Sin objetivo",
        scope: r.scope?.trim() || "",
        responsible,
        initials,
        status: statusLabel,
        status_color: statusColor,
        lifecycle_code: lifecycleCode,
        lifecycle_name: r.lifecycle_name || lifecycleCode,
        lifecycle_terminal: Boolean(r.lifecycle_terminal),
        created_at: r.created_at || "",
        updated_at: r.updated_at || "",
        progress,
      };
    });

    return {
      stats: {
        total: evaluations.length,
        borrador: evaluations.filter((e) => e.status === "BORRADOR").length,
        en_proceso: evaluations.filter((e) => e.status === "EN PROCESO").length,
        finalizada: evaluations.filter((e) => e.status === "COMPLETADA").length,
        en_tratamiento: evaluations.filter((e) => e.status === "EN TRATAMIENTO")
          .length,
      },
      evaluations,
    };
  }

  async createEvaluation(
    companyId: string,
    forceNew = false
  ): Promise<{ id: string; code: string }> {
    if (!forceNew) {
      const existing = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT id::text, code FROM public.run_ra
        WHERE company_id = ${companyId}::uuid
          AND status <> 'DELETED'
          AND status <> 'COMPLETED'
        ORDER BY created_at DESC
        LIMIT 1
      `);
      if (existing[0]) return existing[0];
    }

    const code = `RA-${Date.now()}`;
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<any[]>(Prisma.sql`
        INSERT INTO public.run_ra (company_id, code, title, status, version)
        VALUES (${companyId}::uuid, ${code}, 'Nueva evaluación de riesgo', 'DRAFT', 1)
        RETURNING id::text, code
      `);
      const run = rows[0];

      // Get initial lifecycle state
      const stateRows = await tx.$queryRaw<any[]>(Prisma.sql`
        SELECT id::text FROM public.catalog_ra_lifecycle WHERE code = 'DRAFT' LIMIT 1
      `);
      const stateId = stateRows[0]?.id;

      if (stateId) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public.catalog_ra_lifecycle_history (
            id, run_ra_id, to_lifecycle_id, change_reason, is_current, changed_at
          ) VALUES (
            gen_random_uuid(), ${run.id}::uuid, ${stateId}::uuid, 'Creación de evaluación', true, now()
          )
        `);
      }

      return run;
    });

    return result;
  }

  async deleteEvaluation(id: string): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      SELECT public.sp_delete_run_ra_cascade(${id}::uuid, (SELECT company_id FROM public.run_ra WHERE id = ${id}::uuid))
    `);
  }

  async getGeneralContext(runRaId: string, companyId: string): Promise<any> {
    console.log('[LinearRiskRepository] getGeneralContext:', { runRaId, companyId });
    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        gc.*,
        r.object_type,
        r.description
      FROM public.run_ra r
      LEFT JOIN public.run_ra_contexto_evaluacion gc ON gc.run_ra_id = r.id
      WHERE r.id = ${runRaId}::uuid
      LIMIT 1
    `);
    const row = rows[0] ?? null;

    const appetiteCatalog = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT appetite_level, tolerance_min::float8, tolerance_max::float8
      FROM public.catalog_appetite
      WHERE is_active = 'ACTIVE'
      ORDER BY tolerance_min ASC
    `);

    const [elements, activities] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT id::text, name 
        FROM public.elements 
        WHERE (company_id = ${companyId}::uuid OR company_id IS NULL)
          AND is_active = true 
        ORDER BY name ASC
      `),
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT id::text, name, element_id::text 
        FROM public.activities 
        WHERE is_active = true 
        ORDER BY name ASC
      `),
    ]);

    console.log('[LinearRiskRepository] Result counts:', {
      hasRow: !!row,
      appetite: appetiteCatalog.length,
      elements: elements.length,
      activities: activities.length
    });

    return { context: row, appetiteCatalog, elements, activities };
  }

  async upsertGeneralContext(input: any): Promise<void> {
    const assumptionsJson = JSON.stringify(input.assumptions);
    const sourcesJson = JSON.stringify(input.sources);
    
    const objectId = input.activityId || input.elementId || null;
    const objectType = input.activityId ? 'ACTIVITY' : (input.elementId ? 'ELEMENT' : input.objectType);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        UPDATE public.run_ra
        SET object_type = ${objectType || null},
            object_id   = ${objectId ? Prisma.sql`${objectId}::uuid` : Prisma.sql`NULL`},
            description = ${input.responsable || null},
            updated_at  = now()
        WHERE id = ${input.runRaId}::uuid
      `);

      const exists = await tx.$queryRaw<any[]>(Prisma.sql`
        SELECT 1 FROM public.run_ra_contexto_evaluacion WHERE run_ra_id = ${input.runRaId}::uuid
      `);

      if (exists.length > 0) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE public.run_ra_contexto_evaluacion
          SET
            objective              = ${input.objective},
            scope                  = ${input.scope},
            inclusions             = ${input.inclusions || null},
            exclusions             = ${input.exclusions || null},
            evaluated_period_start = ${input.periodStart ? Prisma.sql`${input.periodStart}::date` : Prisma.sql`NULL`},
            evaluated_period_end   = ${input.periodEnd ? Prisma.sql`${input.periodEnd}::date` : Prisma.sql`NULL`},
            methodology            = ${input.methodology || null},
            risk_appetite          = ${input.riskAppetite || null},
            element_id             = ${input.elementId ? Prisma.sql`${input.elementId}::uuid` : Prisma.sql`NULL`},
            activity_id            = ${input.activityId ? Prisma.sql`${input.activityId}::uuid` : Prisma.sql`NULL`},
            assumptions            = ${assumptionsJson}::jsonb,
            information_sources    = ${sourcesJson}::jsonb,
            updated_at             = now()
          WHERE run_ra_id = ${input.runRaId}::uuid
        `);
      } else {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public.run_ra_contexto_evaluacion (
            run_ra_id, objective, scope, inclusions, exclusions,
            evaluated_period_start, evaluated_period_end,
            methodology, assumptions, information_sources,
            risk_appetite, element_id, activity_id,
            created_at, updated_at
          ) VALUES (
            ${input.runRaId}::uuid,
            ${input.objective},
            ${input.scope},
            ${input.inclusions || null},
            ${input.exclusions || null},
            ${input.periodStart ? Prisma.sql`${input.periodStart}::date` : Prisma.sql`NULL`},
            ${input.periodEnd ? Prisma.sql`${input.periodEnd}::date` : Prisma.sql`NULL`},
            ${input.methodology || null},
            ${assumptionsJson}::jsonb,
            ${sourcesJson}::jsonb,
            ${input.riskAppetite || null},
            ${input.elementId ? Prisma.sql`${input.elementId}::uuid` : Prisma.sql`NULL`},
            ${input.activityId ? Prisma.sql`${input.activityId}::uuid` : Prisma.sql`NULL`},
            now(), now()
          )
        `);
      }
    });
  }

  async getInternalExternalContext(runRaId: string, type: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        id::text,
        ra_id::text,
        context_type,
        factor_category,
        factor_name,
        description
      FROM public.run_ra_contexto_interno_externo
      WHERE ra_id = ${runRaId}::uuid
        AND upper(context_type) = ${type.toUpperCase()}
      ORDER BY factor_category
    `);
  }

  async upsertInternalExternalContext(runRaId: string, type: string, values: any[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM public.run_ra_contexto_interno_externo
        WHERE ra_id = ${runRaId}::uuid
          AND upper(context_type) = ${type.toUpperCase()}
      `);

      for (const val of values) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public.run_ra_contexto_interno_externo (
            id, ra_id, context_type, factor_category, factor_name, description, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), ${runRaId}::uuid, ${type}, ${val.category}, ${val.text}, ${val.text}, now(), now()
          )
        `);
      }
    });
  }

  // --- STEP 2: RISK ANALYSIS ---

  async getRiskAnalysisData(runRaId: string, companyId: string) {
    const [itemsRaw, impacts, probabilities, pesos, activities, owners, controls, runRaMeta, categories, objectives] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          r.id::text,
          r.name,
          r.description,
          r.risk_category::text        AS risk_category_id,
          cat.name                     AS risk_category,
          r.cause,
          r.event,
          r.consequence,
          r.objective_id::text         AS objective_id,
          r.affected_objective,
          r.activity_id::text,
          r.owner_id::text,
          a.impact_score::float8,
          a.probability_score::float8,
          a.inherent_risk_score::float8,
          a.calculation_rationale
        FROM public.run_ra_risks r
        LEFT JOIN public.run_ra_risk_analysis a   ON a.run_ra_risk_id = r.id
        LEFT JOIN public.catalog_risk_category cat ON cat.id = r.risk_category
        WHERE r.run_ra_id = ${runRaId}::uuid
        ORDER BY r.updated_at DESC
      `),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT catalog_impact_id::text AS id, name, description, ordinal::int, numeric_value::float8 FROM public.catalog_ra_impact WHERE is_active = true ORDER BY ordinal ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT catalog_probability_id::text AS id, name, description, ordinal::int, numeric_value::float8 FROM public.catalog_ra_probability WHERE is_active = true ORDER BY ordinal ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text AS id, descripcion, peso::float8 FROM public.pesos ORDER BY id ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, name FROM public.activities ORDER BY name ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, COALESCE(name,'') AS name, COALESCE(last_name,'') AS last_name FROM public.users WHERE company_id = ${companyId}::uuid AND is_active = true ORDER BY name ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, name FROM public.run_ra_controls WHERE run_ra_id = ${runRaId}::uuid AND is_existing = true AND is_active = true ORDER BY name ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          r.id::text,
          r.code,
          r.object_type,
          r.description,
          gc.scope,
          gc.risk_appetite,
          gc.element_id::text AS element_id,
          gc.activity_id::text AS activity_id,
          el.name AS element_name,
          act.name AS activity_name,
          r.owner_id::text AS owner_id
        FROM public.run_ra r
        LEFT JOIN public.run_ra_contexto_evaluacion gc ON gc.run_ra_id = r.id
        LEFT JOIN public.elements el ON el.id = gc.element_id
        LEFT JOIN public.activities act ON act.id = gc.activity_id
        WHERE r.id = ${runRaId}::uuid
        ORDER BY gc.updated_at DESC NULLS LAST
        LIMIT 1
      `),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, name FROM public.catalog_risk_category ORDER BY name ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT objective_id::text AS id, objective_name AS name
        FROM public.company_objective
        WHERE company_id = ${companyId}::uuid
          AND is_active = true
        ORDER BY sequence_order ASC NULLS LAST, objective_name ASC
      `),
    ]);

    const items = itemsRaw.map((i) => {
      let rationale: any = {};
      try {
        rationale = typeof i.calculation_rationale === 'string' ? JSON.parse(i.calculation_rationale) : (i.calculation_rationale || {});
      } catch { rationale = {}; }
      return {
        ...i,
        peso_id: typeof rationale.peso_id === 'number' ? String(rationale.peso_id) : '',
        peso_value: typeof rationale.peso_value === 'number' ? rationale.peso_value : null,
      };
    });

    const riskIds = items.map((x) => x.id);
    const links = riskIds.length
      ? await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT m.run_ra_risk_id::text AS risk_id, m.run_ra_control_id::text AS control_id
          FROM public.map_run_ra_risk_controls m
          WHERE m.run_ra_risk_id = ANY(${riskIds}::uuid[])
        `)
      : [];

    const controlsByRisk = new Map<string, string[]>();
    for (const l of links) {
      const arr = controlsByRisk.get(l.risk_id) ?? [];
      arr.push(l.control_id);
      controlsByRisk.set(l.risk_id, arr);
    }

    const appetiteValue = String(runRaMeta[0]?.risk_appetite ?? '').trim();
    const appetiteRows = appetiteValue
      ? await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT appetite_level, tolerance_min::float8, tolerance_max::float8
          FROM public.catalog_appetite
          WHERE lower(replace(appetite_level, ' ', '_')) = lower(${appetiteValue})
             OR lower(appetite_level) = lower(${appetiteValue})
          ORDER BY effective_from DESC NULLS LAST, created_at DESC
          LIMIT 1
        `)
      : [];

    return {
      items: items.map((i) => ({ ...i, control_ids: controlsByRisk.get(i.id) ?? [] })),
      meta: {
        run_ra_id: runRaId,
        run_ra_code: runRaMeta[0]?.code ?? '',
        evaluated_process: runRaMeta[0]?.element_name || runRaMeta[0]?.scope || '',
        evaluated_activity: runRaMeta[0]?.activity_name || '',
        responsible_person: runRaMeta[0]?.description || '',
        risk_appetite: appetiteRows[0]?.appetite_level || appetiteValue,
        appetite_tolerance_min: appetiteRows[0]?.tolerance_min ?? null,
        appetite_tolerance_max: appetiteRows[0]?.tolerance_max ?? null,
      },
      catalogs: {
        impacts,
        probabilities,
        pesos,
        activities,
        owners: owners.map((o) => ({ id: o.id, name: `${o.name} ${o.last_name}`.trim() })),
        controls,
        categories,
        objectives,
      },
    };
  }

  async upsertRisk(runRaId: string, riskData: any, companyId: string, userId: string) {
    const { id: riskId, name, description, risk_category, cause, event, consequence, objective_id, activity_id, owner_id, impact_id, probability_id, peso_id, control_ids } = riskData;

    const objectiveRows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT objective_name FROM public.company_objective
      WHERE objective_id = ${objective_id}::uuid AND company_id = ${companyId}::uuid AND is_active = true LIMIT 1
    `);
    const affectedObjective = objectiveRows[0]?.objective_name?.trim() ?? '';

    const [impactRows, probRows, pesoRows] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT numeric_value::float8 FROM public.catalog_ra_impact WHERE catalog_impact_id = ${BigInt(impact_id)} AND is_active = true LIMIT 1`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT numeric_value::float8 FROM public.catalog_ra_probability WHERE catalog_probability_id = ${BigInt(probability_id)} AND is_active = true LIMIT 1`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id, descripcion, peso::float8 FROM public.pesos WHERE id = ${Number(peso_id)} LIMIT 1`),
    ]);

    const impactValue = impactRows[0]?.numeric_value;
    const probabilityValue = probRows[0]?.numeric_value;
    const peso = pesoRows[0];

    if (impactValue == null || probabilityValue == null || !peso) throw new Error('Impacto, probabilidad o peso inválidos.');

    const inherentScore = impactValue * probabilityValue * Number(peso.peso);
    const rationaleJson = JSON.stringify({
      impact_id: Number(impact_id),
      probability_id: Number(probability_id),
      peso_id: peso.id,
      peso_value: Number(peso.peso),
      peso_descripcion: peso.descripcion,
      formula: 'impacto * probabilidad * peso',
    });

    return await prisma.$transaction(async (tx) => {
      let finalRiskId = riskId;
      if (finalRiskId) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE public.run_ra_risks
          SET name = ${name}, description = ${description || null}, risk_category = ${risk_category || null}::uuid,
              cause = ${cause}, event = ${event}, consequence = ${consequence}, objective_id = ${objective_id}::uuid,
              affected_objective = ${affectedObjective}, activity_id = ${activity_id}::uuid, owner_id = ${owner_id}::uuid, updated_at = now()
          WHERE id = ${finalRiskId}::uuid AND run_ra_id = ${runRaId}::uuid
        `);
      } else {
        const rows = await tx.$queryRaw<any[]>(Prisma.sql`
          INSERT INTO public.run_ra_risks (
            id, run_ra_id, code, name, description, risk_category, cause, event, consequence, objective_id, affected_objective, owner_id, activity_id, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), ${runRaId}::uuid, ${`RSK-${Date.now().toString().slice(-6)}`}, ${name}, ${description || null}, ${risk_category || null}::uuid,
            ${cause}, ${event}, ${consequence}, ${objective_id}::uuid, ${affectedObjective}, ${owner_id}::uuid, ${activity_id}::uuid, now(), now()
          ) RETURNING id::text
        `);
        finalRiskId = rows[0]?.id;
      }

      const analysis = await tx.$queryRaw<any[]>(Prisma.sql`SELECT id::text FROM public.run_ra_risk_analysis WHERE run_ra_id = ${runRaId}::uuid AND run_ra_risk_id = ${finalRiskId}::uuid LIMIT 1`);
      if (analysis[0]?.id) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE public.run_ra_risk_analysis SET impact_score = ${impactValue}, probability_score = ${probabilityValue}, inherent_risk_score = ${inherentScore}, calculation_rationale = ${rationaleJson}, updated_at = now()
          WHERE id = ${analysis[0].id}::uuid
        `);
      } else {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public.run_ra_risk_analysis (id, run_ra_id, run_ra_risk_id, impact_score, probability_score, inherent_risk_score, calculation_rationale, created_at, updated_at)
          VALUES (gen_random_uuid(), ${runRaId}::uuid, ${finalRiskId}::uuid, ${impactValue}, ${probabilityValue}, ${inherentScore}, ${rationaleJson}, now(), now())
        `);
      }

      await tx.$executeRaw(Prisma.sql`DELETE FROM public.map_run_ra_risk_controls WHERE run_ra_risk_id = ${finalRiskId}::uuid`);
      for (const ctrlId of control_ids) {
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO public.map_run_ra_risk_controls (id, run_ra_risk_id, run_ra_control_id, mitigation_strength, effect_type, reduces_probability, reduces_impact, rationale, created_at, updated_at)
          VALUES (gen_random_uuid(), ${finalRiskId}::uuid, ${ctrlId}::uuid, 1, 'MITIGANTE', true, true, 'Control mitigante existente', now(), now())
        `);
      }
      return finalRiskId;
    });
  }

  async deleteRisk(runRaId: string, riskId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`DELETE FROM public.map_run_ra_risk_controls WHERE run_ra_risk_id = ${riskId}::uuid`);
      await tx.$executeRaw(Prisma.sql`DELETE FROM public.run_ra_risk_analysis WHERE run_ra_risk_id = ${riskId}::uuid AND run_ra_id = ${runRaId}::uuid`);
      await tx.$executeRaw(Prisma.sql`DELETE FROM public.run_ra_risks WHERE id = ${riskId}::uuid AND run_ra_id = ${runRaId}::uuid`);
    });
  }

  // --- STEP 3: CONTROL ANALYSIS ---

  async getControlAnalysisData(runRaId: string, companyId: string, riskId?: string) {
    const [risks, controlTypes, controlNatures, controlFrequencies, controlEffectiveness, controlCoverage, owners] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          r.id::text, r.name, r.event, r.cause, r.consequence,
          cat.name AS risk_category,
          a.inherent_risk_score::float8,
          a.impact_score::float8,
          a.probability_score::float8,
          a.residual_risk_score::float8,
          a.residual_impact::float8,
          a.residual_probability::float8,
          a.residual_justification,
          ilev.name AS inherent_level_name,
          ilev.color AS inherent_level_color
        FROM public.run_ra_risks r
        LEFT JOIN public.run_ra_risk_analysis a ON a.run_ra_risk_id = r.id
        LEFT JOIN public.catalog_risk_category cat ON cat.id = r.risk_category
        LEFT JOIN public.catalog_ra_inherent_level ilev ON ilev.company_id = ${companyId}::uuid 
             AND a.inherent_risk_score >= ilev.min_score AND a.inherent_risk_score <= ilev.max_score
        WHERE r.run_ra_id = ${runRaId}::uuid
        ORDER BY r.created_at ASC
      `),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, name FROM public.catalog_control_type ORDER BY name ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, name FROM public.catalog_control_nature ORDER BY name ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, name FROM public.catalog_control_frequency ORDER BY name ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, numeric_value::float8 AS value, name, code FROM public.catalog_ra_control_effectiveness WHERE is_active = true ORDER BY ordinal ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, numeric_value::float8 AS value, name, code FROM public.catalog_ra_control_coverage WHERE is_active = true ORDER BY ordinal ASC`),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, COALESCE(name,'') || ' ' || COALESCE(last_name,'') AS name FROM public.users WHERE company_id = ${companyId}::uuid AND is_active = true ORDER BY name ASC`),
    ]);

    const targetRiskId = riskId || risks[0]?.id;
    const current = risks.find(r => r.id === targetRiskId);

    const controls = targetRiskId ? await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        m.id::text AS mapping_id,
        m.run_ra_control_id::text AS control_id,
        c.name,
        c.control_type::text,
        c.control_nature::text,
        c.owner_id::text,
        c.frequency::text,
        m.design::float8,
        m.implementation::float8,
        m.operation::float8,
        m.cobertura::float8
      FROM public.map_run_ra_risk_controls m
      JOIN public.run_ra_controls c ON c.id = m.run_ra_control_id
      WHERE m.run_ra_risk_id = ${targetRiskId}::uuid
      ORDER BY m.created_at ASC
    `) : [];

    return {
      risks,
      current,
      controls,
      catalogs: {
        owners,
        control_types: controlTypes,
        control_natures: controlNatures,
        control_frequencies: controlFrequencies,
        control_effectiveness: controlEffectiveness,
        control_coverage: controlCoverage,
      }
    };
  }

  async upsertControlAnalysis(runRaId: string, riskId: string, data: any) {
    const { residualJustification, controls } = data;

    await prisma.$transaction(async (tx) => {
      // Update residual justification in analysis
      await tx.$executeRaw(Prisma.sql`
        UPDATE public.run_ra_risk_analysis
        SET residual_justification = ${residualJustification},
            updated_at = now()
        WHERE run_ra_id = ${runRaId}::uuid AND run_ra_risk_id = ${riskId}::uuid
      `);

      // Update control mappings and the controls themselves
      for (const c of controls) {
        await tx.$executeRaw(Prisma.sql`
          UPDATE public.run_ra_controls
          SET name = ${c.name},
              control_type = ${c.control_type || null}::uuid,
              control_nature = ${c.control_nature || null}::uuid,
              owner_id = ${c.owner_id || null}::uuid,
              frequency = ${c.frequency || null}::uuid,
              updated_at = now()
          WHERE id = ${c.control_id}::uuid
        `);

        await tx.$executeRaw(Prisma.sql`
          UPDATE public.map_run_ra_risk_controls
          SET design = ${c.design},
              implementation = ${c.implementation},
              operation = ${c.operation},
              cobertura = ${c.cobertura},
              updated_at = now()
          WHERE run_ra_risk_id = ${riskId}::uuid AND run_ra_control_id = ${c.control_id}::uuid
        `);
      }

      // Re-calculate residual risk for this risk
      const analysis = await tx.$queryRaw<any[]>(Prisma.sql`
        SELECT inherent_risk_score::float8 FROM public.run_ra_risk_analysis
        WHERE run_ra_id = ${runRaId}::uuid AND run_ra_risk_id = ${riskId}::uuid
      `);
      const inherent = Number(analysis[0]?.inherent_risk_score ?? 0);

      const mappings = await tx.$queryRaw<any[]>(Prisma.sql`
        SELECT design::float8, implementation::float8, operation::float8, cobertura::float8
        FROM public.map_run_ra_risk_controls
        WHERE run_ra_risk_id = ${riskId}::uuid
      `);

      let totalReduction = 0;
      for (const m of mappings) {
        const eff = (
          (Number(m.design || 3) / 5 * 0.35) +
          (Number(m.implementation || 3) / 5 * 0.30) +
          (Number(m.operation || 3) / 5 * 0.35)
        ) * (Number(m.cobertura || 75) / 100);
        totalReduction += (inherent * eff);
      }

      const finalResidual = Math.max(0, inherent - totalReduction);

      await tx.$executeRaw(Prisma.sql`
        UPDATE public.run_ra_risk_analysis
        SET residual_risk_score = ${finalResidual},
            updated_at = now()
        WHERE run_ra_id = ${runRaId}::uuid AND run_ra_risk_id = ${riskId}::uuid
      `);
    });
  }

  async createNewControlForRisk(runRaId: string, riskId: string, controlData: any) {
    return await prisma.$transaction(async (tx) => {
      const controlIdRows = await tx.$queryRaw<any[]>(Prisma.sql`
        INSERT INTO public.run_ra_controls (
          id, run_ra_id, name, description, control_type, control_nature, owner_id, frequency, is_existing, is_active, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${runRaId}::uuid, ${controlData.control_name}, ${controlData.control_description || ''},
          ${controlData.control_type}::uuid, ${controlData.control_nature || null}::uuid, ${controlData.owner_id || null}::uuid,
          ${controlData.frequency || null}::uuid, true, true, now(), now()
        ) RETURNING id::text
      `);
      const controlId = controlIdRows[0].id;

      await tx.$executeRaw(Prisma.sql`
        INSERT INTO public.map_run_ra_risk_controls (
          id, run_ra_risk_id, run_ra_control_id, design, implementation, operation, cobertura, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${riskId}::uuid, ${controlId}::uuid, 3, 3, 3, 75, now(), now()
        )
      `);
      return controlId;
    });
  }

  async deleteControlMapping(runRaId: string, riskId: string, controlId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw(Prisma.sql`
        DELETE FROM public.map_run_ra_risk_controls
        WHERE run_ra_risk_id = ${riskId}::uuid AND run_ra_control_id = ${controlId}::uuid
      `);
    });
  }

  // --- STEP 4: RISK VALUATION ---

  async getRiskValuationData(runRaId: string, companyId: string) {
    const [risks, catalogs] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          r.id::text,
          r.name AS risk,
          r.cause,
          cat.name AS risk_category,
          a.inherent_risk_score::float8 AS inherent_score,
          a.residual_risk_score::float8 AS residual_score,
          a.id_valoration::text,
          ilev.name AS inherent_level,
          ilev.color AS inherent_level_color,
          rlev.name AS residual_level,
          rlev.color AS residual_level_color
        FROM public.run_ra_risks r
        LEFT JOIN public.run_ra_risk_analysis a ON a.run_ra_risk_id = r.id
        LEFT JOIN public.catalog_risk_category cat ON cat.id = r.risk_category
        LEFT JOIN public.catalog_ra_inherent_level ilev ON ilev.company_id = ${companyId}::uuid 
             AND a.inherent_risk_score >= ilev.min_score AND a.inherent_risk_score <= ilev.max_score
        LEFT JOIN public.catalog_ra_inherent_level rlev ON rlev.company_id = ${companyId}::uuid 
             AND a.residual_risk_score >= rlev.min_score AND a.residual_risk_score <= rlev.max_score
        WHERE r.run_ra_id = ${runRaId}::uuid
        ORDER BY r.created_at ASC
      `),
      prisma.$queryRaw<any[]>(Prisma.sql`SELECT id::text, label, code FROM public.catalog_ra_valoration WHERE is_active = true ORDER BY label ASC`),
    ]);

    // For each risk, fetch its controls
    const riskDetails = await Promise.all(risks.map(async (r) => {
      const controls = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT c.id::text, c.name
        FROM public.map_run_ra_risk_controls m
        JOIN public.run_ra_controls c ON c.id = m.run_ra_control_id
        WHERE m.run_ra_risk_id = ${r.id}::uuid
      `);
      
      const reduction_score = r.inherent_score - r.residual_score;
      const reduction_percent = r.inherent_score > 0 ? (reduction_score / r.inherent_score) * 100 : 0;

      return {
        ...r,
        controls,
        reduction_score,
        reduction_percent,
      };
    }));

    const total_inherent = riskDetails.reduce((acc, r) => acc + r.inherent_score, 0);
    const total_residual = riskDetails.reduce((acc, r) => acc + r.residual_score, 0);
    const total_reduction = total_inherent - total_residual;
    const total_reduction_percent = total_inherent > 0 ? (total_reduction / total_inherent) * 100 : 0;

    return {
      summary: { total_inherent, total_residual, total_reduction, total_reduction_percent },
      risks: riskDetails,
      catalogs: { valoration: catalogs }
    };
  }

  async updateRiskValuation(runRaId: string, riskId: string, valorationId: string | null) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE public.run_ra_risk_analysis
      SET id_valoration = ${valorationId}::uuid,
          updated_at = now()
      WHERE run_ra_id = ${runRaId}::uuid AND run_ra_risk_id = ${riskId}::uuid
    `);
  }

  // --- STEP 5: RISK TREATMENT ---

  async getRiskTreatmentActions(runRaId: string, riskId: string) {
    return await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        id::text,
        treatment_action,
        responsible_id::text,
        target_date::text AS target_date,
        requires_reevaluation AS monitored,
        status
      FROM public.run_ra_risk_treatment
      WHERE run_ra_id = ${runRaId}::uuid AND run_ra_risk_id = ${riskId}::uuid
      ORDER BY created_at ASC
    `);
  }

  async upsertRiskTreatmentAction(runRaId: string, riskId: string, actionData: any) {
    const { id, action, responsible_id, due_date, monitored, status } = actionData;

    if (id) {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE public.run_ra_risk_treatment
        SET treatment_action = ${action},
            responsible_id = ${responsible_id || null}::uuid,
            target_date = ${due_date || null}::date,
            requires_reevaluation = ${monitored},
            status = ${status},
            updated_at = now()
        WHERE id = ${id}::uuid
      `);
      return id;
    } else {
      const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
        INSERT INTO public.run_ra_risk_treatment (
          id, run_ra_id, run_ra_risk_id, treatment_action, responsible_id, target_date, requires_reevaluation, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${runRaId}::uuid, ${riskId}::uuid, ${action}, ${responsible_id || null}::uuid, 
          ${due_date || null}::date, ${monitored}, ${status}, now(), now()
        ) RETURNING id::text
      `);
      return rows[0].id;
    }
  }

  async deleteRiskTreatmentAction(runRaId: string, id: string) {
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM public.run_ra_risk_treatment
      WHERE id = ${id}::uuid AND run_ra_id = ${runRaId}::uuid
    `);
  }
}
