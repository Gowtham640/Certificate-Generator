import { NextResponse } from 'next/server';
import { dispatchPlunk } from '@/app/lib/mailer/dispatch-plunk';
import { getSessionUser } from '@/app/lib/mailer/session';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = (await request.json()) as Parameters<typeof dispatchPlunk>[0];
  const result = await dispatchPlunk(body, 25);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ sent: result.sent, failed: result.failed });
}
