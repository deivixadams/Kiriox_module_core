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

type RawPluginRegistryRecord = Omit<PluginRegistryRecord, "status"> & {
  status: PluginRegistryRecord["status"] | "quarantined";
};

const defaultRegistryRecords: PluginRegistryRecord[] = [
  {
    id: "liquidity-advanced-calculator",
    name: "Calculador de Liquidez Avanzado",
    description: "Extiende el ecosistema con cálculos de brecha de liquidez multinivel y proyecciones de flujo de caja.",
    version: "1.2.4",
    author: "Kiriox Core",
    status: "active",
    permissions: ["read:risk", "export:data", "register:ui"],
    extensionPoints: ["simulation:dashboard:widget"],
    dependencies: ["simulation"],
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
    extensionPoints: ["monitoring:dashboard:widget"],
    dependencies: ["monitoring"],
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
    permissions: ["read:risk", "register:ui"],
    extensionPoints: ["linear-risk:dashboard:widget"],
    dependencies: ["linear-risk"],
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

function normalizeExtensionPoints(
  record: RawPluginRegistryRecord,
): KirioxPluginExtensionPoint[] {
  return record.extensionPoints.map((point) => {
    if (point === "linear-risk:dashboard:widget") return point;
    if (point === "monitoring:dashboard:widget") return point;
    if (point === "simulation:dashboard:widget") return point;
    if (point === "structural-risk:dashboard:widget") return point;
    if (point === "incident:dashboard:widget") return point;
    if (record.id === "liquidity-advanced-calculator") return "simulation:dashboard:widget";
    if (record.id === "smv-validator") return "monitoring:dashboard:widget";
    if (record.id === "excel-exporter-premium") return "linear-risk:dashboard:widget";
    return "linear-risk:dashboard:widget";
  });
}

function normalizeStatus(status: RawPluginRegistryRecord["status"]): KirioxPluginStatus {
  if (status === "quarantine") return status;
  if (status === "active") return status;
  if (status === "disabled") return status;
  if (status === "installed") return status;
  return "quarantine";
}

function normalizeRegistryRecords(records: RawPluginRegistryRecord[]): PluginRegistryRecord[] {
  return records.map((record) => ({
    ...record,
    status: record.status === "quarantined" ? "quarantine" : normalizeStatus(record.status),
    extensionPoints: normalizeExtensionPoints(record),
  }));
}

export function readPluginRegistry(): PluginRegistryRecord[] {
  ensurePluginDirectories();

  if (!existsSync(PLUGIN_REGISTRY_FILE)) {
    writeFileSync(PLUGIN_REGISTRY_FILE, JSON.stringify(defaultRegistryRecords, null, 2), "utf8");
    return defaultRegistryRecords;
  }

  const content = readFileSync(PLUGIN_REGISTRY_FILE, "utf8");
  const parsed = JSON.parse(content) as RawPluginRegistryRecord[];
  const normalized = normalizeRegistryRecords(parsed);

  if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
    writePluginRegistry(normalized);
  }

  return normalized;
}

export function writePluginRegistry(records: PluginRegistryRecord[]): void {
  ensurePluginDirectories();
  writeFileSync(PLUGIN_REGISTRY_FILE, JSON.stringify(records, null, 2), "utf8");
}
