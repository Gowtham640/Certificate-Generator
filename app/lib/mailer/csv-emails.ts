import Papa from 'papaparse';

const EMAIL_HEADER = /^(e-?mail|mail)$/i;
const EMAIL_VALUE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailsFromCsvText(text: string): { emails: string[]; column: string } {
  const parsed = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true });
  const rows = (parsed.data || []).map((row) => row.map((cell) => String(cell ?? '').trim()));
  if (rows.length < 2 || !rows[0]?.length) {
    throw new Error('Need a header row and at least one data row.');
  }
  const headers = rows[0];
  let index = headers.findIndex((h) => EMAIL_HEADER.test(h));
  if (index < 0) {
    const scores = headers.map((_, col) =>
      rows.slice(1).reduce((n, row) => n + (EMAIL_VALUE.test(row[col] ?? '') ? 1 : 0), 0),
    );
    const best = scores.indexOf(Math.max(...scores));
    if (best < 0 || scores[best] === 0) {
      throw new Error('No email column found. Name a column email, or put addresses in one column.');
    }
    index = best;
  }
  const emails = Array.from(
    new Set(
      rows
        .slice(1)
        .map((row) => (row[index] ?? '').toLowerCase())
        .filter((value) => EMAIL_VALUE.test(value)),
    ),
  );
  if (emails.length === 0) {
    throw new Error('The email column has no valid addresses.');
  }
  return { emails, column: headers[index] || 'email' };
}
