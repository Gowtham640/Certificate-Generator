import { NextResponse } from 'next/server';
import { asDraft, CAMPAIGN_COLUMNS } from '@/app/lib/mailer/campaign-fields';
import { getSessionUser } from '@/app/lib/mailer/session';
import { mailerDb } from '@/app/lib/mailer/supabase';

function payloadFromBody(body: Record<string, unknown>) {
  const recipients = Array.isArray(body.recipients)
    ? body.recipients.map((e) => String(e).toLowerCase()).filter(Boolean)
    : [];
  return {
    subject: String(body.subject ?? ''),
    content: String(body.content ?? ''),
    recipients,
    from_name: String(body.from_name ?? ''),
    from_email: String(body.from_email ?? '').toLowerCase(),
    reply_to: String(body.reply_to ?? '').toLowerCase(),
    csv_headers: Array.isArray(body.csv_headers) ? body.csv_headers.map((h) => String(h)) : [],
    recipient_rows: Array.isArray(body.recipient_rows) ? body.recipient_rows : [],
    merge_mapping:
      body.merge_mapping && typeof body.merge_mapping === 'object' ? body.merge_mapping : {},
  };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { data, error } = await mailerDb()
    .from('campaigns')
    .select(CAMPAIGN_COLUMNS)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: (data ?? []).map((row) => asDraft(row as Record<string, unknown>)) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const { data, error } = await mailerDb()
    .from('campaigns')
    .insert({ user_id: user.id, ...payloadFromBody(body) })
    .select(CAMPAIGN_COLUMNS)
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not save.' }, { status: 500 });
  return NextResponse.json({ campaign: asDraft(data as Record<string, unknown>) });
}
