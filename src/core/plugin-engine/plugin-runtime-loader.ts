import { existsSync, readFileSync } from "fs";
import { dirname, extname, resolve } from "path";
import ts from "typescript";
import type { KirioxPluginContract } from "@/shared/contracts/plugins/plugin.contract";

function resolveModulePath(baseDir: string, specifier: string): string {
  const candidateBase = resolve(baseDir, specifier);
  const candidates = [
    candidateBase,
    `${candidateBase}.ts`,
    `${candidateBase}.js`,
    resolve(candidateBase, "index.ts"),
    resolve(candidateBase, "index.js"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No se pudo resolver el módulo del plugin: ${specifier}`);
}

export function loadPluginContractFromSource(entryFile: string): KirioxPluginContract {
  const moduleCache = new Map<string, unknown>();

  const loadModule = (filePath: string): unknown => {
    if (moduleCache.has(filePath)) {
      return moduleCache.get(filePath);
    }

    const source = readFileSync(filePath, "utf8");
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
      fileName: filePath,
    });

    const pluginModule = { exports: {} as Record<string, unknown> };
    const localRequire = (specifier: string) => {
      if (!specifier.startsWith("./") && !specifier.startsWith("../")) {
        throw new Error(`Import externo no permitido en plugins: ${specifier}`);
      }
      const resolvedPath = resolveModulePath(dirname(filePath), specifier);
      return loadModule(resolvedPath);
    };

    const evaluator = new Function(
      "exports",
      "require",
      "module",
      "__filename",
      "__dirname",
      transpiled.outputText
    );

    evaluator(
      pluginModule.exports,
      localRequire,
      pluginModule,
      filePath,
      dirname(filePath)
    );

    moduleCache.set(filePath, pluginModule.exports);
    return pluginModule.exports;
  };

  const exportsValue = loadModule(entryFile) as Record<string, unknown>;
  const candidate =
    (exportsValue.default as KirioxPluginContract | undefined) ??
    (exportsValue.plugin as KirioxPluginContract | undefined) ??
    (exportsValue as unknown as KirioxPluginContract);

  if (!candidate || typeof candidate !== "object") {
    throw new Error("El index.ts del plugin no exporta un contrato válido.");
  }

  if (!candidate.manifest || typeof candidate.activate !== "function") {
    throw new Error("El contrato del plugin debe exponer manifest y activate().");
  }

  if (extname(entryFile) !== ".ts") {
    throw new Error("Sólo se permite cargar entrypoints index.ts.");
  }

  return candidate;
}
