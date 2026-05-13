# Plantilla: Crear un nuevo módulo oficial en Kiriox GRI v3

## Antes de empezar — rellena estos 6 valores

| Variable            | Descripción                                         | Ejemplo           |
|---------------------|-----------------------------------------------------|-------------------|
| `{{MODULE_ID}}`     | Identificador kebab-case (va al contrato)           | `audit`           |
| `{{ModuleName}}`    | PascalCase (clases, exports, archivos)              | `Audit`           |
| `{{moduleName}}`    | camelCase (variables, funciones)                    | `audit`           |
| `{{MODULE_DISPLAY}}`| Nombre legible para humanos (manifest.name)         | `Audit`           |
| `{{MODULE_DESC}}`   | Descripción corta para el manifest                  | `Módulo de auditoría de Kiriox.` |
| `{{SOURCE_KEYWORDS}}`| Palabras clave a buscar en la fuente monolítica    | `audit, auditoria, auditoría` |
| `{{SOURCE_ROUTE}}`  | Ruta original en el monolito fuente                 | `gestion/auditoria` |
| `{{NAV_LABEL}}`     | Texto que aparece en el menú lateral                | `Auditoría` |
| `{{NAV_HREF}}`      | Ruta destino al hacer clic en el menú               | `/gestion/auditoria` |
| `{{NAV_ICON}}`      | Nombre del ícono de lucide-react                    | `ClipboardCheck` |
| `{{NAV_ORDER}}`     | Número de orden en el menú (ver tabla al final)     | `30` |

Una vez definidos, cada paso usa esas variables literalmente.
No hay que tomar ninguna otra decisión — solo seguir el orden.

---

## PASO 1 — Analizar la fuente original

**No modificar nada en la fuente.**

Buscar en `D:\_KIRIOX_GRI_v3\xdata\_FUENTE` todo lo relacionado con `{{SOURCE_KEYWORDS}}` y `{{SOURCE_ROUTE}}`.

Registrar hallazgos en estas categorías:

- Rutas de archivos encontradas
- Componentes UI (`page.tsx`, `.module.css`, componentes reutilizables)
- Endpoints API (`/api/{{MODULE_ID}}/...`)
- Consultas a base de datos (tablas, columnas, relaciones)
- Tipos e interfaces propias del módulo
- Dependencias con Core (`@/core/...`)
- Dependencias con otros módulos
- Archivos que mezclan `{{MODULE_ID}}` con otro dominio (deben separarse antes de migrar)

---

## PASO 2 — Crear mapa de migración

Crear el archivo:

```
xdata\bitacora\{{MODULE_ID}}-migration-map.md
```

Estructura del archivo:

```markdown
# Mapa de migración: {{MODULE_DISPLAY}}

## Rutas de archivos fuente
- ...

## Componentes UI
- ...

## Endpoints API
- ...

## Tablas / consultas DB
- ...

## Tipos e interfaces
- ...

## Dependencias con Core
- ...

## Dependencias con otros módulos
- ...

## Archivos mixtos (requieren separación previa)
- ...

## Pendientes de clasificación
- ...
```

---

## PASO 3 — Actualizar contratos y listas de módulos

### 3a. Contrato oficial de ids

Archivo: `src\shared\contracts\modules\module.contract.ts`

Agregar `| "{{MODULE_ID}}"` dentro de `KirioxOfficialModuleId`:

```ts
export type KirioxOfficialModuleId =
  | "core"
  | "incident"
  | "lineal-risk"
  | "monitoring"
  | "structural-risk"
  | "simulation"
  | "catalog"
  | "{{MODULE_ID}}";   // ← agregar aquí, al final de la lista
```

### 3b. ModuleCode (tipo compartido de acceso)

Archivo: `src\shared\types\AccessControlTypes.ts`

Agregar `| '{{MODULE_ID}}'` dentro de `ModuleCode`:

```ts
export type ModuleCode =
  | 'core'
  // ... existentes ...
  | 'catalog'
  | '{{MODULE_ID}}';   // ← agregar aquí, al final de la lista
```

### 3c. Lista ALL_MODULES del repositorio de acceso

Archivo: `src\core\permissions\infrastructure\PrismaAccessContextRepository.ts`

Agregar `'{{MODULE_ID}}'` al array `ALL_MODULES`:

```ts
const ALL_MODULES: ModuleCode[] = [
  'core', 'governance', 'security', 'benchmark',
  'linear-risk', 'structural-risk', 'audit', 'alerts', 'simulation', 'catalog',
  '{{MODULE_ID}}',   // ← agregar aquí
];
```

> Si `{{MODULE_ID}}` no está en `ALL_MODULES`, el módulo nunca aparecerá como habilitado
> y su ítem de menú no se incluirá en el AccessContext aunque esté registrado.

---

## PASO 4 — Crear el manifest del módulo

Crear el archivo:

```
src\modules\{{MODULE_ID}}\{{MODULE_ID}}.module.ts
```

Contenido exacto:

```ts
import type { KirioxModuleContract } from "@/shared/contracts/modules/module.contract";

export const {{moduleName}}Module: KirioxModuleContract = {
  manifest: {
    id: "{{MODULE_ID}}",
    name: "{{MODULE_DISPLAY}}",
    version: "0.1.0",
    description: "{{MODULE_DESC}}",
    status: "active",
    layers: ["domain", "application", "infrastructure", "api", "ui"],
    dependencies: ["core"],
    nav: {
      label: "{{NAV_LABEL}}",
      href: "{{NAV_HREF}}",
      icon: "{{NAV_ICON}}",
      order: {{NAV_ORDER}},
    },
  },

  register() {
    return;
  },

  activate() {
    return;
  },
};
```

> El campo `nav` es lo único necesario para que el módulo aparezca en el menú lateral.
> No se toca ningún otro archivo de Core para añadir la entrada al menú.

---

## PASO 5 — Exportar el módulo

Crear el archivo:

```
src\modules\{{MODULE_ID}}\index.ts
```

Contenido:

```ts
export * from "./{{MODULE_ID}}.module";
```

---

## PASO 6 — Registrar en el Core

### 6a. Crear el registrador

Crear el archivo:

```
src\core\module-registry\register-{{MODULE_ID}}-module.ts
```

Contenido:

```ts
import { {{moduleName}}Module } from "@/modules/{{MODULE_ID}}";
import { kirioxModuleRegistry } from "./module-registry";

export function register{{ModuleName}}Module(): void {
  kirioxModuleRegistry.register({{moduleName}}Module);
}
```

### 6b. Actualizar el bootstrap

Archivo: `src\core\core-bootstrap.ts`

Añadir el import y la llamada **después del último módulo registrado**:

```ts
import { registerCoreModule } from "@/core/module-registry";
// ... otros imports existentes ...
import { register{{ModuleName}}Module } from "@/core/module-registry/register-{{MODULE_ID}}-module";

let bootstrapped = false;

export function bootstrapCore(): void {
  if (bootstrapped) return;

  registerCoreModule();
  // ... otros módulos ya registrados ...
  register{{ModuleName}}Module();   // ← siempre al final

  bootstrapped = true;
}
```

### 6c. Verificar que compila

```bash
pnpm tsc --noEmit
```

Si pasa, el módulo está registrado correctamente. Si falla, no continuar.

---

## PASO 7 — Migrar por capas (en este orden estricto)

Cada capa va dentro de `src\modules\{{MODULE_ID}}\`.

### A. `domain\`

Qué va aquí:
- Entidades (clases o tipos que representan los objetos del dominio)
- Tipos propios del módulo
- Interfaces de repositorio (contratos, sin implementación)
- Reglas de negocio puras

Restricciones absolutas:
- **Sin React**
- **Sin Prisma**
- **Sin HTTP**
- **Sin imports de `@/infrastructure`**

Verificar al terminar:
```bash
pnpm tsc --noEmit
```

---

### B. `application\`

Qué va aquí:
- Casos de uso (`Get{{ModuleName}}UseCase`, `Create{{ModuleName}}UseCase`, etc.)
- Servicios de aplicación
- Solo coordina domain + infrastructure via interfaces

Restricciones:
- Importa interfaces de `domain\`, nunca implementaciones de `infrastructure\`
- Sin React
- Sin HTTP directo

Verificar al terminar:
```bash
pnpm tsc --noEmit
```

---

### C. `infrastructure\`

Qué va aquí:
- Implementaciones de repositorios (`Prisma{{ModuleName}}Repository`)
- Adaptadores externos
- Consultas SQL o llamadas a `prisma.$queryRaw`

Restricciones:
- Prisma solo aquí, nunca en `domain\`, `application\`, `api\`, ni `ui\`
- Importar prisma client desde `@/infrastructure/db/prisma/client`
- Importar `Prisma` (namespace) desde `@/generated/prisma/client`

Verificar al terminar:
```bash
pnpm tsc --noEmit
```

---

### D. `api\`

Qué va aquí:
- Route handlers de Next.js para este módulo
- Ruta destino: `src\app\api\{{MODULE_ID}}\...`

Restricciones:
- Sin lógica de negocio — solo orquesta use-cases
- Sin Prisma directo — usar repositorios de `infrastructure\`
- Usar `getAuthContext()` de `@/core/auth/auth-server` para autenticación

Patrón de cada route handler:

```ts
import { NextResponse } from "next/server";
import { getAuthContext } from "@/core/auth/auth-server";
import { Get{{ModuleName}}UseCase } from "@/modules/{{MODULE_ID}}/application/use-cases/Get{{ModuleName}}UseCase";
import { Prisma{{ModuleName}}Repository } from "@/modules/{{MODULE_ID}}/infrastructure/Prisma{{ModuleName}}Repository";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const useCase = new Get{{ModuleName}}UseCase(new Prisma{{ModuleName}}Repository());
  const result = await useCase.execute({ companyId: auth.tenantId });
  return NextResponse.json(result);
}
```

Verificar al terminar:
```bash
pnpm tsc --noEmit
```

---

### E. `ui\`

Qué va aquí:
- Página principal: `src\app\{{MODULE_ID}}\page.tsx` (o la ruta que corresponda)
- Componentes visuales reutilizables del módulo
- Estilos aislados (CSS modules)

Restricciones:
- `"use client"` solo donde sea estrictamente necesario
- Datos siempre via fetch a la API del módulo, nunca Prisma directo
- Sin imports de `infrastructure\`

Verificar al terminar:
```bash
pnpm tsc --noEmit
```

---

## PASO 8 — Reglas que aplican a todo el módulo

| Regla | Razón |
|---|---|
| Archivos < 600 líneas | Mantenibilidad, revisión fácil |
| `pnpm tsc --noEmit` después de cada bloque | Detectar errores antes de acumularlos |
| Prisma solo en `infrastructure\` | Permite cambiar DB sin tocar dominio ni UI |
| Core no contiene lógica de `{{MODULE_ID}}` | Core es la base; los módulos son los que tienen dominio |
| No migrar lógica de otros módulos | Un módulo = un dominio |
| Si un archivo fuente mezcla dominios, separar antes de mover | Evitar acoplamientos en el nuevo sistema |
| El menú se declara en el manifest del módulo, nunca en Core | Core no conoce a sus módulos hijos |

### Propiedad del menú Dashboard

**Dashboard pertenece exclusivamente a Core.** Core siempre lo expone en `order: 10` — es su única contribución al menú. Ningún módulo nuevo debe declarar `href: "/score/dashboard2"` ni `order: 10`.

### Tabla de órdenes de menú ocupados

| order | Módulo | Label | Quién lo declara |
|---|---|---|---|
| 10 | `core` | Dashboard | Core — **no tocar** |
| 70 | `catalog` | Catálogo | `catalog.module.ts` |

Elegir un `{{NAV_ORDER}}` libre entre esos valores. Dejar gaps de 10 para poder insertar futuros módulos sin renumerar.

---

## PASO 9 — Log de migración

Crear o actualizar el archivo:

```
xdata\bitacora\{{MODULE_ID}}-migration-log.md
```

Registrar por cada bloque migrado:
- Archivos movidos o creados
- Adaptaciones hechas (imports cambiados, nombres renombrados)
- Paquetes instalados
- Resultado de `pnpm tsc --noEmit`
- Pendientes o deuda técnica identificada

---

## PASO 10 — Validación final

Ejecutar en orden:

```bash
pnpm tsc --noEmit
pnpm lint
pnpm build
```

Criterios de aceptación — todos deben cumplirse:

- [ ] `pnpm tsc --noEmit` → 0 errores
- [ ] `pnpm lint` → 0 errores
- [ ] `pnpm build` → compila limpio
- [ ] Kiriox arranca (`pnpm dev`)
- [ ] Core se registra en el bootstrap
- [ ] `{{MODULE_DISPLAY}}` se registra en el bootstrap después de Core
- [ ] La pantalla del módulo carga en el browser
- [ ] No hay imports rotos ni rutas 404 en los endpoints del módulo
- [ ] `{{moduleName}}Module` cumple `KirioxModuleContract`
- [ ] Core no contiene lógica propia de `{{MODULE_ID}}`
- [ ] El ítem `{{NAV_LABEL}}` aparece en el menú lateral al iniciar sesión
- [ ] `GET /api/auth/access-context` devuelve `navigation` con el ítem del módulo
- [ ] `'{{MODULE_ID}}'` está en `ModuleCode`, `KirioxOfficialModuleId` y `ALL_MODULES`

---

## Referencia rápida — archivos que crea este proceso

```
src\shared\contracts\modules\module.contract.ts        ← modificado (agregar id en KirioxOfficialModuleId)
src\shared\types\AccessControlTypes.ts                ← modificado (agregar id en ModuleCode)
src\core\permissions\infrastructure\
  PrismaAccessContextRepository.ts                    ← modificado (agregar id en ALL_MODULES)
src\modules\{{MODULE_ID}}\
  {{MODULE_ID}}.module.ts                              ← manifest + contrato
  index.ts                                             ← barrel export
  domain\                                              ← entidades, tipos, contratos
  application\                                         ← casos de uso
  infrastructure\                                      ← repositorios Prisma
  api\                                                 ← route handlers (o en src\app\api\{{MODULE_ID}}\)
  ui\                                                  ← componentes (o en src\app\{{MODULE_ID}}\)
  docs\
  tests\
src\core\module-registry\
  register-{{MODULE_ID}}-module.ts                     ← registrador
src\core\core-bootstrap.ts                             ← modificado (agregar llamada)
xdata\bitacora\
  {{MODULE_ID}}-migration-map.md                       ← mapa de análisis
  {{MODULE_ID}}-migration-log.md                       ← log de progreso
```


# Arquitectura
Explicación para un Experto (Orquestación, Desacoplamiento y Arquitectura Evolutiva)

Para un arquitecto, Kiriox v3 es una implementación de Vertical Slicing con un Runtime Orchestrator que gestiona el ciclo de vida y la composición del sistema en tiempo de ejecución.

1.  Sustitución de Liskov a Nivel de Módulo: La arquitectura se basa en la abstracción total de la funcionalidad. Mediante el `KirioxModuleContract`, el sistema interactúa con los módulos como cajas negras. Esto permite que el Core actúe como un Hipervisor de Módulos, orquestando la ejecución sin conocer jamás los detalles de implementación internos (Domain o Infrastructure).
2.  Orquestación Basada en Metadatos (Declarative Discovery): Hemos pasado de "Configuración como Código" a "Descubrimiento como Servicio". El Registry no es solo un mapa; es el punto de entrada para una Composición Dinámica. Los hooks de `activate` y `deactivate` permiten que los módulos gestionen su propio setup (como la inicialización de micro-caches o la suscripción a eventos en el Event Bus) de manera asíncrona y aislada.
3.  Aislamiento de Capas de Persistencia y SQL Leakage: A diferencia de las arquitecturas monolíticas tradicionales donde el ORM es un "acoplador universal", aquí el acceso a datos está estrictamente encapsulado en el Infrastructure Layer de cada módulo. El uso de `Prisma.sql` (Raw SQL) dentro de repositorios modulares permite optimizar el rendimiento (especialmente en agregaciones complejas para dashboards) sin que las reglas de SQL o esquemas específicos "sangren" hacia las capas superiores o hacia otros módulos.
4.  Capa de Composición en Tiempo de Ejecución (Context-Aware UI): El `AccessContextRepository` junto con `buildNavigation` funcionan como una capa de Feature Toggling Multi-Tenant. La interfaz de usuario no es estática; se "deriva" del estado del Registry y del contexto de acceso del usuario. Esto permite una arquitectura multi-inquilino donde la funcionalidad puede variar drásticamente entre empresas simplemente activando o desactivando registros en el manifest, sin despliegues adicionales.
5.  Agnosticismo de la Capa de Entrega (Delivery Agnostic): Al separar los `handlers` y las `pages` de las rutas de Next.js, hemos creado una arquitectura lista para Micro-Frontends. Podríamos migrar a Module Federation o cambiar el framework de rutas por completo, y el 100% de la lógica de negocio y dominio permanecería intacta, ya que el framework (Next.js) es tratado simplemente como un detalle de implementación de la capa de entrega.

Conclusión: Kiriox v3 es una arquitectura evolutiva que combina la simplicidad de desarrollo de un monolito con la flexibilidad y el aislamiento de los microservicios. Es un sistema de Autogestión de Capacidades donde el Core proporciona los servicios de bajo nivel (seguridad, persistencia, auditoría) y los módulos proporcionan la inteligencia de negocio de manera autónoma y autocontenida.
