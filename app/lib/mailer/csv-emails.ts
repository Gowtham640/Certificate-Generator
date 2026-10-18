import Papa from 'papaparse';

const EMAIL_HEADER = /^(e-?mail|mail)$/i;
export const EMAIL_VALUE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MERGE_TOKEN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

export type CsvTable = {
  headers: string[];
  rows: Record<string, string>[];
  emails: string[];
  emailColumn: string;
};

export function isEmailAddress(value: string): boolean {
  return EMAIL_VALUE.test(value.trim().toLowerCase());
}

export function emailsFromCsvText(text: string): { emails: string[]; column: string } {
  const table = parseCsvTable(text);
  return { emails: table.emails, column: table.emailColumn };
}

/** Method: Csv Header-Or-Shape Email Column — header email/mail, else the column with the most address-shaped cells. */
export function parseCsvTable(text: string): CsvTable {
  const parsed = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
  const grid = (parsed.data || []).map((row) => row.map((cell) => String(cell ?? '').trim()));
  if (grid.length < 2 || !grid[0]?.length) {
    throw new Error('Need a header row and at least one data row.');
  }
  const headers = grid[0].map((h, i) => h || `column_${i + 1}`);
  let index = headers.findIndex((h) => EMAIL_HEADER.test(h));
  if (index < 0) {
    const scores = headers.map((_, col) =>
      grid.slice(1).reduce((n, row) => n + (EMAIL_VALUE.test(row[col] ?? '') ? 1 : 0), 0),
    );
    const best = scores.indexOf(Math.max(...scores));
    if (best < 0 || scores[best] === 0) {
      throw new Error('No email column found. Name a column email, or put addresses in one column.');
    }
    index = best;
  }
  const emailColumn = headers[index] || 'email';
  const seen = new Map<string, Record<string, string>>();
  for (const line of grid.slice(1)) {
    const email = (line[index] ?? '').toLowerCase();
    if (!EMAIL_VALUE.test(email)) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, col) => {
      row[header] = line[col] ?? '';
    });
    row.email = email;
    seen.set(email, row);
  }
  const emails = Array.from(seen.keys());
  if (emails.length === 0) {
    throw new Error('The email column has no valid addresses.');
  }
  return { headers, rows: emails.map((email) => seen.get(email)!), emails, emailColumn };
}

/** Method: Mustache Token Scan — finds `{{column}}` names in subject and HTML content. */
export function mergeTokensFromText(text: string): string[] {
  const names = new Set<string>();
  const re = new RegExp(MERGE_TOKEN.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    names.add(match[1]);
  }
  return Array.from(names);
}

/**
 * Method: Auto Column Map By Token Name — `{{name}}` maps to CSV header `name` (case-insensitive).
 * Unmapped tokens stay in `missing` until the user remaps or removes them.
 */
export function autoMapTokens(
  tokens: string[],
  headers: string[],
  overrides: Record<string, string> = {},
): { mapping: Record<string, string>; missing: string[] } {
  const mapping: Record<string, string> = {};
  const missing: string[] = [];
  for (const token of tokens) {
    const override = overrides[token];
    if (override && headers.includes(override)) {
      mapping[token] = override;
      continue;
    }
    const hit = headers.find((header) => header.toLowerCase() === token.toLowerCase());
    if (hit) mapping[token] = hit;
    else missing.push(token);
  }
  return { mapping, missing };
}

/** Method: Merge Token Substitute — replaces `{{token}}` with the mapped CSV cell. */
export function applyMerge(
  template: string,
  row: Record<string, string>,
  mapping: Record<string, string>,
): string {
  return template.replace(new RegExp(MERGE_TOKEN.source, 'g'), (full, token: string) => {
    const column = mapping[token];
    if (!column) return full;
    return row[column] ?? '';
  });
}
