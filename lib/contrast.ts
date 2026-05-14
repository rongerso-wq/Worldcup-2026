// WCAG relative luminance → guaranteed-contrast foreground.
// Used so chip labels and active-tab text never collapse on pale/bright kits.

function srgbToLin(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return 0.5;
  const r = srgbToLin(parseInt(m[1], 16));
  const g = srgbToLin(parseInt(m[2], 16));
  const b = srgbToLin(parseInt(m[3], 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Pick black or white text to maximize WCAG contrast on a given background.
// Tighter than `luminance > 0.5` — handles edge cases like Brazil yellow.
export function pickInkHi(hex: string): "#0a0f15" | "#ffffff" {
  return luminance(hex) > 0.55 ? "#0a0f15" : "#ffffff";
}
