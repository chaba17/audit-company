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
      faq: "FAQ",
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
      faq: "FAQ",
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
  },

  // ====== RUSSIAN ======
  ru: {
    nav: {
      home: "Главная",
      about: "О нас",
      services: "Услуги",
      pricing: "Цены",
      blog: "Блог",
      contact: "Контакты",
      faq: "FAQ",
      cta: "Получить предложение",
      menu: "Меню"
    },
    services: {
      accounting: { title: "Бухгалтерия", desc: "Полное ежемесячное бухгалтерское сопровождение по фиксированной цене" },
      tax: { title: "Налоговые декларации", desc: "НДС, подоходный, налог на прибыль и другие отчёты" },
      payroll: { title: "Зарплата и HR", desc: "Кадровый учёт и расчёт зарплаты" },
      registration: { title: "Регистрация компании", desc: "ООО, ИП, филиал — за 1 день" },
      audit: { title: "Финансовый аудит", desc: "Проверка и аудит финансовой отчётности" },
      consulting: { title: "Налоговые консультации", desc: "Экспертные советы сертифицированных специалистов" },
      nonresident: { title: "Нерезидентам", desc: "Налоговое обслуживание иностранцев в Грузии" },
      smallbiz: { title: "Статус малого бизнеса", desc: "Получение и поддержка налогового статуса" },
      virtualzone: { title: "Виртуальная зона", desc: "Статус IT-компании — 0% налог на прибыль" }
    },
    hero: {
      badge: "Нам доверяют 500+ клиентов по всей Грузии",
      title_1: "Бухгалтерия и налоги",
      title_highlight: "решения",
      title_2: "для вашего бизнеса",
      lead: "Мы обслуживаем компании, индивидуальных предпринимателей и физических лиц, зарегистрированных в Грузии — резидентов и нерезидентов.",
      cta_primary: "Бесплатная консультация",
      cta_secondary: "Посмотреть цены",
      trust: "500+ довольных клиентов • 4.9 / 5"
    },
    stats: { clients: "Клиентов", years: "Лет опыта", services: "Услуг", satisfaction: "Удовлетворённость клиентов" },
    services_section: {
      eyebrow: "Наши услуги",
      title: "Всё в одном месте",
      subtitle: "Бухгалтерия, налоги, зарплата, регистрация и консалтинг — от сертифицированных специалистов",
      cta: "Все услуги",
      learn_more: "Подробнее"
    },
    pricing: {
      eyebrow: "Цены · 04",
      title_1: "Прозрачные цены.",
      title_highlight: "Без сюрпризов",
      title_2: "",
      subtitle: "Выберите пакет, соответствующий размеру вашего бизнеса. Все тарифы — фиксированный ежемесячный платёж.",
      monthly: "/ мес",
      popular: "САМЫЙ ПОПУЛЯРНЫЙ",
      cta_start: "Начать"
    },
    testimonials: { eyebrow: "Отзывы · 05", title_1: "Клиенты", title_highlight: "доверяют нам", title_2: "", items: [] },
    faq: { eyebrow: "Вопросы · 06", title_1: "Часто задаваемые", title_highlight: "вопросы", title_2: "", items: [] },
    footer: {
      about: "Ведущая бухгалтерская, налоговая и аудиторская фирма в Грузии. Обслуживаем 500+ клиентов с 2010 года.",
      address: "Тбилиси, пр. Важе-Пшавела 71, Business Hub, 4 этаж",
      copyright: "© 2026 Guberman Group Geo. Все права защищены.",
      privacy: "Политика конфиденциальности",
      terms: "Условия использования"
    },
    contact_page: {
      title: "Свяжитесь с нами",
      subtitle: "Ответим в течение 24 часов. Бесплатная первичная консультация.",
      name: "Имя и фамилия",
      email: "Электронная почта",
      phone: "Телефон",
      company: "Компания",
      service: "Нужная услуга",
      message: "Сообщение",
      select_service: "-- Выберите услугу --",
      submit: "Отправить",
      info_title: "Контактная информация",
      hours_label: "Часы работы"
    },
    services_page: {
      title: "Наши услуги",
      subtitle: "Профессиональная бухгалтерская и налоговая поддержка, адаптированная к вашему бизнесу"
    },
    pricing_page: {
      title: "Цены",
      subtitle: "Прозрачные ежемесячные пакеты — без скрытых комиссий"
    },
    blog_page: {
      title: "Блог и статьи",
      subtitle: "Новости налогового законодательства, руководства и аналитика для бизнеса в Грузии"
    },
    about_page: {
      title: "О нас",
      subtitle: "Команда с 15+ летним опытом помощи грузинскому бизнесу в развитии и росте",
      mission_title: "Наша миссия",
      mission_text: "Сделать бухгалтерию и налоги незаметными для бизнеса. С прозрачными процессами и профессиональной командой мы помогаем предпринимателям сосредоточиться на главном — росте.",
      values_title: "Наши ценности",
      team_title: "Наша команда",
      team_subtitle: "Профессионалы, которым доверяет ведущий бизнес Грузии"
    }
  },

  // ====== HEBREW (Right-to-Left) ======
  he: {
    nav: {
      home: "בית",
      about: "אודות",
      services: "שירותים",
      pricing: "מחירים",
      blog: "בלוג",
      contact: "צור קשר",
      faq: "שאלות נפוצות",
      cta: "קבל הצעת מחיר",
      menu: "תפריט"
    },
    services: {
      accounting: { title: "הנהלת חשבונות", desc: "ניהול חשבונות חודשי מלא במחיר קבוע" },
      tax: { title: "דוחות מס", desc: "מע\"מ, מס הכנסה, מס חברות ודוחות נוספים" },
      payroll: { title: "שכר ומשאבי אנוש", desc: "ניהול עובדים והכנת משכורות" },
      registration: { title: "רישום חברה", desc: "בע\"מ, עצמאי, סניף — ביום אחד" },
      audit: { title: "ביקורת פיננסית", desc: "ביקורת וסקירת דוחות פיננסיים" },
      consulting: { title: "ייעוץ מיסים", desc: "ייעוץ מקצועי ממומחים מוסמכים" },
      nonresident: { title: "תושבי חוץ", desc: "שירותי מס לזרים בגאורגיה" },
      smallbiz: { title: "מעמד עסק קטן", desc: "רישום ושימור מעמד מס" },
      virtualzone: { title: "אזור וירטואלי", desc: "מעמד חברת IT — 0% מס רווחים" }
    },
    hero: {
      badge: "500+ לקוחות סומכים עלינו ברחבי גאורגיה",
      title_1: "הנהלת חשבונות ומיסים",
      title_highlight: "פתרונות",
      title_2: "לעסק שלך",
      lead: "אנו משרתים חברות, עצמאים ויחידים הרשומים בגאורגיה — תושבים ותושבי חוץ כאחד.",
      cta_primary: "התחל ייעוץ חינם",
      cta_secondary: "ראה מחירים",
      trust: "500+ לקוחות מרוצים • 4.9 / 5"
    },
    stats: { clients: "לקוחות", years: "שנות ניסיון", services: "שירותים", satisfaction: "שביעות רצון" },
    services_section: {
      eyebrow: "השירותים שלנו",
      title: "הכל במקום אחד",
      subtitle: "הנהלת חשבונות, מיסים, שכר, רישום וייעוץ — על ידי אנשי מקצוע מוסמכים",
      cta: "כל השירותים",
      learn_more: "קרא עוד"
    },
    pricing: {
      eyebrow: "מחירים · 04",
      title_1: "מחירים שקופים.",
      title_highlight: "ללא הפתעות",
      title_2: "",
      subtitle: "בחר חבילה המתאימה לגודל העסק שלך. כל המחירים הם תשלום חודשי קבוע.",
      monthly: "/ חודש",
      popular: "הפופולרי ביותר",
      cta_start: "התחל"
    },
    testimonials: { eyebrow: "המלצות · 05", title_1: "לקוחות", title_highlight: "סומכים עלינו", title_2: "", items: [] },
    faq: { eyebrow: "שאלות · 06", title_1: "שאלות", title_highlight: "נפוצות", title_2: "", items: [] },
    footer: {
      about: "פירמת הנהלת חשבונות, מיסים וביקורת מובילה בגאורגיה. משרתת 500+ לקוחות מאז 2010.",
      address: "טביליסי, שדרות ואז'ה-פשבלה 71, Business Hub, קומה 4",
      copyright: "© 2026 Guberman Group Geo. כל הזכויות שמורות.",
      privacy: "מדיניות פרטיות",
      terms: "תנאי שימוש"
    },
    contact_page: {
      title: "צור קשר",
      subtitle: "נחזור אליך תוך 24 שעות. ייעוץ ראשוני חינם.",
      name: "שם מלא",
      email: "דוא\"ל",
      phone: "טלפון",
      company: "חברה",
      service: "השירות הרצוי",
      message: "הודעה",
      select_service: "-- בחר שירות --",
      submit: "שלח",
      info_title: "פרטי יצירת קשר",
      hours_label: "שעות עבודה"
    },
    services_page: {
      title: "השירותים שלנו",
      subtitle: "תמיכה מקצועית בהנהלת חשבונות ומיסים, מותאמת לעסק שלך"
    },
    pricing_page: {
      title: "מחירים",
      subtitle: "חבילות חודשיות שקופות — ללא עמלות נסתרות"
    },
    blog_page: {
      title: "בלוג ומאמרים",
      subtitle: "חדשות חקיקת מיסים, מדריכים וניתוחים עבור עסקים בגאורגיה"
    },
    about_page: {
      title: "אודותינו",
      subtitle: "צוות עם ניסיון של 15+ שנה בסיוע לעסקים גאורגיים לצמוח ולשגשג",
      mission_title: "המשימה שלנו",
      mission_text: "להפוך את הנהלת החשבונות והמיסים לבלתי נראים עבור העסק היומיומי. עם תהליכים שקופים וצוות מקצועי, אנו עוזרים ליזמים להתמקד במה שחשוב — צמיחה.",
      values_title: "הערכים שלנו",
      team_title: "הצוות שלנו",
      team_subtitle: "אנשי מקצוע שהעסקים המובילים בגאורגיה סומכים עליהם"
    }
  }
};

// Apply translation
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

function applyTranslations(lang) {
  if (!translations[lang]) lang = 'ka';
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

  // Let page scripts react (e.g. re-render cards in the new language)
  document.dispatchEvent(new CustomEvent("lang-changed", { detail: { lang } }));
}

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("lang") || "ka";
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
// Items use pattern: { title: "ka-text", i18n: { en: { title: "english" }, ... } }
// resolveItemI18n(item, 'en') returns { ...item, title: 'english', i18n: {...} } so other code works unchanged.
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
