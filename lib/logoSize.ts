export const DEFAULT_LOGO_SIZE = 56;
export const MIN_LOGO_SIZE = 32;
export const MAX_LOGO_SIZE = 120;

export function clampLogoSize(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_LOGO_SIZE;
  return Math.min(MAX_LOGO_SIZE, Math.max(MIN_LOGO_SIZE, Math.round(n)));
}
