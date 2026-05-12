import type {
  KirioxCoreEventBusContract,
  KirioxEvent,
  KirioxEventHandler,
} from "@/shared/contracts/core";

export class KirioxCoreEventBus implements KirioxCoreEventBusContract {
  private readonly handlers = new Map<string, Set<KirioxEventHandler>>();

  async publish(event: KirioxEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.name);

    if (!eventHandlers) {
      return;
    }

    await Promise.all(
      Array.from(eventHandlers).map((handler) => handler(event)),
    );
  }

  subscribe(eventName: string, handler: KirioxEventHandler): void {
    const eventHandlers =
      this.handlers.get(eventName) ?? new Set<KirioxEventHandler>();

    eventHandlers.add(handler);
    this.handlers.set(eventName, eventHandlers);
  }

  unsubscribe(eventName: string, handler: KirioxEventHandler): void {
    const eventHandlers = this.handlers.get(eventName);

    if (!eventHandlers) {
      return;
    }

    eventHandlers.delete(handler);

    if (eventHandlers.size === 0) {
      this.handlers.delete(eventName);
    }
  }
}

export const kirioxCoreEventBus = new KirioxCoreEventBus();
