import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import {
  PLUGIN_INSTALLED_DIR,
  PLUGIN_PACKAGES_DIR,
  PLUGIN_QUARANTINE_DIR,
  PLUGIN_REGISTRY_FILE,
} from "./plugin-paths";
import type { KirioxPluginExtensionPoint, KirioxPluginPermission, KirioxPluginStatus } from "@/shared/contracts/plugins/plugin.contract";

export interface PluginRegistryRecord {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  status: KirioxPluginStatus;
  permissions: KirioxPluginPermission[];
  extensionPoints: KirioxPluginExtensionPoint[];
  dependencies: string[];
  installedPath: string | null;
  packageFileName: string | null;
  entryFile: string | null;
  contractLoaded: boolean;
  installedAt: string | null;
  updatedAt: string;
}

const defaultRegistryRecords: PluginRegistryRecord[] = [
  {
    id: "liquidity-advanced-calculator",
    name: "Calculador de Liquidez Avanzado",
    description: "Extiende el ecosistema con cálculos de brecha de liquidez multinivel y proyecciones de flujo de caja.",
    version: "1.2.4",
    author: "Kiriox Core",
    status: "active",
    permissions: ["read:risk", "export:data", "register:ui"],
    extensionPoints: ["dashboard:widget", "report:exporter"],
    dependencies: ["reportes"],
    installedPath: null,
    packageFileName: null,
    entryFile: null,
    contractLoaded: false,
    installedAt: null,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "smv-validator",
    name: "Validador SMV 2.0",
    description: "Valida reglas regulatorias y consistencia de datos antes de la remisión de reportes.",
    version: "2.0.1",
    author: "Regulatory Compliance",
    status: "active",
    permissions: ["read:company", "read:risk", "read:control", "register:ui"],
    extensionPoints: ["navigation:item", "dashboard:widget"],
    dependencies: ["core", "reportes"],
    installedPath: null,
    packageFileName: null,
    entryFile: null,
    contractLoaded: false,
    installedAt: null,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "excel-exporter-premium",
    name: "Exportador Excel Premium",
    description: "Permite exportar salidas regulatorias en Excel con formatos avanzados y protección de celdas.",
    version: "1.0.0",
    author: "Fintech Solutions",
    status: "installed",
    permissions: ["read:company", "export:data"],
    extensionPoints: ["report:exporter"],
    dependencies: ["reportes"],
    installedPath: null,
    packageFileName: null,
    entryFile: null,
    contractLoaded: false,
    installedAt: null,
    updatedAt: new Date().toISOString(),
  },
];

function ensurePluginDirectories() {
  mkdirSync(PLUGIN_PACKAGES_DIR, { recursive: true });
  mkdirSync(PLUGIN_QUARANTINE_DIR, { recursive: true });
  mkdirSync(PLUGIN_INSTALLED_DIR, { recursive: true });
}

export function readPluginRegistry(): PluginRegistryRecord[] {
  ensurePluginDirectories();

  if (!existsSync(PLUGIN_REGISTRY_FILE)) {
    writeFileSync(PLUGIN_REGISTRY_FILE, JSON.stringify(defaultRegistryRecords, null, 2), "utf8");
    return defaultRegistryRecords;
  }

  const content = readFileSync(PLUGIN_REGISTRY_FILE, "utf8");
  const parsed = JSON.parse(content) as PluginRegistryRecord[];
  return parsed;
}

export function writePluginRegistry(records: PluginRegistryRecord[]): void {
  ensurePluginDirectories();
  writeFileSync(PLUGIN_REGISTRY_FILE, JSON.stringify(records, null, 2), "utf8");
}
