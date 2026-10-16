export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_CSV_BYTES = 8 * 1024 * 1024;

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);

export function isCertificateImage(file: File): boolean {
  const name = file.name.toLowerCase();
  const extOk = name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp');
  return extOk || IMAGE_TYPES.has(file.type);
}

export function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'application/vnd.ms-excel';
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function sanitizeFileNameBase(raw: string): string {
  const trimmed = raw.trim().slice(0, 120);
  if (!trimmed) return '';
  const withoutInvalid = trimmed.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_');
  const collapsed = withoutInvalid.replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return collapsed || '';
}

export function makeUniqueBaseName(tracker: Map<string, number>, base: string): string {
  const next = (tracker.get(base) ?? 0) + 1;
  tracker.set(base, next);
  if (next === 1) return base;
  return `${base}_${next}`;
}
