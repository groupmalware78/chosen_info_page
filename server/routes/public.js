import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db, getSetting } from '../db.js';
import { getPublicContent } from '../content.js';
import { contactSchema, fieldErrors } from '../schemas.js';
import { notifyNewMessage } from '../mailer.js';

export const publicRouter = Router();

publicRouter.get('/content', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json(getPublicContent());
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many messages. Please try again later or call us directly.' },
});

publicRouter.post('/contact', contactLimiter, (req, res) => {
  const parsed = contactSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'Please check the form', fields: fieldErrors(parsed.error) });

  const { website, ...msg } = parsed.data;
  // Honeypot filled: pretend success so bots learn nothing.
  if (website) return res.status(201).json({ ok: true });

  db.prepare(
    'INSERT INTO messages (name, email, phone, company, service, message, ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(msg.name, msg.email, msg.phone, msg.company, msg.service, msg.message, req.ip || '');

  notifyNewMessage(msg, getSetting('site')?.email);
  res.status(201).json({ ok: true });
});
