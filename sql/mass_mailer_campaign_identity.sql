-- Sender identity + CSV rows for campaign drafts (schema mass_mailer).
ALTER TABLE mass_mailer.campaigns
  ADD COLUMN IF NOT EXISTS from_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS from_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reply_to text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS csv_headers jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recipient_rows jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS merge_mapping jsonb NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
