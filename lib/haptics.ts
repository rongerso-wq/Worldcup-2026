// Lightweight haptics wrapper.
// `navigator.vibrate` is iOS Safari–unsupported but the call is a silent no-op there,
// so we never need to feature-detect on the caller side. Respects prefers-reduced-motion.

let allowed: boolean | null = null;

function isAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (allowed !== null) return allowed;
  try {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    allowed = !(mq && mq.matches);
  } catch {
    allowed = true;
  }
  return allowed;
}

function buzz(pattern: number | number[]) {
  if (!isAllowed()) return;
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (!nav || typeof nav.vibrate !== "function") return;
  try { nav.vibrate(pattern); } catch {}
}

export const haptics = {
  tap:    () => buzz(8),
  pick:   () => buzz(14),
  select: () => buzz([10, 30, 22]),
  goal:   () => buzz([24, 60, 24, 60, 60]),
};
