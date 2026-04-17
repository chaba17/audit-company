/* ==========================================================
   Admin Panel — Main Logic
   Auth + CRUD + Forms + Export/Import
   ========================================================== */

(() => {
  // ====== STATE ======
  const STORAGE_KEY = 'audit_admin_content';
  const AUTH_KEY = 'audit_admin_auth';
  const PASSWORD_KEY = 'audit_admin_password';
  const DEFAULT_PASSWORD = 'admin';
  const AUTH_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  let state = {
    content: null,
    currentSection: 'dashboard',
    isDirty: false
  };

  // ====== UTILITIES ======
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function toast(message, type = 'success', duration = 3000) {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = {
      success: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      error: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
      warning: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
      info: '<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>'
    };
    el.innerHTML = `${icons[type] || icons.info}<span>${escapeHtml(message)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastIn 0.3s reverse';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function markDirty() {
    state.isDirty = true;
    const indicator = $('#save-indicator');
    if (indicator) {
      indicator.textContent = 'უნახავი ცვლილებები';
      indicator.classList.add('unsaved');
    }
  }

  function markClean() {
    state.isDirty = false;
    const indicator = $('#save-indicator');
    if (indicator) {
      indicator.textContent = 'ყველა ცვლილება შენახული';
      indicator.classList.remove('unsaved');
    }
  }

  // ====== AUTH ======
  async function isAuthenticated() {
    const auth = localStorage.getItem(AUTH_KEY);
    if (!auth) return false;
    try {
      const { expires } = JSON.parse(auth);
      return Date.now() < expires;
    } catch {
      return false;
    }
  }

  async function login(password) {
    const stored = localStorage.getItem(PASSWORD_KEY);
    const hash = await sha256(password);
    const defaultHash = await sha256(DEFAULT_PASSWORD);

    if (hash === stored || (!stored && hash === defaultHash)) {
      const expires = Date.now() + AUTH_DURATION;
      localStorage.setItem(AUTH_KEY, JSON.stringify({ expires }));
      return true;
    }
    return false;
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    location.reload();
  }

  async function changePassword(newPassword) {
    const hash = await sha256(newPassword);
    localStorage.setItem(PASSWORD_KEY, hash);
  }

  // ====== GITHUB CONFIG ======
  const GITHUB_OWNER = 'chaba17';
  const GITHUB_REPO = 'audit-company';
  const GITHUB_PATH = 'assets/data/content.json';
  const GITHUB_BRANCH = 'main';
  const GITHUB_TOKEN_KEY = 'audit_github_token';

  function getGithubToken() { return localStorage.getItem(GITHUB_TOKEN_KEY) || ''; }
  function setGithubToken(token) {
    if (token) localStorage.setItem(GITHUB_TOKEN_KEY, token);
    else localStorage.removeItem(GITHUB_TOKEN_KEY);
  }

  async function githubAPI(path, options = {}) {
    const token = getGithubToken();
    if (!token) throw new Error('NO_TOKEN');
    const base = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;
    const url = path ? `${base}/${path}` : base;

    // Minimal headers to avoid CORS preflight issues
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...(options.headers || {})
    };
    if (options.method && options.method !== 'GET') {
      headers['Content-Type'] = 'application/json';
    }

    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (e) {
      // Network error / CORS / AdBlocker / VPN
      throw new Error('NETWORK: ' + (e.message || 'Failed to fetch'));
    }

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        detail = err.message || detail;
        if (err.documentation_url) detail += ` (${err.documentation_url})`;
      } catch {}
      if (res.status === 401) throw new Error('UNAUTHORIZED: Token არასწორია ან ვადაგასული.');
      if (res.status === 404) throw new Error('NOT_FOUND: Repository ვერ მოიძებნა ან token-ს არ აქვს `repo` უფლება.');
      if (res.status === 403) throw new Error('FORBIDDEN: Token-ს არ აქვს საკმარისი უფლება.');
      throw new Error(detail);
    }
    return res.json();
  }

  // UTF-8 safe Base64 encoding
  function toBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  async function publishToGitHub() {
    const publishBtn = $('#publish-btn');
    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> იტვირთება...';
    }

    try {
      // 1. Get current file SHA (needed for update)
      let sha = null;
      try {
        const current = await githubAPI(`contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}`);
        sha = current.sha;
      } catch (e) {
        if (e.message !== 'Not Found') throw e;
        // File doesn't exist — will create
      }

      // 2. Prepare content
      state.content._updated = new Date().toISOString();
      const jsonStr = JSON.stringify(state.content, null, 2);

      // 3. PUT the file
      const body = {
        message: `Update content via admin — ${new Date().toLocaleString('ka-GE')}`,
        content: toBase64(jsonStr),
        branch: GITHUB_BRANCH
      };
      if (sha) body.sha = sha;

      const result = await githubAPI(`contents/${GITHUB_PATH}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });

      // Save locally too
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.content));
      markClean();

      toast('✅ ცვლილებები გამოქვეყნებულია! Vercel 30-60 წამში გაააქტიურებს.', 'success', 5000);
      console.log('Commit:', result.commit?.html_url);
    } catch (err) {
      if (err.message === 'NO_TOKEN') {
        toast('❌ ჯერ GitHub Token-ი უნდა დააყენო. წადი → Settings', 'error', 5000);
        setTimeout(() => location.hash = '#settings', 1200);
      } else if (err.message?.includes('Bad credentials') || err.message?.includes('401')) {
        toast('❌ Token არასწორია. შეამოწმე Settings-ში.', 'error');
      } else {
        toast('❌ შეცდომა: ' + err.message, 'error', 5000);
      }
      console.error('Publish error:', err);
    } finally {
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.innerHTML = originalPublishBtnHTML;
      }
    }
  }

  const originalPublishBtnHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> Publish Live`;

  // ====== CONTENT MANAGEMENT ======
  function loadContent() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved content:', e);
      }
    }
    return deepClone(window.DEFAULT_CONTENT);
  }

  function saveContent() {
    state.content._updated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.content));
    markClean();
    toast('ცვლილებები წარმატებით შენახულია!', 'success');
    updateBadges();
  }

  function resetContent() {
    if (!confirm('დარწმუნებული ხარ? ყველა ცვლილება წაიშლება და დაბრუნდება ნაგულისხმევ კონტენტზე.')) return;
    localStorage.removeItem(STORAGE_KEY);
    state.content = deepClone(window.DEFAULT_CONTENT);
    renderSection(state.currentSection);
    toast('ნაგულისხმევი კონტენტი აღდგა', 'info');
    updateBadges();
  }

  function exportJSON() {
    const data = JSON.stringify(state.content, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `audit-content-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('JSON ფაილი ჩამოიტვირთა', 'success');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!imported.site || !imported.services) {
          throw new Error('არასწორი ფორმატი');
        }
        if (!confirm('ნამდვილად ჩანაცვლდეს ყველა მიმდინარე კონტენტი?')) return;
        state.content = imported;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.content));
        renderSection(state.currentSection);
        updateBadges();
        toast('JSON წარმატებით იმპორტდა!', 'success');
      } catch (err) {
        toast('შეცდომა: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  function updateBadges() {
    const badges = {
      'badge-services': state.content.services?.length || 0,
      'badge-pricing': state.content.pricing?.plans?.length || 0,
      'badge-team': state.content.team?.length || 0,
      'badge-testimonials': state.content.testimonials?.length || 0,
      'badge-faq': state.content.faq?.length || 0,
      'badge-blog': state.content.blog?.length || 0,
      'badge-industries': state.content.industries?.length || 0
    };
    Object.entries(badges).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  // ====== ROUTING ======
  function handleRoute() {
    const hash = location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);
  }

  function navigateTo(section) {
    state.currentSection = section;
    $$('.sidebar-link').forEach(el => {
      el.classList.toggle('active', el.dataset.section === section);
    });
    const labels = {
      dashboard: 'Dashboard',
      site: 'Site Info',
      hero: 'Hero Section',
      services: 'Services',
      pricing: 'Pricing Plans',
      team: 'Team',
      testimonials: 'Testimonials',
      faq: 'FAQ',
      blog: 'Blog Posts',
      industries: 'Industries',
      stats: 'Statistics',
      megamenu: 'Mega Menu',
      footer: 'Footer',
      translations: 'Translations',
      import: 'Import / Restore',
      settings: 'Settings'
    };
    $('#current-section-label').textContent = labels[section] || section;
    renderSection(section);
    // Close mobile sidebar
    $('#admin-sidebar').classList.remove('open');
    $('#sidebar-backdrop').classList.remove('active');
  }

  function renderSection(section) {
    const main = $('#admin-main');
    const renderers = {
      dashboard: renderDashboard,
      site: renderSite,
      hero: renderHero,
      services: renderServices,
      pricing: renderPricing,
      team: renderTeam,
      testimonials: renderTestimonials,
      faq: renderFAQ,
      blog: renderBlog,
      industries: renderIndustries,
      stats: renderStats,
      megamenu: renderMegaMenu,
      footer: renderFooter,
      translations: renderTranslations,
      import: renderImport,
      settings: renderSettings
    };
    const renderer = renderers[section] || renderDashboard;
    main.innerHTML = renderer();
    // Attach section-specific handlers
    const attachers = {
      dashboard: attachDashboard,
      site: attachSite,
      hero: attachHero,
      services: attachServices,
      pricing: attachPricing,
      team: attachTeam,
      testimonials: attachTestimonials,
      faq: attachFAQ,
      blog: attachBlog,
      industries: attachIndustries,
      stats: attachStats,
      megamenu: attachMegaMenu,
      footer: attachFooter,
      translations: attachTranslations,
      import: attachImport,
      settings: attachSettings
    };
    if (attachers[section]) attachers[section]();
    // Scroll to top
    main.scrollTop = 0;
  }

  // ====== SECTION RENDERERS ======

  // --- DASHBOARD ---
  function renderDashboard() {
    const c = state.content;
    return `
      <div class="page-header">
        <div>
          <h1>კეთილი იყოს თქვენი მობრძანება 👋</h1>
          <p>მართე შენი ვებგვერდის მთელი კონტენტი ერთ სივრცეში</p>
        </div>
      </div>

      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <div>
          <strong>რჩევა:</strong> ცვლილებები ინახება შენი ბრაუზერის მეხსიერებაში. საიტზე გამოსახვისთვის გააკეთე <code>Export JSON</code> და ატვირთე ფაილი რეპოზიტორიაში.
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-label">სერვისები</div>
          <div class="stat-card-value">${c.services?.length || 0}</div>
          <div class="stat-card-desc">აქტიური სერვისი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">პაკეტები</div>
          <div class="stat-card-value">${c.pricing?.plans?.length || 0}</div>
          <div class="stat-card-desc">საფასო პაკეტი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">გუნდი</div>
          <div class="stat-card-value">${c.team?.length || 0}</div>
          <div class="stat-card-desc">ექსპერტი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">გამოხმაურება</div>
          <div class="stat-card-value">${c.testimonials?.length || 0}</div>
          <div class="stat-card-desc">ტესტიმონიალი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">FAQ</div>
          <div class="stat-card-value">${c.faq?.length || 0}</div>
          <div class="stat-card-desc">ხშირი კითხვა</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">ბლოგი</div>
          <div class="stat-card-value">${c.blog?.length || 0}</div>
          <div class="stat-card-desc">ბლოგის პოსტი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">ინდუსტრიები</div>
          <div class="stat-card-value">${c.industries?.length || 0}</div>
          <div class="stat-card-desc">სექტორი</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">ბოლო განახლება</div>
          <div class="stat-card-value" style="font-size: 18px;">${c._updated ? new Date(c._updated).toLocaleDateString('ka-GE') : 'არასდროს'}</div>
          <div class="stat-card-desc">ვერსია ${c._version || '1.0.0'}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">სწრაფი ქმედებები</h3>
            <p class="card-subtitle">ხშირად გამოყენებადი დავალებები</p>
          </div>
        </div>
        <div class="quick-actions">
          <button class="quick-action" data-goto="site">
            <div class="quick-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="18" x="2" y="3" rx="2"/><path d="M2 12h20"/></svg>
            </div>
            <div class="quick-action-text">
              <div class="quick-action-title">საიტის ინფორმაცია</div>
              <div class="quick-action-desc">ტელ, მეილი, მისამართი</div>
            </div>
          </button>
          <button class="quick-action" data-goto="hero">
            <div class="quick-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
            </div>
            <div class="quick-action-text">
              <div class="quick-action-title">Hero სექცია</div>
              <div class="quick-action-desc">სათაური, ტექსტი, CTA</div>
            </div>
          </button>
          <button class="quick-action" data-goto="services">
            <div class="quick-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div class="quick-action-text">
              <div class="quick-action-title">სერვისების მართვა</div>
              <div class="quick-action-desc">დამატება, რედაქტირება</div>
            </div>
          </button>
          <button class="quick-action" data-goto="blog">
            <div class="quick-action-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div class="quick-action-text">
              <div class="quick-action-title">ახალი ბლოგი</div>
              <div class="quick-action-desc">დაამატე სტატია</div>
            </div>
          </button>
        </div>
      </div>
    `;
  }

  function attachDashboard() {
    $$('.quick-action').forEach(btn => {
      btn.addEventListener('click', () => {
        location.hash = '#' + btn.dataset.goto;
      });
    });
  }

  // --- SITE INFO ---
  function renderSite() {
    const s = state.content.site;
    return `
      <div class="page-header">
        <div>
          <h1>საიტის ინფორმაცია</h1>
          <p>კომპანიის კონტაქტები, მისამართი, სოციალური ქსელები</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">საბაზისო ინფორმაცია</h3>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>კომპანიის სახელი <span class="required">*</span></label>
            <input type="text" data-field="site.name" value="${escapeHtml(s.name)}" />
          </div>
          <div class="form-group">
            <label>ტაგლაინი</label>
            <input type="text" data-field="site.tagline" value="${escapeHtml(s.tagline)}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">კონტაქტი</h3>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>ტელეფონი (ძირითადი)</label>
            <input type="tel" data-field="site.phone" value="${escapeHtml(s.phone)}" />
          </div>
          <div class="form-group">
            <label>ტელეფონი (მობილური)</label>
            <input type="tel" data-field="site.phoneAlt" value="${escapeHtml(s.phoneAlt || '')}" />
          </div>
          <div class="form-group">
            <label>ელ.ფოსტა (ძირითადი)</label>
            <input type="email" data-field="site.email" value="${escapeHtml(s.email)}" />
          </div>
          <div class="form-group">
            <label>ელ.ფოსტა (მხარდაჭერა)</label>
            <input type="email" data-field="site.emailAlt" value="${escapeHtml(s.emailAlt || '')}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">მისამართი</h3>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>მისამართი</label>
            <input type="text" data-field="site.address" value="${escapeHtml(s.address)}" />
          </div>
          <div class="form-group">
            <label>დეტალები</label>
            <input type="text" data-field="site.addressDetails" value="${escapeHtml(s.addressDetails || '')}" />
          </div>
          <div class="form-group">
            <label>სამუშაო საათები</label>
            <input type="text" data-field="site.hours" value="${escapeHtml(s.hours)}" />
          </div>
          <div class="form-group">
            <label>შაბათ-კვირა</label>
            <input type="text" data-field="site.hoursWeekend" value="${escapeHtml(s.hoursWeekend || '')}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">სოციალური ქსელები</h3>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>Facebook</label>
            <input type="url" data-field="site.social.facebook" value="${escapeHtml(s.social?.facebook || '')}" placeholder="https://facebook.com/..." />
          </div>
          <div class="form-group">
            <label>Instagram</label>
            <input type="url" data-field="site.social.instagram" value="${escapeHtml(s.social?.instagram || '')}" placeholder="https://instagram.com/..." />
          </div>
          <div class="form-group">
            <label>LinkedIn</label>
            <input type="url" data-field="site.social.linkedin" value="${escapeHtml(s.social?.linkedin || '')}" placeholder="https://linkedin.com/..." />
          </div>
          <div class="form-group">
            <label>YouTube</label>
            <input type="url" data-field="site.social.youtube" value="${escapeHtml(s.social?.youtube || '')}" placeholder="https://youtube.com/..." />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Copyright</h3>
        </div>
        <div class="form-group">
          <label>Copyright ტექსტი</label>
          <input type="text" data-field="site.copyright" value="${escapeHtml(s.copyright)}" />
        </div>
      </div>
    `;
  }

  function attachSite() {
    attachFieldListeners();
  }

  // --- HERO ---
  function renderHero() {
    const h = state.content.hero;
    return `
      <div class="page-header">
        <div>
          <h1>Hero სექცია</h1>
          <p>მთავარი გვერდის ზედა სექცია — პირველი შთაბეჭდილება</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">სათაური და ტექსტი</h3>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Tag (პატარა ყვითელი ლეიბლი)</label>
            <input type="text" data-field="hero.tag" value="${escapeHtml(h.tag)}" />
          </div>
          <div class="form-group">
            <label>მთავარი სათაური <span class="required">*</span></label>
            <textarea data-field="hero.title" rows="3">${escapeHtml(h.title)}</textarea>
            <small class="hint">HTML-ის გამოყენება შესაძლებელია. <code>&lt;mark&gt;სიტყვა&lt;/mark&gt;</code> — ყვითელი highlight</small>
          </div>
          <div class="form-group">
            <label>აღწერა</label>
            <textarea data-field="hero.subtitle" rows="3">${escapeHtml(h.subtitle)}</textarea>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">ღილაკები (CTA)</h3>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>Primary ღილაკი — ტექსტი</label>
            <input type="text" data-field="hero.primaryCta.text" value="${escapeHtml(h.primaryCta.text)}" />
          </div>
          <div class="form-group">
            <label>Primary ღილაკი — URL</label>
            <input type="text" data-field="hero.primaryCta.href" value="${escapeHtml(h.primaryCta.href)}" />
          </div>
          <div class="form-group">
            <label>Secondary ღილაკი — ტექსტი</label>
            <input type="text" data-field="hero.secondaryCta.text" value="${escapeHtml(h.secondaryCta.text)}" />
          </div>
          <div class="form-group">
            <label>Secondary ღილაკი — URL</label>
            <input type="text" data-field="hero.secondaryCta.href" value="${escapeHtml(h.secondaryCta.href)}" />
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">ფონის სურათი</h3>
        </div>
        <div class="image-input">
          <div class="image-input-field">
            <div class="form-group">
              <label>სურათის URL</label>
              <input type="url" data-field="hero.bgImage" data-preview="hero-bg-preview" value="${escapeHtml(h.bgImage)}" />
              <small class="hint">გამოიყენე Unsplash-ის ან სხვა დიდი სურათის URL. რეკ. ზომა: 2000×1200px</small>
            </div>
          </div>
          <div class="image-preview">
            ${h.bgImage ? `<img id="hero-bg-preview" src="${escapeHtml(h.bgImage)}" alt="" />` : '<span>N/A</span>'}
          </div>
        </div>
      </div>
    `;
  }

  function attachHero() {
    attachFieldListeners();
    attachImagePreview();
  }

  // --- SERVICES ---
  function renderServices() {
    const services = state.content.services || [];
    return `
      <div class="page-header">
        <div>
          <h1>სერვისები</h1>
          <p>საიტზე გამოსახული ყველა სერვისი</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-yellow" id="add-service">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            ახალი სერვისი
          </button>
        </div>
      </div>

      <div class="list-toolbar">
        <div class="list-search">
          <input type="text" id="service-search" placeholder="მოძებნე სერვისი..." />
        </div>
      </div>

      ${services.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <h3>ჯერ სერვისები არ გაქვს</h3>
          <p>დაიწყე პირველი სერვისის დამატებით</p>
          <button class="btn btn-yellow" id="add-service-empty">+ პირველი სერვისი</button>
        </div>
      ` : `
        <div class="list-items" id="services-list">
          ${services.map((s, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
              </div>
              <div style="display: flex; gap: 14px; align-items: center;">
                ${s.image ? `<img src="${escapeHtml(s.image)}" class="list-item-thumb" alt="" />` : `<div class="list-item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>`}
                <div class="list-item-body">
                  <h4 class="list-item-title">${escapeHtml(s.title)}</h4>
                  <p class="list-item-subtitle">${escapeHtml(s.shortDesc || '')}</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}" title="რედაქტირება">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="icon-btn danger" data-delete="${i}" title="წაშლა">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachServices() {
    const add = () => openServiceModal();
    $('#add-service')?.addEventListener('click', add);
    $('#add-service-empty')?.addEventListener('click', add);

    $$('#services-list [data-edit]').forEach(btn => {
      btn.addEventListener('click', () => openServiceModal(parseInt(btn.dataset.edit)));
    });
    $$('#services-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm(`წაიშალოს "${state.content.services[i].title}"?`)) return;
        state.content.services.splice(i, 1);
        markDirty();
        renderSection('services');
        toast('სერვისი წაიშალა', 'warning');
      });
    });

    $('#service-search')?.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      $$('#services-list .list-item').forEach(item => {
        const txt = item.textContent.toLowerCase();
        item.style.display = txt.includes(q) ? '' : 'none';
      });
    });

    setupDragReorder('services-list', 'services');
  }

  function openServiceModal(index = null) {
    const isEdit = index !== null;
    const s = isEdit ? deepClone(state.content.services[index]) : {
      id: 'service-' + Date.now(),
      title: '', shortDesc: '', fullDesc: '', icon: 'book-open', image: '', features: []
    };
    const ICONS = ['book-open', 'receipt', 'users', 'building', 'shield-check', 'message-circle', 'globe', 'briefcase', 'cpu'];

    openModal(isEdit ? 'სერვისის რედაქტირება' : 'ახალი სერვისი', `
      <div class="form-grid">
        <div class="form-group">
          <label>სათაური <span class="required">*</span></label>
          <input type="text" id="svc-title" value="${escapeHtml(s.title)}" required />
        </div>
        <div class="form-group">
          <label>ID (URL slug)</label>
          <input type="text" id="svc-id" value="${escapeHtml(s.id)}" />
          <small class="hint">გამოიყენება URL-ში, მაგ. services/accounting.html</small>
        </div>
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>ხატულა (Icon)</label>
            <select id="svc-icon">
              ${ICONS.map(ic => `<option value="${ic}" ${s.icon === ic ? 'selected' : ''}>${ic}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>სურათის URL</label>
            <input type="url" id="svc-image" value="${escapeHtml(s.image || '')}" />
          </div>
        </div>
        <div class="form-group">
          <label>მოკლე აღწერა</label>
          <input type="text" id="svc-short" value="${escapeHtml(s.shortDesc || '')}" />
        </div>
        <div class="form-group">
          <label>სრული აღწერა</label>
          <textarea id="svc-full" rows="4">${escapeHtml(s.fullDesc || '')}</textarea>
        </div>
        <div class="form-group">
          <label>მახასიათებლები</label>
          <div class="features-editor" id="svc-features">
            ${(s.features || []).map((f, i) => `
              <div class="feature-row" data-i="${i}">
                <span class="feature-handle">≡</span>
                <input type="text" value="${escapeHtml(f)}" />
                <button class="icon-btn danger" data-remove-feature="${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-outline btn-xs" id="svc-add-feature" type="button" style="margin-top: 8px;">+ მახასიათებელი</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="svc-save">შენახვა</button>
      </div>
    `);

    const rerenderFeatures = () => {
      const container = $('#svc-features');
      const features = $$('#svc-features .feature-row input').map(i => i.value);
      container.innerHTML = features.map((f, i) => `
        <div class="feature-row" data-i="${i}">
          <span class="feature-handle">≡</span>
          <input type="text" value="${escapeHtml(f)}" />
          <button class="icon-btn danger" data-remove-feature="${i}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
        </div>
      `).join('');
      bindFeatureRemoves();
    };
    const bindFeatureRemoves = () => {
      $$('#svc-features [data-remove-feature]').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.closest('.feature-row').remove();
        });
      });
    };
    bindFeatureRemoves();

    $('#svc-add-feature').addEventListener('click', () => {
      const container = $('#svc-features');
      const row = document.createElement('div');
      row.className = 'feature-row';
      row.innerHTML = `<span class="feature-handle">≡</span><input type="text" value="" placeholder="ახალი მახასიათებელი" /><button class="icon-btn danger"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/></svg></button>`;
      container.appendChild(row);
      row.querySelector('input').focus();
      row.querySelector('button').addEventListener('click', () => row.remove());
    });

    $('#svc-save').addEventListener('click', () => {
      const updated = {
        id: $('#svc-id').value || 'service-' + Date.now(),
        title: $('#svc-title').value,
        shortDesc: $('#svc-short').value,
        fullDesc: $('#svc-full').value,
        icon: $('#svc-icon').value,
        image: $('#svc-image').value,
        features: $$('#svc-features .feature-row input').map(i => i.value).filter(Boolean)
      };
      if (!updated.title) { toast('სათაური სავალდებულოა', 'error'); return; }
      if (isEdit) state.content.services[index] = updated;
      else state.content.services.push(updated);
      markDirty();
      closeModal();
      renderSection('services');
      updateBadges();
      toast(isEdit ? 'სერვისი განახლდა' : 'სერვისი დამატებულია', 'success');
    });
  }

  // --- PRICING ---
  function renderPricing() {
    const p = state.content.pricing;
    return `
      <div class="page-header">
        <div>
          <h1>ფასები</h1>
          <p>მართე 3 საფასო პაკეტი</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-yellow" id="add-plan">+ პაკეტი</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">ზოგადი პარამეტრები</h3>
        </div>
        <div class="form-grid cols-3">
          <div class="form-group">
            <label>თვიური ტექსტი</label>
            <input type="text" data-field="pricing.monthly" value="${escapeHtml(p.monthly)}" />
          </div>
          <div class="form-group">
            <label>"Popular" badge ტექსტი</label>
            <input type="text" data-field="pricing.popular" value="${escapeHtml(p.popular)}" />
          </div>
          <div class="form-group">
            <label>CTA ღილაკის ტექსტი</label>
            <input type="text" data-field="pricing.ctaStart" value="${escapeHtml(p.ctaStart)}" />
          </div>
        </div>
      </div>

      <div class="list-items" id="plans-list">
        ${(p.plans || []).map((plan, i) => `
          <div class="list-item" data-index="${i}">
            <div class="list-item-handle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
            </div>
            <div class="list-item-body">
              <h4 class="list-item-title">
                ${escapeHtml(plan.name)}
                ${plan.featured ? `<span class="list-item-featured">POPULAR</span>` : ''}
              </h4>
              <p class="list-item-subtitle">${escapeHtml(plan.currency)} ${escapeHtml(plan.price)} — ${escapeHtml(plan.description || '')}</p>
            </div>
            <div class="list-item-actions">
              <button class="icon-btn" data-edit-plan="${i}" title="რედაქტირება">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
              <button class="icon-btn danger" data-delete-plan="${i}" title="წაშლა">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function attachPricing() {
    attachFieldListeners();
    $('#add-plan')?.addEventListener('click', () => openPlanModal());
    $$('#plans-list [data-edit-plan]').forEach(btn => {
      btn.addEventListener('click', () => openPlanModal(parseInt(btn.dataset.editPlan)));
    });
    $$('#plans-list [data-delete-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.deletePlan);
        if (!confirm(`წაიშალოს "${state.content.pricing.plans[i].name}"?`)) return;
        state.content.pricing.plans.splice(i, 1);
        markDirty();
        renderSection('pricing');
        toast('პაკეტი წაიშალა', 'warning');
      });
    });
  }

  function openPlanModal(index = null) {
    const isEdit = index !== null;
    const p = isEdit ? deepClone(state.content.pricing.plans[index]) : {
      name: '', description: '', price: '0', currency: '₾', featured: false, features: []
    };

    openModal(isEdit ? 'პაკეტის რედაქტირება' : 'ახალი პაკეტი', `
      <div class="form-grid">
        <div class="form-grid cols-2">
          <div class="form-group">
            <label>დასახელება <span class="required">*</span></label>
            <input type="text" id="plan-name" value="${escapeHtml(p.name)}" />
          </div>
          <div class="form-group">
            <label>აღწერა</label>
            <input type="text" id="plan-desc" value="${escapeHtml(p.description)}" />
          </div>
        </div>
        <div class="form-grid cols-3">
          <div class="form-group">
            <label>ფასი</label>
            <input type="text" id="plan-price" value="${escapeHtml(p.price)}" />
          </div>
          <div class="form-group">
            <label>ვალუტა</label>
            <input type="text" id="plan-currency" value="${escapeHtml(p.currency)}" maxlength="4" />
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <label class="switch" style="padding: 8px 0;">
              <input type="checkbox" id="plan-featured" ${p.featured ? 'checked' : ''} />
              <span class="switch-slider"></span>
              <span class="switch-label">Popular პაკეტი</span>
            </label>
          </div>
        </div>
        <div class="form-group">
          <label>მახასიათებლები</label>
          <div class="features-editor" id="plan-features">
            ${(p.features || []).map((f, i) => `
              <div class="feature-row">
                <span class="feature-handle">≡</span>
                <input type="text" value="${escapeHtml(f)}" />
                <button class="icon-btn danger" type="button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/></svg></button>
              </div>
            `).join('')}
          </div>
          <button class="btn btn-outline btn-xs" id="plan-add-feature" type="button" style="margin-top: 8px;">+ მახასიათებელი</button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="plan-save">შენახვა</button>
      </div>
    `);

    $$('#plan-features .icon-btn.danger').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.feature-row').remove());
    });

    $('#plan-add-feature').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'feature-row';
      row.innerHTML = `<span class="feature-handle">≡</span><input type="text" placeholder="ახალი მახასიათებელი" /><button type="button" class="icon-btn danger"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/></svg></button>`;
      $('#plan-features').appendChild(row);
      row.querySelector('input').focus();
      row.querySelector('button').addEventListener('click', () => row.remove());
    });

    $('#plan-save').addEventListener('click', () => {
      const updated = {
        name: $('#plan-name').value,
        description: $('#plan-desc').value,
        price: $('#plan-price').value,
        currency: $('#plan-currency').value,
        featured: $('#plan-featured').checked,
        features: $$('#plan-features .feature-row input').map(i => i.value).filter(Boolean)
      };
      if (!updated.name) { toast('სახელი სავალდებულოა', 'error'); return; }
      if (isEdit) state.content.pricing.plans[index] = updated;
      else state.content.pricing.plans.push(updated);
      markDirty();
      closeModal();
      renderSection('pricing');
      updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- TEAM ---
  function renderTeam() {
    const team = state.content.team || [];
    return `
      <div class="page-header">
        <div>
          <h1>გუნდის წევრები</h1>
          <p>გუნდის გვერდის მართვა</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-yellow" id="add-member">+ წევრი</button>
        </div>
      </div>
      ${team.length === 0 ? emptyState('ჯერ გუნდის წევრები არ გაქვს', 'დაამატე პირველი წევრი', 'add-member-empty') : `
        <div class="list-items" id="team-list">
          ${team.map((m, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div style="display: flex; gap: 14px; align-items: center;">
                ${m.photo ? `<img src="${escapeHtml(m.photo)}" class="list-item-thumb" style="border-radius: 50%;" alt="" />` : `<div class="list-item-icon" style="border-radius: 50%;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>`}
                <div class="list-item-body">
                  <h4 class="list-item-title">${escapeHtml(m.name)} ${m.tag ? `<span class="list-item-featured">${escapeHtml(m.tag)}</span>` : ''}</h4>
                  <p class="list-item-subtitle">${escapeHtml(m.role)} — ${escapeHtml(m.bio || '')}</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachTeam() {
    const add = () => openTeamModal();
    $('#add-member')?.addEventListener('click', add);
    $('#add-member-empty')?.addEventListener('click', add);
    $$('#team-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openTeamModal(parseInt(btn.dataset.edit))));
    $$('#team-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm(`წაიშალოს "${state.content.team[i].name}"?`)) return;
        state.content.team.splice(i, 1);
        markDirty();
        renderSection('team');
        toast('წევრი წაიშალა', 'warning');
      });
    });
    setupDragReorder('team-list', 'team');
  }

  function openTeamModal(index = null) {
    const isEdit = index !== null;
    const m = isEdit ? deepClone(state.content.team[index]) : { name: '', role: '', tag: '', bio: '', photo: '' };
    openModal(isEdit ? 'წევრის რედაქტირება' : 'ახალი წევრი', `
      <div class="form-grid">
        <div class="form-grid cols-2">
          <div class="form-group"><label>სახელი და გვარი *</label><input type="text" id="mem-name" value="${escapeHtml(m.name)}" /></div>
          <div class="form-group"><label>პოზიცია</label><input type="text" id="mem-role" value="${escapeHtml(m.role)}" /></div>
          <div class="form-group"><label>Tag (მაგ. ACCA, CPA)</label><input type="text" id="mem-tag" value="${escapeHtml(m.tag || '')}" /></div>
          <div class="form-group"><label>ფოტო URL</label><input type="url" id="mem-photo" value="${escapeHtml(m.photo || '')}" /></div>
        </div>
        <div class="form-group"><label>ბიო</label><textarea id="mem-bio" rows="3">${escapeHtml(m.bio || '')}</textarea></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="mem-save">შენახვა</button>
      </div>
    `);
    $('#mem-save').addEventListener('click', () => {
      const u = { name: $('#mem-name').value, role: $('#mem-role').value, tag: $('#mem-tag').value, bio: $('#mem-bio').value, photo: $('#mem-photo').value };
      if (!u.name) { toast('სახელი სავალდებულოა', 'error'); return; }
      if (isEdit) state.content.team[index] = u; else state.content.team.push(u);
      markDirty(); closeModal(); renderSection('team'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- TESTIMONIALS ---
  function renderTestimonials() {
    const items = state.content.testimonials || [];
    return `
      <div class="page-header">
        <div><h1>გამოხმაურებები</h1><p>კლიენტების ცოცხალი გამოხმაურებები</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-testimonial">+ გამოხმაურება</button></div>
      </div>
      ${items.length === 0 ? emptyState('ჯერ გამოხმაურებები არ გაქვს', 'დაამატე პირველი', 'add-testimonial-empty') : `
        <div class="list-items" id="testimonials-list">
          ${items.map((t, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div style="display: flex; gap: 14px; align-items: center;">
                ${t.avatar ? `<img src="${escapeHtml(t.avatar)}" class="list-item-thumb" style="border-radius: 50%;" alt="" />` : `<div class="list-item-icon" style="border-radius: 50%;">👤</div>`}
                <div class="list-item-body">
                  <h4 class="list-item-title">${escapeHtml(t.author)}</h4>
                  <p class="list-item-subtitle">${escapeHtml(t.role)} — "${escapeHtml((t.quote||'').substring(0, 80))}..."</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachTestimonials() {
    const add = () => openTestimonialModal();
    $('#add-testimonial')?.addEventListener('click', add);
    $('#add-testimonial-empty')?.addEventListener('click', add);
    $$('#testimonials-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openTestimonialModal(parseInt(btn.dataset.edit))));
    $$('#testimonials-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm('წაიშალოს გამოხმაურება?')) return;
        state.content.testimonials.splice(i, 1);
        markDirty(); renderSection('testimonials'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('testimonials-list', 'testimonials');
  }

  function openTestimonialModal(index = null) {
    const isEdit = index !== null;
    const t = isEdit ? deepClone(state.content.testimonials[index]) : { quote: '', author: '', role: '', avatar: '' };
    openModal(isEdit ? 'გამოხმაურების რედაქტირება' : 'ახალი გამოხმაურება', `
      <div class="form-grid">
        <div class="form-group"><label>Quote (ციტატა) *</label><textarea id="tes-quote" rows="4">${escapeHtml(t.quote)}</textarea></div>
        <div class="form-grid cols-2">
          <div class="form-group"><label>ავტორი</label><input type="text" id="tes-author" value="${escapeHtml(t.author)}" /></div>
          <div class="form-group"><label>პოზიცია / კომპანია</label><input type="text" id="tes-role" value="${escapeHtml(t.role)}" /></div>
        </div>
        <div class="form-group"><label>Avatar URL</label><input type="url" id="tes-avatar" value="${escapeHtml(t.avatar || '')}" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="tes-save">შენახვა</button>
      </div>
    `);
    $('#tes-save').addEventListener('click', () => {
      const u = { quote: $('#tes-quote').value, author: $('#tes-author').value, role: $('#tes-role').value, avatar: $('#tes-avatar').value };
      if (!u.quote) { toast('ციტატა სავალდებულოა', 'error'); return; }
      if (isEdit) state.content.testimonials[index] = u; else state.content.testimonials.push(u);
      markDirty(); closeModal(); renderSection('testimonials'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- FAQ ---
  function renderFAQ() {
    const items = state.content.faq || [];
    return `
      <div class="page-header">
        <div><h1>FAQ</h1><p>ხშირად დასმული კითხვები</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-faq">+ კითხვა</button></div>
      </div>
      ${items.length === 0 ? emptyState('FAQ ცარიელია', 'დაამატე პირველი', 'add-faq-empty') : `
        <div class="list-items" id="faq-list">
          ${items.map((f, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div class="list-item-body">
                <h4 class="list-item-title">${escapeHtml(f.question)}</h4>
                <p class="list-item-subtitle">${escapeHtml((f.answer || '').substring(0, 100))}...</p>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachFAQ() {
    const add = () => openFAQModal();
    $('#add-faq')?.addEventListener('click', add);
    $('#add-faq-empty')?.addEventListener('click', add);
    $$('#faq-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openFAQModal(parseInt(btn.dataset.edit))));
    $$('#faq-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm('წაიშალოს კითხვა?')) return;
        state.content.faq.splice(i, 1);
        markDirty(); renderSection('faq'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('faq-list', 'faq');
  }

  function openFAQModal(index = null) {
    const isEdit = index !== null;
    const f = isEdit ? deepClone(state.content.faq[index]) : { question: '', answer: '' };
    openModal(isEdit ? 'FAQ რედაქტირება' : 'ახალი FAQ', `
      <div class="form-grid">
        <div class="form-group"><label>კითხვა *</label><input type="text" id="faq-q" value="${escapeHtml(f.question)}" /></div>
        <div class="form-group"><label>პასუხი *</label><textarea id="faq-a" rows="5">${escapeHtml(f.answer)}</textarea></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="faq-save">შენახვა</button>
      </div>
    `);
    $('#faq-save').addEventListener('click', () => {
      const u = { question: $('#faq-q').value, answer: $('#faq-a').value };
      if (!u.question || !u.answer) { toast('ორივე ველი სავალდებულოა', 'error'); return; }
      if (isEdit) state.content.faq[index] = u; else state.content.faq.push(u);
      markDirty(); closeModal(); renderSection('faq'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- BLOG ---
  function renderBlog() {
    const items = state.content.blog || [];
    return `
      <div class="page-header">
        <div><h1>ბლოგის პოსტები</h1><p>Insights & Thought Leadership</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-blog">+ სტატია</button></div>
      </div>
      ${items.length === 0 ? emptyState('ბლოგი ცარიელია', 'დაწერე პირველი სტატია', 'add-blog-empty') : `
        <div class="list-items" id="blog-list">
          ${items.map((b, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div style="display: flex; gap: 14px; align-items: center;">
                ${b.image ? `<img src="${escapeHtml(b.image)}" class="list-item-thumb" alt="" />` : `<div class="list-item-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg></div>`}
                <div class="list-item-body">
                  <h4 class="list-item-title">${escapeHtml(b.title)} ${b.featured ? `<span class="list-item-featured">FEATURED</span>` : ''}</h4>
                  <p class="list-item-subtitle">${escapeHtml(b.category)} · ${escapeHtml(b.date)} · ${escapeHtml(b.readTime || '')}</p>
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachBlog() {
    const add = () => openBlogModal();
    $('#add-blog')?.addEventListener('click', add);
    $('#add-blog-empty')?.addEventListener('click', add);
    $$('#blog-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openBlogModal(parseInt(btn.dataset.edit))));
    $$('#blog-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm(`წაიშალოს "${state.content.blog[i].title}"?`)) return;
        state.content.blog.splice(i, 1);
        markDirty(); renderSection('blog'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('blog-list', 'blog');
  }

  function openBlogModal(index = null) {
    const isEdit = index !== null;
    const b = isEdit ? deepClone(state.content.blog[index]) : {
      title: '', slug: '', category: '', date: new Date().toISOString().split('T')[0], readTime: '5 წუთი', excerpt: '', image: '', featured: false
    };
    openModal(isEdit ? 'ბლოგის რედაქტირება' : 'ახალი სტატია', `
      <div class="form-grid">
        <div class="form-group"><label>სათაური *</label><input type="text" id="bl-title" value="${escapeHtml(b.title)}" /></div>
        <div class="form-grid cols-2">
          <div class="form-group"><label>Slug (URL)</label><input type="text" id="bl-slug" value="${escapeHtml(b.slug)}" /></div>
          <div class="form-group"><label>კატეგორია</label><input type="text" id="bl-category" value="${escapeHtml(b.category)}" /></div>
        </div>
        <div class="form-grid cols-3">
          <div class="form-group"><label>თარიღი</label><input type="date" id="bl-date" value="${escapeHtml(b.date)}" /></div>
          <div class="form-group"><label>წაკითხვის დრო</label><input type="text" id="bl-read" value="${escapeHtml(b.readTime || '')}" /></div>
          <div class="form-group">
            <label>&nbsp;</label>
            <label class="switch" style="padding: 8px 0;"><input type="checkbox" id="bl-featured" ${b.featured ? 'checked' : ''} /><span class="switch-slider"></span><span class="switch-label">Featured</span></label>
          </div>
        </div>
        <div class="form-group"><label>Excerpt (მოკლე აღწერა)</label><textarea id="bl-excerpt" rows="3">${escapeHtml(b.excerpt || '')}</textarea></div>
        <div class="form-group"><label>სურათის URL</label><input type="url" id="bl-image" value="${escapeHtml(b.image || '')}" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="bl-save">შენახვა</button>
      </div>
    `);
    $('#bl-save').addEventListener('click', () => {
      const u = {
        title: $('#bl-title').value, slug: $('#bl-slug').value, category: $('#bl-category').value,
        date: $('#bl-date').value, readTime: $('#bl-read').value, excerpt: $('#bl-excerpt').value,
        image: $('#bl-image').value, featured: $('#bl-featured').checked
      };
      if (!u.title) { toast('სათაური სავალდებულოა', 'error'); return; }
      if (isEdit) state.content.blog[index] = u; else state.content.blog.push(u);
      markDirty(); closeModal(); renderSection('blog'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- INDUSTRIES ---
  function renderIndustries() {
    const items = state.content.industries || [];
    return `
      <div class="page-header">
        <div><h1>ინდუსტრიები</h1><p>სექტორები რომელთაც ემსახურები</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-industry">+ ინდუსტრია</button></div>
      </div>
      ${items.length === 0 ? emptyState('ჯერ ინდუსტრიები არ გაქვს', 'დაამატე პირველი', 'add-industry-empty') : `
        <div class="list-items" id="industries-list">
          ${items.map((ind, i) => `
            <div class="list-item" data-index="${i}">
              <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
              <div class="list-item-body">
                <h4 class="list-item-title">${escapeHtml(ind.title)}</h4>
                <p class="list-item-subtitle">${escapeHtml(ind.description)}</p>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;
  }

  function attachIndustries() {
    const add = () => openIndustryModal();
    $('#add-industry')?.addEventListener('click', add);
    $('#add-industry-empty')?.addEventListener('click', add);
    $$('#industries-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openIndustryModal(parseInt(btn.dataset.edit))));
    $$('#industries-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm(`წაიშალოს "${state.content.industries[i].title}"?`)) return;
        state.content.industries.splice(i, 1);
        markDirty(); renderSection('industries'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('industries-list', 'industries');
  }

  function openIndustryModal(index = null) {
    const isEdit = index !== null;
    const ind = isEdit ? deepClone(state.content.industries[index]) : { title: '', description: '' };
    openModal(isEdit ? 'ინდუსტრიის რედაქტირება' : 'ახალი ინდუსტრია', `
      <div class="form-grid">
        <div class="form-group"><label>სახელი *</label><input type="text" id="ind-title" value="${escapeHtml(ind.title)}" /></div>
        <div class="form-group"><label>აღწერა</label><textarea id="ind-desc" rows="3">${escapeHtml(ind.description)}</textarea></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="ind-save">შენახვა</button>
      </div>
    `);
    $('#ind-save').addEventListener('click', () => {
      const u = { title: $('#ind-title').value, description: $('#ind-desc').value };
      if (!u.title) { toast('სახელი სავალდებულოა', 'error'); return; }
      if (isEdit) state.content.industries[index] = u; else state.content.industries.push(u);
      markDirty(); closeModal(); renderSection('industries'); updateBadges();
      toast('შენახულია', 'success');
    });
  }

  // --- STATS ---
  function renderStats() {
    const stats = state.content.stats || [];
    return `
      <div class="page-header">
        <div><h1>სტატისტიკა</h1><p>მთავარი გვერდის დიდი რიცხვები</p></div>
        <div class="page-header-actions"><button class="btn btn-yellow" id="add-stat">+ სტატი</button></div>
      </div>
      <div class="list-items" id="stats-list">
        ${stats.map((st, i) => `
          <div class="list-item" data-index="${i}">
            <div class="list-item-handle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></div>
            <div class="list-item-body">
              <h4 class="list-item-title" style="font-size: 20px;">${escapeHtml(st.value)}</h4>
              <p class="list-item-subtitle">${escapeHtml(st.label)}</p>
            </div>
            <div class="list-item-actions">
              <button class="icon-btn" data-edit="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
              <button class="icon-btn danger" data-delete="${i}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function attachStats() {
    $('#add-stat')?.addEventListener('click', () => openStatModal());
    $$('#stats-list [data-edit]').forEach(btn => btn.addEventListener('click', () => openStatModal(parseInt(btn.dataset.edit))));
    $$('#stats-list [data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.delete);
        if (!confirm('წაიშალოს?')) return;
        state.content.stats.splice(i, 1);
        markDirty(); renderSection('stats'); toast('წაიშალა', 'warning');
      });
    });
    setupDragReorder('stats-list', 'stats');
  }

  function openStatModal(index = null) {
    const isEdit = index !== null;
    const s = isEdit ? deepClone(state.content.stats[index]) : { value: '', label: '' };
    openModal(isEdit ? 'სტატის რედაქტირება' : 'ახალი სტატი', `
      <div class="form-grid cols-2">
        <div class="form-group"><label>მაჩვენებელი (მაგ. 500+)</label><input type="text" id="st-value" value="${escapeHtml(s.value)}" /></div>
        <div class="form-group"><label>ტექსტი</label><input type="text" id="st-label" value="${escapeHtml(s.label)}" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" data-modal-cancel>გაუქმება</button>
        <button class="btn btn-yellow" id="st-save">შენახვა</button>
      </div>
    `);
    $('#st-save').addEventListener('click', () => {
      const u = { value: $('#st-value').value, label: $('#st-label').value };
      if (isEdit) state.content.stats[index] = u; else state.content.stats.push(u);
      markDirty(); closeModal(); renderSection('stats');
      toast('შენახულია', 'success');
    });
  }

  // --- MEGA MENU ---
  function renderMegaMenu() {
    const m = state.content.megaMenus || {};
    return `
      <div class="page-header">
        <div><h1>Mega Menu</h1><p>ზედა ნავიგაციის ჩამოსაშლელი მენიუების მართვა</p></div>
      </div>
      ${Object.entries(m).map(([key, menu]) => `
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(menu.label)} (${key})</h3>
          </div>
          <div class="form-grid">
            <div class="form-grid cols-2">
              <div class="form-group"><label>Intro Title</label><input type="text" data-field="megaMenus.${key}.introTitle" value="${escapeHtml(menu.introTitle || '')}" /></div>
              <div class="form-group"><label>CTA Text</label><input type="text" data-field="megaMenus.${key}.ctaText" value="${escapeHtml(menu.ctaText || '')}" /></div>
            </div>
            <div class="form-group"><label>Intro Description</label><textarea data-field="megaMenus.${key}.introDesc" rows="3">${escapeHtml(menu.introDesc || '')}</textarea></div>
            <div class="form-group">
              <label>Spotlight Items (თითო ხაზზე ერთი)</label>
              <textarea data-field="megaMenus.${key}.spotlightItems" rows="5" data-list>${(menu.spotlightItems || []).join('\n')}</textarea>
              <small class="hint">ერთ ხაზზე — ერთი პუნქტი</small>
            </div>
          </div>
        </div>
      `).join('')}
    `;
  }

  function attachMegaMenu() {
    attachFieldListeners();
  }

  // --- FOOTER ---
  function renderFooter() {
    const f = state.content.footer;
    return `
      <div class="page-header">
        <div><h1>Footer</h1><p>ფუტერის ტექსტი და ბმულები</p></div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">About ტექსტი</h3></div>
        <div class="form-group"><label>აღწერა</label><textarea data-field="footer.about" rows="4">${escapeHtml(f.about || '')}</textarea></div>
      </div>
    `;
  }

  function attachFooter() {
    attachFieldListeners();
  }

  // --- TRANSLATIONS ---
  function renderTranslations() {
    return `
      <div class="page-header">
        <div><h1>თარგმანები (i18n)</h1><p>ქართული / ინგლისური ტექსტები</p></div>
      </div>
      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        <div>
          <strong>შენიშვნა:</strong> ეს სექცია მხოლოდ ხაზგასმისთვისაა — ენის გადართვა საიტზე ხდება KA/EN ღილაკით Header-ში. თარგმანები ავტომატურად იტვირთება i18n.js-დან.
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">ენის გადართვის პანელი</h3></div>
        <p>საიტზე ყველა ტექსტი არის ქართულად. ინგლისურ ვერსიას ავტომატურად დააჯენს <code>i18n.js</code> ფაილი.</p>
      </div>
    `;
  }

  function attachTranslations() {}

  // --- IMPORT ---
  function renderImport() {
    return `
      <div class="page-header">
        <div><h1>Import / Restore</h1><p>JSON ფაილის ატვირთვა ან ნაგულისხმევი კონტენტის აღდგენა</p></div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">📂 JSON იმპორტი</h3></div>
        <p>ატვირთე ადრე Export-ით გადმოწერილი <code>.json</code> ფაილი — ყველა კონტენტი განახლდება.</p>
        <div style="margin-top: 16px; display: flex; gap: 10px;">
          <button class="btn btn-dark" id="import-trigger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            აირჩიე JSON ფაილი
          </button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 class="card-title">🔄 ნაგულისხმევზე დაბრუნება</h3></div>
        <p>ყველა ცვლილება წაიშლება და დაბრუნდება ნაგულისხმევი (factory) კონტენტი.</p>
        <div style="margin-top: 16px;">
          <button class="btn btn-danger" id="reset-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            ყველაფრის წაშლა და აღდგენა
          </button>
        </div>
      </div>
    `;
  }

  function attachImport() {
    $('#import-trigger')?.addEventListener('click', () => $('#import-file').click());
    $('#reset-btn')?.addEventListener('click', resetContent);
  }

  // --- SETTINGS ---
  function renderSettings() {
    const hasToken = !!getGithubToken();
    const maskedToken = hasToken ? '••••••••••••••••••••' + getGithubToken().slice(-4) : '';

    return `
      <div class="page-header">
        <div><h1>პარამეტრები</h1><p>ადმინი პანელის და GitHub-ის კონფიგურაცია</p></div>
      </div>

      <!-- GitHub Token -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title">🚀 GitHub Auto-Publish ${hasToken ? '<span style="display: inline-block; margin-left: 8px; padding: 3px 10px; background: #10B981; color: white; font-size: 11px; border-radius: 4px; font-weight: 700;">ACTIVE</span>' : '<span style="display: inline-block; margin-left: 8px; padding: 3px 10px; background: #F59E0B; color: white; font-size: 11px; border-radius: 4px; font-weight: 700;">NOT CONFIGURED</span>'}</h3>
            <p class="card-subtitle">"Publish Live" ღილაკისთვის საჭიროა GitHub Personal Access Token</p>
          </div>
        </div>

        <div class="info-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          <div>
            <strong>როგორ მივიღო Token:</strong><br>
            1. გადადი <a href="https://github.com/settings/tokens/new?description=Audit%20Admin&scopes=repo" target="_blank" style="color: var(--ink); font-weight: 700; text-decoration: underline;">GitHub → New Token</a><br>
            2. მონიშნე <code>repo</code> scope<br>
            3. დააჭირე "Generate token"<br>
            4. დააკოპირე ტოკენი (ერთჯერად ჩანს!) და ჩასვი ქვემოთ
          </div>
        </div>

        <div class="form-grid" style="max-width: 640px;">
          <div class="form-group">
            <label>GitHub Personal Access Token</label>
            <input type="password" id="gh-token" value="${escapeHtml(hasToken ? maskedToken : '')}" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" />
            <small class="hint">შენახული მხოლოდ შენი ბრაუზერის localStorage-ში. Repository: <code>${GITHUB_OWNER}/${GITHUB_REPO}</code></small>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-dark" id="save-token">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              შენახვა
            </button>
            ${hasToken ? `
              <button class="btn btn-outline" id="test-token">Test კავშირი</button>
              <button class="btn btn-outline" id="remove-token" style="color: var(--danger); border-color: var(--danger);">წაშლა</button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Password -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">🔒 Admin პაროლი</h3></div>
        <div class="form-grid cols-2" style="max-width: 640px;">
          <div class="form-group">
            <label>ახალი პაროლი</label>
            <input type="password" id="new-password" />
          </div>
          <div class="form-group">
            <label>გაიმეორე</label>
            <input type="password" id="confirm-password" />
          </div>
        </div>
        <button class="btn btn-dark" id="change-pw">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          შეცვლა
        </button>
      </div>

      <!-- System Info -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">ℹ️ სისტემური ინფო</h3></div>
        <div class="form-grid cols-2">
          <div class="form-group"><label>ვერსია</label><input type="text" readonly value="${state.content._version || '1.0.0'}" /></div>
          <div class="form-group"><label>ბოლო განახლება</label><input type="text" readonly value="${state.content._updated ? new Date(state.content._updated).toLocaleString('ka-GE') : 'N/A'}" /></div>
        </div>
      </div>

      <!-- How it works -->
      <div class="card">
        <div class="card-header"><h3 class="card-title">📖 როგორ მუშაობს</h3></div>
        <div style="font-size: 14px; line-height: 1.7; color: var(--gray-700);">
          <p><strong>🔵 Save Local</strong> — ცვლილებები შენახულია მხოლოდ შენს ბრაუზერში (localStorage). მხოლოდ შენ ხედავ.</p>
          <p><strong>🟡 Publish Live</strong> — ცვლილებები იგზავნება GitHub-ზე, Vercel ავტომატურად ანახლებს საიტს. ყველას გამოუჩნდება 30-60 წამში.</p>
          <p><strong>⚙️ Export JSON</strong> — ჩამოწერა backup-ისთვის (ფაილის სახით).</p>
          <p style="margin-top: 12px; padding: 12px; background: var(--gray-100); border-left: 3px solid var(--yellow);"><strong>💡 რჩევა:</strong> Token-ი დააყენე ერთხელ → შემდეგ "Publish Live" ღილაკი იმუშავებს ყოველთვის.</p>
        </div>
      </div>
    `;
  }

  function attachSettings() {
    $('#change-pw')?.addEventListener('click', async () => {
      const n = $('#new-password').value;
      const c = $('#confirm-password').value;
      if (!n || n.length < 3) { toast('მინიმუმ 3 სიმბოლო', 'error'); return; }
      if (n !== c) { toast('პაროლები არ ემთხვევა', 'error'); return; }
      await changePassword(n);
      $('#new-password').value = '';
      $('#confirm-password').value = '';
      toast('პაროლი შეიცვალა', 'success');
    });

    // GitHub token
    $('#save-token')?.addEventListener('click', () => {
      const val = $('#gh-token').value.trim();
      if (!val || val.startsWith('••••')) { toast('ჩასვი სწორი ტოკენი', 'error'); return; }
      if (!val.startsWith('ghp_') && !val.startsWith('github_pat_')) {
        if (!confirm('Token არ იწყება ghp_ ან github_pat_. გააგრძელო?')) return;
      }
      setGithubToken(val);
      toast('Token შენახულია', 'success');
      renderSection('settings');
    });

    $('#test-token')?.addEventListener('click', async () => {
      const btn = $('#test-token');
      const orig = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><path d="M21 12a9 9 0 1 1-6.22-8.56"/></svg> ტესტი...';

      try {
        const data = await githubAPI('');
        toast(`✅ კავშირი OK — ${data.full_name} (${data.private ? 'private' : 'public'})`, 'success', 5000);
      } catch (e) {
        const msg = e.message;
        if (msg.startsWith('NETWORK:')) {
          toast('❌ ქსელის პრობლემა. შეამოწმე: 1) ინტერნეტი 2) AdBlocker/VPN 3) Brave Shield — გამორთე', 'error', 8000);
          console.error('Network error — try disabling AdBlocker or browser extensions that block api.github.com');
        } else if (msg.startsWith('UNAUTHORIZED:')) {
          toast('❌ ' + msg.replace('UNAUTHORIZED: ', ''), 'error', 5000);
        } else if (msg.startsWith('NOT_FOUND:')) {
          toast('❌ ' + msg.replace('NOT_FOUND: ', ''), 'error', 5000);
        } else if (msg.startsWith('FORBIDDEN:')) {
          toast('❌ ' + msg.replace('FORBIDDEN: ', ''), 'error', 5000);
        } else {
          toast('❌ ' + msg, 'error', 6000);
        }
        console.error('GitHub test failed:', e);
      } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    });

    $('#remove-token')?.addEventListener('click', () => {
      if (!confirm('Token-ის წაშლა? "Publish Live" აღარ იმუშავებს.')) return;
      setGithubToken('');
      toast('Token წაიშალა', 'warning');
      renderSection('settings');
    });
  }

  // ====== HELPERS ======
  function emptyState(title, desc, btnId) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(desc)}</p>
        <button class="btn btn-yellow" id="${btnId}">+ დაამატე</button>
      </div>
    `;
  }

  function attachFieldListeners() {
    $$('[data-field]').forEach(input => {
      input.addEventListener('input', (e) => {
        const path = input.dataset.field.split('.');
        let obj = state.content;
        for (let i = 0; i < path.length - 1; i++) {
          if (!obj[path[i]]) obj[path[i]] = {};
          obj = obj[path[i]];
        }
        let val = input.value;
        if (input.dataset.list !== undefined) {
          val = val.split('\n').map(l => l.trim()).filter(Boolean);
        }
        if (input.type === 'checkbox') val = input.checked;
        obj[path[path.length - 1]] = val;
        markDirty();
      });
    });
  }

  function attachImagePreview() {
    $$('[data-preview]').forEach(input => {
      input.addEventListener('input', () => {
        const preview = document.getElementById(input.dataset.preview);
        if (preview) preview.src = input.value;
      });
    });
  }

  function setupDragReorder(listId, contentKey) {
    const list = document.getElementById(listId);
    if (!list) return;
    let dragIdx = null;
    $$('.list-item', list).forEach(item => {
      item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', (e) => {
        dragIdx = parseInt(item.dataset.index);
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        const targetIdx = parseInt(item.dataset.index);
        if (dragIdx === null || dragIdx === targetIdx) return;
        const arr = contentKey === 'services' ? state.content.services :
                    contentKey === 'team' ? state.content.team :
                    contentKey === 'testimonials' ? state.content.testimonials :
                    contentKey === 'faq' ? state.content.faq :
                    contentKey === 'blog' ? state.content.blog :
                    contentKey === 'industries' ? state.content.industries :
                    contentKey === 'stats' ? state.content.stats : null;
        if (!arr) return;
        const [moved] = arr.splice(dragIdx, 1);
        arr.splice(targetIdx, 0, moved);
        markDirty();
        renderSection(state.currentSection);
        toast('რიგითობა განახლდა', 'info');
      });
    });
  }

  // ====== MODAL ======
  function openModal(title, html) {
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    $('#modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    $$('[data-modal-cancel]').forEach(b => b.addEventListener('click', closeModal));
  }

  function closeModal() {
    $('#modal').classList.add('hidden');
    document.body.style.overflow = '';
    $('#modal-body').innerHTML = '';
  }

  // ====== INIT ======
  async function init() {
    if (!(await isAuthenticated())) {
      showLogin();
    } else {
      showApp();
    }
  }

  function showLogin() {
    $('#login-screen').classList.remove('hidden');
    $('#admin-app').classList.add('hidden');
    $('#login-password').focus();
    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = $('#login-password').value;
      const success = await login(pw);
      if (success) {
        showApp();
      } else {
        $('#login-error').classList.remove('hidden');
        $('#login-password').value = '';
      }
    });
  }

  function showApp() {
    $('#login-screen').classList.add('hidden');
    $('#admin-app').classList.remove('hidden');
    state.content = loadContent();
    updateBadges();
    setupTopbar();
    setupSidebar();
    handleRoute();
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('beforeunload', (e) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  function setupTopbar() {
    $('#save-btn').addEventListener('click', saveContent);
    $('#publish-btn')?.addEventListener('click', async () => {
      if (!confirm('გამოვაქვეყნო ცვლილებები საიტზე?\n\n• ფაილი შეივსება GitHub-ში\n• Vercel ავტომატურად განაახლებს საიტს\n• 30-60 წამში ცვლილებები ხილვადი იქნება ყველასთვის')) return;
      await publishToGitHub();
    });
    $('#export-btn').addEventListener('click', exportJSON);
    $('#preview-btn').addEventListener('click', () => window.open('index.html', '_blank'));
    $('#logout-btn').addEventListener('click', () => {
      if (state.isDirty && !confirm('გაქვს უნახავი ცვლილებები. გამოსვლა?')) return;
      logout();
    });
    $('#modal-close').addEventListener('click', closeModal);
    $('.modal-backdrop').addEventListener('click', closeModal);

    $('#import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importJSON(file);
      e.target.value = '';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveContent();
      }
      if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) {
        closeModal();
      }
    });
  }

  function setupSidebar() {
    const toggle = $('#sidebar-toggle');
    const sidebar = $('#admin-sidebar');
    const backdrop = $('#sidebar-backdrop');

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('active');
    });
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });

    $$('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const section = link.dataset.section;
        if (section) {
          location.hash = '#' + section;
        }
      });
    });
  }

  init();
})();
