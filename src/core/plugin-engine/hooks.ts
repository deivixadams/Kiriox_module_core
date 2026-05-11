export interface ExtensionHook<TPayload = unknown> {
  key: string;
  payload: TPayload;
}

export function createExtensionHook<TPayload>(
  key: string,
  payload: TPayload,
): ExtensionHook<TPayload> {
  return { key, payload };
}
