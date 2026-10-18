/**
 * Plunk POST /v1/send (secret key).
 * Required without a template: to, subject, body, from.
 * Optional we use: reply.
 * Not used: template, subscribed, data, headers, attachments.
 * Prefer from: { name, email }. Do not send deprecated top-level name.
 * Docs: https://docs.useplunk.com/api-reference/public-api/sendEmail
 */

import { htmlHasText, plunkSubject } from '@/app/lib/mailer/html-text';

export type PlunkRecipient = string | { name?: string; email: string };

export type PlunkSendPayload = {
  to: PlunkRecipient;
  subject: string;
  body: string;
  from: { name: string; email: string };
  reply?: string;
};

function plunkErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string };
      message?: string;
    };
    return parsed.error?.message || parsed.message || raw;
  } catch {
    return raw;
  }
}

export async function sendPlunkEmail(input: PlunkSendPayload): Promise<void> {
  const base = process.env.PLUNK_API_URL?.replace(/\/$/, '');
  const key = process.env.PLUNK_API_KEY;
  if (!base || !key) {
    throw new Error('Set PLUNK_API_URL and PLUNK_API_KEY in .env to send mail.');
  }

  const subject = plunkSubject(input.subject);
  if (!subject || !htmlHasText(input.body)) {
    throw new Error('Plunk requires subject and HTML body when no template is used.');
  }

  const payload: PlunkSendPayload = {
    to: input.to,
    subject,
    body: input.body,
    from: {
      name: input.from.name.trim(),
      email: input.from.email.toLowerCase(),
    },
  };
  if (input.reply) payload.reply = input.reply.toLowerCase();

  const res = await fetch(`${base}/v1/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(plunkErrorMessage(text) || `Plunk send failed (${res.status}).`);
  }
}
