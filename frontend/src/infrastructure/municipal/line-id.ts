/** Derives the stable app line ID used by favorites, e.g. `PSA 1` → `line-psa1`, `C3d` → `line-c3d`. */
export function toLineId(lineCode: string): string {
  const slug = lineCode
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  return `line-${slug}`;
}

export function splitLineCodes(value: string): string[] {
  return value.split(',').map((code) => code.trim()).filter((code) => code.length > 0);
}
