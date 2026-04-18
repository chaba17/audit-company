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
    // Use raw.githubusercontent.com — no token needed, always fresh
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${GITHUB_PATH}?t=${Date.now()}`;

    const ghRes = await fetch(url, { cache: 'no-store' });
    if (!ghRes.ok) {
      return res.status(502).json({ error: 'GitHub fetch failed', status: ghRes.status });
    }
    const data = await ghRes.json();

    // Very short cache — fresh updates within 3s, but protect from DDoS
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3, stale-while-revalidate=5');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
