/* ==========================================================
   i18n — Georgian / English translations
   Usage: add data-i18n="key.path" to any text element
   ========================================================== */

const translations = {
  ka: {
    // Navigation
    nav: {
      home: "მთავარი",
      about: "ჩვენ შესახებ",
      services: "სერვისები",
      pricing: "ფასები",
      blog: "ბლოგი",
      contact: "კონტაქტი",
      cta: "მიიღე შეთავაზება",
      menu: "მენიუ"
    },

    // Services list (used in dropdown + pages)
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

    // Hero
    hero: {
      badge: "ნდობა — 500+ კლიენტი საქართველოში",
      title_1: "საბუღალტრო და საგადასახადო",
      title_highlight: "გადაწყვეტა",
      title_2: "თქვენი ბიზნესისთვის",
      lead: "ვემსახურებით საქართველოში რეგისტრირებულ კომპანიებს, ინდივიდუალურ მეწარმეებს და ფიზიკურ პირებს — რეზიდენტებსა და არარეზიდენტებს.",
      cta_primary: "დაიწყე უფასო კონსულტაცია",
      cta_secondary: "ფასების ნახვა",
      trust: "500+ კმაყოფილი კლიენტი • 4.9 / 5"
    },

    // Stats
    stats: {
      clients: "კლიენტი",
      years: "წლიანი გამოცდილება",
      services: "სერვისი",
      satisfaction: "კლიენტის კმაყოფილება"
    },

    // Services section
    services_section: {
      eyebrow: "ჩვენი სერვისები",
      title: "ყველაფერი ერთ სივრცეში",
      subtitle: "ბუღალტერია, გადასახადები, ხელფასი, რეგისტრაცია და კონსულტაცია — პროფესიონალებისგან",
      cta: "ყველა სერვისი",
      learn_more: "გაიგე მეტი"
    },

    // Features / Why choose us
    why: {
      eyebrow: "რატომ ჩვენ",
      title: "გაყიდული ფასი და 100% გამჭვირვალობა",
      subtitle: "ვმუშაობთ თვიური ფიქსირებული ფასებით და გვერდის ქცევა-გამჭვირვალე, გარანტირებული შედეგებით",
      items: [
        { title: "ფიქსირებული ფასი", desc: "თვიური გადასახადი წინასწარ იცით — ფარული საკომისიოების გარეშე" },
        { title: "პერსონალური ბუღალტერი", desc: "თქვენი კომპანიისთვის გამოყოფილი ექსპერტი — ერთი კონტაქტი ყველაფერისთვის" },
        { title: "ონლაინ პლატფორმა", desc: "დოკუმენტები, ანგარიშგება და კომუნიკაცია ერთ სივრცეში" },
        { title: "დროული ანგარიშგება", desc: "ყველა დეკლარაცია დროულად — ჯარიმების რისკის გარეშე" }
      ]
    },

    // Process steps
    process: {
      eyebrow: "როგორ ვმუშაობთ",
      title: "4 მარტივი ნაბიჯი",
      subtitle: "გაერკვიეთ თუ როგორ გავხდებით თქვენი პარტნიორი",
      steps: [
        { title: "დაგვიკავშირდით", desc: "შეავსეთ ფორმა ან დაგვირეკეთ უფასო კონსულტაციისთვის" },
        { title: "ინდივიდუალური შეთავაზება", desc: "გავაანალიზებთ თქვენს მოთხოვნას და ფასს" },
        { title: "ხელშეკრულება", desc: "ხელმოწერა სახლიდან ან ოფისში — ყველაფერი ციფრულად" },
        { title: "ვიწყებთ მუშაობას", desc: "მოცულობისა და გუნდის მიხედვით — 1-3 დღეში" }
      ]
    },

    // Pricing
    pricing: {
      eyebrow: "ფასები",
      title: "აირჩიე შენზე მორგებული პაკეტი",
      subtitle: "ფიქსირებული თვიური გადასახადი, ფარული საკომისიოების გარეშე",
      monthly: "/ თვეში",
      popular: "პოპულარული",
      cta_start: "დაიწყე ახლა",
      plans: [
        {
          name: "სტარტერი",
          desc: "ახალი ინდმეწარმისთვის და მცირე ბიზნესისთვის",
          price: "150",
          currency: "₾",
          features: [
            "30-მდე ოპერაცია თვეში",
            "მცირე ბიზნესის დეკლარაცია",
            "საბანკო ამონაწერების დამუშავება",
            "საგადასახადო კონსულტაცია",
            "ელ.ფოსტით მხარდაჭერა"
          ]
        },
        {
          name: "ბიზნესი",
          desc: "შპს-სთვის აქტიური ოპერაციებით",
          price: "350",
          currency: "₾",
          badge: "პოპულარული",
          features: [
            "150-მდე ოპერაცია თვეში",
            "დღგ-ის და მოგების დეკლარაცია",
            "ხელფასის დარიცხვა (5 თანამშრომლამდე)",
            "ყოველთვიური ფინანსური ანგარიშგება",
            "პერსონალური ბუღალტერი",
            "ტელეფონით და ონლაინ მხარდაჭერა"
          ]
        },
        {
          name: "კორპორაციული",
          desc: "დიდი ოპერაციული მოცულობის კომპანიებისთვის",
          price: "750",
          currency: "₾",
          features: [
            "შეუზღუდავი ოპერაციები",
            "სრული საგადასახადო მომსახურება",
            "ხელფასის დარიცხვა (შეუზღუდავი)",
            "IFRS ანგარიშგება",
            "თვიური აუდიტის მიმოხილვა",
            "პრიორიტეტული მხარდაჭერა 24/7",
            "საფინანსო დირექტორის კონსულტაცია"
          ]
        }
      ]
    },

    // Testimonials
    testimonials: {
      eyebrow: "გამოხმაურებები",
      title: "რას ამბობენ ჩვენი კლიენტები",
      subtitle: "500-ზე მეტი კომპანია საქართველოს სხვადასხვა სექტორიდან გვენდობა ყოველთვიურ ბუღალტერიას",
      items: [
        {
          quote: "ერთ წელზე მეტია ვთანამშრომლობთ და აბსოლუტურად კმაყოფილი ვარ. ყველა დეკლარაცია დროულად, კომუნიკაცია ძალიან სწრაფი.",
          author: "ნინო ყიფიანი",
          role: "Co-Founder, TechStart GE"
        },
        {
          quote: "როგორც არარეზიდენტმა, საერთოდ არ ვიცოდი საიდან დამეწყო. გუნდმა ყველა საკითხი გადაწყვიტა — რეგისტრაციიდან დეკლარაციებამდე.",
          author: "David Miller",
          role: "CEO, Remote Ventures"
        },
        {
          quote: "გადავედით უფრო დიდ პაკეტზე, რადგან ბიზნესი გავაფართოვეთ. ფინანსური ანგარიშგება ყოველთვიურად გვაქვს — მართვა გახდა გაცილებით მარტივი.",
          author: "გიორგი ბერიძე",
          role: "Founder, Logistics Pro"
        }
      ]
    },

    // FAQ
    faq: {
      eyebrow: "კითხვები",
      title: "ხშირად დასმული კითხვები",
      subtitle: "ვერ იპოვე პასუხი? დაგვიკავშირდი — პასუხს მოგცემთ 24 საათში",
      items: [
        {
          q: "რამდენად სწრაფად შემიძლია დავიწყო თქვენთან მუშაობა?",
          a: "ჩვეულებრივ, კონტრაქტის გაფორმებიდან 1-3 სამუშაო დღეში ვიწყებთ მომსახურებას. სისწრაფე დამოკიდებულია ბიზნესის მოცულობაზე და დოკუმენტაციაზე."
        },
        {
          q: "ვმუშაობ არარეზიდენტი, შემიძლია თქვენი მომსახურება?",
          a: "კი, სპეციალიზირებული პაკეტი გვაქვს არარეზიდენტებისთვის. ვეხმარებით კომპანიის რეგისტრაციაში, საგადასახადო სტატუსის მიღებასა და საბანკო ანგარიშის გახსნაში."
        },
        {
          q: "მცირე ბიზნესის სტატუსი რა სარგებელს იძლევა?",
          a: "მცირე ბიზნესის სტატუსი იძლევა 1% გადასახადს ბრუნვაზე, წლიური 500,000 ლარის ლიმიტით. გარკვეული აქტივობები შეზღუდულია — დეტალურად გაცნობებთ კონსულტაციაზე."
        },
        {
          q: "შეიცავს თუ არა ფასი ყველა დეკლარაციას?",
          a: "დიახ, ყველა სტანდარტული პაკეტი მოიცავს ყოველთვიური, კვარტალური და წლიური დეკლარაციების მომზადებასა და ჩაბარებას."
        },
        {
          q: "რა მოხდება თუ არ ვიცი როდის არის დეკლარაციის ჩაბარების დრო?",
          a: "ეს ჩვენი პასუხისმგებლობაა. თქვენ დროდადრო დაიხსომებთ შეტყობინებებს სასურველი ქმედებების შესახებ, მაგრამ ფორმალური ვადების თვალთვალი ჩვენი გუნდის ხელშია."
        },
        {
          q: "შემიძლია გადავიდე მეორე პაკეტზე?",
          a: "რა თქმა უნდა — პაკეტს შეგიძლია შეცვალო ნებისმიერ დროს. ცვლილება ძალაში შედის შემდეგი თვის პირველი რიცხვიდან."
        }
      ]
    },

    // CTA section
    cta: {
      title: "მზად ხარ, რომ გათავისუფლდე ბუღალტერიის ტვირთისგან?",
      subtitle: "დარეგისტრირდი უფასო კონსულტაციაზე — 30 წუთში გაიცნობ საუკეთესო ვარიანტს შენი ბიზნესისთვის",
      primary: "დაიწყე უფასო კონსულტაცია",
      secondary: "დარეკე ახლავე"
    },

    // Blog section
    blog: {
      eyebrow: "ბლოგი",
      title: "სიახლეები და სტატიები",
      subtitle: "საგადასახადო ცვლილებები, ბიზნესის რჩევები და სიახლეები საქართველოს ბიზნეს-გარემოზე",
      read: "წაიკითხე მეტი"
    },

    // Footer
    footer: {
      about: "ვემსახურებით საქართველოს ბიზნესს — ბუღალტერია, გადასახადები, აუდიტი და კონსულტაცია. სანდო პარტნიორი, რომელიც გიცავს ფინანსური რისკებისგან.",
      services: "სერვისები",
      company: "კომპანია",
      contact: "კონტაქტი",
      address: "თბილისი, ვაჟა-ფშაველას გამზ. 71",
      hours: "ორშ-პარ: 09:00 - 19:00",
      copyright: "© 2026 Audit Company. ყველა უფლება დაცულია.",
      privacy: "კონფიდენციალურობა",
      terms: "წესები და პირობები"
    },

    // Contact page
    contact_page: {
      title: "დაგვიკავშირდით",
      subtitle: "გვიპასუხეთ კითხვაზე 24 საათში — რომელი კომუნიკაციის ფორმატი უფრო კომფორტულია?",
      form_title: "გაგვიგზავნე შეტყობინება",
      name: "სახელი",
      email: "ელ.ფოსტა",
      phone: "ტელეფონი",
      company: "კომპანია (ოფციონალური)",
      service: "სასურველი სერვისი",
      message: "შეტყობინება",
      submit: "გაგზავნა",
      select_service: "აირჩიე..."
    },

    // About page
    about_page: {
      title: "ჩვენ შესახებ",
      subtitle: "15 წელზე მეტი გამოცდილების გუნდი, რომელიც საქართველოს ბიზნესს ეხმარება ზრდასა და განვითარებაში",
      mission_title: "ჩვენი მისია",
      mission_text: "ვაქციოთ ბუღალტერია და გადასახადები უხილავად ყოველდღიური ბიზნესისთვის. გამჭვირვალე პროცესით, პროფესიონალური გუნდით და თანამედროვე ტექნოლოგიებით ვეხმარებით მეწარმეებს ფოკუსირდნენ მნიშვნელოვანზე — ბიზნესის ზრდაზე.",
      values_title: "ჩვენი ღირებულებები",
      team_title: "ვებვერი გუნდი",
      team_subtitle: "პროფესიონალები, რომელთაც ენდობა საქართველოს წამყვანი ბიზნესი"
    }
  },

  en: {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      pricing: "Pricing",
      blog: "Blog",
      contact: "Contact",
      cta: "Get a Quote",
      menu: "Menu"
    },

    services: {
      accounting: { title: "Accounting", desc: "Complete monthly bookkeeping at a fixed price" },
      tax: { title: "Tax Returns", desc: "VAT, Income Tax, Corporate Tax filings" },
      payroll: { title: "Payroll & HR", desc: "Employee records and salary processing" },
      registration: { title: "Company Formation", desc: "LLC, Sole Proprietor, Branch — 1 day" },
      audit: { title: "Financial Audit", desc: "Financial statement review and audit" },
      consulting: { title: "Tax Consulting", desc: "Expert advice from certified professionals" },
      nonresident: { title: "Non-residents", desc: "Tax services for foreigners in Georgia" },
      smallbiz: { title: "Small Business Status", desc: "Apply for and maintain tax status" },
      virtualzone: { title: "Virtual Zone", desc: "IT company status — 0% profit tax" }
    },

    hero: {
      badge: "Trusted by 500+ clients across Georgia",
      title_1: "Accounting & Tax",
      title_highlight: "solutions",
      title_2: "for your business",
      lead: "We serve companies, sole proprietors and individuals registered in Georgia — both residents and non-residents.",
      cta_primary: "Start Free Consultation",
      cta_secondary: "See Pricing",
      trust: "500+ happy clients • 4.9 / 5"
    },

    stats: {
      clients: "Clients",
      years: "Years Experience",
      services: "Services",
      satisfaction: "Client Satisfaction"
    },

    services_section: {
      eyebrow: "Our Services",
      title: "Everything in one place",
      subtitle: "Accounting, tax, payroll, registration and consulting — delivered by certified professionals",
      cta: "All Services",
      learn_more: "Learn more"
    },

    why: {
      eyebrow: "Why Us",
      title: "Fixed pricing and 100% transparency",
      subtitle: "We work on flat monthly fees with transparent pricing and guaranteed delivery",
      items: [
        { title: "Fixed Pricing", desc: "Know your monthly fee upfront — no hidden charges ever" },
        { title: "Dedicated Accountant", desc: "One expert assigned to your business — single point of contact" },
        { title: "Online Platform", desc: "Documents, reports, and communication in one place" },
        { title: "On-time Filing", desc: "All returns filed on time — zero risk of penalties" }
      ]
    },

    process: {
      eyebrow: "How it works",
      title: "4 simple steps",
      subtitle: "Discover how we become your trusted financial partner",
      steps: [
        { title: "Contact Us", desc: "Fill out the form or call us for a free consultation" },
        { title: "Custom Proposal", desc: "We analyze your needs and send a tailored quote" },
        { title: "Sign Contract", desc: "Digital signing from home or in office — all paperless" },
        { title: "We Start Working", desc: "Onboarded in 1-3 days depending on volume and team" }
      ]
    },

    pricing: {
      eyebrow: "Pricing",
      title: "Choose a plan that fits you",
      subtitle: "Flat monthly fees, no hidden charges",
      monthly: "/ month",
      popular: "Most Popular",
      cta_start: "Get Started",
      plans: [
        {
          name: "Starter",
          desc: "For new sole proprietors and small businesses",
          price: "150",
          currency: "GEL",
          features: [
            "Up to 30 transactions / month",
            "Small business tax return",
            "Bank statement processing",
            "Tax consultation",
            "Email support"
          ]
        },
        {
          name: "Business",
          desc: "For active LLCs with regular operations",
          price: "350",
          currency: "GEL",
          badge: "Most Popular",
          features: [
            "Up to 150 transactions / month",
            "VAT and Profit Tax returns",
            "Payroll (up to 5 employees)",
            "Monthly financial report",
            "Dedicated accountant",
            "Phone and online support"
          ]
        },
        {
          name: "Corporate",
          desc: "For large operations and enterprises",
          price: "750",
          currency: "GEL",
          features: [
            "Unlimited transactions",
            "Full tax compliance service",
            "Payroll (unlimited)",
            "IFRS reporting",
            "Monthly audit review",
            "Priority support 24/7",
            "CFO-level consulting"
          ]
        }
      ]
    },

    testimonials: {
      eyebrow: "Testimonials",
      title: "What our clients say",
      subtitle: "Over 500 companies across different sectors in Georgia trust us with their monthly accounting",
      items: [
        {
          quote: "We've been working together for over a year and I'm absolutely satisfied. All returns filed on time, communication is very fast.",
          author: "Nino Kipiani",
          role: "Co-Founder, TechStart GE"
        },
        {
          quote: "As a non-resident, I had no idea where to start. The team handled everything — from company registration to tax filings.",
          author: "David Miller",
          role: "CEO, Remote Ventures"
        },
        {
          quote: "We upgraded to a bigger package as we expanded. Monthly financial reports have made management so much simpler.",
          author: "Giorgi Beridze",
          role: "Founder, Logistics Pro"
        }
      ]
    },

    faq: {
      eyebrow: "FAQ",
      title: "Frequently asked questions",
      subtitle: "Didn't find your answer? Contact us — we'll reply within 24 hours",
      items: [
        {
          q: "How fast can I start working with you?",
          a: "Typically we onboard within 1-3 business days of signing. The timeline depends on business volume and documentation readiness."
        },
        {
          q: "I'm a non-resident — can I use your services?",
          a: "Yes, we have a dedicated package for non-residents. We help with company registration, tax status applications, and bank account opening."
        },
        {
          q: "What benefits does Small Business Status give?",
          a: "Small Business Status offers a 1% turnover tax, with an annual limit of GEL 500,000. Some activities are restricted — we'll explain details during consultation."
        },
        {
          q: "Does the price include all tax returns?",
          a: "Yes, every standard package includes preparation and filing of all monthly, quarterly and annual tax returns."
        },
        {
          q: "What if I don't know tax deadlines?",
          a: "That's our responsibility. You'll get occasional reminders for actions we need from you, but the formal deadline tracking is on our team."
        },
        {
          q: "Can I upgrade or change my plan later?",
          a: "Absolutely — you can change plans at any time. Changes take effect from the 1st of the following month."
        }
      ]
    },

    cta: {
      title: "Ready to offload the accounting burden?",
      subtitle: "Book a free consultation — in 30 minutes you'll know the best option for your business",
      primary: "Start Free Consultation",
      secondary: "Call Us Now"
    },

    blog: {
      eyebrow: "Blog",
      title: "News & articles",
      subtitle: "Tax updates, business tips, and news on Georgia's business environment",
      read: "Read more"
    },

    footer: {
      about: "Serving businesses in Georgia — accounting, tax, audit and consulting. A reliable partner that protects you from financial risks.",
      services: "Services",
      company: "Company",
      contact: "Contact",
      address: "71 Vazha-Pshavela Ave, Tbilisi",
      hours: "Mon-Fri: 09:00 - 19:00",
      copyright: "© 2026 Audit Company. All rights reserved.",
      privacy: "Privacy",
      terms: "Terms & Conditions"
    },

    contact_page: {
      title: "Contact Us",
      subtitle: "We respond to every inquiry within 24 hours — pick the channel that works best for you",
      form_title: "Send us a message",
      name: "Name",
      email: "Email",
      phone: "Phone",
      company: "Company (optional)",
      service: "Service of interest",
      message: "Message",
      submit: "Send",
      select_service: "Select..."
    },

    about_page: {
      title: "About Us",
      subtitle: "A team with over 15 years of experience helping Georgian businesses grow and thrive",
      mission_title: "Our Mission",
      mission_text: "To make accounting and taxes invisible for day-to-day business. With transparent processes, professional people and modern technology, we help entrepreneurs focus on what matters — growth.",
      values_title: "Our Values",
      team_title: "Our Team",
      team_subtitle: "Professionals trusted by leading Georgian businesses"
    }
  }
};

// Apply translation
function applyTranslations(lang) {
  const dict = translations[lang] || translations.ka;
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const keyPath = el.getAttribute("data-i18n").split(".");
    let value = dict;
    for (const k of keyPath) value = value && value[k];
    if (typeof value === "string") {
      if (el.hasAttribute("data-i18n-html")) el.innerHTML = value;
      else el.textContent = value;
    }
  });

  // Placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const keyPath = el.getAttribute("data-i18n-placeholder").split(".");
    let value = dict;
    for (const k of keyPath) value = value && value[k];
    if (typeof value === "string") el.setAttribute("placeholder", value);
  });

  localStorage.setItem("lang", lang);
  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("lang") || "ka";
  applyTranslations(saved);

  document.querySelectorAll(".lang-switch button").forEach(btn => {
    btn.addEventListener("click", () => applyTranslations(btn.dataset.lang));
  });
});

window.translations = translations;
window.applyTranslations = applyTranslations;
