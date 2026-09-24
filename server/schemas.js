import { z } from 'zod';
import { FONTS, ICONS, MODES, UNITS } from '../shared/constants.js';

const text = (max = 200) => z.string().trim().max(max).default('');
const longText = (max = 5000) => z.string().trim().max(max).default('');
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex colour like #0b3d91');

// Links a CMS editor may enter: in-page anchors, site paths, web, mail and phone links.
const link = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^(#|\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(v), 'Must start with #, /, https://, mailto: or tel:')
  .default('');

// Images are either uploaded through the CMS or hosted elsewhere over https.
const image = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^\/uploads\/[\w.-]+$/.test(v) || /^https:\/\//i.test(v), 'Must be an uploaded image or https:// URL')
  .default('');

const cta = z.object({ label: text(60), href: link }).default({ label: '', href: '' });

export const contentSchemas = {
  site: z.object({
    companyName: text(120),
    shortName: text(40),
    tagline: text(160),
    logoUrl: image,
    email: z.union([z.literal(''), z.string().trim().email().max(200)]).default(''),
    phone: text(40),
    whatsapp: text(40),
    address: longText(400),
    hours: text(160),
    mapEmbedUrl: z
      .string()
      .trim()
      .max(1500)
      .refine((v) => v === '' || /^https:\/\/(www\.)?google\.com\/maps\/embed\?/.test(v), 'Must be a Google Maps embed URL')
      .default(''),
    socials: z
      .object({ facebook: link, instagram: link, linkedin: link, x: link, tiktok: link })
      .prefault({}),
    footerNote: text(300),
    seoTitle: text(120),
    seoDescription: text(300),
  }),

  hero: z.object({
    eyebrow: text(80),
    heading: text(160),
    subheading: longText(400),
    backgroundImage: image,
    primaryCta: cta,
    secondaryCta: cta,
    stats: z.array(z.object({ value: text(20), label: text(60) })).max(4).default([]),
  }),

  branding: z.object({
    eyebrow: text(80),
    heading: text(160),
    body: longText(1500),
    mission: longText(600),
    vision: longText(600),
    values: z.array(z.object({ title: text(60), text: longText(300) })).max(6).default([]),
  }),

  about: z.object({
    eyebrow: text(80),
    heading: text(160),
    body: longText(3000),
    image: image,
    badgeValue: text(20),
    badgeLabel: text(60),
    highlights: z.array(text(160)).max(8).default([]),
  }),

  sections: z.object({
    visibility: z
      .object({
        branding: z.boolean().default(true),
        about: z.boolean().default(true),
        services: z.boolean().default(true),
        rates: z.boolean().default(true),
        faqs: z.boolean().default(true),
        contact: z.boolean().default(true),
      })
      .prefault({}),
    services: z.object({ eyebrow: text(80), heading: text(160), subheading: longText(400) }).prefault({}),
    rates: z
      .object({
        eyebrow: text(80),
        heading: text(160),
        subheading: longText(400),
        disclaimer: longText(600),
        airKgPerCbm: z.coerce.number().min(1).max(1000).default(167),
        seaKgPerCbm: z.coerce.number().min(1).max(5000).default(1000),
        roadKgPerCbm: z.coerce.number().min(1).max(5000).default(333),
      })
      .prefault({}),
    faqs: z.object({ eyebrow: text(80), heading: text(160), subheading: longText(400) }).prefault({}),
    contact: z
      .object({ eyebrow: text(80), heading: text(160), subheading: longText(400), successMessage: text(300) })
      .prefault({}),
  }),

  legal: z.object({
    updatedAt: text(40),
    terms: longText(40000),
    privacy: longText(40000),
  }),

  theme: z.object({
    preset: text(40),
    primary: hex,
    accent: hex,
    background: hex,
    surface: hex,
    text: hex,
    muted: hex,
    border: hex,
    headingFont: z.enum(FONTS),
    bodyFont: z.enum(FONTS),
    radius: z.coerce.number().int().min(0).max(28),
    heroOverlay: z.coerce.number().int().min(0).max(95),
  }),
};

export const CONTENT_KEYS = Object.keys(contentSchemas);

const bool = z.union([z.boolean(), z.number()]).transform((v) => (v ? 1 : 0));

export const collectionSchemas = {
  services: z.object({
    title: z.string().trim().min(1).max(120),
    description: longText(1000),
    icon: z.enum(ICONS).default('box'),
    sort_order: z.coerce.number().int().default(0),
    published: bool.default(1),
  }),
  faqs: z.object({
    question: z.string().trim().min(1).max(300),
    answer: z.string().trim().min(1).max(3000),
    sort_order: z.coerce.number().int().default(0),
    published: bool.default(1),
  }),
  rates: z.object({
    origin: z.string().trim().min(1).max(120),
    destination: z.string().trim().min(1).max(120),
    mode: z.enum(MODES),
    unit: z.enum(UNITS),
    price: z.coerce.number().min(0).max(1_000_000),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/, 'Use a 3-letter currency code, e.g. USD')
      .transform((v) => v.toUpperCase())
      .default('USD'),
    min_charge: z.coerce.number().min(0).max(1_000_000).default(0),
    transit_time: text(60),
    notes: text(300),
    sort_order: z.coerce.number().int().default(0),
    published: bool.default(1),
  }),
};

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().email('Please enter a valid email').max(200),
  phone: text(40),
  company: text(120),
  service: text(120),
  message: z.string().trim().min(10, 'Please tell us a little more (10+ characters)').max(5000),
  website: z.string().max(500).optional().default(''), // honeypot: humans never see or fill it
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10, 'Use at least 10 characters').max(200),
});

/** Turns a ZodError into { field: message } for form display. */
export function fieldErrors(error) {
  const out = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
