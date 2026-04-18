/* ==========================================================
   Shared Header + Footer — EY Exact Replica
   ========================================================== */

const basePath = (() => {
  const path = window.location.pathname.replace(/\\/g, "/");
  if (path.includes("/services/")) return "../";
  return "";
})();

const SERVICES = [
  { slug: "accounting",   key: "services.accounting",   icon: "book-open" },
  { slug: "tax",          key: "services.tax",          icon: "receipt" },
  { slug: "payroll",      key: "services.payroll",      icon: "users" },
  { slug: "registration", key: "services.registration", icon: "building" },
  { slug: "audit",        key: "services.audit",        icon: "shield-check" },
  { slug: "consulting",   key: "services.consulting",   icon: "message-circle" },
  { slug: "nonresident",  key: "services.nonresident",  icon: "globe" },
  { slug: "smallbiz",     key: "services.smallbiz",     icon: "briefcase" },
  { slug: "virtualzone",  key: "services.virtualzone",  icon: "cpu" }
];

const ICONS = {
  "book-open":     '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  "receipt":       '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>',
  "users":         '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  "building":      '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>',
  "shield-check":  '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
  "message-circle":'<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  "globe":         '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  "briefcase":     '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  "cpu":           '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/></svg>',
  "chevron-down":  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  "chevron-up":    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
  "arrow-right":   '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  "arrow-right-sm":'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  "search":        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  "user":          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  "globe-sm":      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a14.5 14.5 0 0 1 0 20M12 2a14.5 14.5 0 0 0 0 20"/></svg>',
  "menu":          '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="8" y2="8"/><line x1="4" x2="20" y1="16" y2="16"/></svg>',
  "close":         '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  "check":         '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  "facebook":      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z"/></svg>',
  "instagram":     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>',
  "linkedin":      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.42v1.57h.05c.48-.9 1.64-1.85 3.38-1.85 3.62 0 4.29 2.38 4.29 5.48v6.25zM5.34 7.43A2.06 2.06 0 1 1 5.34 3.3a2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
  "youtube":       '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.38.48A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.12 2.12C4.5 20.4 12 20.4 12 20.4s7.5 0 9.38-.48a3 3 0 0 0 2.12-2.12C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z"/></svg>',
  "phone":         '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1 1 0 0 0-1.02.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.58l2.2-2.21a1 1 0 0 0 .25-1.02A11.36 11.36 0 0 1 8.5 4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3.5a1 1 0 0 0-1-1z"/></svg>',
  "mail":          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>'
};

// ====== MEGA MENU DATA (EY 3-part structure) ======
const MEGA_MENUS = {
  services: {
    label: "სერვისები",
    intro: {
      title: "სერვისები",
      desc: "Audit კლიენტებს ეხმარება შექმნან გრძელვადიანი ღირებულება. ჩვენი მომსახურება მოიცავს ბუღალტერიას, საგადასახადო დეკლარაციებს, აუდიტს და სტრატეგიულ კონსულტაციას — საქართველოს მეწარმეებისთვის.",
      ctaText: "გაეცანი",
      ctaHref: "services.html"
    },
    links: [
      { title: "ბუღალტრული აღრიცხვა", href: "services/accounting.html" },
      { title: "საგადასახადო დეკლარაციები", href: "services/tax.html" },
      { title: "ფინანსური აუდიტი", href: "services/audit.html" },
      { title: "ხელფასი და HR", href: "services/payroll.html" },
      { title: "კომპანიის რეგისტრაცია", href: "services/registration.html" },
      { title: "საგადასახადო კონსულტაცია", href: "services/consulting.html" },
      { title: "არარეზიდენტებისთვის", href: "services/nonresident.html" },
      { title: "მცირე ბიზნესის სტატუსი", href: "services/smallbiz.html" },
      { title: "ვირტუალური ზონა", href: "services/virtualzone.html" }
    ],
    spotlight: {
      title: "Spotlight",
      items: [
        { title: "Artificial Intelligence (AI)", href: "blog.html" },
        { title: "2026 საგადასახადო ცვლილებები", href: "blog.html" },
        { title: "ვირტუალური ზონის სტატუსი", href: "blog.html" },
        { title: "IFRS მიგრაცია", href: "blog.html" },
        { title: "დღგ-ის ოპტიმიზაცია", href: "blog.html" },
        { title: "ტრანსფერ ფრაისინგი", href: "blog.html" }
      ]
    }
  },

  industries: {
    label: "ინდუსტრიები",
    intro: {
      title: "ინდუსტრიები",
      desc: "ვემსახურებით საქართველოს სხვადასხვა სექტორის კომპანიებს — სპეციფიკური ექსპერტიზით თითოეული ნიშისთვის. ყოველ ინდუსტრიას ჰყავს ჩვენს გუნდში სპეციალისტი, რომელიც იცნობს სპეციფიკურ გამოწვევებს.",
      ctaText: "ყველა ინდუსტრია",
      ctaHref: "services.html"
    },
    links: [
      { title: "Technology & IT", href: "#" },
      { title: "ფინანსური სერვისები", href: "#" },
      { title: "უძრავი ქონება", href: "#" },
      { title: "საცალო & E-commerce", href: "#" },
      { title: "ლოჯისტიკა", href: "#" },
      { title: "HoReCa", href: "#" },
      { title: "ჯანდაცვა & მედიცინა", href: "#" },
      { title: "საერთაშორისო ბიზნესი", href: "#" }
    ],
    spotlight: {
      title: "Spotlight",
      items: [
        { title: "Tech Startup Growth", href: "blog.html" },
        { title: "ფინტექ რეგულაციები 2026", href: "blog.html" },
        { title: "E-commerce დაბეგვრა", href: "blog.html" },
        { title: "Real Estate Outlook", href: "blog.html" }
      ]
    }
  },

  insights: {
    label: "Insights",
    intro: {
      title: "Insights & Thought Leadership",
      desc: "საგადასახადო ანალიზი, ბიზნესის ტრენდები და ექსპერტების Insights საქართველოს ბიზნეს გარემოზე. კვირის სიახლეები, გზამკვლევები და კვლევები — ერთ სივრცეში.",
      ctaText: "წაიკითხე ყველა",
      ctaHref: "blog.html"
    },
    links: [
      { title: "საგადასახადო სიახლეები", href: "blog.html" },
      { title: "ბიზნესის სტრატეგია", href: "blog.html" },
      { title: "ტექნოლოგია & IT", href: "blog.html" },
      { title: "აუდიტი & IFRS", href: "blog.html" },
      { title: "გზამკვლევები", href: "blog.html" },
      { title: "რეპორტები & კვლევები", href: "blog.html" },
      { title: "ვებინარები", href: "blog.html" }
    ],
    spotlight: {
      title: "Spotlight",
      items: [
        { title: "2026 Tax Guide", href: "blog.html" },
        { title: "შპს vs ი/მ გზამკვლევი", href: "blog.html" },
        { title: "Digital Transformation", href: "blog.html" },
        { title: "ESG Reporting", href: "blog.html" }
      ]
    }
  },

  about: {
    label: "ჩვენ შესახებ",
    intro: {
      title: "ჩვენ შესახებ",
      desc: "15+ წლის გამოცდილების გუნდი, რომელიც საქართველოს ბიზნესს ეხმარება ფინანსური ზრდის გზაზე. 500+ კმაყოფილი კლიენტი, სერტიფიცირებული ექსპერტები, გამჭვირვალე მიდგომა.",
      ctaText: "გაიცანი გუნდი",
      ctaHref: "about.html"
    },
    links: [
      { title: "ჩვენი მიდგომა", href: "about.html" },
      { title: "ჩვენი ისტორია", href: "about.html" },
      { title: "ჩვენი გუნდი", href: "about.html" },
      { title: "ღირებულებები", href: "about.html" },
      { title: "დაგვიკავშირდი", href: "contact.html" },
      { title: "პრესა & მედია", href: "#" }
    ],
    spotlight: {
      title: "Spotlight",
      items: [
        { title: "Leadership Team", href: "about.html" },
        { title: "2025 Impact Report", href: "blog.html" },
        { title: "Career Opportunities", href: "#" },
        { title: "ESG Commitment", href: "blog.html" }
      ]
    }
  },

  careers: {
    label: "კარიერა",
    intro: {
      title: "კარიერა Audit-ში",
      desc: "ვეძებთ ნიჭიერ და გატაცებულ ადამიანებს, რომლებიც მზად არიან აწარმოონ ცვლილებები. Audit-ში შენი იდეა მნიშვნელოვანია.",
      ctaText: "იხილე ვაკანსიები",
      ctaHref: "#"
    },
    links: [
      { title: "ღია ვაკანსიები", href: "#" },
      { title: "სტუდენტები & Graduates", href: "#" },
      { title: "სტაჟირება", href: "#" },
      { title: "კულტურა", href: "#" },
      { title: "ბენეფიტები", href: "#" }
    ],
    spotlight: {
      title: "Spotlight",
      items: [
        { title: "Graduate Program 2026", href: "#" },
        { title: "Life at Audit", href: "#" },
        { title: "Diversity & Inclusion", href: "#" }
      ]
    }
  }
};

function renderMegaMenu(key, data) {
  const linksHtml = data.links.map(link => `
    <a href="${basePath}${link.href}" class="mega-link-item">
      <span>${link.title}</span>
      <span class="mega-arrow">→</span>
    </a>
  `).join("");

  const spotlightHtml = data.spotlight ? `
    <div class="mega-spotlight">
      <h4>${data.spotlight.title}</h4>
      <div class="mega-spotlight-list">
        ${data.spotlight.items.map(s => `<a href="${basePath}${s.href}">${s.title}</a>`).join("")}
      </div>
    </div>
  ` : "";

  return `
    <div class="mega-menu" data-mega="${key}">
      <div class="mega-inner">
        <div class="mega-intro">
          <h3>${data.intro.title}</h3>
          <p>${data.intro.desc}</p>
          <a href="${basePath}${data.intro.ctaHref}" class="mega-explore-btn">${data.intro.ctaText}</a>
        </div>
        <div class="mega-links">
          ${linksHtml}
        </div>
        ${spotlightHtml}
      </div>
      <button class="mega-close" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>
      </button>
    </div>
  `;
}

function renderHeader() {
  // Use dynamic megaMenus from content.json if available, else fallback to hardcoded MEGA_MENUS
  const dynMenus = (window.SITE_CONTENT && window.SITE_CONTENT.megaMenus) || null;
  const menusToUse = dynMenus && Object.keys(dynMenus).length > 0 ? dynMenus : MEGA_MENUS;

  const navItems = Object.keys(menusToUse).map(key => ({ key, type: "mega" }));

  const navItemsHtml = navItems.map(item => {
    const mega = menusToUse[item.key];
    if (!mega || !mega.label) return '';
    return `
      <li class="has-mega" data-mega-trigger="${item.key}">
        <button class="nav-link" type="button" aria-expanded="false">
          <span>${mega.label}</span>
        </button>
        ${renderMegaMenu(item.key, mega)}
      </li>
    `;
  }).join("");

  return `
    <header class="header">
      <div class="container-wide">
        <nav class="nav" aria-label="Main">
          <a href="${basePath}index.html" class="logo">
            <div class="logo-wrap">
              <span class="logo-ey">Audit</span>
            </div>
            <span class="logo-tagline">Shape the future<br>with confidence</span>
          </a>

          <ul class="nav-menu">
            ${navItemsHtml}
          </ul>

          <div class="nav-actions">
            <button class="nav-action-item nav-search" aria-label="Search">
              ${ICONS["search"]}
              <span>Search</span>
            </button>
            <a href="${basePath}contact.html" class="nav-action-item nav-account">
              ${ICONS["user"]}
              <span>My Audit</span>
            </a>
            <button class="nav-action-item nav-locale" type="button">
              ${ICONS["globe-sm"]}
              <span class="nav-locale-text">Georgia <strong>ქართული</strong></span>
              ${ICONS["chevron-down"]}
            </button>
            <button class="nav-toggle" type="button" aria-label="Menu" aria-expanded="false">
              <span class="nav-toggle-icon-open">${ICONS["menu"]}</span>
              <span class="nav-toggle-icon-close">${ICONS["close"]}</span>
            </button>
          </div>
        </nav>
      </div>
    </header>

    <div class="mega-backdrop" aria-hidden="true"></div>

    <!-- Hidden language switcher for i18n (keeps KA/EN toggle functionality) -->
    <div class="lang-switch" style="position: absolute; left: -9999px;" role="group" aria-label="Language">
      <button data-lang="ka" type="button">KA</button>
      <button data-lang="en" type="button">EN</button>
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-about">
            <a href="${basePath}index.html" class="logo">
              <div class="logo-wrap"><span class="logo-ey">Audit</span></div>
              <span class="logo-tagline" style="color: rgba(255,255,255,0.6);">Shape the future<br>with confidence</span>
            </a>
            <p data-i18n="footer.about" style="margin-top: 20px;"></p>
            <p style="font-size: 13px; color: rgba(255,255,255,0.6);">
              <strong style="color: white; display: block; font-size: 16px; margin-bottom: 6px;">+995 32 2 00 00 00</strong>
              info@auditcompany.ge<br>
              <span data-i18n="footer.address"></span>
            </p>
          </div>

          <div>
            <h5>Services</h5>
            <div class="footer-links">
              <a href="${basePath}services/audit.html" data-i18n="services.audit.title"></a>
              <a href="${basePath}services/tax.html" data-i18n="services.tax.title"></a>
              <a href="${basePath}services/accounting.html" data-i18n="services.accounting.title"></a>
              <a href="${basePath}services/consulting.html" data-i18n="services.consulting.title"></a>
              <a href="${basePath}services/payroll.html" data-i18n="services.payroll.title"></a>
            </div>
          </div>

          <div>
            <h5>Industries</h5>
            <div class="footer-links">
              <a href="#">Technology & IT</a>
              <a href="#">ფინანსური სერვისები</a>
              <a href="#">უძრავი ქონება</a>
              <a href="#">საცალო ვაჭრობა</a>
              <a href="#">ლოჯისტიკა</a>
            </div>
          </div>

          <div>
            <h5>Insights</h5>
            <div class="footer-links">
              <a href="${basePath}blog.html">საგადასახადო სიახლეები</a>
              <a href="${basePath}blog.html">კვლევები</a>
              <a href="${basePath}blog.html">რეპორტები</a>
              <a href="${basePath}blog.html">ვებინარები</a>
            </div>
          </div>

          <div>
            <h5>About</h5>
            <div class="footer-links">
              <a href="${basePath}about.html" data-i18n="nav.about"></a>
              <a href="#">Careers</a>
              <a href="${basePath}contact.html" data-i18n="nav.contact"></a>
              <a href="#" data-i18n="footer.privacy"></a>
              <a href="#" data-i18n="footer.terms"></a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="left">
            <span data-i18n="footer.copyright"></span>
            <a href="#">Accessibility</a>
            <a href="#" data-i18n="footer.privacy"></a>
            <a href="#" data-i18n="footer.terms"></a>
          </div>
          <div class="social">
            <a href="#" aria-label="LinkedIn">${ICONS["linkedin"]}</a>
            <a href="#" aria-label="Facebook">${ICONS["facebook"]}</a>
            <a href="#" aria-label="Instagram">${ICONS["instagram"]}</a>
            <a href="#" aria-label="YouTube">${ICONS["youtube"]}</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");
  if (headerMount) headerMount.outerHTML = renderHeader();
  if (footerMount) footerMount.outerHTML = renderFooter();

  if (typeof applyTranslations === "function") {
    const lang = localStorage.getItem("lang") || "ka";
    applyTranslations(lang);
  }
});

window.ICONS = ICONS;
window.SERVICES = SERVICES;
window.MEGA_MENUS = MEGA_MENUS;
