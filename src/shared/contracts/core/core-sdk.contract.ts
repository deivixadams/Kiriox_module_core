import type { KirioxCoreAccessContract } from "./core-access.contract";
import type { KirioxCoreAuditContract } from "./core-audit.contract";
import type { KirioxCoreEventBusContract } from "./core-event-bus.contract";
import type { KirioxCoreExtensionPointContract } from "./core-extension-point.contract";

export interface KirioxCoreSdkContract {
  access: KirioxCoreAccessContract;
  audit: KirioxCoreAuditContract;
  eventBus: KirioxCoreEventBusContract;
  extensionPoints: KirioxCoreExtensionPointContract;
}
