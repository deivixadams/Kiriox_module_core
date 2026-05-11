import type { CoreSdkContext } from "./core-sdk";

export interface ModuleSdk<TCapabilities = unknown> {
  context: CoreSdkContext;
  capabilities: TCapabilities;
}
