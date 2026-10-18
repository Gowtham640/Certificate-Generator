import { NextResponse } from 'next/server';
import { applyMerge, autoMapTokens, isEmailAddress, mergeTokensFromText } from '@/app/lib/mailer/csv-emails';
import { sendPlunkEmail } from '@/app/lib/mailer/plunk-send';
import { getSessionUser } from '@/app/lib/mailer/session';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });

  const body = (await request.json()) as {
    subject?: string;
    content?: string;
    from_name?: string;
    from_email?: string;
    reply_to?: string;
    csv_headers?: string[];
    merge_mapping?: Record<string, string>;
    rows?: Record<string, string>[];
    emails?: string[];
  };

  const fromEmail = String(body.from_email ?? '').toLowerCase();
  const fromName = String(body.from_name ?? '');
  const replyTo = String(body.reply_to ?? fromEmail).toLowerCase();
  const subject = String(body.subject ?? '');
  const content = String(body.content ?? '');
  const headers = Array.isArray(body.csv_headers) ? body.csv_headers.map(String) : [];
  const tokens = mergeTokensFromText(`${subject}\n${content}`);
  const { mapping, missing } = autoMapTokens(tokens, headers, body.merge_mapping ?? {});
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Unmapped merge fields: ${missing.map((t) => `{{${t}}}`).join(', ')}` },
      { status: 400 },
    );
  }
  if (!isEmailAddress(fromEmail) || !isEmailAddress(replyTo)) {
    return NextResponse.json({ error: 'From email and reply-to must be valid addresses.' }, { status: 400 });
  }

  const rows = Array.isArray(body.rows) ? body.rows : [];
  const emails = Array.isArray(body.emails)
    ? body.emails.map((e) => e.toLowerCase()).filter(isEmailAddress)
    : [];
  const jobs =
    rows.length > 0
      ? rows
      : emails.map((email) => ({ email }));

  if (jobs.length === 0) {
    return NextResponse.json({ error: 'Add at least one test recipient.' }, { status: 400 });
  }
  if (jobs.length > 25) {
    return NextResponse.json({ error: 'Test send is capped at 25 addresses.' }, { status: 400 });
  }

  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  for (const row of jobs) {
    const email = String(row.email ?? row.Email ?? '').toLowerCase();
    if (!isEmailAddress(email)) {
      failed.push({ email: email || '(empty)', error: 'Not an email.' });
      continue;
    }
    try {
      await sendPlunkEmail({
        to: email,
        subject: applyMerge(subject, row, mapping),
        body: applyMerge(content, row, mapping),
        fromEmail,
        fromName,
        replyTo,
      });
      sent.push(email);
    } catch (err) {
      failed.push({ email, error: err instanceof Error ? err.message : 'Send failed.' });
    }
  }

  return NextResponse.json({ sent, failed });
}
