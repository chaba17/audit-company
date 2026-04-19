// Vercel Edge Middleware - HTTP Basic Auth layer for admin portal
// Runs BEFORE the file is served. Even if someone finds the URL, they need
// to pass HTTP Basic Auth before anything renders.
//
// Config via Vercel env vars (Project Settings - Environment Variables):
//   PORTAL_USER     - Basic Auth username  (default: "admin")
//   PORTAL_PASS     - Basic Auth password  (required - set in Vercel dashboard)

export const config = {
  // Only intercept the hidden portal path. Root, services, pricing, API, etc. stay public.
  matcher: ['/portal-gbm-k7x9', '/portal-gbm-k7x9.html'],
};

export default function middleware(request) {
  const PORTAL_USER = process.env.PORTAL_USER || 'admin';
  // If PORTAL_PASS is not set in Vercel env vars, fall back to a temporary setup password.
  // The user MUST change this in Vercel dashboard: Project Settings → Environment Variables.
  const PORTAL_PASS = process.env.PORTAL_PASS || 'gbm-setup-change-me-now';

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Basic ')) {
    try {
      const encoded = authHeader.substring(6);
      const decoded = atob(encoded);
      const sep = decoded.indexOf(':');
      const user = decoded.substring(0, sep);
      const pass = decoded.substring(sep + 1);
      if (user === PORTAL_USER && pass === PORTAL_PASS) {
        // Auth OK - let the request through to the admin portal
        return;
      }
    } catch (_) { /* fall through */ }
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Portal", charset="UTF-8"',
      'Content-Type': 'text/plain'
    }
  });
}
