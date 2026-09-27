import crypto from 'node:crypto';
import { config } from './config.js';
import { db } from './db.js';

export const SESSION_COOKIE = 'cl_session';
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, SCRYPT.keylen, SCRYPT);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, SCRYPT);
  return crypto.timingSafeEqual(expected, actual);
}

// Used to keep login timing uniform when the email does not exist.
const DUMMY_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));

export function authenticate(email, password) {
  const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email);
  const ok = verifyPassword(password, user ? user.password_hash : DUMMY_HASH);
  return ok && user ? { id: user.id, email: user.email } : null;
}

const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

const idleMs = () => config.sessionIdleMinutes * 60 * 1000;

function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/api',
    maxAge: idleMs(),
  });
}

export function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha256(token), userId, Date.now() + idleMs());
  setSessionCookie(res, token);
}

export function destroySession(req, res) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
  res.clearCookie(SESSION_COOKIE, { path: '/api', httpOnly: true, secure: config.cookieSecure, sameSite: 'strict' });
}

export function destroyOtherSessions(userId, req) {
  const token = req.cookies?.[SESSION_COOKIE] || '';
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, sha256(token));
}

export function purgeExpiredSessions() {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
}

/** Rejects requests without a valid session; activity pushes the idle expiry forward. */
export function requireAuth(req, res, next) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  const row = db
    .prepare(
      `SELECT u.id, u.email, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    )
    .get(sha256(token));
  if (!row || row.expires_at < Date.now()) return res.status(401).json({ error: 'Session expired' });
  db.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').run(Date.now() + idleMs(), sha256(token));
  setSessionCookie(res, token);
  req.user = { id: row.id, email: row.email };
  next();
}

/**
 * CSRF defence for state-changing admin requests: the session cookie is SameSite=Strict,
 * and we additionally require a custom header, which browsers will not send cross-origin
 * without a CORS preflight (and this API grants none).
 */
export function requireCsrfHeader(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('X-Requested-With') !== 'chosen-cms') return res.status(403).json({ error: 'Missing CSRF header' });
  next();
}
