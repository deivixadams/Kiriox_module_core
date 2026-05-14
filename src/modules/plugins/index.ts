import { PluginsRepository } from "./plugins.repository";
import { PluginsService } from "./plugins.service";

const pluginsRepository = new PluginsRepository();
const pluginsService = new PluginsService(pluginsRepository);

export { pluginsService as PluginsModule };
export * from "./plugins.module";
export * from "./plugins.types";
export * from "./plugins.contract";
