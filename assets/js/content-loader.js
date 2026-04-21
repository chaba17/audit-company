/* ==========================================================
   Content Loader — fetches content.json from repo
   Overrides static content so admin edits appear live on the site
   ========================================================== */

// ==========================================================
// BOOT CACHE — populate window.SITE_CONTENT synchronously from localStorage
// BEFORE anything else runs, so partials.js's first renderHeader() already
// sees the logoUrl / site.name / etc. and doesn't flash the fallback text logo.
// Public-only cache key (separate from admin's audit_admin_content).
// ==========================================================
try {
  const cached = localStorage.getItem('site_content_cache');
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed && typeof parsed === 'object') {
      window.SITE_CONTENT = parsed;
      // Also pre-merge hero values into window.translations (if i18n.js has loaded already,
      // which it does since it's the first defer script). This makes i18n's very first
      // applyTranslations() on DOMContentLoaded use the admin-published hero text instead
      // of the hardcoded Georgian defaults — eliminating the flash-of-old-hero on refresh.
      try {
        const hero = parsed.hero;
        if (hero && window.translations) {
          const LANGS = ['ka', 'en', 'ru', 'he'];
          const parseMark = (s) => {
            if (typeof s !== 'string') return { pre: '', highlight: '', post: '' };
            const m = s.match(/^([\s\S]*?)<mark>([\s\S]*?)<\/mark>([\s\S]*)$/);
            if (m) return { pre: m[1].trim(), highlight: m[2].trim(), post: m[3].trim() };
            return { pre: s, highlight: '', post: '' };
          };
          const stripP = (s) => (typeof s === 'string' ? s.replace(/^<p>|<\/p>$/gi, '').trim() : s);
          LANGS.forEach(l => {
            const dict = window.translations[l];
            if (!dict || !dict.hero) return;
            const ov = (hero.i18n && hero.i18n[l]) || {};
            const tagV = ov.tag || hero.tag;
            if (tagV) dict.hero.tag = tagV;
            const titleV = ov.title || hero.title;
            if (titleV) {
              const p = parseMark(titleV);
              dict.hero.title_pre = p.pre || '';
              dict.hero.title_highlight = p.highlight || '';
              dict.hero.title_post = p.post || '';
            }
            const subV = ov.subtitle || hero.subtitle;
            if (subV) dict.hero.subtitle = stripP(subV);
            const pT = (ov.primaryCta && ov.primaryCta.text) || (hero.primaryCta && hero.primaryCta.text);
            if (pT) dict.hero.cta_primary = pT;
            const sT = (ov.secondaryCta && ov.secondaryCta.text) || (hero.secondaryCta && hero.secondaryCta.text);
            if (sT) dict.hero.cta_secondary = sT;
          });
        }
      } catch (_) {}
    }
  }
} catch (_) { /* ignore cache errors */ }

(async () => {
  // Escape HTML for safe insertion as text
  const escapeHTML = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Fetch content.json with cache-busting
  const loadContent = async () => {
    try {
      // Try localStorage first (admin preview)
      const local = localStorage.getItem('audit_admin_content');
      if (local && location.pathname.includes('admin')) {
        return JSON.parse(local);
      }
      // Determine relative API path based on current location
      const apiBase = location.pathname.includes('/services/') ? '../' : '';

      // Try serverless API first (always fresh, bypasses edge cache)
      try {
        const apiRes = await fetch(`${apiBase}api/content?t=${Date.now()}`, { cache: 'no-store' });
        if (apiRes.ok) return await apiRes.json();
      } catch (e) { /* fall through to static */ }

      // Fallback to static file
      const res = await fetch(`${apiBase}assets/data/content.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Content load failed');
      return await res.json();
    } catch (e) {
      console.warn('Content-loader: using fallback', e);
      return null;
    }
  };

  const content = await loadContent();
  if (!content) return;
  window.SITE_CONTENT = content;

  // Save to public cache so next page-load can hydrate synchronously (no logo flash)
  try { localStorage.setItem('site_content_cache', JSON.stringify(content)); } catch (_) {}

  // Apply per-item i18n overlays to ARRAYS so downstream code sees already-translated items
  const applyItemI18n = () => {
    const lang = localStorage.getItem('lang') || 'ka';
    if (!window.resolveItemI18n) return; // i18n.js not loaded yet
    ['services', 'team', 'testimonials', 'faq', 'blog', 'industries'].forEach(key => {
      const arr = (window.SITE_CONTENT_RAW && window.SITE_CONTENT_RAW[key]) || content[key];
      if (Array.isArray(arr)) {
        content[key] = arr.map(item => window.resolveItemI18n(item, lang));
      }
    });
    if (content.pricing && Array.isArray(content.pricing.plans)) {
      const raw = (window.SITE_CONTENT_RAW && window.SITE_CONTENT_RAW.pricing && window.SITE_CONTENT_RAW.pricing.plans) || content.pricing.plans;
      content.pricing.plans = raw.map(p => window.resolveItemI18n(p, lang));
    }
  };

  // Keep a pristine copy so re-applying for a different language still has access to all overlays
  window.SITE_CONTENT_RAW = JSON.parse(JSON.stringify(content));
  applyItemI18n();

  // Listen for language changes (from nav switcher) and re-apply overlays + re-render.
  // Only reload when previous lang is defined (meaning an actual user-initiated switch, not initial load).
  document.addEventListener('lang-changed', (e) => {
    const previous = e?.detail?.previous;
    const current = e?.detail?.lang;
    // Guard: only reload if this is a genuine change (previous existed and differs).
    if (!previous || previous === current) return;
    applyItemI18n();
    location.reload();
  });

  // ========================================================
  // APPLY SEO / META / OG TAGS — from content.seo.pages[pageKey]
  // ========================================================
  try {
    const pageKey = (() => {
      const p = location.pathname.replace(/\/+$/, '').toLowerCase();
      if (p === '' || p === '/index' || p.endsWith('/index.html') || p === '/') return 'home';
      if (p.endsWith('/services') || p.endsWith('/services.html') || p.includes('/services/')) return 'services';
      if (p.endsWith('/pricing') || p.endsWith('/pricing.html')) return 'pricing';
      if (p.endsWith('/about') || p.endsWith('/about.html')) return 'about';
      if (p.endsWith('/blog') || p.endsWith('/blog.html')) return 'blog';
      if (p.endsWith('/contact') || p.endsWith('/contact.html')) return 'contact';
      return 'home';
    })();

    const seoPages = (content.seo && content.seo.pages) || {};
    const pageSeo = seoPages[pageKey] || {};
    const globalSeo = content.seo || {};
    const siteName = (content.site && content.site.name) || 'Audit';
    const siteUrl = (globalSeo.siteUrl || 'https://gubermangeo.com').replace(/\/+$/, '');

    const siteInfo = content.site || {};
    const title = pageSeo.title || siteInfo.defaultTitle || globalSeo.defaultTitle || document.title;
    const description = pageSeo.description || siteInfo.defaultDescription || globalSeo.defaultDescription || '';
    const ogImage = pageSeo.ogImage || globalSeo.defaultOgImage || '';
    const keywords = pageSeo.keywords || globalSeo.defaultKeywords || '';
    const canonicalUrl = siteUrl + location.pathname;

    // Favicon + Apple touch icon (site-wide, from content.site)
    if (siteInfo.favicon) {
      ensureLink('icon', siteInfo.favicon);
      ensureLink('shortcut icon', siteInfo.favicon);
    }
    if (siteInfo.appleTouchIcon) {
      ensureLink('apple-touch-icon', siteInfo.appleTouchIcon);
    }

    const ensureMeta = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const ensureLink = (rel, href) => {
      if (!href) return;
      let el = document.head.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    if (title) document.title = title;
    ensureMeta('name', 'description', description);
    ensureMeta('name', 'keywords', keywords);
    ensureLink('canonical', canonicalUrl);

    // hreflang — tell Google which URL serves which language.
    // For this site, all languages share the same URL (client-side switcher),
    // so we emit self-referential alternates; "x-default" points to root.
    const ensureHreflang = (lang, href) => {
      let el = document.head.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'alternate');
        el.setAttribute('hreflang', lang);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };
    ['ka', 'en', 'ru', 'he'].forEach(l => ensureHreflang(l, canonicalUrl));
    ensureHreflang('x-default', canonicalUrl);

    // Site-verification tokens (Google Search Console, Bing, Yandex, Pinterest, Facebook)
    const verification = (globalSeo.verification) || {};
    if (verification.google) ensureMeta('name', 'google-site-verification', verification.google);
    if (verification.bing) ensureMeta('name', 'msvalidate.01', verification.bing);
    if (verification.yandex) ensureMeta('name', 'yandex-verification', verification.yandex);
    if (verification.pinterest) ensureMeta('name', 'p:domain_verify', verification.pinterest);
    if (verification.facebook) ensureMeta('name', 'facebook-domain-verification', verification.facebook);

    // Open Graph (Facebook, LinkedIn, etc.)
    ensureMeta('property', 'og:site_name', siteName);
    ensureMeta('property', 'og:type', pageKey === 'blog' ? 'article' : 'website');
    ensureMeta('property', 'og:url', canonicalUrl);
    ensureMeta('property', 'og:title', title);
    ensureMeta('property', 'og:description', description);
    if (ogImage) ensureMeta('property', 'og:image', ogImage);
    ensureMeta('property', 'og:locale', 'ka_GE');

    // Twitter Card
    ensureMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    ensureMeta('name', 'twitter:title', title);
    ensureMeta('name', 'twitter:description', description);
    if (ogImage) ensureMeta('name', 'twitter:image', ogImage);

    // JSON-LD schema.org Organization (homepage only, helps Google Knowledge Graph)
    if (pageKey === 'home') {
      const org = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteName,
        url: siteUrl,
        logo: (content.site && content.site.logoUrl) || siteUrl + '/assets/images/logo.png',
        email: content.site && content.site.email,
        telephone: content.site && content.site.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: content.site && content.site.address,
          addressCountry: 'GE'
        },
        sameAs: [
          content.site?.social?.facebook,
          content.site?.social?.instagram,
          content.site?.social?.linkedin,
          content.site?.social?.youtube
        ].filter(Boolean).filter(u => u !== '#')
      };
      let ld = document.head.querySelector('script[data-org-jsonld]');
      if (!ld) {
        ld = document.createElement('script');
        ld.type = 'application/ld+json';
        ld.setAttribute('data-org-jsonld', '');
        document.head.appendChild(ld);
      }
      ld.textContent = JSON.stringify(org, null, 2);
    }

    // ====================================================
    // FAQ schema — helps Google show rich results with Q&A
    // ====================================================
    if ((pageKey === 'home' || pageKey === 'services') && Array.isArray(content.faq) && content.faq.length > 0) {
      const lang = localStorage.getItem('lang') || 'ka';
      const resolveFaq = (f) => window.resolveItemI18n ? window.resolveItemI18n(f, lang) : f;
      const faqLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: content.faq.slice(0, 10).map(f => {
          const r = resolveFaq(f);
          return {
            '@type': 'Question',
            name: r.question || '',
            acceptedAnswer: { '@type': 'Answer', text: (r.answer || '').replace(/<[^>]+>/g, '') }
          };
        })
      };
      let faqScript = document.head.querySelector('script[data-faq-jsonld]');
      if (!faqScript) {
        faqScript = document.createElement('script');
        faqScript.type = 'application/ld+json';
        faqScript.setAttribute('data-faq-jsonld', '');
        document.head.appendChild(faqScript);
      }
      faqScript.textContent = JSON.stringify(faqLd);
    }

    // ====================================================
    // BreadcrumbList schema — for service inner pages
    // ====================================================
    if (location.pathname.includes('/services/')) {
      const slug = location.pathname.split('/').pop().replace('.html', '').replace(/\/$/, '');
      const svc = (content.services || []).find(s => {
        const urlSlug = (s.id || '').toString().replace(/\s+/g, '-').replace(/[\/\\?#&=]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return urlSlug === slug || s.id === slug;
      });
      const bcLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl + '/' },
          { '@type': 'ListItem', position: 2, name: 'Services', item: siteUrl + '/services' },
          { '@type': 'ListItem', position: 3, name: (svc && svc.title) || slug, item: canonicalUrl }
        ]
      };
      let bcScript = document.head.querySelector('script[data-bc-jsonld]');
      if (!bcScript) {
        bcScript = document.createElement('script');
        bcScript.type = 'application/ld+json';
        bcScript.setAttribute('data-bc-jsonld', '');
        document.head.appendChild(bcScript);
      }
      bcScript.textContent = JSON.stringify(bcLd);
    }
  } catch (e) { console.warn('SEO inject failed:', e); }

  // ========================================================
  // APPLY GOOGLE ANALYTICS — from content.analytics.gaId
  // ========================================================
  try {
    const gaId = content.analytics && content.analytics.gaId;
    if (gaId && /^(G-|UA-|GTM-)[A-Z0-9-]+$/i.test(gaId) && !document.querySelector('script[data-ga-snippet]')) {
      const tag = document.createElement('script');
      tag.async = true;
      tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
      tag.setAttribute('data-ga-snippet', '');
      document.head.appendChild(tag);
      const init = document.createElement('script');
      init.setAttribute('data-ga-snippet', 'init');
      init.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId.replace(/'/g, "\\'")}');`;
      document.head.appendChild(init);
    }
  } catch (e) { console.warn('Analytics inject failed:', e); }

  // ========================================================
  // APPLY THEME — from content.theme (colors via CSS vars)
  // ========================================================
  try {
    const theme = content.theme || {};
    const vars = [];
    if (theme.yellow) vars.push(`--color-yellow: ${theme.yellow}`);
    if (theme.ink) vars.push(`--color-ink: ${theme.ink}`);
    if (theme.charcoal) vars.push(`--color-charcoal: ${theme.charcoal}`);
    if (theme.accent) vars.push(`--color-accent: ${theme.accent}`);
    if (vars.length) {
      let style = document.head.querySelector('style[data-theme-vars]');
      if (!style) {
        style = document.createElement('style');
        style.setAttribute('data-theme-vars', '');
        document.head.appendChild(style);
      }
      style.textContent = `:root { ${vars.join('; ')}; }`;
    }
  } catch (e) { console.warn('Theme inject failed:', e); }

  // Auto-sync services mega menu links with the real services list (so admin-added services always show in the dropdown)
  try {
    if (Array.isArray(content.services) && content.services.length && content.megaMenus && content.megaMenus.services) {
      const urlSafeSlug = (id) => (id || '').toString()
        .replace(/\s+/g, '-').replace(/[\/\\?#&=]/g, '-')
        .replace(/-+/g, '-').replace(/^-|-$/g, '');
      content.megaMenus.services.links = content.services.map(s => ({
        title: s.title || s.id || '',
        href: 'services/' + (urlSafeSlug(s.id) || encodeURIComponent(s.id || '')) + '.html'
      }));
    }
  } catch (e) { console.warn('Mega menu services sync failed:', e); }

  // Re-render footer with new site/social data (phone, email, social links)
  try {
    if (typeof renderFooter === 'function') {
      const footerEl = document.querySelector('footer.footer');
      if (footerEl) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderFooter();
        const newFooter = tmp.querySelector('footer.footer');
        if (newFooter) footerEl.replaceWith(newFooter);
      }
    }
  } catch (e) { console.warn('Footer re-render failed:', e); }

  // Re-apply translations after header/footer re-render (so new data-i18n attributes get filled)
  const reapplyTranslations = () => {
    try {
      if (typeof window.applyTranslations === 'function') {
        const lang = localStorage.getItem('lang') || 'ka';
        window.applyTranslations(lang);
      }
    } catch (e) { console.warn('Re-apply translations failed:', e); }
  };
  reapplyTranslations();

  // ========================================================
  // ABOUT PAGE — render Mission + History + Values from content.aboutPage
  // ========================================================
  try {
    if (location.pathname.includes('about') && content.aboutPage) {
      const a = content.aboutPage;
      // Apply i18n overlay for the language
      const lang = localStorage.getItem('lang') || 'ka';
      const resolve = (section) => window.resolveItemI18n ? window.resolveItemI18n(section, lang) : section;
      const hero = resolve(a.hero || {});
      const mission = resolve(a.mission || {});
      const history = resolve(a.history || {});
      const values = resolve(a.values || {});

      // Hero block
      const heroEyebrow = document.querySelector('.page-header .eyebrow');
      const heroTitle = document.querySelector('.page-header h1');
      const heroSubtitle = document.querySelector('.page-header p');
      if (heroEyebrow && hero.eyebrow) heroEyebrow.textContent = hero.eyebrow;
      if (heroTitle && (hero.titlePre || hero.titleHighlight)) {
        heroTitle.innerHTML = `${escapeHTML(hero.titlePre || '')}<br><span class="highlight">${escapeHTML(hero.titleHighlight || '')}</span>`;
      }
      if (heroSubtitle && hero.subtitle) heroSubtitle.textContent = hero.subtitle;

      // Mission block (second .section)
      const missionSection = document.querySelectorAll('.section')[1];
      if (missionSection) {
        const mEyebrow = missionSection.querySelector('.eyebrow');
        const mTitle = missionSection.querySelector('h2.display');
        const mText = missionSection.querySelector('p.lead');
        const mImg = missionSection.querySelector('.split-img img');
        const mCta = missionSection.querySelector('a.btn.btn-dark');
        const mList = missionSection.querySelector('ul.check-list');
        if (mEyebrow && mission.eyebrow) mEyebrow.textContent = mission.eyebrow;
        if (mTitle && (mission.titlePre || mission.titleHighlight)) {
          mTitle.innerHTML = `${escapeHTML(mission.titlePre || '')} <span class="highlight">${escapeHTML(mission.titleHighlight || '')}</span>`;
        }
        if (mText && mission.text) mText.textContent = mission.text;
        if (mImg && mission.image) mImg.src = mission.image;
        if (mCta && mission.ctaText) {
          mCta.innerHTML = `${escapeHTML(mission.ctaText)} <span class="btn-arrow">→</span>`;
          if (mission.ctaHref) mCta.href = mission.ctaHref;
        }
        if (mList && Array.isArray(mission.items) && mission.items.length) {
          mList.innerHTML = mission.items.map((it, i) => `
            <li><span class="check-num">${String(i + 1).padStart(2, '0')}.</span><span><strong>${escapeHTML(it.title || '')}</strong> — ${escapeHTML(it.text || '')}</span></li>
          `).join('');
        }
      }

      // History block (third .section — timeline)
      const historySections = document.querySelectorAll('.section.bg-soft');
      const historySection = historySections[0]; // first bg-soft after mission
      if (historySection) {
        const hEyebrow = historySection.querySelector('.eyebrow');
        const hTitle = historySection.querySelector('h2.display');
        const hList = historySection.querySelector('ul.check-list');
        const hImg = historySection.querySelector('.split-img img');
        if (hEyebrow && history.eyebrow) hEyebrow.textContent = history.eyebrow;
        if (hTitle && (history.titlePre || history.titleHighlight)) {
          hTitle.innerHTML = `${escapeHTML(history.titlePre || '')} <span class="highlight">${escapeHTML(history.titleHighlight || '')}</span>.`;
        }
        if (hImg && history.image) hImg.src = history.image;
        if (hList && Array.isArray(history.timeline) && history.timeline.length) {
          hList.innerHTML = history.timeline.map(it => `
            <li><span class="check-num">${escapeHTML(it.year || '')}</span><span><strong>${escapeHTML(it.title || '')}.</strong> ${escapeHTML(it.text || '')}</span></li>
          `).join('');
        }
      }

      // Values block (fourth .section — services-grid style cards)
      const valuesSection = document.querySelectorAll('.section')[3];
      if (valuesSection) {
        const vEyebrow = valuesSection.querySelector('.eyebrow');
        const vTitle = valuesSection.querySelector('h2.display');
        const vGrid = valuesSection.querySelector('.services-grid');
        if (vEyebrow && values.eyebrow) vEyebrow.textContent = values.eyebrow;
        if (vTitle && (values.titlePre || values.titleHighlight)) {
          vTitle.innerHTML = `${escapeHTML(values.titlePre || '')} <span class="highlight">${escapeHTML(values.titleHighlight || '')}</span>`;
        }
        if (vGrid && Array.isArray(values.items) && values.items.length) {
          const valueIcons = [
            '<svg class="service-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
            '<svg class="service-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
            '<svg class="service-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>'
          ];
          vGrid.innerHTML = values.items.map((it, i) => `
            <div class="service-card reveal visible ${i > 0 ? 'delay-' + Math.min(i, 3) : ''}">
              <div class="service-number">${escapeHTML(it.num || ('VALUE ' + String(i+1).padStart(2, '0')))}</div>
              ${valueIcons[i % valueIcons.length]}
              <h3>${escapeHTML(it.title || '')}</h3>
              <p>${escapeHTML(it.text || '')}</p>
            </div>
          `).join('');
        }
      }
    }
  } catch (e) { console.warn('About page render failed:', e); }

  // =====================================================================
  // LIVE CHAT WIDGET — floating action button with WhatsApp/Telegram/WeChat/Viber
  // Admin toggles each channel via content.site.chat.{whatsapp,telegram,wechat,viber}.
  // Fully inline (no external deps), rendered once, re-used across all pages.
  // =====================================================================
  try {
    const chat = (content.site && content.site.chat) || {};
    const enabled = chat.enabled !== false; // default: on if any channel is set
    const prefillRaw = (chat.prefill || '').trim();
    const greeting = chat.greeting || 'გამარჯობა! როგორ დაგეხმაროთ? 👋';
    const prefill = encodeURIComponent(prefillRaw);
    // Strip non-digit characters for phone URIs (keep + for E.164)
    const cleanPhone = (n) => (n || '').toString().replace(/[^+0-9]/g, '');

    const channels = [];
    if (chat.whatsapp) {
      channels.push({
        key: 'whatsapp',
        label: 'WhatsApp',
        desc: chat.whatsapp,
        bg: '#25D366',
        href: `https://wa.me/${cleanPhone(chat.whatsapp).replace(/^\+/, '')}${prefill ? '?text=' + prefill : ''}`,
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.463 3.488"/></svg>'
      });
    }
    if (chat.telegram) {
      const handle = chat.telegram.replace(/^@/, '').replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '');
      channels.push({
        key: 'telegram',
        label: 'Telegram',
        desc: '@' + handle,
        bg: '#229ED9',
        href: `https://t.me/${encodeURIComponent(handle)}${prefill ? '?text=' + prefill : ''}`,
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.5.5 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>'
      });
    }
    if (chat.wechat) {
      channels.push({
        key: 'wechat',
        label: 'WeChat',
        desc: chat.wechat,
        bg: '#07C160',
        href: `weixin://dl/chat?${encodeURIComponent(chat.wechat)}`,
        copy: chat.wechat, // fallback — some users will need to copy ID
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.81-.049-.164-.572-.257-1.164-.257-1.788 0-3.695 3.447-6.695 7.696-6.695.15 0 .298.008.446.018-.533-3.41-3.756-5.895-7.694-5.895zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-3.676 0-6.686 2.53-6.686 5.682 0 3.153 3.01 5.684 6.687 5.684.75 0 1.498-.106 2.181-.308a.635.635 0 0 1 .52.066l1.463.842a.261.261 0 0 0 .136.04.232.232 0 0 0 .232-.231c0-.059-.024-.116-.04-.171l-.303-1.135a.462.462 0 0 1-.015-.147.473.473 0 0 1 .185-.366c1.348-.98 2.216-2.48 2.216-4.154 0-3.153-3.01-5.682-6.687-5.682zm-2.23 2.72c.533 0 .965.432.965.964a.967.967 0 0 1-.965.964.966.966 0 0 1-.964-.964c0-.533.432-.965.964-.965zm4.463 0c.534 0 .966.432.966.964a.968.968 0 0 1-.966.964.966.966 0 0 1-.964-.964c0-.533.431-.965.964-.965z"/></svg>'
      });
    }
    if (chat.viber) {
      channels.push({
        key: 'viber',
        label: 'Viber',
        desc: chat.viber,
        bg: '#7360F2',
        href: `viber://chat?number=${encodeURIComponent(cleanPhone(chat.viber))}`,
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.293 4.177.693 6.7.623 9.82c-.06 3.11-.13 8.95 5.5 10.541h.002l-.002 2.416s-.038.975.602 1.172c.75.232 1.2-.481 1.92-1.248.391-.421.929-1.045 1.335-1.518 3.855.324 6.815-.418 7.152-.528.779-.253 5.182-.818 5.896-6.66.736-6.024-.36-9.832-2.34-11.55l-.012-.005c-.6-.55-3.002-2.3-8.37-2.32 0 0-.395-.025-1.032-.028zm1.079 1.955c.543.003.871.02.871.02 4.537.018 6.706 1.382 7.216 1.842 1.675 1.431 2.532 4.864 1.911 9.899-.596 4.877-4.165 5.184-4.823 5.396-.281.09-2.861.733-6.107.522 0 0-2.416 2.914-3.17 3.672-.118.118-.257.167-.35.142-.13-.03-.167-.186-.165-.41l.02-4.013c-4.766-1.32-4.486-6.29-4.436-8.886.06-2.598.544-4.728 2-6.167 1.96-1.772 5.477-2.035 7.111-2.044 0 0 .157-.005.39-.005zm-3.63 3.045c-.11-.01-.22.02-.306.083l.005-.004c-.15.167-.384.283-.65.35.223-.042 1.068-.005 1.395.767.267.632.446 1.36.476 1.492l.004.014c.032.133.05.312-.09.572-.137.253-.394.5-.57.657-.187.15-.35.377-.304.557.094.325.45.885.722 1.16h.005c.472.48.942.998 1.512 1.305.57.306 1.073.51 1.462.597.133.028.31.003.388-.198.077-.2.39-.535.611-.78.218-.238.445-.244.576-.21.131.033.83.373 1.41.618.58.245 1.009.414 1.146.486.205.108.37.193.38.368.012.197-.012.505-.115.867-.141.51-.945.98-1.325 1.012-.38.033-.757.18-2.59-.536-2.194-.859-3.602-3.042-3.715-3.196-.11-.148-.865-1.17-.865-2.233 0-1.063.539-1.588.73-1.823l.003-.004c.15-.164.29-.166.419-.171z"/></svg>'
      });
    }

    // Phone (Call) channel — from site.phone, uses tel: link.
    // On desktop this usually opens the OS default dialer/FaceTime/etc.
    const sitePhone = (content.site && content.site.phone) || '';
    if (sitePhone) {
      channels.unshift({
        key: 'call',
        label: 'Call',
        desc: sitePhone,
        bg: '#2e2e38',
        href: 'tel:' + cleanPhone(sitePhone),
        external: false, // tel: links don't need target=_blank
        icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
      });
    }

    // Message channel — opens the contact-form modal.
    channels.push({
      key: 'message',
      label: 'Message',
      desc: 'info@gubermangeo.com',
      bg: '#FFE600',
      fg: '#2e2e38', // dark text on yellow bg
      action: 'open-form',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
    });

    if (enabled && channels.length > 0 && !document.getElementById('chat-widget-root')) {
      const curLang = localStorage.getItem('lang') || 'ka';
      const T = {
        ka: {
          name: 'სახელი', email: 'ელ. ფოსტა', phone: 'ტელეფონი', message: 'შეტყობინება',
          send: 'გაგზავნა', sending: 'იგზავნება…',
          formTitle: 'დაგვიტოვეთ შეტყობინება',
          formSub: 'დაგიკავშირდებით 24 საათში',
          success: 'მადლობა! ჩვენ დაგიკავშირდებით 24 საათში.',
          errorValidation: 'გთხოვთ შეავსოთ სახელი და ელ.ფოსტა.',
          errorRate: 'ძალიან ბევრი მცდელობა. სცადეთ მოგვიანებით.',
          errorGeneric: 'ვერ გაიგზავნა. სცადეთ ცოტა ხანში.',
          ariaOpen: 'დახურე', ariaClosed: 'დაგვიკავშირდი',
          callLabel: 'ზარი', whatsappLabel: 'WhatsApp', telegramLabel: 'Telegram',
          viberLabel: 'Viber', wechatLabel: 'WeChat', messageLabel: 'შეტყობინება'
        },
        en: {
          name: 'Name', email: 'Email', phone: 'Phone', message: 'Message',
          send: 'Send', sending: 'Sending…',
          formTitle: 'Send us a message', formSub: "We'll reply within 24 hours",
          success: "Thanks! We'll get back to you within 24 hours.",
          errorValidation: 'Please fill in your name and email.',
          errorRate: 'Too many attempts. Please try again later.',
          errorGeneric: 'Could not send. Please try again shortly.',
          ariaOpen: 'Close', ariaClosed: 'Contact us',
          callLabel: 'Call', whatsappLabel: 'WhatsApp', telegramLabel: 'Telegram',
          viberLabel: 'Viber', wechatLabel: 'WeChat', messageLabel: 'Message'
        },
        ru: {
          name: 'Имя', email: 'Email', phone: 'Телефон', message: 'Сообщение',
          send: 'Отправить', sending: 'Отправка…',
          formTitle: 'Напишите нам', formSub: 'Ответим в течение 24 часов',
          success: 'Спасибо! Мы свяжемся с вами в течение 24 часов.',
          errorValidation: 'Пожалуйста, заполните имя и email.',
          errorRate: 'Слишком много попыток. Попробуйте позже.',
          errorGeneric: 'Не удалось отправить. Попробуйте позже.',
          ariaOpen: 'Закрыть', ariaClosed: 'Связаться',
          callLabel: 'Звонок', whatsappLabel: 'WhatsApp', telegramLabel: 'Telegram',
          viberLabel: 'Viber', wechatLabel: 'WeChat', messageLabel: 'Сообщение'
        },
        he: {
          name: 'שם', email: 'אימייל', phone: 'טלפון', message: 'הודעה',
          send: 'שלח', sending: 'שולח…',
          formTitle: 'שלח לנו הודעה', formSub: 'נענה תוך 24 שעות',
          success: 'תודה! נחזור אליכם תוך 24 שעות.',
          errorValidation: 'נא מלא שם ואימייל.',
          errorRate: 'יותר מדי ניסיונות. נסה שוב מאוחר יותר.',
          errorGeneric: 'לא נשלח. נסה שוב מעט מאוחר יותר.',
          ariaOpen: 'סגור', ariaClosed: 'צור קשר',
          callLabel: 'התקשר', whatsappLabel: 'WhatsApp', telegramLabel: 'Telegram',
          viberLabel: 'Viber', wechatLabel: 'WeChat', messageLabel: 'הודעה'
        }
      }[curLang] || {};

      // Map channel keys to localized labels
      const labelByKey = {
        call: T.callLabel, whatsapp: T.whatsappLabel, telegram: T.telegramLabel,
        viber: T.viberLabel, wechat: T.wechatLabel, message: T.messageLabel
      };

      const root = document.createElement('div');
      root.id = 'chat-widget-root';
      root.className = 'chat-widget';
      root.innerHTML = `
        <div class="chat-dial" role="menu" aria-label="Contact channels">
          ${channels.map((ch, i) => {
            const label = labelByKey[ch.key] || ch.label;
            const fg = ch.fg || '#ffffff';
            const linkAttrs = ch.action === 'open-form'
              ? `type="button" data-action="open-form"`
              : (ch.key === 'call'
                  ? `href="${ch.href}"`
                  : `href="${ch.href}" target="_blank" rel="noopener noreferrer"`)
              + (ch.copy ? ` data-copy="${escapeHTML(ch.copy)}"` : '');
            const tag = ch.action === 'open-form' ? 'button' : 'a';
            return `
              <${tag} class="chat-dial-item" ${linkAttrs}
                    style="--bg:${ch.bg}; --fg:${fg}; --delay:${i * 32}ms"
                    data-channel="${ch.key}"
                    role="menuitem"
                    aria-label="${escapeHTML(label)}">
                <span class="chat-dial-icon">${ch.icon}</span>
                <span class="chat-dial-label">${escapeHTML(label)}</span>
              </${tag}>
            `;
          }).join('')}
        </div>
        <button class="chat-fab" type="button" aria-label="${escapeHTML(T.ariaClosed)}" aria-expanded="false">
          <svg class="chat-fab-icon chat-fab-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <svg class="chat-fab-icon chat-fab-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
          <span class="chat-fab-pulse" aria-hidden="true"></span>
        </button>

        <!-- Separate modal for the contact form (opened only via the Message dial item) -->
        <div class="chat-form-modal" role="dialog" aria-modal="true" aria-label="${escapeHTML(T.formTitle)}" hidden>
          <div class="chat-form-modal-inner">
            <header class="chat-form-modal-header">
              <div>
                <strong>${escapeHTML(T.formTitle)}</strong>
                <span>${escapeHTML(T.formSub)}</span>
              </div>
              <button type="button" class="chat-form-modal-close" aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </header>
            <form class="chat-form" novalidate>
              <div class="chat-form-row">
                <input type="text" name="name" required maxlength="120" placeholder="${escapeHTML(T.name)} *" autocomplete="name" />
              </div>
              <div class="chat-form-row">
                <input type="email" name="email" required maxlength="200" placeholder="${escapeHTML(T.email)} *" autocomplete="email" />
              </div>
              <div class="chat-form-row">
                <input type="tel" name="phone" maxlength="40" placeholder="${escapeHTML(T.phone)}" autocomplete="tel" />
              </div>
              <div class="chat-form-row">
                <textarea name="message" rows="3" maxlength="5000" placeholder="${escapeHTML(T.message)}"></textarea>
              </div>
              <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;width:1px;height:1px;" aria-hidden="true" />
              <div class="chat-form-feedback" role="status" hidden></div>
              <button type="submit" class="chat-form-submit">
                <span class="chat-form-submit-text">${escapeHTML(T.send)}</span>
                <span class="chat-form-submit-arrow">→</span>
              </button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(root);

      const fab = root.querySelector('.chat-fab');
      const dial = root.querySelector('.chat-dial');
      const modal = root.querySelector('.chat-form-modal');
      const modalClose = root.querySelector('.chat-form-modal-close');

      const toggleDial = (force) => {
        const next = typeof force === 'boolean' ? force : !root.classList.contains('is-open');
        root.classList.toggle('is-open', next);
        fab.setAttribute('aria-expanded', String(next));
        fab.setAttribute('aria-label', next ? T.ariaOpen : T.ariaClosed);
      };
      const toggleModal = (force) => {
        const next = typeof force === 'boolean' ? force : modal.hidden;
        modal.hidden = !next;
        if (next) {
          const firstInput = modal.querySelector('input[name="name"]');
          setTimeout(() => firstInput && firstInput.focus(), 50);
        }
      };

      fab.addEventListener('click', (e) => { e.stopPropagation(); toggleDial(); });
      document.addEventListener('click', (e) => {
        if (root.classList.contains('is-open') && !dial.contains(e.target) && e.target !== fab && !fab.contains(e.target) && !modal.contains(e.target)) {
          toggleDial(false);
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (!modal.hidden) toggleModal(false);
          else if (root.classList.contains('is-open')) toggleDial(false);
        }
      });

      // Dial item behavior
      root.querySelectorAll('.chat-dial-item').forEach(item => {
        item.addEventListener('click', (e) => {
          const action = item.getAttribute('data-action');
          if (action === 'open-form') {
            e.preventDefault();
            toggleDial(false);
            toggleModal(true);
            return;
          }
          // WeChat fallback — copy ID so user can paste in the app
          const copy = item.getAttribute('data-copy');
          if (copy && navigator.clipboard) navigator.clipboard.writeText(copy).catch(() => {});
          // Close the dial after tapping any other channel (feels more native)
          setTimeout(() => toggleDial(false), 150);
        });
      });

      modalClose.addEventListener('click', () => toggleModal(false));
      modal.addEventListener('click', (e) => { if (e.target === modal) toggleModal(false); });

      // Form submission — posts to /api/send-contact (Zoho SMTP)
      const form = modal.querySelector('.chat-form');
      const feedback = form.querySelector('.chat-form-feedback');
      const showFeedback = (msg, kind) => {
        feedback.hidden = false;
        feedback.textContent = msg;
        feedback.classList.remove('is-success', 'is-error', 'is-info');
        feedback.classList.add('is-' + (kind || 'info'));
      };
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        if (!data.name || !data.email) {
          showFeedback(T.errorValidation, 'error');
          return;
        }
        const btn = form.querySelector('.chat-form-submit');
        const btnText = btn.querySelector('.chat-form-submit-text');
        const original = btnText.textContent;
        btn.disabled = true;
        btnText.textContent = T.sending;
        showFeedback(T.sending, 'info');
        try {
          const res = await fetch('/api/send-contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, source: 'chat-widget' })
          });
          const json = await res.json().catch(() => ({}));
          if (res.ok && json.ok) {
            showFeedback(T.success, 'success');
            form.reset();
          } else if (res.status === 429) {
            showFeedback(T.errorRate, 'error');
          } else {
            showFeedback(json.error || T.errorGeneric, 'error');
          }
        } catch (_) {
          showFeedback(T.errorGeneric, 'error');
        } finally {
          btn.disabled = false;
          btnText.textContent = original;
        }
      });
    }
  } catch (e) { console.warn('Chat widget render failed:', e); }

  // Contact page: update phone + email + address blocks from site info
  try {
    const site = content.site || {};
    if (site.phone) {
      const phoneLink = document.getElementById('contact-phone-link');
      const phoneText = document.getElementById('contact-phone-text');
      const telHref = 'tel:' + site.phone.replace(/[^+0-9]/g, '');
      if (phoneLink) phoneLink.setAttribute('href', telHref);
      if (phoneText) phoneText.textContent = site.phone;
    }
    if (site.email) {
      const emailLink = document.getElementById('contact-email-link');
      const emailText = document.getElementById('contact-email-text');
      if (emailLink) emailLink.setAttribute('href', 'mailto:' + site.email);
      if (emailText) emailText.textContent = site.email;
    }
  } catch (e) { console.warn('Contact info update failed:', e); }

  // Re-render header if content has megaMenus (to pick up admin changes)
  try {
    if (typeof renderHeader === 'function' && content.megaMenus && Object.keys(content.megaMenus).length > 0) {
      const oldHeader = document.querySelector('.header');
      const oldBackdrop = document.querySelector('.mega-backdrop');
      if (oldHeader) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderHeader();
        const nodes = [...tmp.children];
        const headerNodes = nodes.filter(n => n.classList && n.classList.contains('header'));
        if (headerNodes.length) oldHeader.replaceWith(...headerNodes);
        if (oldBackdrop) {
          const newBackdrop = nodes.find(n => n.classList && n.classList.contains('mega-backdrop'));
          if (newBackdrop) oldBackdrop.replaceWith(newBackdrop);
        }
        document.dispatchEvent(new CustomEvent('nav-rendered'));
        reapplyTranslations();
      }
    }
  } catch (e) { console.warn('Header re-render failed:', e); }

  // Merge into i18n translations
  try {
  if (window.translations?.ka) {
    const ka = window.translations.ka;
    const ALL_LANGS = ['ka', 'en', 'ru', 'he'];

    // HERO — merge into every language (uses content.hero + content.hero.i18n[lang] overrides).
    // For non-KA languages WITHOUT an override, fall back to the KA base so admin's single-language
    // edit propagates across all language tabs by default (not the hardcoded i18n.js values).
    if (content.hero) {
      const parseMark = (s) => {
        if (typeof s !== 'string') return { pre: '', highlight: '', post: '' };
        const m = s.match(/^([\s\S]*?)<mark>([\s\S]*?)<\/mark>([\s\S]*)$/);
        if (m) return { pre: m[1].trim(), highlight: m[2].trim(), post: m[3].trim() };
        return { pre: s, highlight: '', post: '' };
      };
      const stripP = (s) => (typeof s === 'string' ? s.replace(/^<p>|<\/p>$/gi, '').trim() : s);
      ALL_LANGS.forEach(lang => {
        const dict = window.translations[lang];
        if (!dict || !dict.hero) return;
        const override = (content.hero.i18n && content.hero.i18n[lang]) || {};
        // Tag — override or fall back to KA base
        const tagVal = override.tag || content.hero.tag || '';
        if (tagVal) dict.hero.tag = tagVal;
        // Title — single string with <mark> → split into pre/highlight/post
        const titleVal = override.title || content.hero.title || '';
        if (titleVal) {
          const parts = parseMark(titleVal);
          // Always write all three (even empty) so stale hardcoded remnants don't leak through
          dict.hero.title_pre = parts.pre || '';
          dict.hero.title_highlight = parts.highlight || '';
          dict.hero.title_post = parts.post || '';
        }
        // Subtitle
        const subVal = override.subtitle || content.hero.subtitle || '';
        if (subVal) dict.hero.subtitle = stripP(subVal);
        // CTA texts
        const primaryText = (override.primaryCta && override.primaryCta.text) ||
                            (content.hero.primaryCta && content.hero.primaryCta.text) || '';
        if (primaryText) dict.hero.cta_primary = primaryText;
        const secondaryText = (override.secondaryCta && override.secondaryCta.text) ||
                              (content.hero.secondaryCta && content.hero.secondaryCta.text) || '';
        if (secondaryText) dict.hero.cta_secondary = secondaryText;
      });
    }

    // Pricing
    if (content.pricing) {
      ka.pricing.monthly = content.pricing.monthly || ka.pricing.monthly;
      ka.pricing.popular = content.pricing.popular || ka.pricing.popular;
      ka.pricing.cta_start = content.pricing.ctaStart || ka.pricing.cta_start;
      if (content.pricing.plans?.length) {
        ka.pricing.plans = content.pricing.plans.map(p => ({
          name: p.name,
          desc: p.description,
          price: p.price,
          currency: p.currency,
          features: p.features || [],
          badge: p.featured ? (content.pricing.popular || "POPULAR") : ""
        }));
      }
    }

    // Testimonials
    if (content.testimonials?.length) {
      ka.testimonials.items = content.testimonials.map(t => ({
        quote: t.quote,
        author: t.author,
        role: t.role
      }));
    }

    // FAQ
    if (content.faq?.length) {
      ka.faq.items = content.faq.map(f => ({ q: f.question, a: f.answer }));
    }

    // Services (translations keys) — create entries for NEW services too, in ALL languages
    if (content.services?.length) {
      const LANGS = ['ka', 'en', 'ru', 'he'];
      content.services.forEach(s => {
        LANGS.forEach(lang => {
          const dict = window.translations[lang];
          if (!dict || !dict.services) return;
          if (!dict.services[s.id]) dict.services[s.id] = { title: '', desc: '' };
          // Pick language-specific value from service.i18n[lang], else fall back to KA base
          const i18nOverride = (s.i18n && s.i18n[lang]) || {};
          dict.services[s.id].title = i18nOverride.title || s.title || dict.services[s.id].title;
          dict.services[s.id].desc = i18nOverride.shortDesc || s.shortDesc || dict.services[s.id].desc;
        });
      });
    }

    // Footer
    if (content.footer?.about) {
      ka.footer.about = content.footer.about;
    }
    if (content.site?.address) ka.footer.address = content.site.address;
    if (content.site?.hours) ka.footer.hours = content.site.hours;
    if (content.site?.copyright) ka.footer.copyright = content.site.copyright;
  }
  } catch (e) { console.warn('i18n merge failed:', e); }

  // Fire event so pages can re-render if needed
  document.dispatchEvent(new CustomEvent('content-loaded', { detail: content }));

  // Re-apply translations if already initialized
  if (typeof applyTranslations === 'function') {
    const lang = localStorage.getItem('lang') || 'ka';
    applyTranslations(lang);
  }

  // ===== Hero direct DOM updates (language-aware) =====
  // These write clean HTML (no stale comma/<br> between spans) and override whatever
  // applyTranslations put in. We resolve the current language's override, falling back to the KA base.
  if (content.hero) {
    const curLang = localStorage.getItem('lang') || 'ka';
    const heroOverride = (content.hero.i18n && content.hero.i18n[curLang]) || {};
    const pick = (fieldPath) => {
      // e.g. 'primaryCta.text' — walk override first, then KA base
      const parts = fieldPath.split('.');
      const walk = (obj) => parts.reduce((v, k) => (v == null ? v : v[k]), obj);
      return walk(heroOverride) || walk(content.hero) || '';
    };

    const heroTitle = document.querySelector('.hero-content h1');
    const titleStr = pick('title');
    if (heroTitle && titleStr) {
      heroTitle.innerHTML = String(titleStr)
        .replace(/<mark>/g, '<span class="highlight">')
        .replace(/<\/mark>/g, '</span>');
    }
    const heroSub = document.querySelector('.hero-sub');
    const subStr = pick('subtitle');
    if (heroSub && subStr) {
      heroSub.textContent = String(subStr).replace(/^<p>|<\/p>$/gi, '').trim();
    }
    const heroTag = document.querySelector('.hero-tag');
    const tagStr = pick('tag');
    if (heroTag && tagStr) {
      heroTag.textContent = tagStr;
    }
    const heroBg = document.querySelector('.hero-bg img');
    if (heroBg && content.hero.bgImage) {
      // Set src; add onerror fallback to GitHub raw URL in case Vercel hasn't propagated yet
      const vercelUrl = content.hero.bgImage;
      heroBg.onerror = function () {
        const m = vercelUrl.match(/^https:\/\/(?:gubermangeo\.com|[a-z0-9-]+\.vercel\.app)\/(.+)$/i);
        if (m && heroBg.src === vercelUrl) {
          heroBg.src = `https://raw.githubusercontent.com/chaba17/audit-company/main/${m[1]}`;
        }
      };
      heroBg.src = vercelUrl;
    }
    const heroPrimary = document.querySelector('.hero-actions .btn-yellow');
    const primaryText = pick('primaryCta.text');
    if (heroPrimary && primaryText) {
      if (content.hero.primaryCta && content.hero.primaryCta.href) heroPrimary.href = content.hero.primaryCta.href;
      const arrow = heroPrimary.querySelector('.btn-arrow');
      heroPrimary.innerHTML = '';
      heroPrimary.append(document.createTextNode(primaryText + ' '));
      if (arrow) heroPrimary.append(arrow);
    }
    const heroSecondary = document.querySelector('.hero-actions .btn-outline-light');
    const secondaryText = pick('secondaryCta.text');
    if (heroSecondary && secondaryText) {
      if (content.hero.secondaryCta && content.hero.secondaryCta.href) heroSecondary.href = content.hero.secondaryCta.href;
      heroSecondary.textContent = secondaryText;
    }
  }

  // Stats (homepage)
  const statsItems = document.querySelectorAll('.stat-big-item');
  if (statsItems.length && content.stats?.length) {
    statsItems.forEach((item, i) => {
      if (content.stats[i]) {
        const val = item.querySelector('.stat-big-value');
        const lbl = item.querySelector('.stat-big-label');
        if (val) val.textContent = content.stats[i].value;
        if (lbl) lbl.textContent = content.stats[i].label;
      }
    });
  }

  // Industries (homepage)
  const industryCards = document.querySelectorAll('.industry-card');
  if (industryCards.length && content.industries?.length) {
    industryCards.forEach((card, i) => {
      if (content.industries[i]) {
        const h4 = card.querySelector('h4');
        const p = card.querySelector('p');
        if (h4) h4.textContent = content.industries[i].title;
        if (p) p.textContent = content.industries[i].description;
      }
    });
  }

  // Team (about page) — fully dynamic, re-renders the whole grid
  if (location.pathname.includes('about') && content.team?.length) {
    const teamSection = document.querySelector('.section.bg-soft .insights-grid');
    if (teamSection) {
      teamSection.innerHTML = content.team.map((m, i) => `
        <div class="insight-card reveal visible ${i > 0 ? 'delay-' + Math.min(i, 3) : ''}">
          <div class="insight-img"><img src="${m.photo || ''}" alt="${m.name || ''}" /></div>
          <div class="insight-meta">
            <span class="tag">${(m.role || '').toUpperCase()}</span>
            ${m.tag ? `<span>· ${m.tag}</span>` : ''}
          </div>
          <h3>${m.name || ''}</h3>
          <p>${m.bio || ''}</p>
        </div>
      `).join('');
    }
  }

  // Blog grid (blog page) — fully dynamic
  if (location.pathname.includes('blog') && content.blog?.length) {
    const blogGrid = document.querySelector('.insights-grid');
    if (blogGrid) {
      // Featured = first post with featured=true, or first overall
      const featured = content.blog.find(b => b.featured) || content.blog[0];
      const rest = content.blog.filter(b => b !== featured);

      // Update featured (link on top)
      const featuredLink = document.querySelector('section.section .reveal[style*="grid-template-columns"]');
      if (featuredLink && featured) {
        const img = featuredLink.querySelector('img');
        const tag = featuredLink.querySelector('.tag');
        const meta = featuredLink.querySelectorAll('.insight-meta > span');
        const h2 = featuredLink.querySelector('h2');
        const p = featuredLink.querySelector('p');
        if (img) img.src = featured.image || '';
        if (tag) tag.textContent = 'FEATURED · ' + (featured.category || '').toUpperCase();
        if (meta[1]) meta[1].textContent = featured.date || '';
        if (meta[2]) meta[2].textContent = '· ' + (featured.readTime || '');
        if (h2) h2.innerHTML = featured.title || '';
        if (p) p.textContent = featured.excerpt || '';
      }

      // Render rest in grid
      blogGrid.innerHTML = rest.map((b, i) => `
        <a href="#" class="insight-card reveal visible ${i > 0 ? 'delay-' + Math.min(i, 3) : ''}">
          <div class="insight-img"><img src="${b.image || ''}" alt="${b.title || ''}" /></div>
          <div class="insight-meta">
            <span class="tag">${(b.category || '').toUpperCase()}</span>
            <span>${b.date || ''}</span>
            ${b.readTime ? `<span>· ${b.readTime}</span>` : ''}
          </div>
          <h3>${b.title || ''}</h3>
          <p>${b.excerpt || ''}</p>
        </a>
      `).join('');
    }
  }

  // Services — replace window.SERVICES + re-render grids
  if (content.services?.length) {
    // Build new SERVICES array with all services from content.json
    window.SERVICES = content.services.map(s => ({
      slug: s.id,
      key: `services.${s.id}`,
      icon: s.icon || 'book-open',
      title: s.title,
      shortDesc: s.shortDesc
    }));

    // Helper to render a service card
    const renderServiceCard = (s, i, limit) => {
      const icons = window.ICONS || {};
      const arrowIcon = icons['arrow-right-sm'] || '→';
      const iconHtml = icons[s.icon] || '';
      // Slugify URL on the fly so links stay ASCII-safe even if admin-entered id has spaces/special chars
      const urlSlug = (s.slug || '').replace(/\s+/g, '-').replace(/[\/\\?#&=]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const serviceUrl = `services/${urlSlug || encodeURIComponent(s.slug)}.html`;
      const num = String(i + 1).padStart(2, '0');
      const total = String(limit).padStart(2, '0');
      return `
        <div class="service-card reveal visible">
          <div class="service-number">${num} / ${total}</div>
          <div class="service-icon">${iconHtml}</div>
          <h3>${s.title || ''}</h3>
          <p>${s.shortDesc || ''}</p>
          <a href="${serviceUrl}" class="service-link">
            <span>გაიგე მეტი</span>
            ${arrowIcon}
          </a>
        </div>
      `;
    };

    // Detect which grid this page should render
    const isHome = location.pathname === '/' || location.pathname.includes('index');
    const isServicesPage = location.pathname.includes('services.html')
      || location.pathname === '/services'
      || location.pathname === '/services/';

    const renderServicesGrid = () => {
      const servicesEl = document.getElementById('services-grid');
      if (!servicesEl) return;
      if (isHome) {
        const first = window.SERVICES.slice(0, 6);
        servicesEl.innerHTML = first.map((s, i) => renderServiceCard(s, i, first.length)).join('');
      } else if (isServicesPage) {
        servicesEl.innerHTML = window.SERVICES.map((s, i) => renderServiceCard(s, i, window.SERVICES.length)).join('');
      }
    };

    // Render immediately
    renderServicesGrid();
    // Re-render after inline page scripts finish (some pages have setTimeout 50ms inline renderers)
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => setTimeout(renderServicesGrid, 120));
    } else {
      setTimeout(renderServicesGrid, 120);
    }
  }

  // Industries (home page) — fully dynamic
  if (content.industries?.length) {
    const indGrid = document.querySelector('.industries-grid');
    if (indGrid) {
      indGrid.innerHTML = content.industries.map((ind, i) => `
        <div class="industry-card reveal visible ${i > 0 ? 'delay-' + Math.min(i % 4, 3) : ''}">
          <svg class="industry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect width="16" height="16" x="4" y="4" rx="2"/></svg>
          <h4>${ind.title || ''}</h4>
          <p>${ind.description || ''}</p>
          <svg class="industry-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      `).join('');
    }
  }

  // Homepage insights grid — replace hardcoded Unsplash placeholders with
  // admin's real blog posts (first 3). Uses admin's own WebP-optimized images
  // instead of pulling ~600KB of Unsplash JPEGs for every visitor.
  // SEO wins: proper alt text, real content, no external image dependency.
  const isHomepagePath = location.pathname === '/' ||
    location.pathname.endsWith('/index.html') || location.pathname.endsWith('/index');
  if (isHomepagePath && Array.isArray(content.blog) && content.blog.length > 0) {
    const insightsGrid = document.querySelector('section.section .insights-grid');
    if (insightsGrid) {
      const lang = localStorage.getItem('lang') || 'ka';
      const resolve = (b) => window.resolveItemI18n ? window.resolveItemI18n(b, lang) : b;
      const posts = content.blog.slice(0, 3).map(resolve);
      insightsGrid.innerHTML = posts.map((b, i) => `
        <a href="blog.html${b.slug ? '#' + encodeURIComponent(b.slug) : ''}" class="insight-card reveal visible ${i > 0 ? 'delay-' + Math.min(i, 3) : ''}">
          ${b.image ? `<div class="insight-img"><img src="${escapeHTML(b.image)}" alt="${escapeHTML(b.title || '')}" loading="lazy" decoding="async" width="800" height="500" /></div>` : ''}
          <div class="insight-meta">
            <span class="tag">${escapeHTML((b.category || '').toString().toUpperCase())}</span>
            ${b.date ? `<span>${escapeHTML(b.date)}</span>` : ''}
            ${b.readTime ? `<span>· ${escapeHTML(b.readTime)}</span>` : ''}
          </div>
          <h3>${escapeHTML(b.title || '')}</h3>
          <p>${escapeHTML((b.excerpt || '').substring(0, 160))}</p>
          <span class="insight-link">წაიკითხე →</span>
        </a>
      `).join('');
    }
  }
})();
