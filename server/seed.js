import crypto from 'node:crypto';
import { config } from './config.js';
import { db, getSetting, setSetting, transaction } from './db.js';
import { hashPassword } from './auth.js';
import { DEFAULT_THEME } from '../shared/constants.js';
import { contentSchemas } from './schemas.js';

// Starter content so the site looks complete on first boot. Everything here is editable in /admin.
const defaults = {
  site: {
    companyName: 'Chosen Logistics Ltd',
    shortName: 'Chosen Logistics',
    tagline: 'Co-loading made simple. Ship less than a container, pay only for the space you use.',
    logoUrl: '',
    email: 'info@chosenlogistics.com',
    phone: '+000 000 000 000',
    whatsapp: '',
    address: 'Chosen Logistics House\nUpdate this address in the admin panel',
    hours: 'Mon – Fri: 8:00 – 17:30 · Sat: 9:00 – 13:00',
    mapEmbedUrl: '',
    socials: { facebook: '', instagram: '', linkedin: '', x: '', tiktok: '' },
    footerNote: 'Consolidated sea, air and road freight for importers, traders and growing businesses.',
    seoTitle: 'Chosen Logistics Ltd | Co-loading Cargo & Freight Consolidation',
    seoDescription:
      'Chosen Logistics Ltd offers co-loading (LCL) sea freight, consolidated air cargo, customs clearance and door-to-door delivery at transparent rates.',
  },
  hero: {
    eyebrow: 'Co-loading · Consolidation · Clearing',
    heading: 'Share the container. Keep the savings.',
    subheading:
      'We consolidate cargo from multiple shippers into one load, so you ship small or mid-size consignments by sea, air and road without paying for a full container.',
    backgroundImage: '',
    primaryCta: { label: 'View our rates', href: '#rates' },
    secondaryCta: { label: 'Get a quote', href: '#contact' },
    stats: [
      { value: '10k+', label: 'Consignments delivered' },
      { value: '3', label: 'Freight modes' },
      { value: '98%', label: 'On-time arrivals' },
      { value: '24/7', label: 'Shipment tracking' },
    ],
  },
  branding: {
    eyebrow: 'The Chosen Logistics brand',
    heading: 'Freight you can count on, from people you can reach.',
    body:
      'Chosen Logistics Ltd was built on one promise: small shippers deserve big-shipper service. Our name reflects the trust our clients place in us every time they hand over their cargo, and we work to earn that choice on every consignment.',
    mission:
      'To make international shipping affordable and predictable for every business by pooling cargo, sharing costs and handling every step with care.',
    vision: 'To be the most trusted co-loading partner for traders and growing businesses across the region.',
    values: [
      { title: 'Transparency', text: 'Clear rates, no hidden charges, and honest timelines.' },
      { title: 'Reliability', text: 'Fixed consolidation schedules and proactive updates.' },
      { title: 'Care', text: 'Every package is handled as if it were our own.' },
      { title: 'Partnership', text: 'We grow when our clients grow.' },
    ],
  },
  about: {
    eyebrow: 'Who we are',
    heading: 'A consolidation specialist with an end-to-end network',
    body:
      'We are a freight forwarding and consolidation company focused on less-than-container-load (LCL) and loose cargo. Our team receives goods at origin warehouses, consolidates them into shared containers or air pallets, handles export and import documentation, clears customs and delivers to your door.\n\nWhether you are a first-time importer bringing in a few cartons or an established business moving regular volumes, we give you the same attention, the same visibility and the same fair pricing.',
    image: '',
    badgeValue: '10+',
    badgeLabel: 'Years moving cargo',
    highlights: [
      'Weekly sea and air consolidation departures',
      'Receiving warehouses at key origin hubs',
      'In-house customs clearance team',
      'Door-to-door delivery and last-mile distribution',
      'Real-time shipment updates by phone, email or WhatsApp',
    ],
  },
  sections: {
    visibility: { branding: true, about: true, services: true, rates: true, faqs: true, contact: true },
    services: {
      eyebrow: 'What we do',
      heading: 'Services built around shared shipping',
      subheading: 'From pick-up at origin to delivery at your door, we handle every leg of your consignment.',
    },
    rates: {
      eyebrow: 'Transparent pricing',
      heading: 'Co-loading rates',
      subheading: 'Indicative consolidation rates by route. Use the estimator for a quick ballpark before requesting a formal quote.',
      disclaimer:
        'Rates are indicative, exclude duties and taxes, and are subject to change based on cargo type, space availability and carrier surcharges. A final quotation is issued after cargo inspection.',
      airKgPerCbm: 167,
      seaKgPerCbm: 1000,
      roadKgPerCbm: 333,
    },
    faqs: {
      eyebrow: 'FAQs',
      heading: 'Questions shippers ask us',
      subheading: "Can't find your answer? Reach out and our team will respond within one business day.",
    },
    contact: {
      eyebrow: 'Contact us',
      heading: "Let's move your cargo",
      subheading: 'Tell us what you are shipping and where. We will come back with a quote and the next consolidation date.',
      successMessage: 'Thank you! Your message has been received. Our team will get back to you shortly.',
    },
  },
  legal: {
    updatedAt: new Date().toISOString().slice(0, 10),
    terms: `## 1. Introduction
These Terms and Conditions govern the freight forwarding, consolidation (co-loading), warehousing, customs clearance and delivery services provided by Chosen Logistics Ltd ("the Company", "we", "us"). By booking a shipment or delivering goods to our warehouse, you ("the Customer") agree to these terms.

## 2. Quotations and rates
- Rates published on this website are indicative only and may change without notice.
- A binding quotation is issued after we receive accurate cargo details (weight, dimensions, description and value).
- Charges are calculated on the greater of actual weight or volumetric weight.
- Duties, taxes, storage and third-party charges are payable by the Customer unless expressly included in writing.

## 3. Customer obligations
- The Customer must provide an accurate description, value and packing list for all goods.
- Goods must be properly packed and labelled for consolidated transport.
- The Customer is responsible for ensuring goods are lawful to export and import and are not prohibited or restricted.

## 4. Prohibited goods
We do not accept dangerous, hazardous, illegal, counterfeit or perishable goods unless agreed in writing. Undeclared prohibited goods may be refused, held or surrendered to the authorities at the Customer's cost.

## 5. Payment
Invoices are payable before release of cargo unless credit terms are agreed in writing. We may exercise a lien over goods for unpaid charges.

## 6. Liability and insurance
Our liability for loss or damage is limited as set out in the applicable carriage conventions and our standard trading conditions. We strongly recommend that Customers purchase cargo insurance; we can arrange cover on request.

## 7. Delays
Transit times are estimates. We are not liable for delays caused by carriers, customs, port congestion, weather or other events beyond our control.

## 8. Unclaimed cargo
Cargo not collected within 14 days of arrival notification may attract storage charges and may be disposed of in accordance with applicable law.

## 9. Governing law
These terms are governed by the laws of the jurisdiction in which Chosen Logistics Ltd is registered.

## 10. Contact
Questions about these terms can be sent to us using the contact details on this website.`,
    privacy: `## 1. Who we are
Chosen Logistics Ltd ("we", "us") is committed to protecting your personal data. This policy explains what we collect, why, and your rights.

## 2. Information we collect
- **Contact details** you submit through our contact form: name, email, phone number, company and message.
- **Shipment information** needed to move your cargo: consignee and shipper details, cargo descriptions and documents.
- **Technical data** such as your IP address, used only for security and spam prevention.

## 3. How we use your information
- To respond to enquiries and provide quotations.
- To arrange, track and deliver shipments and clear customs.
- To meet legal, regulatory and accounting obligations.
- We do not sell your personal data.

## 4. Sharing
We share data only with parties required to move your cargo (carriers, customs authorities, agents and delivery partners) or where required by law.

## 5. Retention
We keep enquiry data for up to 24 months and shipment records for as long as required by customs and tax regulations.

## 6. Security
We use industry-standard technical and organisational measures to protect your data.

## 7. Cookies
This website uses only a strictly necessary cookie for the administrator login. No tracking or advertising cookies are used.

## 8. Your rights
You may request access to, correction of, or deletion of your personal data by contacting us.

## 9. Changes
We may update this policy from time to time. The date at the top of this page shows when it was last updated.`,
  },
  theme: DEFAULT_THEME,
};

const services = [
  ['LCL Sea Freight Co-loading', 'Share container space with other shippers and pay only for the cubic metres you use. Weekly consolidated departures.', 'ship'],
  ['Consolidated Air Cargo', 'Fast, cost-effective air freight for urgent or high-value goods, consolidated on scheduled flights and charged by chargeable weight.', 'plane'],
  ['Road Freight & Groupage', 'Cross-border and domestic groupage trucking for part loads, with secure sealed trucks and tracked routes.', 'truck'],
  ['Customs Clearance', 'Licensed clearing agents handle documentation, duty assessment and release, so your cargo is not held at port.', 'customs'],
  ['Warehousing & Receiving', 'Origin receiving warehouses to collect goods from multiple suppliers, inspect, label and consolidate before shipping.', 'warehouse'],
  ['Door-to-Door Delivery', 'From supplier to your doorstep: pick-up, freight, clearance and last-mile delivery under one booking.', 'route'],
];

const faqs = [
  ['What is co-loading?', 'Co-loading (also called consolidation or LCL, less-than-container-load) combines cargo from several shippers into one container or air shipment. Each shipper pays only for the space their goods occupy, which makes shipping small volumes far more affordable.'],
  ['How are my charges calculated?', 'Sea freight is charged per cubic metre (CBM) or per 1,000 kg, whichever is greater. Air freight is charged per kilogram of chargeable weight, which is the greater of actual weight and volumetric weight. A minimum charge applies per consignment.'],
  ['How do I calculate CBM?', 'Multiply length × width × height in metres for each carton, then add them together. For example, a carton of 50 cm × 40 cm × 30 cm is 0.5 × 0.4 × 0.3 = 0.06 CBM.'],
  ['How long does shipping take?', 'Transit times depend on the route and mode. Typical consolidated sea freight takes 30–45 days port to port, and air cargo 5–10 days. Each route in our rates table shows its estimated transit time.'],
  ['Do rates include customs duty?', 'No. Our freight rates exclude import duty and taxes, which are set by the customs authority based on the goods and their declared value. We can clear your cargo and give you a duty estimate in advance.'],
  ['What items can I not ship?', 'We cannot ship dangerous goods, flammables, weapons, narcotics, counterfeit goods, or any items prohibited by origin or destination regulations. Contact us if you are unsure about a specific item.'],
  ['Can you collect from my supplier?', 'Yes. Send us your supplier contact details and we will arrange pick-up or have them deliver directly to our receiving warehouse. We confirm receipt with photos and measurements.'],
  ['How do I track my shipment?', 'Once your cargo is received you get a reference number. Our team sends milestone updates by email or WhatsApp, and you can contact us anytime for a status update.'],
];

// Sample routes only: replace with your real lanes and prices in the admin panel.
const rates = [
  ['Guangzhou, China', 'Nairobi, Kenya', 'sea', 'cbm', 185, 'USD', 185, '35–45 days'],
  ['Guangzhou, China', 'Nairobi, Kenya', 'air', 'kg', 9.5, 'USD', 50, '5–7 days'],
  ['Dubai, UAE', 'Nairobi, Kenya', 'sea', 'cbm', 150, 'USD', 150, '21–28 days'],
  ['Dubai, UAE', 'Nairobi, Kenya', 'air', 'kg', 5.2, 'USD', 40, '3–5 days'],
  ['London, UK', 'Nairobi, Kenya', 'air', 'kg', 7.8, 'USD', 60, '5–8 days'],
  ['Istanbul, Türkiye', 'Nairobi, Kenya', 'sea', 'cbm', 210, 'USD', 210, '30–40 days'],
  ['Nairobi, Kenya', 'Kampala, Uganda', 'road', 'kg', 0.45, 'USD', 30, '2–3 days'],
];

export function seed() {
  transaction(() => {
    for (const [key, value] of Object.entries(defaults)) {
      if (getSetting(key) === null) setSetting(key, contentSchemas[key].parse(value));
    }

    if (db.prepare('SELECT COUNT(*) AS n FROM services').get().n === 0) {
      const stmt = db.prepare('INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)');
      services.forEach(([t, d, i], idx) => stmt.run(t, d, i, idx));
    }
    if (db.prepare('SELECT COUNT(*) AS n FROM faqs').get().n === 0) {
      const stmt = db.prepare('INSERT INTO faqs (question, answer, sort_order) VALUES (?, ?, ?)');
      faqs.forEach(([q, a], idx) => stmt.run(q, a, idx));
    }
    if (db.prepare('SELECT COUNT(*) AS n FROM rates').get().n === 0) {
      const stmt = db.prepare(
        'INSERT INTO rates (origin, destination, mode, unit, price, currency, min_charge, transit_time, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      );
      rates.forEach((r, idx) => stmt.run(...r, idx));
    }
  });

  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n === 0) {
    let password = config.adminPassword;
    if (!password) {
      password = crypto.randomBytes(12).toString('base64url');
      console.log('\n==============================================================');
      console.log(' Admin account created (set ADMIN_PASSWORD to choose your own)');
      console.log(`   Email:    ${config.adminEmail}`);
      console.log(`   Password: ${password}`);
      console.log(' Sign in at /admin and change this password immediately.');
      console.log('==============================================================\n');
    }
    db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(config.adminEmail, hashPassword(password));
  }
}
