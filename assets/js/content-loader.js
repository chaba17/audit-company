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

    // Services (translations keys) — create entries for NEW services too
    if (content.services?.length) {
      content.services.forEach(s => {
        if (!ka.services[s.id]) ka.services[s.id] = { title: '', desc: '' };
        ka.services[s.id].title = s.title;
        ka.services[s.id].desc = s.shortDesc;
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
      const serviceUrl = `services/${s.slug}.html`;
      return `
        <div class="service-card reveal visible">
          <div class="service-number">0${i + 1} / ${String(limit).padStart(2,'0')}</div>
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

    // Home page services grid — show first 6
    if (location.pathname === '/' || location.pathname.includes('index')) {
      const servicesEl = document.getElementById('services-grid');
      if (servicesEl) {
        const first = window.SERVICES.slice(0, 6);
        servicesEl.innerHTML = first.map((s, i) => renderServiceCard(s, i, first.length)).join('');
      }
    }

    // Services page — show all
    if (location.pathname.includes('services.html') || location.pathname === '/services') {
      const servicesEl = document.getElementById('services-grid');
      if (servicesEl) {
        servicesEl.innerHTML = window.SERVICES.map((s, i) => renderServiceCard(s, i, window.SERVICES.length)).join('');
      }
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
