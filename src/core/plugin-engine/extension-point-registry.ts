export interface ExtensionPoint {
  id: string;
  description: string;
}

export const extensionPointRegistry: ExtensionPoint[] = [];
