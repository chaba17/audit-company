/* ==========================================================
   Content Loader — fetches content.json from repo
   Overrides static content so admin edits appear live on the site
   ========================================================== */

(async () => {
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

  // Merge into i18n translations (only Georgian — English stays fallback)
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

    // Services (translations keys)
    if (content.services?.length) {
      content.services.forEach(s => {
        if (ka.services[s.id]) {
          ka.services[s.id].title = s.title;
          ka.services[s.id].desc = s.shortDesc;
        }
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

  // Team (about page)
  const teamCards = document.querySelectorAll('.insights-grid .insight-card');
  if (teamCards.length && content.team?.length && location.pathname.includes('about')) {
    teamCards.forEach((card, i) => {
      if (content.team[i]) {
        const img = card.querySelector('img');
        const tag = card.querySelector('.tag');
        const h3 = card.querySelector('h3');
        const p = card.querySelector('p');
        if (img && content.team[i].photo) img.src = content.team[i].photo;
        if (tag) tag.textContent = content.team[i].role.toUpperCase();
        if (h3) h3.textContent = content.team[i].name;
        if (p) p.textContent = content.team[i].bio;
      }
    });
  }

  // Blog grid (blog page)
  const blogCards = document.querySelectorAll('.insights-grid .insight-card');
  if (blogCards.length && content.blog?.length && location.pathname.includes('blog')) {
    blogCards.forEach((card, i) => {
      const b = content.blog[i + 1]; // first is featured
      if (b) {
        const img = card.querySelector('img');
        const tag = card.querySelector('.tag');
        const h3 = card.querySelector('h3');
        const p = card.querySelector('p');
        if (img && b.image) img.src = b.image;
        if (tag) tag.textContent = b.category.toUpperCase();
        if (h3) h3.textContent = b.title;
        if (p) p.textContent = b.excerpt;
      }
    });
  }
})();
