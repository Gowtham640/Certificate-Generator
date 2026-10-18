import { NextResponse } from 'next/server';
import { dispatchPlunk, type DispatchInput } from '@/app/lib/mailer/dispatch-plunk';
import { getSessionUser } from '@/app/lib/mailer/session';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  const body = (await request.json()) as DispatchInput & {
    recipients?: string[];
    recipient_rows?: Record<string, string>[];
  };
  const result = await dispatchPlunk({
    ...body,
    emails: body.emails ?? body.recipients,
    rows: body.rows ?? body.recipient_rows,
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ sent: result.sent, failed: result.failed });
}
