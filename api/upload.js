/**
 * POST /api/upload — upload a single image to GitHub, get a public URL back.
 *
 * Body (JSON):
 *   { secret: "<ADMIN_SECRET>", name: "photo.jpg", contentBase64: "...", mime: "image/jpeg" }
 *
 * Response:
 *   { ok: true, url: "https://gubermangeo.com/assets/images/uploads/<ts>-<safeName>" }
 *
 * Env vars (Vercel):
 *   GITHUB_TOKEN  — personal access token with `repo` scope
 *   ADMIN_SECRET  — shared password (same as publish endpoint)
 */

const GITHUB_OWNER = 'chaba17';
const GITHUB_REPO = 'audit-company';
const GITHUB_BRANCH = 'main';
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB (base64 payload will be ~11 MB)
const ALLOWED_MIME = /^image\/(jpeg|jpg|png|webp|gif|avif|svg\+xml)$/i;

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

function safeName(raw) {
  return String(raw || 'image').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

export const config = { api: { bodyParser: { sizeLimit: '12mb' } } };

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!GITHUB_TOKEN || !ADMIN_SECRET) {
    return res.status(503).json({ error: 'Upload service not configured (missing GITHUB_TOKEN or ADMIN_SECRET).' });
  }

  const body = await parseBody(req);
  const { secret, name, contentBase64, mime } = body || {};
  if (!secret || secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Invalid secret' });
  }
  if (!contentBase64 || !name) {
    return res.status(400).json({ error: 'Missing name or contentBase64' });
  }
  if (mime && !ALLOWED_MIME.test(mime)) {
    return res.status(400).json({ error: 'File type not allowed. Images only (jpeg/png/webp/gif/avif/svg).' });
  }
  // Rough size check on base64
  const sizeBytes = Math.floor((contentBase64.length * 3) / 4);
  if (sizeBytes > MAX_FILE_SIZE) {
    return res.status(413).json({ error: `File too big: ${Math.round(sizeBytes/1024)}KB (max 8MB)` });
  }

  const timestamp = Date.now();
  const filename = `${timestamp}-${safeName(name)}`;
  const path = `assets/images/uploads/${filename}`;

  try {
    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'gubermangeo-upload-api'
        },
        body: JSON.stringify({
          message: `Upload image ${filename}`,
          content: contentBase64,
          branch: GITHUB_BRANCH
        })
      }
    );

    const ghData = await ghRes.json().catch(() => ({}));
    if (!ghRes.ok) {
      return res.status(ghRes.status).json({ error: 'GitHub upload failed', detail: ghData.message || 'unknown' });
    }

    return res.status(200).json({
      ok: true,
      path,
      url: `https://gubermangeo.com/${path}`,
      size: sizeBytes,
      name: filename
    });
  } catch (err) {
    console.error('[upload] error', err?.message || err);
    return res.status(500).json({ error: 'Upload failed', detail: String(err?.message || err) });
  }
}
