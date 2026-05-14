type Entry<T> = { value: T; expires: number };
const store = new Map<string, Entry<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await loader();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export function bust(prefix?: string) {
  if (!prefix) return store.clear();
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
