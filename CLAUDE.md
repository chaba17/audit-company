# Instructions for Claude

## Critical: NEVER restore content.json from old commits

The live data in `assets/data/content.json` is the user's **authoritative** content.
They add / edit / delete services, team members, testimonials, FAQs, blog posts,
industries, pricing plans via the admin panel.

**Rules:**
1. **NEVER** run `git show <old-commit>:assets/data/content.json > assets/data/content.json`
   to "restore" old data unless the user explicitly asks for it with a specific
   commit reference.
2. **NEVER** replace content.json with DEFAULT_CONTENT (the 9 default services etc.)
3. If content.json appears "wrong" or "missing items", the correct action is:
   - Inspect `assets/js/admin.js` merge/guard logic
   - Fix the bug there
   - Do NOT touch content.json directly
4. The admin panel's publish flow is the ONLY legitimate way to change content.json.
   Your git commits should be limited to code files (`.js`, `.css`, `.html`, `.json`
   config files) — never content.json unless fixing a specific structural issue.

## Site context

- Domain: `gubermangeo.com`
- Hidden admin portal: `/portal-gbm-k7x9.html` (protected by Basic Auth via
  `middleware.js` + `PORTAL_PASS` env var)
- Hosted on Vercel, repo is `chaba17/audit-company` on GitHub
- Admin uses `ADMIN_SECRET` env var for shared-secret publish flow
- Zoho Mail serves `info@gubermangeo.com` (EU region, smtp.zoho.eu)
- Bing verification meta already in place (`F8C0D3B068A2D777FC53B0FE97D3DAFA`)

## Multi-language

4 languages supported: `ka` (Georgian, default), `en`, `ru`, `he` (RTL).
Translation overlay pattern: items have base KA fields + optional
`i18n: { en: {...}, ru: {...}, he: {...} }` overrides.
Structural text uses `data-i18n="key.path"` with fallback chain
requested → en → ka in `i18n.js`.
