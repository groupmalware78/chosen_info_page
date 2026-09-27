import { config } from './config.js';

const { mail } = config;

/** Emails a new enquiry to the office via Resend. No-op when RESEND_API_KEY is not set. */
export async function notifyNewMessage(msg, fallbackTo) {
  const to = mail.notifyTo || fallbackTo;
  if (!mail.resendApiKey || !to) return;
  const lines = [
    `Name: ${msg.name}`,
    `Email: ${msg.email}`,
    msg.phone && `Phone: ${msg.phone}`,
    msg.company && `Company: ${msg.company}`,
    msg.service && `Service: ${msg.service}`,
    '',
    msg.message,
  ].filter((l) => l !== false && l !== '');
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${mail.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: mail.from,
        to: [to],
        reply_to: msg.email,
        subject: `New website enquiry from ${msg.name.replace(/[\r\n]/g, ' ')}`,
        text: lines.join('\n'),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error('[mailer] Failed to send enquiry notification:', err.message);
  }
}
