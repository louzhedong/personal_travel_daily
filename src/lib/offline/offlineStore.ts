export interface OfflineSnapshot<T> {
  data: T;
  syncedAt: string;
}

export function createOfflineSnapshot<T>(data: T): OfflineSnapshot<T> {
  return { data, syncedAt: new Date().toISOString() };
}
