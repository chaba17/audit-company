/**
 * POST /api/publish
 *
 * Shared publish endpoint — multiple admin users can publish content
 * without needing their own GitHub token. Uses server-side env vars.
 *
 * Environment variables required (set in Vercel dashboard):
 *   GITHUB_TOKEN    — Personal access token with `repo` scope
 *   ADMIN_SECRET    — Shared password for admin users (separate from login password)
 *
 * Body (JSON):
 *   { secret: "<ADMIN_SECRET>", content: { ... } }
 */

const GITHUB_OWNER = 'chaba17';
const GITHUB_REPO = 'audit-company';
const GITHUB_PATH = 'assets/data/content.json';
const GITHUB_BRANCH = 'main';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  // Some Vercel runtimes need manual parse
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { GITHUB_TOKEN, ADMIN_SECRET, VERCEL_DEPLOY_HOOK } = process.env;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server not configured: GITHUB_TOKEN missing (add in Vercel → Settings → Environment Variables)' });
  }
  if (!ADMIN_SECRET) {
    return res.status(500).json({ error: 'Server not configured: ADMIN_SECRET missing' });
  }

  const body = await parseBody(req);
  const { secret, content } = body;

  if (!secret || secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Invalid secret' });
  }
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'Invalid content' });
  }

  try {
    content._updated = new Date().toISOString();
    const jsonStr = JSON.stringify(content, null, 2);
    const encoded = Buffer.from(jsonStr, 'utf-8').toString('base64');

    // Retry up to 3 times on SHA conflict
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      // Get current SHA
      let sha = null;
      try {
        const getRes = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}&_t=${Date.now()}`,
          { headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }, cache: 'no-store' }
        );
        if (getRes.ok) {
          const data = await getRes.json();
          sha = data.sha;
        }
      } catch {}

      // PUT new content
      const putBody = {
        message: `Update via shared admin — ${new Date().toLocaleString('ka-GE')}`,
        content: encoded,
        branch: GITHUB_BRANCH
      };
      if (sha) putBody.sha = sha;

      const putRes = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(putBody)
        }
      );

      if (putRes.ok) {
        const result = await putRes.json();

        // Optional: trigger Vercel deploy hook for faster static rebuild
        if (VERCEL_DEPLOY_HOOK) {
          try { await fetch(VERCEL_DEPLOY_HOOK, { method: 'POST' }); } catch {}
        }

        return res.status(200).json({
          success: true,
          commit: result.commit?.sha,
          commitUrl: result.commit?.html_url
        });
      }

      const errData = await putRes.json().catch(() => ({}));
      lastError = errData.message || `HTTP ${putRes.status}`;

      // Retry on SHA conflict
      if (putRes.status === 409 || (errData.message || '').includes('does not match')) {
        await new Promise(r => setTimeout(r, 300));
        continue;
      }
      break; // other error — don't retry
    }

    return res.status(500).json({ error: 'Publish failed', detail: lastError });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
