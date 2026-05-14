import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { PLUGIN_AUDIT_FILE } from "./plugin-paths";

export type PluginAuditEventType =
  | "install"
  | "activate"
  | "deactivate"
  | "load"
  | "error"
  | "execute";

export interface PluginAuditEntry {
  timestamp: string;
  pluginId: string;
  event: PluginAuditEventType;
  status: "success" | "failure" | "info";
  message: string;
  pointId?: string;
  actor?: string;
  details?: Record<string, unknown>;
}

function ensureAuditFile(): void {
  mkdirSync(dirname(PLUGIN_AUDIT_FILE), { recursive: true });
  if (!existsSync(PLUGIN_AUDIT_FILE)) {
    writeFileSync(PLUGIN_AUDIT_FILE, "", "utf8");
  }
}

export function appendPluginAudit(entry: PluginAuditEntry): void {
  ensureAuditFile();
  appendFileSync(PLUGIN_AUDIT_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}

export function readPluginAuditTrail(limit = 20): PluginAuditEntry[] {
  ensureAuditFile();
  const content = readFileSync(PLUGIN_AUDIT_FILE, "utf8").trim();
  if (!content) {
    return [];
  }

  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as PluginAuditEntry)
    .slice(-limit)
    .reverse();
}
