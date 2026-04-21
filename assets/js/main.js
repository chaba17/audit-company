/* ==========================================================
   Audit Company — UI interactions (Mega menu + Mobile drawer)
   ========================================================== */

function initNav() {
  // Sticky header shadow on scroll
  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    // Remove old listener if any (simple guard)
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ====== MEGA MENU (desktop) ======
  const megaTriggers = document.querySelectorAll(".has-mega");
  const backdrop = document.querySelector(".mega-backdrop");

  const closeAllMegas = () => {
    megaTriggers.forEach(t => t.classList.remove("open"));
    if (backdrop) backdrop.classList.remove("active");
  };

  megaTriggers.forEach(trigger => {
    const link = trigger.querySelector(".nav-link");
    if (!link) return;

    // Click to toggle (works on touch and mouse)
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = trigger.classList.contains("open");
      closeAllMegas();
      if (!isOpen) {
        trigger.classList.add("open");
        if (backdrop && window.innerWidth > 1100) backdrop.classList.add("active");
      }
    });

    // Hover (desktop only)
    trigger.addEventListener("mouseenter", () => {
      if (window.innerWidth > 1100) {
        closeAllMegas();
        trigger.classList.add("open");
        if (backdrop) backdrop.classList.add("active");
      }
    });
    trigger.addEventListener("mouseleave", () => {
      if (window.innerWidth > 1100) {
        trigger.classList.remove("open");
        if (backdrop) backdrop.classList.remove("active");
      }
    });
  });

  // Click outside → close
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".has-mega") && !e.target.closest(".mega-menu")) {
      closeAllMegas();
    }
  });

  // ESC key → close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllMegas();
      if (document.body.classList.contains("nav-open")) closeMenu();
    }
  });

  // ====== MOBILE NAV DRAWER ======
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");

  let closeMenu = () => {};

  if (navToggle && navMenu) {
    closeMenu = () => {
      navMenu.classList.remove("open");
      navToggle.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
      closeAllMegas();
    };
    const openMenu = () => {
      navMenu.classList.add("open");
      navToggle.classList.add("active");
      navToggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("nav-open");
    };

    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.contains("open");
      if (isOpen) closeMenu(); else openMenu();
    });

    // Close on link click inside menu (simple links, not dropdown toggles)
    navMenu.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link && !link.closest(".nav-link")) closeMenu();
    });

    // Close on resize to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1100 && navMenu.classList.contains("open")) closeMenu();
    });
  }

  // Backdrop click closes mega
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeAllMegas();
    });
  }

  // ====== LANGUAGE DROPDOWN ======
  const localeWrap = document.querySelector(".nav-locale-wrap");
  const localeBtn = localeWrap?.querySelector(".nav-locale");
  if (localeWrap && localeBtn) {
    localeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = localeWrap.classList.toggle("open");
      localeBtn.setAttribute("aria-expanded", String(isOpen));
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav-locale-wrap")) {
        localeWrap.classList.remove("open");
        localeBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ====== SEARCH (header button → modal overlay with live results) ======
  initSearch();
}

// ====================================================================
// SEARCH — builds a live index from window.SITE_CONTENT and opens
// a modal overlay when the header .nav-search button is clicked.
// The overlay is rendered once and reused; the index is rebuilt when
// the content-loaded event fires (so admin-added items appear immediately).
// ====================================================================
function initSearch() {
  const searchBtns = document.querySelectorAll(".nav-search");
  if (!searchBtns.length) return;

  // Clear any leftover inline hide (older code versions hid the button when
  // admin's search.enabled flag was false; we now always show and let the
  // admin control placeholder / no-results text instead).
  searchBtns.forEach(b => { b.style.display = ""; });

  // ---- Build or reuse the modal ----
  let overlay = document.getElementById("site-search-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "site-search-overlay";
    overlay.className = "search-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Search");
    overlay.innerHTML = `
      <div class="search-modal" role="document">
        <div class="search-modal-inner">
          <div class="search-input-wrap">
            <svg class="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="search" id="site-search-input" autocomplete="off" spellcheck="false" />
            <button type="button" class="search-close" aria-label="Close">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="search-results" id="site-search-results" role="listbox"></div>
          <div class="search-hint">
            <span><kbd>↑</kbd><kbd>↓</kbd> ნავიგაცია</span>
            <span><kbd>↵</kbd> არჩევა</span>
            <span><kbd>Esc</kbd> დახურვა</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const input = overlay.querySelector("#site-search-input");
  const resultsEl = overlay.querySelector("#site-search-results");
  const closeBtn = overlay.querySelector(".search-close");

  // ---- Build the search index from SITE_CONTENT ----
  let index = [];
  const buildIndex = () => {
    const c = window.SITE_CONTENT || {};
    const lang = localStorage.getItem("lang") || "ka";
    const resolveI18n = (item) =>
      (typeof window.resolveItemI18n === "function" ? window.resolveItemI18n(item, lang) : item);

    const urlSafeSlug = (id) => (id || "").toString()
      .replace(/\s+/g, "-").replace(/[\/\\?#&=]/g, "-")
      .replace(/-+/g, "-").replace(/^-|-$/g, "");

    // Relative path prefix: /services/ pages need '../' to link to root pages.
    const prefix = location.pathname.includes("/services/") ? "../" : "";

    const rows = [];
    (c.services || []).forEach(s => {
      const it = resolveI18n(s);
      rows.push({
        type: "service",
        typeLabel: { ka: "სერვისი", en: "Service", ru: "Услуга", he: "שירות" }[lang] || "Service",
        title: it.title || it.id || "",
        excerpt: it.shortDesc || it.description || "",
        url: `${prefix}services/${urlSafeSlug(it.id) || encodeURIComponent(it.id || "")}.html`
      });
    });
    (c.blog || []).forEach(b => {
      const it = resolveI18n(b);
      rows.push({
        type: "blog",
        typeLabel: { ka: "ბლოგი", en: "Blog", ru: "Блог", he: "בלוג" }[lang] || "Blog",
        title: it.title || "",
        excerpt: it.excerpt || "",
        url: `${prefix}blog.html${it.slug ? "#" + encodeURIComponent(it.slug) : ""}`
      });
    });
    (c.faq || []).forEach(f => {
      const it = resolveI18n(f);
      rows.push({
        type: "faq",
        typeLabel: "FAQ",
        title: it.question || "",
        excerpt: it.answer || "",
        url: `${prefix}index.html#faq`
      });
    });
    (c.industries || []).forEach(i => {
      const it = resolveI18n(i);
      rows.push({
        type: "industry",
        typeLabel: { ka: "ინდუსტრია", en: "Industry", ru: "Индустрия", he: "תעשייה" }[lang] || "Industry",
        title: it.title || "",
        excerpt: it.description || "",
        url: `${prefix}index.html#industries`
      });
    });
    // Pre-lowercase once for fast matching
    index = rows.map(r => ({
      ...r,
      _titleLc: (r.title || "").toLowerCase(),
      _excerptLc: (r.excerpt || "").toLowerCase()
    }));
  };

  buildIndex();
  // Rebuild when content-loader finishes fetching (covers first load before
  // SITE_CONTENT was populated) and on language change (lang-changed reloads
  // the page, but this is a cheap safety net).
  document.addEventListener("content-loaded", buildIndex);
  document.addEventListener("lang-changed", buildIndex);

  // ---- Apply admin-configured placeholder + no-results text ----
  const applyConfig = () => {
    const cur = (window.SITE_CONTENT && window.SITE_CONTENT.search) || {};
    const lang = localStorage.getItem("lang") || "ka";
    const fallbackPlaceholder = {
      ka: "მოძებნე სერვისი ან ინფორმაცია...",
      en: "Search services or information...",
      ru: "Найти услугу или информацию...",
      he: "חפש שירות או מידע..."
    }[lang] || "Search...";
    input.placeholder = cur.placeholder || fallbackPlaceholder;
    input.setAttribute("aria-label", fallbackPlaceholder);
  };
  applyConfig();
  document.addEventListener("content-loaded", applyConfig);
  document.addEventListener("lang-changed", applyConfig);

  // ---- Searching ----
  let selectedIdx = -1;
  const highlight = (text, query) => {
    if (!query || !text) return escapeHTML(text || "");
    const q = query.toLowerCase();
    const lcText = text.toLowerCase();
    const idx = lcText.indexOf(q);
    if (idx < 0) return escapeHTML(text);
    return escapeHTML(text.slice(0, idx))
      + '<mark>' + escapeHTML(text.slice(idx, idx + q.length)) + '</mark>'
      + escapeHTML(text.slice(idx + q.length));
  };

  const escapeHTML = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const render = (query) => {
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      resultsEl.innerHTML = "";
      selectedIdx = -1;
      return;
    }
    // Match on title (priority 2) + excerpt (priority 1). Cap at 20.
    const matches = [];
    for (const row of index) {
      const titleHit = row._titleLc.includes(q);
      const excerptHit = row._excerptLc.includes(q);
      if (titleHit || excerptHit) {
        matches.push({ row, score: (titleHit ? 2 : 0) + (excerptHit ? 1 : 0) });
      }
    }
    matches.sort((a, b) => b.score - a.score);
    const top = matches.slice(0, 20);

    if (!top.length) {
      const cur = (window.SITE_CONTENT && window.SITE_CONTENT.search) || {};
      const lang = localStorage.getItem("lang") || "ka";
      const fallbackNoResults = {
        ka: "შედეგი ვერ მოიძებნა",
        en: "No results found",
        ru: "Ничего не найдено",
        he: "לא נמצאו תוצאות"
      }[lang] || "No results found";
      const msg = cur.noResultsText || fallbackNoResults;
      resultsEl.innerHTML = `<div class="search-no-results">${escapeHTML(msg)}</div>`;
      selectedIdx = -1;
      return;
    }
    resultsEl.innerHTML = top.map((m, i) => `
      <a href="${escapeHTML(m.row.url)}" class="search-result" role="option" data-idx="${i}">
        <span class="search-result-type">${escapeHTML(m.row.typeLabel)}</span>
        <span class="search-result-title">${highlight(m.row.title, q)}</span>
        ${m.row.excerpt ? `<span class="search-result-excerpt">${highlight(m.row.excerpt.slice(0, 140), q)}</span>` : ""}
      </a>
    `).join("");
    selectedIdx = 0;
    updateSelection();
  };

  const updateSelection = () => {
    const items = resultsEl.querySelectorAll(".search-result");
    items.forEach((el, i) => {
      el.classList.toggle("is-selected", i === selectedIdx);
      if (i === selectedIdx) el.scrollIntoView({ block: "nearest" });
    });
  };

  // ---- Open / close ----
  let prevActive = null;
  const open = () => {
    prevActive = document.activeElement;
    overlay.classList.add("is-open");
    document.body.classList.add("has-search-open");
    // Defer focus so keyboard doesn't capture the triggering click
    setTimeout(() => input.focus(), 20);
  };
  const close = () => {
    overlay.classList.remove("is-open");
    document.body.classList.remove("has-search-open");
    input.value = "";
    resultsEl.innerHTML = "";
    selectedIdx = -1;
    if (prevActive && typeof prevActive.focus === "function") prevActive.focus();
  };

  // Wire up ALL nav-search buttons (header may have a mobile duplicate)
  searchBtns.forEach(btn => {
    // Avoid double-binding on re-renders
    if (btn.dataset.searchBound === "1") return;
    btn.dataset.searchBound = "1";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      open();
    });
  });

  if (closeBtn && closeBtn.dataset.bound !== "1") {
    closeBtn.dataset.bound = "1";
    closeBtn.addEventListener("click", close);
  }

  // Click outside .search-modal → close
  if (overlay.dataset.bound !== "1") {
    overlay.dataset.bound = "1";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }

  // Keyboard: Esc to close, arrow keys to navigate, Enter to open
  if (input.dataset.bound !== "1") {
    input.dataset.bound = "1";
    let debounce;
    input.addEventListener("input", (e) => {
      clearTimeout(debounce);
      const q = e.target.value;
      debounce = setTimeout(() => render(q), 80);
    });
    input.addEventListener("keydown", (e) => {
      const items = resultsEl.querySelectorAll(".search-result");
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (!items.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIdx = (selectedIdx + 1) % items.length;
        updateSelection();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIdx = (selectedIdx - 1 + items.length) % items.length;
        updateSelection();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = items[selectedIdx];
        if (target && target.href) location.href = target.href;
      }
    });
  }

  // Global: Ctrl/Cmd + K or "/" opens search from anywhere
  if (!window.__searchShortcutBound) {
    window.__searchShortcutBound = true;
    document.addEventListener("keydown", (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); open(); return; }
      if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || "")) {
        e.preventDefault(); open();
      }
    });
  }
}

window.initSearch = initSearch;

// Expose globally so content-loader can call after re-render
window.initNav = initNav;

document.addEventListener("DOMContentLoaded", () => {
  initNav();

  // Re-init nav when content-loader re-renders header
  document.addEventListener("nav-rendered", () => initNav());

  // Safety net: after 1.5s, make ALL remaining .reveal elements visible
  // (content is visible even if IntersectionObserver missed some)
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      el.classList.add('visible');
    });
  }, 1500);

  // MutationObserver: any dynamically-added .reveal gets .visible after a frame
  const mutObs = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        // Check if added node or its descendants have .reveal
        const reveals = node.classList?.contains('reveal')
          ? [node]
          : [...(node.querySelectorAll?.('.reveal') || [])];
        reveals.forEach(el => {
          if (!el.classList.contains('visible')) {
            requestAnimationFrame(() => el.classList.add('visible'));
          }
        });
      });
    });
  });
  mutObs.observe(document.body, { childList: true, subtree: true });

  // Intersection Observer for scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

  // Stat counter animation
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count || el.textContent, 10);
      const suffix = el.dataset.suffix || "";
      let current = 0;
      const step = Math.max(1, Math.floor(target / 50));
      const tick = () => {
        current += step;
        if (current >= target) { el.textContent = target.toLocaleString() + suffix; return; }
        el.textContent = current.toLocaleString() + suffix;
        requestAnimationFrame(tick);
      };
      tick();
      statObserver.unobserve(el);
    });
  }, { threshold: 0.3 });
  document.querySelectorAll("[data-count]").forEach(el => statObserver.observe(el));

  // Contact form — POST to /api/send-contact (Zoho SMTP via Vercel function)
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const feedbackEl = document.getElementById("contact-form-feedback");
    const showFeedback = (msg, type) => {
      if (!feedbackEl) return;
      const colors = {
        success: { bg: '#f0fdf4', border: '#10B981', text: '#065f46' },
        error:   { bg: '#fef2f2', border: '#EF4444', text: '#991b1b' },
        info:    { bg: '#eff6ff', border: '#3B82F6', text: '#1e3a8a' }
      }[type] || { bg: '#fef9c3', border: '#FFE600', text: '#713f12' };
      feedbackEl.style.display = 'block';
      feedbackEl.style.background = colors.bg;
      feedbackEl.style.borderLeftColor = colors.border;
      feedbackEl.style.color = colors.text;
      feedbackEl.textContent = msg;
    };

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const lang = localStorage.getItem("lang") || document.documentElement.lang || "ka";
      const T = ({
        ka: {
          sending: "იგზავნება…",
          success: "მადლობა! დაგიკავშირდებით 24 საათში.",
          errorValidation: "გთხოვთ შეავსოთ სახელი და ელ.ფოსტა.",
          errorRate: "ძალიან ბევრი მცდელობა. სცადეთ მოგვიანებით.",
          errorGeneric: "ვერ გაიგზავნა. სცადეთ ცოტა ხანში."
        },
        en: {
          sending: "Sending…",
          success: "Thanks! We'll get back to you within 24 hours.",
          errorValidation: "Please fill in your name and email.",
          errorRate: "Too many attempts. Please try again later.",
          errorGeneric: "Could not send. Please try again shortly."
        }
      })[lang] || {};

      const data = Object.fromEntries(new FormData(contactForm).entries());
      if (!data.name || !data.email) {
        showFeedback(T.errorValidation, 'error');
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalDisabled = submitBtn?.disabled;
      if (submitBtn) submitBtn.disabled = true;
      showFeedback(T.sending, 'info');

      try {
        const res = await fetch('/api/send-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.ok) {
          showFeedback(T.success, 'success');
          contactForm.reset();
        } else if (res.status === 429) {
          showFeedback(T.errorRate, 'error');
        } else {
          showFeedback(json.error || T.errorGeneric, 'error');
        }
      } catch (err) {
        showFeedback(T.errorGeneric, 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = originalDisabled || false;
      }
    });
  }
});
