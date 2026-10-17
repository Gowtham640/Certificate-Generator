import { NextResponse } from 'next/server';
import { getSessionUser } from '@/app/lib/mailer/session';
import { mailerDb } from '@/app/lib/mailer/supabase';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const { data, error } = await mailerDb()
    .from('campaigns')
    .select('id, subject, content, recipients, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = (await request.json()) as {
    subject?: string;
    content?: string;
    recipients?: string[];
  };
  const recipients = Array.isArray(body.recipients)
    ? body.recipients.map((e) => String(e).toLowerCase()).filter(Boolean)
    : [];
  const { data, error } = await mailerDb()
    .from('campaigns')
    .insert({
      user_id: user.id,
      subject: String(body.subject ?? ''),
      content: String(body.content ?? ''),
      recipients,
    })
    .select('id, subject, content, recipients, created_at, updated_at')
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not save.' }, { status: 500 });
  return NextResponse.json({ campaign: data });
}
