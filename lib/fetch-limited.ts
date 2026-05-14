// Edge-safe fetch with a hard byte cap. Streams the body so a slow/huge
// upstream can't exhaust Edge memory.

export class UpstreamTooLargeError extends Error {
  constructor(public readonly limit: number) {
    super(`upstream_too_large_${limit}`);
  }
}

export async function fetchText(
  url: string,
  init: RequestInit & { maxBytes?: number; timeoutMs?: number } = {},
): Promise<{ ok: boolean; status: number; text: string }> {
  const { maxBytes = 1_000_000, timeoutMs = 8_000, ...rest } = init;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...rest, signal: ctrl.signal });
    if (!res.ok || !res.body) {
      return { ok: res.ok, status: res.status, text: "" };
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        try { await reader.cancel(); } catch {}
        throw new UpstreamTooLargeError(maxBytes);
      }
      chunks.push(value);
    }
    const merged = new Uint8Array(received);
    let offset = 0;
    for (const c of chunks) { merged.set(c, offset); offset += c.byteLength; }
    return { ok: true, status: res.status, text: new TextDecoder().decode(merged) };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJson<T = unknown>(
  url: string,
  init?: RequestInit & { maxBytes?: number; timeoutMs?: number },
): Promise<{ ok: boolean; status: number; data: T | null }> {
  const r = await fetchText(url, init);
  if (!r.ok || !r.text) return { ok: r.ok, status: r.status, data: null };
  try {
    return { ok: true, status: r.status, data: JSON.parse(r.text) as T };
  } catch {
    return { ok: false, status: r.status, data: null };
  }
}
