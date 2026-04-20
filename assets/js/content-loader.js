/* ==========================================================
   Content Loader — fetches content.json from repo
   Overrides static content so admin edits appear live on the site
   ========================================================== */

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

  // Merge into i18n translations (only Georgian — English stays fallback)
  try {
  if (window.translations?.ka) {
    const ka = window.translations.ka;

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

  // Update hero on homepage
  const heroTitle = document.querySelector('.hero-content h1');
  if (heroTitle && content.hero?.title) {
    heroTitle.innerHTML = content.hero.title
      .replace(/<mark>/g, '<span class="highlight">')
      .replace(/<\/mark>/g, '</span>');
  }
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub && content.hero?.subtitle) {
    heroSub.textContent = content.hero.subtitle;
  }
  const heroTag = document.querySelector('.hero-tag');
  if (heroTag && content.hero?.tag) {
    heroTag.textContent = content.hero.tag;
  }
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg && content.hero?.bgImage) {
    heroBg.src = content.hero.bgImage;
  }
  const heroPrimary = document.querySelector('.hero-actions .btn-yellow');
  if (heroPrimary && content.hero?.primaryCta) {
    heroPrimary.href = content.hero.primaryCta.href;
    const arrow = heroPrimary.querySelector('.btn-arrow');
    heroPrimary.innerHTML = '';
    heroPrimary.append(document.createTextNode(content.hero.primaryCta.text + ' '));
    if (arrow) heroPrimary.append(arrow);
  }
  const heroSecondary = document.querySelector('.hero-actions .btn-outline-light');
  if (heroSecondary && content.hero?.secondaryCta) {
    heroSecondary.href = content.hero.secondaryCta.href;
    heroSecondary.textContent = content.hero.secondaryCta.text;
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
})();
