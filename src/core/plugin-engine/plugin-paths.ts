import { resolve } from "path";

const REPO_ROOT = process.cwd();
const WORKSPACE_ROOT = resolve(REPO_ROOT, "..");
const PLUGINS_BASE_DIR = resolve(WORKSPACE_ROOT, "xdata", "plugins");

export const PLUGIN_PACKAGES_DIR = resolve(PLUGINS_BASE_DIR, "packages");
export const PLUGIN_QUARANTINE_DIR = resolve(PLUGINS_BASE_DIR, "quarantine");
export const PLUGIN_INSTALLED_DIR = resolve(PLUGINS_BASE_DIR, "installed");
export const PLUGIN_REGISTRY_FILE = resolve(PLUGINS_BASE_DIR, "registry.json");
