import { NextResponse } from 'next/server';
import { getSessionUser } from '@/app/lib/mailer/session';
import { mailerDb } from '@/app/lib/mailer/supabase';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  const { data, error } = await mailerDb()
    .from('campaigns')
    .select('id, subject, content, recipients, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
  return NextResponse.json({ campaign: data });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { id } = await params;
  const body = (await request.json()) as {
    subject?: string;
    content?: string;
    recipients?: string[];
  };
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.subject === 'string') patch.subject = body.subject;
  if (typeof body.content === 'string') patch.content = body.content;
  if (Array.isArray(body.recipients)) {
    patch.recipients = body.recipients.map((e) => String(e).toLowerCase()).filter(Boolean);
  }
  const { data, error } = await mailerDb()
    .from('campaigns')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, subject, content, recipients, created_at, updated_at')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
  return NextResponse.json({ campaign: data });
}
