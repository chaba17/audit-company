/**
 * POST /api/send-contact
 *
 * Sends contact-form submissions via Zoho Mail SMTP to CONTACT_TO_EMAIL.
 *
 * Required Vercel environment variables (Project Settings -> Environment Variables):
 *   ZOHO_SMTP_USER    - full mailbox, e.g. "info@gubermangeo.com"
 *   ZOHO_SMTP_PASS    - Zoho "App Password" (NOT the regular login password).
 *                       Generate at: Zoho Mail -> My Account -> Security -> App Passwords
 *   CONTACT_TO_EMAIL  - where contact submissions land (usually same as ZOHO_SMTP_USER)
 *
 * Optional:
 *   ZOHO_SMTP_HOST          - SMTP host override. Auto-detected from user email TLD if unset:
 *                             - user ends with @...eu, @...ge or explicitly set EU → smtp.zoho.eu
 *                             - otherwise → smtp.zoho.com
 *                             You can force the region by setting this manually.
 *   CONTACT_SUBJECT_PREFIX  - prefixed to the subject line (default: "[gubermangeo.com]")
 */

import nodemailer from 'nodemailer';

// In-memory rate limit per serverless instance. Not perfect across regions/instances,
// but catches casual abuse. For heavy production use, swap to Vercel KV.
const rateBuckets = new Map(); // ip -> { count, resetAt }
const RATE_WINDOW_MS = 10 * 60 * 1000;   // 10 minutes
const RATE_MAX = 5;                       // max 5 submissions per IP per window

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX;
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Env-var validation
  const SMTP_USER = process.env.ZOHO_SMTP_USER;
  const SMTP_PASS = process.env.ZOHO_SMTP_PASS;
  const TO_EMAIL  = process.env.CONTACT_TO_EMAIL || SMTP_USER;
  const SUBJECT_PREFIX = process.env.CONTACT_SUBJECT_PREFIX || '[gubermangeo.com]';
  if (!SMTP_USER || !SMTP_PASS) {
    return res.status(503).json({
      error: 'Email service not configured',
      detail: 'Set ZOHO_SMTP_USER and ZOHO_SMTP_PASS env vars in Vercel dashboard.'
    });
  }

  // Rate limit
  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }

  const body = await parseBody(req);
  const {
    name = '', email = '', phone = '', company = '',
    service = '', message = '', website = ''
  } = body || {};

  // Honeypot — bots fill hidden fields
  if (website && website.trim()) {
    // Pretend success to confuse bot, but don't actually send
    return res.status(200).json({ ok: true });
  }

  // Validation
  if (!name.trim() || !email.trim()) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  if (name.length > 200 || email.length > 200 || message.length > 10000) {
    return res.status(400).json({ error: 'Field too long.' });
  }

  // Build email
  const subject = `${SUBJECT_PREFIX} ახალი განაცხადი: ${name.slice(0, 80)}${service ? ` — ${service}` : ''}`;
  const plainBody = [
    `ახალი შეტყობინება gubermangeo.com-ის კონტაქტის ფორმიდან`,
    `──────────────────────────────────`,
    `სახელი:    ${name}`,
    `მეილი:    ${email}`,
    phone ? `ტელეფონი:  ${phone}` : null,
    company ? `კომპანია:  ${company}` : null,
    service ? `სერვისი:   ${service}` : null,
    ``,
    `შეტყობინება:`,
    message || '(ცარიელი)',
    ``,
    `──────────────────────────────────`,
    `IP: ${ip}`,
    `დრო: ${new Date().toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' })}`
  ].filter(Boolean).join('\n');

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #fafafc; padding: 24px;">
      <div style="background: white; border-left: 4px solid #FFE600; padding: 28px;">
        <h2 style="margin: 0 0 6px; font-size: 20px; color: #14141C;">ახალი განაცხადი</h2>
        <p style="margin: 0 0 20px; color: #747480; font-size: 13px;">gubermangeo.com-ის კონტაქტის ფორმიდან</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #747480; width: 110px;">სახელი:</td><td style="padding: 8px 0; color: #14141C; font-weight: 600;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding: 8px 0; color: #747480;">მეილი:</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}" style="color: #14141C;">${escapeHtml(email)}</a></td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; color: #747480;">ტელეფონი:</td><td style="padding: 8px 0;"><a href="tel:${escapeHtml(phone)}" style="color: #14141C;">${escapeHtml(phone)}</a></td></tr>` : ''}
          ${company ? `<tr><td style="padding: 8px 0; color: #747480;">კომპანია:</td><td style="padding: 8px 0; color: #14141C;">${escapeHtml(company)}</td></tr>` : ''}
          ${service ? `<tr><td style="padding: 8px 0; color: #747480;">სერვისი:</td><td style="padding: 8px 0; color: #14141C;">${escapeHtml(service)}</td></tr>` : ''}
        </table>
        ${message ? `
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e7e7ea;">
            <div style="color: #747480; font-size: 13px; margin-bottom: 8px;">შეტყობინება:</div>
            <div style="color: #14141C; white-space: pre-wrap; line-height: 1.5;">${escapeHtml(message)}</div>
          </div>
        ` : ''}
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e7e7ea; font-size: 11px; color: #9898a3;">
          IP: ${escapeHtml(ip)} · ${new Date().toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' })}
        </div>
      </div>
    </div>
  `;

  // Choose SMTP host: env override wins; otherwise default to Zoho EU for users in EU/GE region.
  // Zoho Global users: smtp.zoho.com. Zoho EU/India/AU users use their regional host.
  // Safer default = smtp.zoho.eu because that's what this project's Zoho account is on.
  const SMTP_HOST = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.eu';

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: 465,
    secure: true, // SSL
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  try {
    await transporter.sendMail({
      from: `"gubermangeo.com" <${SMTP_USER}>`,
      to: TO_EMAIL,
      replyTo: `"${name.replace(/["\\]/g, '')}" <${email}>`,
      subject,
      text: plainBody,
      html: htmlBody
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Log the full error so it shows up in Vercel runtime logs, but return a safe message to the client.
    const detail = (err && (err.response || err.message)) ? String(err.response || err.message) : 'unknown';
    console.error('[send-contact] SMTP send failed via', SMTP_HOST, '| user=', SMTP_USER, '| error=', detail);
    return res.status(500).json({
      error: 'Email could not be sent right now. Please try again later.',
      // Only include diagnostic detail when explicitly enabled via env var (never in production by default)
      ...(process.env.EXPOSE_SMTP_ERRORS === '1' ? { detail, host: SMTP_HOST } : {})
    });
  }
}
