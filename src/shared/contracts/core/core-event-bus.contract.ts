export type KirioxEventPayload = Record<string, unknown>;

export interface KirioxEvent {
  id?: string;
  name: string;
  source: "core" | "module" | "plugin" | "system";
  payload: KirioxEventPayload;
  occurredAt: Date;
}

export type KirioxEventHandler = (
  event: KirioxEvent,
) => Promise<void> | void;

export interface KirioxCoreEventBusContract {
  publish(event: KirioxEvent): Promise<void>;
  subscribe(eventName: string, handler: KirioxEventHandler): void;
  unsubscribe(eventName: string, handler: KirioxEventHandler): void;
}
