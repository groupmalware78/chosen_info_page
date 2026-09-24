import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { db } from './db.js';
import { seed } from './seed.js';
import { purgeExpiredSessions } from './auth.js';
import { getPublicContent } from './content.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { googleFontsHref, themeToCss } from '../shared/constants.js';

seed();
purgeExpiredSessions();
setInterval(purgeExpiredSessions, 60 * 60 * 1000).unref();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // Inline style is needed for the server-injected theme variables.
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        frameSrc: ['https://www.google.com'],
        connectSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: config.isProd && config.cookieSecure ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '200kb' }));

app.get('/healthz', (req, res) => {
  db.prepare('SELECT 1').get();
  res.json({ ok: true });
});

app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

app.use(
  '/uploads',
  express.static(path.join(config.dataDir, 'uploads'), {
    maxAge: '30d',
    immutable: true,
    setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
  }),
);

// ---------- Front-end (production build) ----------

const indexFile = path.join(config.distDir, 'index.html');
if (fs.existsSync(indexFile)) {
  const template = fs.readFileSync(indexFile, 'utf8');
  const escapeHtml = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // Server-render the theme, SEO tags and initial content so the first paint is already on-brand.
  const renderIndex = (isAdmin) => {
    const content = getPublicContent();
    const site = content.site || {};
    const title = isAdmin ? `Admin · ${site.shortName || site.companyName || 'CMS'}` : site.seoTitle || site.companyName || '';
    const head = [
      `<title>${escapeHtml(title)}</title>`,
      `<meta name="description" content="${escapeHtml(site.seoDescription)}">`,
      `<meta property="og:title" content="${escapeHtml(title)}">`,
      `<meta property="og:description" content="${escapeHtml(site.seoDescription)}">`,
      `<meta property="og:type" content="website">`,
      site.logoUrl ? `<link rel="icon" href="${escapeHtml(site.logoUrl)}">` : '',
      isAdmin ? '<meta name="robots" content="noindex">' : '',
      `<link rel="stylesheet" href="${escapeHtml(googleFontsHref(content.theme))}">`,
      `<style id="theme-vars">${themeToCss(content.theme)}</style>`,
    ].join('\n    ');
    const data = isAdmin
      ? ''
      : `<script id="__INITIAL_CONTENT__" type="application/json">${JSON.stringify(content).replace(/</g, '\\u003c')}</script>`;
    return template.replace(/<title>.*?<\/title>/, '').replace('<!--app-head-->', head).replace('<!--app-data-->', data);
  };

  app.use(
    '/assets',
    express.static(path.join(config.distDir, 'assets'), { maxAge: '1y', immutable: true, fallthrough: false }),
  );
  app.use(express.static(config.distDir, { index: false, maxAge: '1h' }));

  app.get(/^\/(?!api\/|uploads\/).*/, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.type('html').send(renderIndex(req.path.startsWith('/admin')));
  });
} else if (config.isProd) {
  console.warn('dist/ not found. Run `npm run build` before `npm start`.');
}

// ---------- Errors ----------

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  if (err.status === 404) return res.status(404).end();
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const server = app.listen(config.port, (err) => {
  // Express 5 passes listen errors (e.g. port in use) here instead of throwing.
  if (err) {
    console.error(err.code === 'EADDRINUSE' ? `Port ${config.port} is already in use. Set PORT to a free port.` : err);
    process.exit(1);
  }
  console.log(`Chosen Logistics running on http://localhost:${config.port} (${config.isProd ? 'production' : 'development'})`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
