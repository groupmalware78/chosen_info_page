// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='new-strong-pass' npm run reset-admin
import { config } from './config.js';
import { db } from './db.js';
import { hashPassword } from './auth.js';

if (!config.adminPassword || config.adminPassword.length < 10) {
  console.error('Set ADMIN_PASSWORD (10+ characters) to reset the admin account.');
  process.exit(1);
}

const hash = hashPassword(config.adminPassword);
const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(config.adminEmail);
if (existing) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, existing.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(existing.id);
  console.log(`Password reset for ${config.adminEmail}. All sessions signed out.`);
} else {
  db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(config.adminEmail, hash);
  console.log(`Admin user ${config.adminEmail} created.`);
}
