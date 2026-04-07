export const toUpperTrim = (v: unknown): string =>
  typeof v === 'string' ? v.toUpperCase().trim() : '';

export const toLowerTrim = (v: unknown): string =>
  typeof v === 'string' ? v.toLowerCase().trim() : '';

export const toTrim = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : '';
