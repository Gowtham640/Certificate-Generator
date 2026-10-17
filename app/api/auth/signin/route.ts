import { NextResponse } from 'next/server';
import { verifyPassword } from '@/app/lib/mailer/password';
import { createSession } from '@/app/lib/mailer/session';
import { mailerDb } from '@/app/lib/mailer/supabase';

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const { data, error } = await mailerDb()
    .from('users')
    .select('id, email, password_hash')
    .eq('email', email)
    .maybeSingle();
  if (error || !data || !(await verifyPassword(password, data.password_hash))) {
    return NextResponse.json({ error: 'Email or password is wrong.' }, { status: 401 });
  }
  await createSession(data.id);
  return NextResponse.json({ user: { id: data.id, email: data.email } });
}
