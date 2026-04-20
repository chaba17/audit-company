/**
 * GET /sitemap.xml  (rewritten to /api/sitemap via vercel.json)
 *
 * Dynamically generates an XML sitemap from the live content.json on GitHub.
 * - Always reflects the latest admin-published services / blog posts
 * - No static file to keep in sync
 * - Cached 1 hour at the CDN; Google recrawls at its own cadence anyway
 */

const GITHUB_OWNER = 'chaba17';
const GITHUB_REPO = 'audit-company';
const GITHUB_PATH = 'assets/data/content.json';
const GITHUB_BRANCH = 'main';

const SITE_URL = 'https://gubermangeo.com';

// URL-safe slugifier that mirrors content-loader.js's service URL builder
// (spaces → hyphens, strips unsafe chars, collapses dashes). Ensures the
// sitemap entries match the real service page URLs Vercel rewrites to.
function urlSafeSlug(id) {
  return (id || '').toString()
    .replace(/\s+/g, '-')
    .replace(/[\/\\?#&=]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function xmlEscape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildUrl({ loc, lastmod, freq, priority }) {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchContent() {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}&_t=${Date.now()}`;
  const headers = {
    'Accept': 'application/vnd.github.v3.raw',
    'User-Agent': 'audit-sitemap-generator'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { cache: 'no-store', headers });
  if (!res.ok) throw new Error(`GitHub fetch ${res.status}`);
  return JSON.parse(await res.text());
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end('Method not allowed');
  }

  let content = {};
  try {
    content = await fetchContent();
  } catch (e) {
    // Don't 500 — still emit a minimal sitemap of the static pages so Google
    // has *something* to index while we investigate GitHub issues.
    content = {};
  }

  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0', freq: 'weekly', lastmod: today },
    { loc: `${SITE_URL}/services`, priority: '0.9', freq: 'weekly', lastmod: today },
    { loc: `${SITE_URL}/pricing`, priority: '0.9', freq: 'monthly', lastmod: today },
    { loc: `${SITE_URL}/about`, priority: '0.8', freq: 'monthly', lastmod: today },
    { loc: `${SITE_URL}/blog`, priority: '0.8', freq: 'daily', lastmod: today },
    { loc: `${SITE_URL}/contact`, priority: '0.7', freq: 'monthly', lastmod: today }
  ];

  (content.services || []).forEach(s => {
    const slug = urlSafeSlug(s.id);
    if (!slug) return;
    urls.push({
      loc: `${SITE_URL}/services/${slug}`,
      priority: '0.8',
      freq: 'monthly',
      lastmod: today
    });
  });

  // Blog posts (hash-linked on the blog page — include for discovery signal)
  (content.blog || []).forEach(b => {
    if (!b || !b.slug) return;
    urls.push({
      loc: `${SITE_URL}/blog#${encodeURIComponent(b.slug)}`,
      priority: '0.6',
      freq: 'monthly',
      lastmod: b.date || today
    });
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(buildUrl).join('\n')}
</urlset>
`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  // Short CDN cache so admin-added services show up fast; Google refetches anyway.
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).send(body);
}
