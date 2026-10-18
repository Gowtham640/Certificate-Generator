import { NextResponse } from 'next/server';
import { asDraft, CAMPAIGN_COLUMNS } from '@/app/lib/mailer/campaign-fields';
import { getSessionUser } from '@/app/lib/mailer/session';
import { mailerDb } from '@/app/lib/mailer/supabase';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  const { data, error } = await mailerDb()
    .from('campaigns')
    .select(CAMPAIGN_COLUMNS)
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
  return NextResponse.json({ campaign: asDraft(data as Record<string, unknown>) });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.subject === 'string') patch.subject = body.subject;
  if (typeof body.content === 'string') patch.content = body.content;
  if (Array.isArray(body.recipients)) {
    patch.recipients = body.recipients.map((e) => String(e).toLowerCase()).filter(Boolean);
  }
  if (typeof body.from_name === 'string') patch.from_name = body.from_name;
  if (typeof body.from_email === 'string') patch.from_email = body.from_email.toLowerCase();
  if (typeof body.reply_to === 'string') patch.reply_to = body.reply_to.toLowerCase();
  if (Array.isArray(body.csv_headers)) patch.csv_headers = body.csv_headers.map((h) => String(h));
  if (Array.isArray(body.recipient_rows)) patch.recipient_rows = body.recipient_rows;
  if (body.merge_mapping && typeof body.merge_mapping === 'object') patch.merge_mapping = body.merge_mapping;
  const { data, error } = await mailerDb()
    .from('campaigns')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(CAMPAIGN_COLUMNS)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
  return NextResponse.json({ campaign: asDraft(data as Record<string, unknown>) });
}
