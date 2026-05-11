


Tablas para la parte estructura. Si notas que alguna ha cambiado actualizar.

| Tabla                                         | Descripción 
─────────────────────────────────────────────────────────────────────
| `public.graph_run_sa`                         | Tabla maestra de evaluaciones estructurales o corridas de análisis por grafo.                 |
| `public.graph_catalog_run_lifecycle`          | Catálogo de estados del ciclo de vida del run estructural.                                    |
| `public.graph_catalog_run_scope_type`         | Catálogo del alcance del análisis estructural: compañía, elemento, actividad o personalizado.  |
| `public.graph_catalog_run_methodology`        | Catálogo de metodologías de análisis estructural por grafo.                                      |
| `public.graph_run_lifecycle_history`          | Histórico auditable de cambios de estado del run estructural.                                    |
| `public.graph_activities_dependencies`        | Registro de dependencias estructurales de cada actividad.                                      |
| `public.graph_activities_dependency_resource` | Catálogo de tipos de recurso del que puede depender una actividad.                         |
| `public.graph_activities_failure_effect`      | Catálogo del efecto producido si falla una dependencia.                                    |
| `public.graph_activities_dependency_strength` | Catálogo de fuerza de dependencia: baja, media, alta o crítica.                                 |
| `public.graph_activities_alternative_level`   | Catálogo de nivel de alternativa disponible ante falla de dependencia.                           |
| `public.graph_run_sa_activities`              | Tabla puente entre evaluaciones estructurales y actividades incluidas en el análisis.           |


## 2026-05-05 — Aprendizaje

**Regla aprendida:** Registrar en `MEMORY.md` únicamente aprendizajes de alta importancia y reutilización futura; no registrar ajustes tácticos puntuales sin valor general.

**Aplicación futura:** Filtrar cada posible entrada por impacto sistémico y reusabilidad antes de guardarla en memoria.

En general:
Todo aprendizaje que reduzca incertidumbre futura, evite repetir errores, preserve decisiones del proyecto o mejore la consistencia técnica debe registrarse en MEMORY.md. No registres observaciones triviales, temporales o demasiado específicas. Prioriza conocimiento estable, reutilizable y relevante para arquitectura, desarrollo, pruebas, despliegue, seguridad, mantenimiento y evolución del sistema.
## 2026-05-05 — Aprendizaje

**Contexto:** Conexión a la base de datos del proyecto.

**Regla aprendida:** La base de datos real es `interval_db`. El contenedor Docker se llama `kiriox`. Antes de consultar la DB, leer siempre `.env`. El comando correcto es `docker exec kiriox psql -U postgres -d interval_db -c "..."`. Nunca asumir `kiriox_db` ni `trace-postgres`.

**Aplicación futura:** Siempre leer `.env` antes de cualquier consulta o suposición sobre estructura de tablas. Validar contra `interval_db`, no contra otras bases.

## 2026-05-05 — Aprendizaje

**Contexto:** Normalización del campo "Objetivo afectado" en el paso 2 de riesgo lineal.

**Regla aprendida:** "Objetivo afectado" no debe capturarse como texto libre; debe seleccionarse desde `public.company_objective` y persistirse como `objective_id` (UUID) con FK.

**Aplicación futura:** En formularios de riesgo, usar catálogos maestros corporativos para entidades de gobierno (objetivos, apetito, etc.) y evitar texto libre cuando el dato define trazabilidad y reporting.
## 2026-05-05 — Aprendizaje

**Contexto:** Modernización del wizard de captura estructural.

**Regla aprendida:** La evaluación de impacto operativo y criticidad de actividades debe realizarse de forma dual y separada, basada en catálogos técnicos específicos (`graph_activity_catalog_impact` y `graph_activity_catalog_criticality`) en lugar de formularios de texto libre.

**Aplicación futura:** Al diseñar interfaces de valoración de riesgo estructural, priorizar el uso de listboxes enriquecidos con "Definiciones Operativas" y "Señales de Decisión" que guíen al usuario, separando la configuración administrativa (Step 1) de la valoración técnica (Step 2/3).
## 2026-05-05 — Aprendizaje

**Contexto:** Diseño del paso 2 en `/gestion/wizard_captura_estructural` para captura de dependencias.

**Regla aprendida:** La actividad X no se captura manualmente en el formulario del paso 2; X debe venir arrastrada desde la selección del paso 1 (actividades incluidas en la corrida).

**Aplicación futura:** En flujos estructurales X→Y, bloquear captura libre de X y usar únicamente actividades preseleccionadas de la corrida para asegurar trazabilidad y consistencia.
## 2026-05-05 — Aprendizaje

**Contexto:** Implementación de la ruta `/gobierno/actividades-clave/nuevo` para la creación de actividades.

**Regla aprendida:** La creación de actividades clave de gobierno requiere vincularlas obligatoriamente a una empresa (`company_id`) y a un proceso/elemento (`element_id`). La interfaz debe permitir la selección dinámica de procesos basada en la empresa elegida.

**Aplicación futura:** Para nuevas pantallas de creación de objetos en el dominio de gobierno, seguir el patrón de `GovernanceActivityNewPage`: fetch de contexto (empresas) -> fetch de dependencia (procesos) -> POST a API de actividades.

## 2026-05-07 — Aprendizaje

**Contexto:** Inserción manual de incidentes en `public.incident_register`.

**Regla aprendida:** La tabla `incident_register` requiere UUIDs reales para `element_id`, `risk_id`, `control_id`, `severity_id` y `action_plan_id`. `severity_id` apunta a `catalog_activity_criticality_level` (Muy bajo, Bajo, Medio, Alto, Crítico) y `action_plan_id` apunta a `catalog_ra_valoration` (Aceptar, Tratar, Escalar, etc.).

**Aplicación futura:** Al realizar inserciones de prueba o migraciones de datos, siempre mapear los campos FK a los catálogos correspondientes verificando los IDs en `interval_db` del contenedor `kiriox`.

**UI Renaming:** El módulo "Hechos Relevantes" fue renombrado a "Incidentes" en el sidebar y dashboards. Se debe mantener el endpoint `/api/hechos-relevantes/buscar` por compatibilidad, pero la etiqueta visible al usuario siempre debe ser "Incidentes".

## 2026-05-08 — Aprendizaje

**Contexto:** Corrección del usuario sobre estado del entorno raíz en D:\_KIRIOX_GRI_v3.

**Regla aprendida:** No asumir dependencias faltantes en raíz; el usuario ya instaló paquetes y confirmó que el sistema corre, Prisma generate y TypeScript check ejecutados con éxito.

**Aplicación futura:** Al resumir avances, reflejar explícitamente que la raíz operativa D:\_KIRIOX_GRI_v3 está provisionada y funcional, evitando reportar bloqueos de instalación ya resueltos.


## Version de prisma
prisma               : 7.8.0
@prisma/client       : 7.8.0
Operating System     : win32
Architecture         : x64
Node.js              : v22.19.0
TypeScript           : 5.9.3
Query Compiler       : enabled
PSL                  : @prisma/prisma-schema-wasm 7.8.0-6.3c6e192761c0362d496ed980de936e2f3cebcd3a
Schema Engine        : schema-engine-cli 3c6e192761c0362d496ed980de936e2f3cebcd3a (at node_modules\.pnpm\@prisma+engines@7.8.0\node_modules\@prisma\engines\schema-engine-windows.exe)
Default Engines Hash : 3c6e192761c0362d496ed980de936e2f3cebcd3a
Studio               : 0.27.3

