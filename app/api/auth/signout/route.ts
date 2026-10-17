import { NextResponse } from 'next/server';
import { clearSession } from '@/app/lib/mailer/session';

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
