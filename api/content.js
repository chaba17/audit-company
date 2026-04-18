/**
 * GET /api/content
 *
 * Serves the latest content.json directly from GitHub (bypasses Vercel edge cache).
 * This means admin's published changes are visible on the live site within seconds,
 * without waiting for Vercel to rebuild.
 */

const GITHUB_OWNER = 'chaba17';
const GITHUB_REPO = 'audit-company';
const GITHUB_PATH = 'assets/data/content.json';
const GITHUB_BRANCH = 'main';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Use GitHub API with raw accept header — bypasses CDN cache of raw.githubusercontent.com
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}&_t=${Date.now()}`;

    const headers = {
      'Accept': 'application/vnd.github.v3.raw',
      'User-Agent': 'audit-admin-content-api'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const ghRes = await fetch(url, { cache: 'no-store', headers });
    if (!ghRes.ok) {
      const errText = await ghRes.text().catch(() => '');
      return res.status(502).json({ error: 'GitHub fetch failed', status: ghRes.status, detail: errText.slice(0, 200) });
    }
    const text = await ghRes.text();
    let data;
    try { data = JSON.parse(text); } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON from GitHub', detail: e.message });
    }

    // No cache — always fresh (each request hits function, but function is fast)
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=0, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
