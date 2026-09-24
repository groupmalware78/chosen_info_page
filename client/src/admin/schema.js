import { ICONS } from '../../../shared/constants.js';

// Form layouts for each CMS-editable section. Server-side validation lives in server/schemas.js.

const linkHelp = 'Use #rates, #contact etc. for sections on the page, or a full https:// link.';

export const pages = {
  site: {
    key: 'site',
    title: 'Company & SEO',
    description: 'Company identity, contact details, social links and search engine settings.',
    fieldsets: [
      {
        legend: 'Identity',
        fields: [
          { name: 'companyName', label: 'Company name' },
          { name: 'shortName', label: 'Short name', help: 'Shown in the header next to the logo.' },
          { name: 'tagline', label: 'Tagline', full: true },
          { name: 'logoUrl', label: 'Logo', type: 'image', help: 'PNG or WebP with a transparent background works best. Also used as the favicon.' },
        ],
      },
      {
        legend: 'Contact details',
        description: 'Shown in the contact section and footer.',
        fields: [
          { name: 'email', label: 'Email', inputType: 'email', help: 'Also receives enquiry notifications when SMTP is configured.' },
          { name: 'phone', label: 'Phone' },
          { name: 'whatsapp', label: 'WhatsApp number', help: 'International format, e.g. +254700000000. Adds a floating chat button.' },
          { name: 'hours', label: 'Working hours' },
          { name: 'address', label: 'Address', type: 'textarea', rows: 3 },
          {
            name: 'mapEmbedUrl',
            label: 'Google Maps embed URL',
            type: 'textarea',
            rows: 2,
            help: 'Google Maps → Share → Embed a map → copy only the src="…" URL.',
          },
        ],
      },
      {
        legend: 'Social media',
        fields: [
          { name: 'socials.facebook', label: 'Facebook URL' },
          { name: 'socials.instagram', label: 'Instagram URL' },
          { name: 'socials.linkedin', label: 'LinkedIn URL' },
          { name: 'socials.x', label: 'X (Twitter) URL' },
          { name: 'socials.tiktok', label: 'TikTok URL' },
        ],
      },
      {
        legend: 'Footer & SEO',
        fields: [
          { name: 'footerNote', label: 'Footer blurb', type: 'textarea', rows: 2 },
          { name: 'seoTitle', label: 'Page title (SEO)', full: true, help: 'Shown in browser tabs and search results. ~60 characters.' },
          { name: 'seoDescription', label: 'Meta description (SEO)', type: 'textarea', rows: 2, help: 'Shown under the title in search results. ~155 characters.' },
        ],
      },
    ],
  },

  hero: {
    key: 'hero',
    title: 'Hero',
    description: 'The first thing visitors see at the top of the page.',
    fieldsets: [
      {
        legend: 'Headline',
        fields: [
          { name: 'eyebrow', label: 'Small label above heading', full: true },
          { name: 'heading', label: 'Heading', type: 'textarea', rows: 2 },
          { name: 'subheading', label: 'Sub-heading', type: 'textarea', rows: 3 },
          { name: 'backgroundImage', label: 'Background image', type: 'image', help: 'Optional. Large landscape photo, 1920px wide or more. Overlay strength is set under Theme.' },
        ],
      },
      {
        legend: 'Buttons',
        fields: [
          { name: 'primaryCta.label', label: 'Primary button label' },
          { name: 'primaryCta.href', label: 'Primary button link', help: linkHelp },
          { name: 'secondaryCta.label', label: 'Secondary button label' },
          { name: 'secondaryCta.href', label: 'Secondary button link' },
        ],
      },
      {
        legend: 'Key figures',
        fields: [
          {
            name: 'stats',
            label: 'Stats (up to 4)',
            type: 'list',
            itemLabel: 'stat',
            max: 4,
            fields: [
              { name: 'value', label: 'Value', placeholder: '10k+' },
              { name: 'label', label: 'Label', placeholder: 'Consignments delivered' },
            ],
          },
        ],
      },
    ],
  },

  branding: {
    key: 'branding',
    title: 'Our brand',
    description: 'The Chosen Logistics Ltd brand story, mission, vision and values.',
    fieldsets: [
      {
        legend: 'Brand story',
        fields: [
          { name: 'eyebrow', label: 'Small label' },
          { name: 'heading', label: 'Heading' },
          { name: 'body', label: 'Story', type: 'textarea', rows: 5, help: 'Leave a blank line between paragraphs.' },
          { name: 'mission', label: 'Mission', type: 'textarea', rows: 3 },
          { name: 'vision', label: 'Vision', type: 'textarea', rows: 3 },
        ],
      },
      {
        legend: 'Core values',
        fields: [
          {
            name: 'values',
            label: 'Values (up to 6)',
            type: 'list',
            itemLabel: 'value',
            max: 6,
            fields: [
              { name: 'title', label: 'Title' },
              { name: 'text', label: 'Description' },
            ],
          },
        ],
      },
    ],
  },

  about: {
    key: 'about',
    title: 'Who we are',
    description: 'Introduce the company, its experience and what makes it different.',
    fieldsets: [
      {
        legend: 'Content',
        fields: [
          { name: 'eyebrow', label: 'Small label' },
          { name: 'heading', label: 'Heading' },
          { name: 'body', label: 'Body', type: 'textarea', rows: 8, help: 'Leave a blank line between paragraphs.' },
          { name: 'image', label: 'Image', type: 'image', help: 'Optional. A photo of your team, warehouse or operations.' },
          { name: 'badgeValue', label: 'Badge value', placeholder: '10+' },
          { name: 'badgeLabel', label: 'Badge label', placeholder: 'Years moving cargo' },
        ],
      },
      {
        legend: 'Highlights',
        fields: [{ name: 'highlights', label: 'Checklist items (up to 8)', type: 'stringList', itemLabel: 'highlight', max: 8 }],
      },
    ],
  },

  legal: {
    key: 'legal',
    title: 'Terms & Privacy',
    description: 'Legal pages linked from the footer at /terms and /privacy.',
    fieldsets: [
      {
        description:
          'Formatting: start a line with ## for a heading, - for a bullet point, wrap text in **double asterisks** for bold, and use [link text](https://example.com) for links.',
        fields: [
          { name: 'updatedAt', label: 'Last updated', inputType: 'date' },
          { name: 'terms', label: 'Terms & Conditions', type: 'markdown' },
          { name: 'privacy', label: 'Privacy Policy', type: 'markdown' },
        ],
      },
    ],
  },
};

export const sectionHeaderFields = (key) => [
  { name: `${key}.eyebrow`, label: 'Small label' },
  { name: `${key}.heading`, label: 'Heading' },
  { name: `${key}.subheading`, label: 'Intro text', type: 'textarea', rows: 2 },
];

export const sectionsPage = {
  title: 'Page sections',
  description: 'Show or hide whole sections of the one-page site.',
  fieldsets: [
    {
      legend: 'Visible sections',
      description: 'The hero and footer are always shown.',
      fields: [
        { name: 'visibility.branding', label: 'Our brand', type: 'toggle' },
        { name: 'visibility.about', label: 'Who we are', type: 'toggle' },
        { name: 'visibility.services', label: 'Services', type: 'toggle' },
        { name: 'visibility.rates', label: 'Rates', type: 'toggle' },
        { name: 'visibility.faqs', label: 'FAQs', type: 'toggle' },
        { name: 'visibility.contact', label: 'Contact us', type: 'toggle' },
      ],
    },
  ],
};

export const collections = {
  services: {
    title: 'Services',
    description: 'Services offered, shown as cards.',
    section: { key: 'services', fields: sectionHeaderFields('services') },
    itemName: 'service',
    columns: [{ key: 'title', label: 'Service', primary: true }, { key: 'description', label: 'Description', truncate: 90 }],
    fields: [
      { name: 'title', label: 'Title', full: true },
      { name: 'icon', label: 'Icon', type: 'select', options: ICONS, iconPreview: true },
      { name: 'published', label: 'Published', type: 'toggle' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
    ],
    blank: { title: '', description: '', icon: 'box', published: 1 },
  },
  rates: {
    title: 'Rates',
    description: 'Co-loading rates by route. Shown in a filterable table with a cost estimator.',
    section: {
      key: 'rates',
      fields: [
        ...sectionHeaderFields('rates'),
        { name: 'rates.disclaimer', label: 'Disclaimer below the table', type: 'textarea', rows: 2 },
        { name: 'rates.airKgPerCbm', label: 'Air: kg per CBM', type: 'number', help: 'Volumetric factor. 167 = 1:6000 cm³/kg.' },
        { name: 'rates.seaKgPerCbm', label: 'Sea: kg per CBM', type: 'number', help: 'Weight/measure ratio. Usually 1000.' },
        { name: 'rates.roadKgPerCbm', label: 'Road: kg per CBM', type: 'number', help: 'Usually 333.' },
      ],
    },
    itemName: 'rate',
    columns: [
      { key: 'route', label: 'Route', primary: true, render: (r) => `${r.origin} → ${r.destination}` },
      { key: 'mode', label: 'Mode', render: (r) => r.mode[0].toUpperCase() + r.mode.slice(1) },
      { key: 'price', label: 'Rate', render: (r) => `${r.currency} ${r.price} / ${r.unit === 'kg' ? 'kg' : 'CBM'}` },
      { key: 'transit_time', label: 'Transit' },
    ],
    fields: [
      { name: 'origin', label: 'Origin', placeholder: 'Guangzhou, China' },
      { name: 'destination', label: 'Destination', placeholder: 'Nairobi, Kenya' },
      { name: 'mode', label: 'Mode', type: 'select', options: [['sea', 'Sea'], ['air', 'Air'], ['road', 'Road']] },
      { name: 'unit', label: 'Charged per', type: 'select', options: [['cbm', 'CBM (cubic metre)'], ['kg', 'Kilogram']] },
      { name: 'price', label: 'Price per unit', type: 'number' },
      { name: 'currency', label: 'Currency', placeholder: 'USD', maxLength: 3 },
      { name: 'min_charge', label: 'Minimum charge', type: 'number' },
      { name: 'transit_time', label: 'Transit time', placeholder: '30–40 days' },
      { name: 'notes', label: 'Notes', full: true, placeholder: 'Optional, e.g. "Weekly departures every Friday"' },
      { name: 'published', label: 'Published', type: 'toggle' },
    ],
    blank: { origin: '', destination: '', mode: 'sea', unit: 'cbm', price: '', currency: 'USD', min_charge: 0, transit_time: '', notes: '', published: 1 },
  },
  faqs: {
    title: 'FAQs',
    description: 'Frequently asked questions, shown as an accordion.',
    section: { key: 'faqs', fields: sectionHeaderFields('faqs') },
    itemName: 'question',
    columns: [{ key: 'question', label: 'Question', primary: true }, { key: 'answer', label: 'Answer', truncate: 90 }],
    fields: [
      { name: 'question', label: 'Question', full: true },
      { name: 'answer', label: 'Answer', type: 'textarea', rows: 6 },
      { name: 'published', label: 'Published', type: 'toggle' },
    ],
    blank: { question: '', answer: '', published: 1 },
  },
};

export const contactSectionFields = [
  ...sectionHeaderFields('contact'),
  { name: 'contact.successMessage', label: 'Message shown after sending', type: 'textarea', rows: 2 },
];
