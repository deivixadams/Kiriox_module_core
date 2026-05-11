import type { CoreSdkContext } from "./core-sdk";

export interface PluginSdk<TApi = unknown> {
  context: CoreSdkContext;
  api: TApi;
}
