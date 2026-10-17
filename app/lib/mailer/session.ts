import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/app/lib/mailer/constants';
import { mailerDb } from '@/app/lib/mailer/supabase';

const SESSION_DAYS = 7;

export type MailerUser = { id: string; email: string };

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const { error } = await mailerDb().from('sessions').insert({
    user_id: userId,
    token_hash: hashToken(token),
    expires_at: expires.toISOString(),
  });
  if (error) throw new Error(error.message);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires,
    secure: process.env.NODE_ENV === 'production',
  });
  return token;
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await mailerDb().from('sessions').delete().eq('token_hash', hashToken(token));
  }
  jar.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export async function getSessionUser(): Promise<MailerUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { data, error } = await mailerDb()
    .from('sessions')
    .select('user_id, expires_at, users ( id, email )')
    .eq('token_hash', hashToken(token))
    .maybeSingle();
  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await mailerDb().from('sessions').delete().eq('token_hash', hashToken(token));
    return null;
  }
  const nested = data.users as { id: string; email: string } | { id: string; email: string }[] | null;
  const user = Array.isArray(nested) ? nested[0] : nested;
  if (!user) return null;
  return { id: user.id, email: user.email };
}
