import AdmZip from "adm-zip";
import { mkdirSync, renameSync, rmSync, writeFileSync, existsSync, readFileSync, readdirSync } from "fs";
import { dirname, join, normalize, resolve } from "path";
import { bootstrapCore } from "@/core/core-bootstrap";
import { kirioxModuleRegistry } from "@/core/module-registry";
import { KirioxPluginManifestSchema } from "@/shared/contracts/plugins/plugin-manifest.schema";
import type { KirioxPluginContract } from "@/shared/contracts/plugins/plugin.contract";
import { kirioxExtensionPointRegistry } from "./extension-point-registry";
import { appendPluginAudit } from "./plugin-audit";
import { validatePluginManifest } from "./plugin-validator";
import {
  PLUGIN_INSTALLED_DIR,
  PLUGIN_PACKAGES_DIR,
  PLUGIN_QUARANTINE_DIR,
} from "./plugin-paths";
import {
  readPluginRegistry,
  writePluginRegistry,
  type PluginRegistryRecord,
} from "./plugin-registry-store";
import { loadPluginContractFromSource } from "./plugin-runtime-loader";

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/;

export interface PluginInstallationResult {
  ok: boolean;
  pluginId?: string;
  status?: "installed";
  message: string;
  installedPath?: string;
}

function safeDirectoryName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function assertSafeZipEntries(zip: AdmZip): void {
  for (const entry of zip.getEntries()) {
    const normalized = normalize(entry.entryName);
    if (normalized.startsWith("..") || normalized.includes(`..\\`) || normalized.includes(`../`)) {
      throw new Error(`El zip contiene rutas no seguras: ${entry.entryName}`);
    }
  }
}

function extractZipSafely(zipFilePath: string, targetDir: string): void {
  const zip = new AdmZip(zipFilePath);
  assertSafeZipEntries(zip);

  mkdirSync(targetDir, { recursive: true });

  for (const entry of zip.getEntries()) {
    const outputPath = resolve(targetDir, entry.entryName);
    if (!outputPath.startsWith(resolve(targetDir))) {
      throw new Error(`Entrada fuera del directorio objetivo: ${entry.entryName}`);
    }

    if (entry.isDirectory) {
      mkdirSync(outputPath, { recursive: true });
      continue;
    }

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, entry.getData());
  }
}

function findManifestRecursively(rootDir: string): string {
  const candidates = [join(rootDir, "plugin.manifest.json")];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  const queue = [rootDir];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const entries = readdirSync(current, { withFileTypes: true }) as Array<{ name: string; isDirectory(): boolean }>;
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.name === "plugin.manifest.json") {
        return fullPath;
      }
    }
  }

  throw new Error("No se encontró plugin.manifest.json en el paquete.");
}

function findEntryFile(pluginRootDir: string): string {
  const entry = join(pluginRootDir, "index.ts");
  if (!existsSync(entry)) {
    throw new Error("No se encontró index.ts en la raíz del plugin.");
  }
  return entry;
}

function validateDependencies(dependencies: string[]): void {
  bootstrapCore();
  const registeredModules = new Set(kirioxModuleRegistry.list().map((moduleEntry) => moduleEntry.manifest.id));
  const installedPlugins = new Set(readPluginRegistry().map((record) => record.id));

  for (const dependency of dependencies) {
    if (registeredModules.has(dependency as never)) continue;
    if (installedPlugins.has(dependency)) continue;
    throw new Error(`Dependencia no resuelta: ${dependency}`);
  }
}

function validateExtensionPoints(extensionPoints: string[]): void {
  for (const pointId of extensionPoints) {
    if (!kirioxExtensionPointRegistry.get(pointId)) {
      throw new Error(`La zona ${pointId} no está declarada por ningún módulo oficial.`);
    }
  }
}

function validateLoadedContract(
  manifestFromFile: ReturnType<typeof KirioxPluginManifestSchema.parse>,
  contract: KirioxPluginContract
): void {
  const loadedManifest = KirioxPluginManifestSchema.parse(contract.manifest);

  if (loadedManifest.id !== manifestFromFile.id) {
    throw new Error("El manifest exportado no coincide con plugin.manifest.json en id.");
  }
  if (loadedManifest.version !== manifestFromFile.version) {
    throw new Error("El manifest exportado no coincide con plugin.manifest.json en version.");
  }
}

export async function installPluginPackage(uploadedFile: File): Promise<PluginInstallationResult> {
  const timestamp = Date.now();
  const packageBaseName = safeDirectoryName(uploadedFile.name.replace(/\.zip$/i, ""));
  const packageFileName = `${timestamp}-${packageBaseName}.zip`;
  const quarantineDir = join(PLUGIN_QUARANTINE_DIR, `${timestamp}-${packageBaseName}`);

  try {
    if (!uploadedFile.name.toLowerCase().endsWith(".zip")) {
      throw new Error("Sólo se permiten paquetes .zip.");
    }

    mkdirSync(PLUGIN_PACKAGES_DIR, { recursive: true });
    mkdirSync(PLUGIN_QUARANTINE_DIR, { recursive: true });
    mkdirSync(PLUGIN_INSTALLED_DIR, { recursive: true });

    const packageFilePath = join(PLUGIN_PACKAGES_DIR, packageFileName);

    writeFileSync(packageFilePath, Buffer.from(await uploadedFile.arrayBuffer()));
    extractZipSafely(packageFilePath, quarantineDir);

    const manifestPath = findManifestRecursively(quarantineDir);
    const manifestRaw = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    const validation = validatePluginManifest(manifestRaw);
    if (!validation.ok) {
      throw new Error(validation.issues.join(" "));
    }

    const manifest = KirioxPluginManifestSchema.parse(manifestRaw);

    if (!SEMVER_PATTERN.test(manifest.version)) {
      throw new Error("La versión del plugin debe usar formato semver.");
    }

    validateDependencies(manifest.dependencies ?? []);
    validateExtensionPoints(manifest.extensionPoints);

    const pluginRootDir = dirname(manifestPath);
    const entryFile = findEntryFile(pluginRootDir);
    const contract = loadPluginContractFromSource(entryFile);
    validateLoadedContract(manifest, contract);

    const installedDirName = `${safeDirectoryName(manifest.id)}@${safeDirectoryName(manifest.version)}`;
    const installedDir = join(PLUGIN_INSTALLED_DIR, installedDirName);

    if (existsSync(installedDir)) {
      throw new Error(`Ya existe un plugin instalado con id ${manifest.id} y versión ${manifest.version}.`);
    }

    renameSync(pluginRootDir, installedDir);
    rmSync(quarantineDir, { recursive: true, force: true });

    const registry = readPluginRegistry().filter((record) => !(record.id === manifest.id && record.version === manifest.version));
    const nextRecord: PluginRegistryRecord = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description ?? "",
      author: manifest.author ?? "Desconocido",
      status: "installed",
      permissions: manifest.permissions,
      extensionPoints: manifest.extensionPoints,
      dependencies: manifest.dependencies ?? [],
      installedPath: installedDir,
      packageFileName,
      entryFile: join(installedDir, "index.ts"),
      contractLoaded: true,
      installedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    registry.push(nextRecord);
    writePluginRegistry(registry);
    appendPluginAudit({
      timestamp: new Date().toISOString(),
      pluginId: manifest.id,
      event: "install",
      status: "success",
      message: `Plugin ${manifest.name} instalado correctamente.`,
      actor: "system",
    });

    return {
      ok: true,
      pluginId: manifest.id,
      status: "installed",
      message: `Plugin ${manifest.name} instalado correctamente.`,
      installedPath: installedDir,
    };
  } catch (error) {
    appendPluginAudit({
      timestamp: new Date().toISOString(),
      pluginId: packageBaseName,
      event: "error",
      status: "failure",
      message: error instanceof Error ? error.message : "Error desconocido en instalación.",
      actor: "system",
      details: {
        packageFileName,
        quarantineDir,
      },
    });
    throw error;
  }
}
