import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  isProd,
  root,
  port: Number(process.env.PORT) || 3000,
  dataDir: path.resolve(root, process.env.DATA_DIR || 'data'),
  distDir: path.join(root, 'dist'),
  // Set TRUST_PROXY=1 when running behind a reverse proxy (nginx, Render, Fly, etc.)
  trustProxy: process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : false,
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd,
  sessionDays: Number(process.env.SESSION_DAYS) || 7,
  adminEmail: process.env.ADMIN_EMAIL || 'admin@chosenlogistics.com',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
    notifyTo: process.env.CONTACT_NOTIFY_TO || '',
  },
};
