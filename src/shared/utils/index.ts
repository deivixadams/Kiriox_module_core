export function notImplemented(scope: string): never {
  throw new Error(`${scope} is not implemented yet.`);
}

export * from './http-responses';
export * from './next-handler';
