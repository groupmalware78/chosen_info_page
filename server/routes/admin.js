import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { config } from '../config.js';
import { db, getSetting, setSetting, transaction } from '../db.js';
import {
  authenticate,
  createSession,
  destroyOtherSessions,
  destroySession,
  hashPassword,
  requireAuth,
  requireCsrfHeader,
  verifyPassword,
} from '../auth.js';
import {
  CONTENT_KEYS,
  collectionSchemas,
  contentSchemas,
  fieldErrors,
  loginSchema,
  passwordSchema,
} from '../schemas.js';

export const adminRouter = Router();
adminRouter.use(requireCsrfHeader);
adminRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const plain = (v) => JSON.parse(JSON.stringify(v));
const badRequest = (res, error) => res.status(400).json({ error: 'Validation failed', fields: fieldErrors(error) });
const parseId = (v) => (/^\d+$/.test(v) ? Number(v) : null);

// ---------- Auth ----------

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

adminRouter.post('/auth/login', loginLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password' });
  const user = authenticate(parsed.data.email, parsed.data.password);
  if (!user) return res.status(401).json({ error: 'Incorrect email or password' });
  createSession(res, user.id);
  res.json({ user });
});

adminRouter.post('/auth/logout', (req, res) => {
  destroySession(req, res);
  res.json({ ok: true });
});

adminRouter.use(requireAuth);

adminRouter.get('/auth/me', (req, res) => res.json({ user: req.user }));

adminRouter.post('/auth/password', (req, res) => {
  const parsed = passwordSchema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, parsed.error);
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!verifyPassword(parsed.data.currentPassword, row.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect', fields: { currentPassword: 'Incorrect password' } });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(parsed.data.newPassword), req.user.id);
  destroyOtherSessions(req.user.id, req);
  res.json({ ok: true });
});

// ---------- Dashboard ----------

adminRouter.get('/stats', (req, res) => {
  const count = (sql) => db.prepare(sql).get().n;
  res.json({
    services: count('SELECT COUNT(*) AS n FROM services'),
    faqs: count('SELECT COUNT(*) AS n FROM faqs'),
    rates: count('SELECT COUNT(*) AS n FROM rates'),
    messages: count('SELECT COUNT(*) AS n FROM messages'),
    unread: count('SELECT COUNT(*) AS n FROM messages WHERE is_read = 0'),
    recent: plain(db.prepare('SELECT id, name, email, message, is_read, created_at FROM messages ORDER BY id DESC LIMIT 5').all()),
  });
});

// ---------- Singleton content sections ----------

adminRouter.get('/content', (req, res) => {
  const out = {};
  for (const key of CONTENT_KEYS) out[key] = getSetting(key) ?? {};
  res.json(out);
});

adminRouter.put('/content/:key', (req, res) => {
  const schema = contentSchemas[req.params.key];
  if (!schema) return res.status(404).json({ error: 'Unknown section' });
  const parsed = schema.safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, parsed.error);
  setSetting(req.params.key, parsed.data);
  res.json(parsed.data);
});

// ---------- Collections: services, faqs, rates ----------

const COLLECTIONS = Object.keys(collectionSchemas);

adminRouter.param('collection', (req, res, next, name) => {
  if (!COLLECTIONS.includes(name)) return res.status(404).json({ error: 'Unknown collection' });
  next();
});

adminRouter.get('/collections/:collection', (req, res) => {
  const table = req.params.collection;
  res.json(plain(db.prepare(`SELECT * FROM ${table} ORDER BY sort_order, id`).all()));
});

adminRouter.post('/collections/:collection', (req, res) => {
  const table = req.params.collection;
  const parsed = collectionSchemas[table].safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, parsed.error);
  const data = parsed.data;
  if (req.body?.sort_order === undefined) {
    data.sort_order = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM ${table}`).get().n;
  }
  const cols = Object.keys(data);
  const info = db
    .prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`)
    .run(...cols.map((c) => data[c]));
  res.status(201).json(plain(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid)));
});

adminRouter.put('/collections/:collection/:id', (req, res) => {
  const table = req.params.collection;
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Not found' });
  const parsed = collectionSchemas[table].safeParse(req.body ?? {});
  if (!parsed.success) return badRequest(res, parsed.error);
  const cols = Object.keys(parsed.data);
  const info = db
    .prepare(`UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
    .run(...cols.map((c) => parsed.data[c]), id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json(plain(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id)));
});

adminRouter.delete('/collections/:collection/:id', (req, res) => {
  const id = parseId(req.params.id);
  const info = id ? db.prepare(`DELETE FROM ${req.params.collection} WHERE id = ?`).run(id) : { changes: 0 };
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

adminRouter.post('/collections/:collection/reorder', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isInteger) : [];
  const stmt = db.prepare(`UPDATE ${req.params.collection} SET sort_order = ? WHERE id = ?`);
  transaction(() => ids.forEach((id, idx) => stmt.run(idx, id)));
  res.json({ ok: true });
});

// ---------- Messages ----------

adminRouter.get('/messages', (req, res) => {
  const pageSize = 20;
  const page = Math.max(1, Number(req.query.page) || 1);
  const filter = req.query.filter === 'unread' ? 'WHERE is_read = 0' : '';
  const total = db.prepare(`SELECT COUNT(*) AS n FROM messages ${filter}`).get().n;
  const items = db
    .prepare(`SELECT * FROM messages ${filter} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(pageSize, (page - 1) * pageSize);
  res.json({ items: plain(items), total, page, pages: Math.max(1, Math.ceil(total / pageSize)) });
});

adminRouter.patch('/messages/:id', (req, res) => {
  const id = parseId(req.params.id);
  const info = id ? db.prepare('UPDATE messages SET is_read = ? WHERE id = ?').run(req.body?.is_read ? 1 : 0, id) : { changes: 0 };
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

adminRouter.delete('/messages/:id', (req, res) => {
  const id = parseId(req.params.id);
  const info = id ? db.prepare('DELETE FROM messages WHERE id = ?').run(id) : { changes: 0 };
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

adminRouter.get('/messages.csv', (req, res) => {
  const rows = db.prepare('SELECT id, created_at, name, email, phone, company, service, message, is_read FROM messages ORDER BY id DESC').all();
  // Quote every cell and neutralise spreadsheet formula injection.
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = ['id', 'created_at', 'name', 'email', 'phone', 'company', 'service', 'message', 'is_read'];
  const csv = [header.join(','), ...rows.map((r) => header.map((h) => cell(r[h])).join(','))].join('\r\n');
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="enquiries.csv"');
  res.send(`﻿${csv}`);
});

// ---------- Media uploads ----------

const uploadDir = path.join(config.dataDir, 'uploads');
const IMAGE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// Verify the file really is the image type it claims (SVG is deliberately excluded: it can carry script).
function sniffImage(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.subarray(0, 3).toString() === 'GIF') return 'image/gif';
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

adminRouter.post('/uploads', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  const type = sniffImage(req.file.buffer);
  if (!type) return res.status(400).json({ error: 'Only JPEG, PNG, WebP or GIF images are allowed' });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${IMAGE_TYPES[type]}`;
  fs.writeFileSync(path.join(uploadDir, name), req.file.buffer);
  res.status(201).json({ url: `/uploads/${name}`, name, size: req.file.size });
});

adminRouter.get('/uploads', (req, res) => {
  const files = fs
    .readdirSync(uploadDir)
    .filter((f) => /^[\w.-]+\.(jpg|png|webp|gif)$/.test(f))
    .map((name) => {
      const stat = fs.statSync(path.join(uploadDir, name));
      return { name, url: `/uploads/${name}`, size: stat.size, created: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.created.localeCompare(a.created));
  res.json(files);
});

adminRouter.delete('/uploads/:name', (req, res) => {
  const name = req.params.name;
  if (!/^[\w.-]+$/.test(name) || name.startsWith('.')) return res.status(400).json({ error: 'Invalid file name' });
  const file = path.join(uploadDir, name);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(file);
  res.json({ ok: true });
});

// Multer / body errors -> JSON
adminRouter.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : err.message });
  }
  next(err);
});
