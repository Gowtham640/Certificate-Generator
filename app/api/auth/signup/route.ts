import { NextResponse } from 'next/server';
import { hashPassword } from '@/app/lib/mailer/password';
import { createSession } from '@/app/lib/mailer/session';
import { mailerDb } from '@/app/lib/mailer/supabase';

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!email.includes('@') || password.length < 8) {
    return NextResponse.json({ error: 'Email and a password of at least 8 characters are required.' }, { status: 400 });
  }
  const db = mailerDb();
  const { data: existing } = await db.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) {
    return NextResponse.json({ error: 'That email already has an account.' }, { status: 409 });
  }
  const { data, error } = await db
    .from('users')
    .insert({ email, password_hash: await hashPassword(password) })
    .select('id, email')
    .single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create the account.' }, { status: 500 });
  }
  await createSession(data.id);
  return NextResponse.json({ user: { id: data.id, email: data.email } });
}
