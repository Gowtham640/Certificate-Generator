export const CAMPAIGN_COLUMNS =
  'id, subject, content, recipients, from_name, from_email, reply_to, csv_headers, recipient_rows, merge_mapping, created_at, updated_at';

export type CampaignDraft = {
  id: string;
  subject: string;
  content: string;
  recipients: string[];
  from_name: string;
  from_email: string;
  reply_to: string;
  csv_headers: string[];
  recipient_rows: Record<string, string>[];
  merge_mapping: Record<string, string>;
  created_at?: string;
  updated_at?: string;
};

export function asDraft(row: Record<string, unknown>): CampaignDraft {
  return {
    id: String(row.id),
    subject: String(row.subject ?? ''),
    content: String(row.content ?? ''),
    recipients: Array.isArray(row.recipients) ? row.recipients.map((e) => String(e)) : [],
    from_name: String(row.from_name ?? ''),
    from_email: String(row.from_email ?? ''),
    reply_to: String(row.reply_to ?? ''),
    csv_headers: Array.isArray(row.csv_headers) ? row.csv_headers.map((h) => String(h)) : [],
    recipient_rows: Array.isArray(row.recipient_rows)
      ? (row.recipient_rows as Record<string, string>[])
      : [],
    merge_mapping:
      row.merge_mapping && typeof row.merge_mapping === 'object'
        ? (row.merge_mapping as Record<string, string>)
        : {},
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}
