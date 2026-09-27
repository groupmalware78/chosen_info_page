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
  // Admin sessions expire after this many minutes without activity.
  sessionIdleMinutes: Number(process.env.SESSION_IDLE_MINUTES) || 15,
  adminEmail: process.env.ADMIN_EMAIL || 'admin@chosenlogistics.com',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  mail: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.CONTACT_FROM || 'Chosen Logistics Website <no-reply@chosenlogistics.com>',
    notifyTo: process.env.CONTACT_NOTIFY_TO || '',
  },
  // Overall per-IP request budget for /api, on top of the stricter login and contact limits.
  apiRateLimit: Number(process.env.API_RATE_LIMIT) || 300,
};
