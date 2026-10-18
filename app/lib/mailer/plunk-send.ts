export type PlunkSendInput = {
  to: string;
  subject: string;
  body: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
};

export async function sendPlunkEmail(input: PlunkSendInput): Promise<void> {
  const base = process.env.PLUNK_API_URL?.replace(/\/$/, '');
  const key = process.env.PLUNK_SECRET_KEY;
  if (!base || !key) {
    throw new Error('Set PLUNK_API_URL and PLUNK_SECRET_KEY in .env to send test mail.');
  }
  const res = await fetch(`${base}/v1/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      to: input.to,
      subject: input.subject,
      body: input.body,
      from: input.fromEmail,
      name: input.fromName,
      reply: input.replyTo || input.fromEmail,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Plunk send failed (${res.status}).`);
  }
}
