/* ==========================================================
   i18n — KA / EN / RU / HE translations
   Usage: add data-i18n="key.path" to any text element
   ========================================================== */

const translations = {

  // ====================================================================
  // ქართული (Georgian) — base language
  // ====================================================================
  ka: {
    nav: {
      home: "მთავარი",
      about: "ჩვენ შესახებ",
      services: "სერვისები",
      pricing: "ფასები",
      blog: "ბლოგი",
      contact: "კონტაქტი",
      faq: "FAQ",
      careers: "კარიერა",
      insights: "Insights",
      industries: "ინდუსტრიები",
      cta: "მიიღე შეთავაზება",
      menu: "მენიუ",
      search: "ძიება"
    },

    common: {
      learn_more: "გაიგე მეტი",
      read_more: "წაიკითხე მეტი",
      view_all: "ყველას ნახვა",
      start_free: "დაიწყე უფასოდ",
      get_consultation: "მიიღე კონსულტაცია",
      contact_us: "დაგვიკავშირდი",
      view_pricing: "ფასების ნახვა",
      our_services: "ჩვენი სერვისები"
    },

    hero: {
      // Empty by design — admin's content.hero values (merged by content-loader.js) are the source of truth.
      // Empty string makes resolveKey return undefined, so applyTranslations skips these elements and
      // preserves whatever content-loader.js wrote directly to the DOM.
      tag: "",
      title_pre: "",
      title_highlight: "",
      title_post: "",
      subtitle: "",
      cta_primary: "",
      cta_secondary: ""
    },

    callout: {
      text: "შექმენი შენი ბიზნესის ნდობა — ერთ-ერთ საქართველოში წამყვან პროფესიულ ფირმასთან.",
      cta: "დაიწყე დღესვე"
    },

    stats: {
      clients_label: "კლიენტი, რომლებიც გვენდობიან საქართველოში",
      years_label: "წლის გამოცდილება Big 4-ის დონეზე",
      saved_label: "დაზოგილი გადასახადი კლიენტებისთვის",
      satisfaction_label: "კლიენტის კმაყოფილება წლიური შეფასებით"
    },

    services_home: {
      eyebrow: "სერვისები · 01",
      title_pre: "როგორ",
      title_highlight: "დაგეხმარებით",
      title_post: "შენი ბიზნესის ზრდაში.",
      cta: "ყველა სერვისი"
    },

    industries_home: {
      eyebrow: "ინდუსტრიები · 02",
      title_pre: "ვიცნობთ თქვენს",
      title_highlight: "სექტორს.",
      subtitle: "ვემსახურებით სხვადასხვა ინდუსტრიის კომპანიებს — სპეციფიკური ექსპერტიზით თითოეული ნიშისთვის."
    },

    industries_cards: {
      tech_title: "Technology & IT",
      tech_desc: "ვირტუალური ზონის სტატუსი, SaaS კომპანიები, AI/Blockchain სტარტაპები.",
      finance_title: "ფინანსური სერვისები",
      finance_desc: "ბანკები, სადაზღვევო, საინვესტიციო ფონდები, ფინტექ სტარტაპები.",
      realestate_title: "უძრავი ქონება",
      realestate_desc: "დეველოპმენტი, უძრავი ქონების მართვა, მშენებლობა.",
      retail_title: "საცალო & E-commerce",
      retail_desc: "ონლაინ მაღაზიები, საცალო ქსელები, FMCG კომპანიები.",
      logistics_title: "ლოჯისტიკა",
      logistics_desc: "ტრანსპორტი, დისტრიბუცია, საბაჟო ოპერაციები.",
      horeca_title: "HoReCa",
      horeca_desc: "სასტუმროები, რესტორნები, კაფე-ბარები, ტურისტული ოპერატორები.",
      healthcare_title: "ჯანდაცვა & მედიცინა",
      healthcare_desc: "კლინიკები, ფარმაცევტული კომპანიები, მედ-ცენტრები.",
      intl_title: "საერთაშორისო ბიზნესი",
      intl_desc: "ექსპორტი/იმპორტი, არარეზიდენტი ინვესტორები, ჰოლდინგები."
    },

    agenda: {
      eyebrow: "C-Suite Agenda · 03",
      title_pre: "დღის წესრიგი",
      title_highlight: "ინდივიდუალურია",
      subtitle: "სპეციალიზირებული პროგრამები თითოეული მენეჯერული როლისთვის",
      cfo_title: "CFO Agenda",
      cfo_desc: "ფინანსური დირექტორების პრიორიტეტები: ლიკვიდობა, ფასების სტრატეგია, ინვესტიციები.",
      ceo_title: "CEO Agenda",
      ceo_desc: "აღმასრულებლების ფოკუსი: ბაზრის პოზიცია, ორგანიზაციული გამრჯებელობა.",
      cio_title: "CIO Agenda",
      cio_desc: "ტექნოლოგიური ხედვა: ციფრული ტრანსფორმაცია, კიბერ-დაცვა, AI."
    },

    insights_home: {
      eyebrow: "Insights · 04",
      title_pre: "უახლესი",
      title_highlight: "Insights",
      title_post: "და ანალიზი"
    },

    why_home: {
      eyebrow: "რატომ ჩვენ · 05",
      title_pre: "სანდოობა",
      title_highlight: "თაობებით.",
      subtitle: "ის, რაც ჩვენს კლიენტებს ყველაზე მნიშვნელოვნად მიაჩნიათ",
      item1: "Big 4-ის გამოცდილება — ქართული ბაზრის ცოდნით",
      item2: "500+ კლიენტი სხვადასხვა ინდუსტრიიდან",
      item3: "100% ონლაინ პროცესი — სახლიდან გამოსვლის გარეშე",
      item4: "პერსონალური ბუღალტერი ყოველ კომპანიაზე",
      item5: "დროული ანგარიშგება და ჯარიმების ნულოვანი რისკი",
      cta: "გაიცანი ჩვენი გუნდი"
    },

    pricing_home: {
      eyebrow: "ფასები · 06",
      title_pre: "გამჭვირვალე ფასები,",
      title_highlight: "ფარული ხარჯების გარეშე.",
      subtitle: "სამი ძირითადი პაკეტი შენი ბიზნესის ზომის მიხედვით"
    },

    client_voices: {
      eyebrow: "Client Voices · 07",
      title_pre: "რას ამბობენ",
      title_highlight: "ჩვენი კლიენტები."
    },

    faq_home: {
      eyebrow: "ხშირი კითხვები · 08",
      title_pre: "პასუხები, რომლებიც",
      title_highlight: "მნიშვნელოვანია."
    },

    cta_final: {
      title_pre: "შექმენი შენი",
      title_highlight: "ფინანსური მომავალი",
      subtitle: "ჩვენი გუნდი მზადაა დაგეხმაროს ზრდაში — ბუღალტერიიდან სტრატეგიულ კონსულტაციამდე.",
      cta: "დაიწყე უფასო კონსულტაცია"
    },

    services_page: {
      eyebrow: "ჩვენი სერვისები",
      title_pre: "როგორ",
      title_highlight: "დაგეხმარებით",
      title_post: "შენი ბიზნესის ზრდაში.",
      process_eyebrow: "როგორ ვმუშაობთ · 02",
      process_title_pre: "დაიწყე",
      process_title_highlight: "4 მარტივ",
      process_title_post: "ნაბიჯში.",
      step1_title: "უფასო კონსულტაცია",
      step1_desc: "30 წუთიანი საუბარი თქვენი მოთხოვნების გასაგებად — სრულიად უფასოდ.",
      step2_title: "პერსონალური შეთავაზება",
      step2_desc: "მორგებული ფასი 24 საათში — ფარული ხარჯების გარეშე.",
      step3_title: "ციფრული ხელშეკრულება",
      step3_desc: "ხელმოწერა სახლიდან ამოუსვლელად — სრულიად ციფრულად.",
      step4_title: "ვიწყებთ მუშაობას",
      step4_desc: "1-3 დღეში აქტიურდება ონლაინ პორტალი, იწყება თანამშრომლობა.",
      cta_title_pre: "მზად ხარ",
      cta_title_highlight: "დავიწყოთ?",
      cta_subtitle: "აირჩიე სერვისი და დაიწყე უფასო კონსულტაცია დღესვე."
    },

    pricing_page: {
      eyebrow: "ფასები · 01",
      title_pre: "გამჭვირვალე",
      title_highlight: "ფასები,",
      title_post: "ფარული ხარჯების გარეშე.",
      compare_eyebrow: "შედარება · 02",
      compare_title_pre: "რა შედის",
      compare_title_highlight: "თითოეულ პაკეტში.",
      feature_col: "მახასიათებელი",
      cta_title_pre: "მზად ხარ",
      cta_title_highlight: "დაიწყო?",
      cta_subtitle: "აირჩიე პაკეტი და დაიწყე უფასო კონსულტაცია დღესვე."
    },

    about_page: {
      eyebrow: "ჩვენ შესახებ · 01",
      title_pre: "15 წელი",
      title_highlight: "საქართველოს ბიზნესთან ერთად.",
      subtitle: "Big 4-ის გამოცდილების გუნდი, რომელმაც 500+ კომპანია მიიყვანა წარმატებამდე.",
      mission_eyebrow: "ჩვენი მისია · 02",
      mission_title_pre: "ბუღალტერია არ უნდა იყოს",
      mission_title_highlight: "ტვირთი.",
      mission_text: "ვაქციოთ ბუღალტერია და გადასახადები უხილავად ყოველდღიური ბიზნესისთვის. გამჭვირვალე პროცესით, პროფესიონალური გუნდით და თანამედროვე ტექნოლოგიებით ვეხმარებით მეწარმეებს ფოკუსირდნენ მნიშვნელოვანზე — ბიზნესის ზრდაზე.",
      history_eyebrow: "ჩვენი ისტორია · 03",
      history_title_pre: "15 წელი",
      history_title_highlight: "წარმატების",
      values_eyebrow: "ჩვენი ღირებულებები · 04",
      values_title_pre: "პრინციპები, რომლითაც",
      values_title_highlight: "ვცხოვრობთ.",
      team_eyebrow: "ჩვენი გუნდი · 05",
      team_title_pre: "ექსპერტები, რომელთაც",
      team_title_highlight: "ენდობა.",
      cta_title_pre: "გახდი",
      cta_title_highlight: "500+ კომპანიის",
      cta_title_post: "წევრი, ვინც გვენდობა",
      cta_subtitle: "დაიწყე უფასო კონსულტაცია — 30 წუთში გაიცნობ საუკეთესო ვარიანტს.",
      cta_btn: "დაიწყე ახლავე"
    },

    blog_page: {
      eyebrow: "Insights & Thought Leadership",
      title_pre: "იდეები, რომელიც",
      title_highlight: "ქმნის სიმბოლოს.",
      subtitle: "საგადასახადო ანალიზი, ბიზნესის ტრენდები და ექსპერტების Insights საქართველოს ბიზნეს გარემოზე.",
      featured_tag: "FEATURED",
      read_article: "წაიკითხე ანგარიში",
      categories: "კატეგორიები:",
      all: "ყველა",
      more: "მეტი სტატიის ნახვა",
      newsletter_title: "გამოიწერე Insights Newsletter",
      newsletter_subtitle: "ყოველ კვირაში ერთხელ — უახლესი ცვლილებები, გზამკვლევები და ანალიზები.",
      newsletter_placeholder: "შენი ელ.ფოსტა",
      newsletter_cta: "გამოწერა"
    },

    contact_page: {
      eyebrow: "კონტაქტი · 01",
      title_pre: "დავიწყოთ",
      title_highlight: "საუბარი.",
      subtitle: "გვიპასუხეთ კითხვაზე 24 საათში — რომელი კომუნიკაციის ფორმატი უფრო კომფორტულია?",
      left_eyebrow: "კომუნიკაციის არხები · 02",
      left_title_pre: "ყველაზე მოსახერხებელი",
      left_title_highlight: "შეარჩიე.",
      left_intro: "ჩვენი გუნდი გიპასუხებთ 24 საათში სამუშაო დღეებში.",
      label_phone: "ტელეფონი",
      label_email: "ელ.ფოსტა",
      label_office: "ოფისი",
      label_hours: "სამუშაო საათები",
      office_line1: "თბილისი, ვაჟა-ფშაველას გამზ. 71",
      office_line2: "Business Hub, მე-4 სართული",
      hours_line1: "ორშ - პარ: 09:00 - 19:00",
      hours_line2: "შაბათი: 10:00 - 15:00",
      form_eyebrow: "გაგვიგზავნე შეტყობინება · 03",
      form_title_pre: "გვიამბე თქვენი",
      form_title_highlight: "ამოცანის",
      form_title_post: "შესახებ.",
      name: "სახელი",
      email: "ელ.ფოსტა",
      phone: "ტელეფონი",
      company: "კომპანია",
      service: "სასურველი სერვისი",
      message: "შეტყობინება",
      select_service: "აირჩიე...",
      submit: "გაგზავნა"
    },

    services: {
      accounting: { title: "ბუღალტრული აღრიცხვა", desc: "სრული ბუღალტერია თვეში ფიქსირებული ფასით" },
      tax: { title: "საგადასახადო დეკლარაციები", desc: "დღგ, საშემოსავლო, მოგების გადასახადი" },
      payroll: { title: "ხელფასი და HR", desc: "თანამშრომლების აღრიცხვა, ხელფასის დარიცხვა" },
      registration: { title: "კომპანიის რეგისტრაცია", desc: "შპს, ი/მ, ფილიალი — 1 დღეში" },
      audit: { title: "ფინანსური აუდიტი", desc: "ფინანსური ანგარიშგების მიმოხილვა" },
      consulting: { title: "საგადასახადო კონსულტაცია", desc: "ექსპერტების პროფესიული რჩევები" },
      nonresident: { title: "არარეზიდენტებისთვის", desc: "საგადასახადო მომსახურება უცხოელებისთვის" },
      smallbiz: { title: "მცირე/მიკრო ბიზნესი", desc: "სტატუსის მიღება და შენარჩუნება" },
      virtualzone: { title: "ვირტუალური ზონა", desc: "IT კომპანიების სტატუსი — 0% მოგება" }
    },

    pricing: {
      eyebrow: "ფასები",
      title: "აირჩიე შენზე მორგებული პაკეტი",
      subtitle: "ფიქსირებული თვიური გადასახადი, ფარული საკომისიოების გარეშე",
      monthly: "/ თვეში",
      popular: "POPULAR",
      cta_start: "დაიწყე ახლა",
      plans: []
    },
    testimonials: { eyebrow: "Client Voices", title: "რას ამბობენ ჩვენი კლიენტები", items: [] },
    faq: { eyebrow: "FAQ", title: "ხშირი კითხვები", items: [] },

    footer: {
      about: "ვემსახურებით საქართველოს ბიზნესს — ბუღალტერია, გადასახადები, აუდიტი და კონსულტაცია. სანდო პარტნიორი, რომელიც გიცავს ფინანსური რისკებისგან.",
      address: "თბილისი, ვაჟა-ფშაველას გამზ. 71",
      hours: "ორშ-პარ: 09:00 - 19:00",
      copyright: "© 2026 Guberman Group Geo. ყველა უფლება დაცულია.",
      privacy: "კონფიდენციალურობა",
      terms: "წესები და პირობები",
      services: "სერვისები",
      industries: "ინდუსტრიები",
      insights: "Insights",
      about_col: "ჩვენ შესახებ",
      ind_tech: "Technology & IT",
      ind_finance: "ფინანსური სერვისები",
      ind_realestate: "უძრავი ქონება",
      ind_retail: "საცალო ვაჭრობა",
      ind_logistics: "ლოჯისტიკა",
      ins_tax: "საგადასახადო სიახლეები",
      ins_research: "კვლევები",
      ins_reports: "რეპორტები",
      ins_webinars: "ვებინარები",
      careers: "Careers",
      accessibility: "Accessibility"
    },

    mega: {
      services_label: "სერვისები",
      services_desc: "სრული საბუღალტრო, საგადასახადო და აუდიტის მომსახურება საქართველოში",
      services_cta: "გაეცანი",
      industries_label: "ინდუსტრიები",
      industries_desc: "ვემსახურებით საქართველოს სხვადასხვა სექტორის კომპანიებს — სპეციფიკური ექსპერტიზით თითოეული ნიშისთვის.",
      industries_cta: "ყველა ინდუსტრია",
      insights_label: "Insights",
      insights_desc: "საგადასახადო ანალიზი, ბიზნესის ტრენდები და ექსპერტების Insights საქართველოს ბიზნეს გარემოზე.",
      insights_cta: "წაიკითხე ყველა",
      about_label: "ჩვენ შესახებ",
      about_desc: "15+ წლის გამოცდილების გუნდი. 500+ კმაყოფილი კლიენტი, სერტიფიცირებული ექსპერტები.",
      about_cta: "გაიცანი გუნდი",
      careers_label: "კარიერა",
      careers_desc: "Audit-ში ვეძებთ ადამიანებს, ვინც ცვლილებებს ქმნის — მოდი ჩვენს გუნდში."
    }
  }
};

// ========================================================
// Lazy-loading of EN/RU/HE translations (split into i18n-extras.js
// to shave ~15KB brotli off initial page load when user is on KA).
// ========================================================
var __extrasLoaded = false;
var __extrasLoading = null; // Promise
function registerExtraTranslations(extras) {
  Object.assign(translations, extras);
  __extrasLoaded = true;
  // Re-apply current language in case the user picked a non-KA lang
  // BEFORE the extras finished loading — their page will now translate correctly.
  var pending = window.__pendingLangAfterExtras;
  if (pending) { window.__pendingLangAfterExtras = null; applyTranslations(pending); }
}
function loadExtras() {
  if (__extrasLoaded) return Promise.resolve();
  if (__extrasLoading) return __extrasLoading;
  __extrasLoading = new Promise(function (resolve, reject) {
    var s = document.createElement("script");
    s.src = "/assets/js/i18n-extras.js?v=" + (window.__cacheBust || "");
    s.async = true;
    s.onload = function () { resolve(); };
    s.onerror = function () { __extrasLoading = null; reject(new Error("Failed to load i18n-extras")); };
    document.head.appendChild(s);
  });
  return __extrasLoading;
}
window.registerExtraTranslations = registerExtraTranslations;
// If the extras script loaded BEFORE this file (preload + fast network), pick up its payload
if (window.__pendingExtraTranslations) {
  registerExtraTranslations(window.__pendingExtraTranslations);
  window.__pendingExtraTranslations = null;
}


// ========================================================
// Language metadata
// ========================================================
const SUPPORTED_LANGUAGES = [
  { code: 'ka', label: 'ქართული',   short: 'KA', flag: '🇬🇪', rtl: false },
  { code: 'en', label: 'English',    short: 'EN', flag: '🇬🇧', rtl: false },
  { code: 'ru', label: 'Русский',    short: 'RU', flag: '🇷🇺', rtl: false },
  { code: 'he', label: 'עברית',      short: 'HE', flag: '🇮🇱', rtl: true  }
];

// Resolve a translation key by walking the path with a fallback chain.
// Fallback order: requested lang -> English -> Georgian (base).
function resolveKey(keyPath, lang) {
  const chain = [lang, 'en', 'ka'].filter((l, i, a) => a.indexOf(l) === i);
  for (const l of chain) {
    let v = translations[l];
    let ok = true;
    for (const k of keyPath) {
      if (v && typeof v === 'object' && k in v) v = v[k];
      else { ok = false; break; }
    }
    if (ok && v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}

let __currentLang = null; // internal tracker — distinguishes initial load from user switch

function applyTranslations(lang) {
  // Non-KA language requested but extras aren't loaded yet? Kick off the fetch
  // and apply the OLD lang temporarily, then re-apply once extras arrive.
  if (lang !== 'ka' && !translations[lang]) {
    window.__pendingLangAfterExtras = lang;
    try { loadExtras(); } catch (_) {}
    // Fall through using ka so the UI doesn't freeze while we wait
    lang = __currentLang || 'ka';
  }
  if (!translations[lang]) lang = 'ka';
  const isSameLang = __currentLang === lang;
  document.documentElement.lang = lang;

  const langMeta = SUPPORTED_LANGUAGES.find(l => l.code === lang) || SUPPORTED_LANGUAGES[0];
  document.documentElement.dir = langMeta.rtl ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('lang-rtl', !!langMeta.rtl);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const keyPath = el.getAttribute("data-i18n").split(".");
    const value = resolveKey(keyPath, lang);
    if (typeof value === "string") {
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = value;
      else el.textContent = value;
    }
  });

  // Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const keyPath = el.getAttribute("data-i18n-placeholder").split(".");
    const value = resolveKey(keyPath, lang);
    if (typeof value === "string") el.setAttribute("placeholder", value);
  });

  localStorage.setItem("lang", lang);
  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  // Update visible language label in nav (any element with data-current-lang)
  document.querySelectorAll("[data-current-lang-label]").forEach(el => {
    el.textContent = langMeta.label;
  });
  document.querySelectorAll("[data-current-lang-short]").forEach(el => {
    el.textContent = langMeta.short;
  });

  // Update active state in visible locale dropdown
  document.querySelectorAll("[data-locale-option]").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-locale-option") === lang);
  });

  // Only fire when lang actually changed — prevents infinite-reload loops.
  if (!isSameLang && __currentLang !== null) {
    document.dispatchEvent(new CustomEvent("lang-changed", { detail: { lang, previous: __currentLang } }));
  }
  __currentLang = lang;
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("lang") || "ka";
  // If the user's saved language is a non-KA one, kick off the extras fetch
  // EARLY (doesn't block — applyTranslations falls back to KA until it arrives).
  if (saved !== "ka") {
    try { loadExtras(); } catch (_) {}
  }
  applyTranslations(saved);

  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => applyTranslations(btn.dataset.lang));
  });

  // Wire visible locale options (added dynamically by partials.js)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-locale-option]");
    if (btn) {
      applyTranslations(btn.getAttribute("data-locale-option"));
      // Close dropdown
      const wrap = btn.closest(".nav-locale-wrap");
      if (wrap) wrap.classList.remove("open");
    }
  });
});

// i18n content-item resolver — returns a merged view of an item with language overrides applied.
function resolveItemI18n(item, lang) {
  if (!item || typeof item !== 'object') return item;
  if (!lang || lang === 'ka' || !item.i18n || !item.i18n[lang]) return item;
  const override = item.i18n[lang];
  const merged = { ...item };
  for (const key of Object.keys(override)) {
    const val = override[key];
    if (val !== undefined && val !== null && val !== '') merged[key] = val;
  }
  return merged;
}

window.translations = translations;
window.applyTranslations = applyTranslations;
window.resolveItemI18n = resolveItemI18n;
window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
