export function normalizeIso(value: string, label: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${label} must be a valid date`);
  }
  return new Date(parsed).toISOString();
}

export function optionalIso(
  value: string | undefined,
  label: string,
): string | undefined {
  if (!value) return undefined;
  return normalizeIso(value, label);
}
