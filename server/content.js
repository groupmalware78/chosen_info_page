import { db, getSetting } from './db.js';
import { CONTENT_KEYS } from './schemas.js';

/** Everything the public site needs, in a single payload. */
export function getPublicContent() {
  const content = {};
  for (const key of CONTENT_KEYS) content[key] = getSetting(key) ?? {};

  content.services = db
    .prepare('SELECT id, title, description, icon FROM services WHERE published = 1 ORDER BY sort_order, id')
    .all();
  content.faqs = db.prepare('SELECT id, question, answer FROM faqs WHERE published = 1 ORDER BY sort_order, id').all();
  content.rates = db
    .prepare(
      `SELECT id, origin, destination, mode, unit, price, currency, min_charge, transit_time, notes
       FROM rates WHERE published = 1 ORDER BY sort_order, id`,
    )
    .all();

  // node:sqlite returns null-prototype rows; normalise for JSON consumers.
  return JSON.parse(JSON.stringify(content));
}
