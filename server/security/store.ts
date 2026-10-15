export interface Mutation<T> { value: T; writes?: Record<string, unknown> }
export interface TrustedStore {
  read(path: string): Promise<any | undefined>;
  transact<T>(paths: string[], update: (documents: Record<string, any>) => Mutation<T>): Promise<T>;
}
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export interface Principal { uid: string; anonymous: boolean; name?: string; email?: string }
