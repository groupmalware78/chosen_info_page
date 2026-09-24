import nodemailer from 'nodemailer';
import { config } from './config.js';

const { smtp } = config;
const transport = smtp.host
  ? nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    })
  : null;

/** Emails a new enquiry to the office. No-op when SMTP is not configured. */
export async function notifyNewMessage(msg, fallbackTo) {
  const to = smtp.notifyTo || fallbackTo;
  if (!transport || !to) return;
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
    await transport.sendMail({
      from: smtp.from || smtp.user,
      to,
      replyTo: msg.email,
      subject: `New website enquiry from ${msg.name.replace(/[\r\n]/g, ' ')}`,
      text: lines.join('\n'),
    });
  } catch (err) {
    console.error('[mailer] Failed to send enquiry notification:', err.message);
  }
}
