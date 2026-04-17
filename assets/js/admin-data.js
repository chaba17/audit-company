/* ==========================================================
   Admin Panel — Default Content Schema
   This is the "seed" data structure. All editable site content.
   ========================================================== */

window.DEFAULT_CONTENT = {
  _version: "1.0.0",
  _updated: new Date().toISOString(),

  // ====== SITE INFO ======
  site: {
    name: "Audit",
    tagline: "Shape the future with confidence",
    phone: "+995 32 2 00 00 00",
    phoneAlt: "+995 599 00 00 00",
    email: "info@auditcompany.ge",
    emailAlt: "support@auditcompany.ge",
    address: "თბილისი, ვაჟა-ფშაველას გამზ. 71",
    addressDetails: "Business Hub, მე-4 სართული",
    hours: "ორშ - პარ: 09:00 - 19:00",
    hoursWeekend: "შაბათი: 10:00 - 15:00",
    copyright: "© 2026 Audit Financial Partners. ყველა უფლება დაცულია.",
    social: {
      facebook: "#",
      instagram: "#",
      linkedin: "#",
      youtube: "#"
    }
  },

  // ====== HERO SECTION ======
  hero: {
    tag: "Shape your future · 2026",
    title: "შენ გააფორმებ <mark>მომავალს</mark>, თუ მომავალი გააფორმებს შენ?",
    subtitle: "გაიცანი რას მიიღებ ერთ-ერთი საქართველოში წამყვანი საბუღალტრო და საგადასახადო ფირმისგან — ბუღალტერიიდან აუდიტამდე, შპს-ის რეგისტრაციიდან ვირტუალური ზონის სტატუსამდე.",
    primaryCta: { text: "გაიცანი როგორ დაგეხმარებით", href: "contact.html" },
    secondaryCta: { text: "ჩვენი სერვისები", href: "services.html" },
    bgImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=85"
  },

  // ====== STATS ======
  stats: [
    { value: "500+", label: "კლიენტი, რომლებიც გვენდობიან საქართველოში" },
    { value: "15", label: "წლის გამოცდილება Big 4-ის დონეზე" },
    { value: "₾2.4M", label: "დაზოგილი გადასახადი კლიენტებისთვის" },
    { value: "98%", label: "კლიენტის კმაყოფილება წლიური შეფასებით" }
  ],

  // ====== SERVICES ======
  services: [
    {
      id: "accounting",
      title: "ბუღალტრული აღრიცხვა",
      shortDesc: "თვიური საბუღალტრო მომსახურება",
      fullDesc: "სრული საბუღალტრო მომსახურება საქართველოში რეგისტრირებული ბიზნესისთვის. ვაწარმოებთ პირველად დოკუმენტებს, ვამზადებთ ანგარიშგებას, ვუზრუნველყოფთ შესაბამისობას საქართველოს კანონმდებლობასთან.",
      icon: "book-open",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=85",
      features: [
        "პირველადი დოკუმენტების დამუშავება",
        "საბანკო ამონაწერების ატვირთვა",
        "მთავარი წიგნის წარმოება",
        "თვიური ფინანსური ანგარიშგება",
        "საგადასახადო დეკლარაციების მომზადება",
        "დღგ-ის ანგარიშგება"
      ]
    },
    {
      id: "tax",
      title: "საგადასახადო დეკლარაციები",
      shortDesc: "დღგ, მოგება, საშემოსავლო გადასახადი",
      fullDesc: "ყველა ტიპის საგადასახადო დეკლარაციის მომზადება და ჩაბარება — დღგ, მოგების გადასახადი, საშემოსავლო გადასახადი, აქციზი და სხვა.",
      icon: "receipt",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=85",
      features: [
        "თვიური დღგ დეკლარაცია",
        "მოგების გადასახადის დეკლარაცია",
        "საშემოსავლო გადასახადის დარიცხვა",
        "აქციზის გადასახადი",
        "ქონების გადასახადი",
        "წყაროსთან დაკავებული გადასახადი"
      ]
    },
    {
      id: "audit",
      title: "ფინანსური აუდიტი",
      shortDesc: "IFRS და ქართული სტანდარტების მიხედვით",
      fullDesc: "ნებაყოფლობითი და სავალდებულო აუდიტი საქართველოს კანონმდებლობისა და IFRS სტანდარტების შესაბამისად.",
      icon: "shield-check",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85",
      features: [
        "სავალდებულო ფინანსური აუდიტი",
        "ნებაყოფლობითი აუდიტი",
        "შეთანხმებული პროცედურები",
        "საგადასახადო აუდიტი",
        "შიდა აუდიტი",
        "Due Diligence"
      ]
    },
    {
      id: "payroll",
      title: "ხელფასი და HR",
      shortDesc: "თანამშრომლების მართვა და ხელფასის დარიცხვა",
      fullDesc: "სრული სპექტრი ხელფასის და HR მომსახურების — დარიცხვიდან თანამშრომლის დოკუმენტაციამდე.",
      icon: "users",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=85",
      features: [
        "ხელფასის ყოველთვიური დარიცხვა",
        "საშემოსავლო გადასახადი",
        "საპენსიო შენატანები",
        "შრომის ხელშეკრულებები",
        "თანამშრომლის რეგისტრაცია",
        "შვებულების აღრიცხვა"
      ]
    },
    {
      id: "registration",
      title: "კომპანიის რეგისტრაცია",
      shortDesc: "შპს, ი/მ, ფონდი — 1 დღეში",
      fullDesc: "სრული სერვისი კომპანიის რეგისტრაციისთვის საქართველოში — შპს, ინდმეწარმე, ფონდი, ფილიალი.",
      icon: "building",
      image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=85",
      features: [
        "შპს რეგისტრაცია",
        "ინდივიდუალური მეწარმე",
        "არამომგებიანი ფონდი",
        "უცხოური კომპანიის ფილიალი",
        "წესდების მომზადება",
        "საბანკო ანგარიშის გახსნა"
      ]
    },
    {
      id: "consulting",
      title: "საგადასახადო კონსულტაცია",
      shortDesc: "სტრატეგიული რჩევა",
      fullDesc: "პროფესიული კონსულტაცია საგადასახადო სტრატეგიებზე, ოპტიმიზაციაზე, საერთაშორისო საგადასახადო დაგეგმვაზე.",
      icon: "message-circle",
      image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=800&q=85",
      features: [
        "საგადასახადო სტრატეგიები",
        "ტრანსფერ ფრაისინგი",
        "საერთაშორისო დაბეგვრა",
        "რეორგანიზაციის კონსულტაცია",
        "ოპტიმიზაცია",
        "საგადასახადო დავა"
      ]
    },
    {
      id: "nonresident",
      title: "არარეზიდენტებისთვის",
      shortDesc: "უცხოელი მეწარმეები და ინვესტორები",
      fullDesc: "სპეციალიზებული მომსახურება არარეზიდენტი ფიზიკური და იურიდიული პირებისთვის.",
      icon: "globe",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=85",
      features: [
        "არარეზიდენტის რეგისტრაცია",
        "Power of Attorney",
        "საბანკო ანგარიშის გახსნა",
        "საგადასახადო სტატუსი",
        "Tax Residency Certificate",
        "ორმაგი დაბეგვრის თავიდან აცილება"
      ]
    },
    {
      id: "smallbiz",
      title: "მცირე ბიზნესის სტატუსი",
      shortDesc: "1% ბრუნვის გადასახადი",
      fullDesc: "მცირე ბიზნესის სტატუსის მიღება საქართველოში — 1% გადასახადი ბრუნვაზე, ყოველთვიური ანგარიშგება მარტივია.",
      icon: "briefcase",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=85",
      features: [
        "სტატუსის აპლიკაცია",
        "1% ბრუნვის გადასახადი",
        "ყოველთვიური დეკლარაცია",
        "სტატუსის განახლება",
        "დასაშვები აქტივობების ანალიზი",
        "ყოველწლიური ანგარიშგება"
      ]
    },
    {
      id: "virtualzone",
      title: "ვირტუალური ზონა",
      shortDesc: "IT კომპანიების სტატუსი — 0% მოგება",
      fullDesc: "ვირტუალური ზონის სტატუსის მიღება IT კომპანიებისთვის — 0% მოგების გადასახადი, 0% დღგ ექსპორტზე.",
      icon: "cpu",
      image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=800&q=85",
      features: [
        "ვირტუალური ზონის აპლიკაცია",
        "0% მოგების გადასახადი",
        "0% დღგ ექსპორტზე",
        "შესაბამისი დოკუმენტაცია",
        "მუდმივი მხარდაჭერა",
        "საერთაშორისო დაბეგვრის კონსულტაცია"
      ]
    }
  ],

  // ====== PRICING PLANS ======
  pricing: {
    monthly: "/ თვეში",
    popular: "ყველაზე პოპულარული",
    ctaStart: "დაიწყე ახლავე",
    plans: [
      {
        name: "სტარტერი",
        description: "ახალი ინდმეწარმისთვის და მცირე ბიზნესისთვის",
        price: "150",
        currency: "₾",
        featured: false,
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
        description: "შპს-სთვის აქტიური ოპერაციებით",
        price: "350",
        currency: "₾",
        featured: true,
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
        description: "დიდი ოპერაციული მოცულობის კომპანიებისთვის",
        price: "750",
        currency: "₾",
        featured: false,
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

  // ====== TEAM MEMBERS ======
  team: [
    {
      name: "თამარ ჯაფარიძე",
      role: "Managing Partner",
      tag: "ACCA",
      bio: "15+ წლის გამოცდილება საერთაშორისო აუდიტსა და ფინანსურ ანგარიშგებაში.",
      photo: "https://i.pravatar.cc/600?img=47"
    },
    {
      name: "ლევან კიკნაძე",
      role: "Tax Consultant",
      tag: "12Y+",
      bio: "12+ წლის გამოცდილება საგადასახადო კანონმდებლობაში. SMB-სთვის სპეციალისტი.",
      photo: "https://i.pravatar.cc/600?img=12"
    },
    {
      name: "ნინო ღოღობერიძე",
      role: "Head of Audit",
      tag: "CPA",
      bio: "IFRS-ის ექსპერტი, Big 4 გამოცდილებით — საერთაშორისო პროექტების ხელმძღვანელი.",
      photo: "https://i.pravatar.cc/600?img=48"
    }
  ],

  // ====== TESTIMONIALS ======
  testimonials: [
    {
      quote: "ერთ წელზე მეტია ვთანამშრომლობთ და აბსოლუტურად კმაყოფილი ვარ. ყველა დეკლარაცია დროულად, კომუნიკაცია ძალიან სწრაფი.",
      author: "ნინო ყიფიანი",
      role: "Co-Founder, TechStart GE",
      avatar: "https://i.pravatar.cc/100?img=47"
    },
    {
      quote: "როგორც არარეზიდენტმა, საერთოდ არ ვიცოდი საიდან დამეწყო. გუნდმა ყველა საკითხი გადაწყვიტა — რეგისტრაციიდან დეკლარაციებამდე.",
      author: "David Miller",
      role: "CEO, Remote Ventures",
      avatar: "https://i.pravatar.cc/100?img=12"
    },
    {
      quote: "გადავედით უფრო დიდ პაკეტზე, რადგან ბიზნესი გავაფართოვეთ. ფინანსური ანგარიშგება ყოველთვიურად გვაქვს — მართვა გახდა გაცილებით მარტივი.",
      author: "გიორგი ბერიძე",
      role: "Founder, Logistics Pro",
      avatar: "https://i.pravatar.cc/100?img=53"
    }
  ],

  // ====== FAQ ======
  faq: [
    {
      question: "რამდენად სწრაფად შემიძლია დავიწყო თქვენთან მუშაობა?",
      answer: "ჩვეულებრივ, კონტრაქტის გაფორმებიდან 1-3 სამუშაო დღეში ვიწყებთ მომსახურებას. სისწრაფე დამოკიდებულია ბიზნესის მოცულობაზე და დოკუმენტაციაზე."
    },
    {
      question: "ვმუშაობ არარეზიდენტი, შემიძლია თქვენი მომსახურება?",
      answer: "კი, სპეციალიზირებული პაკეტი გვაქვს არარეზიდენტებისთვის. ვეხმარებით კომპანიის რეგისტრაციაში, საგადასახადო სტატუსის მიღებასა და საბანკო ანგარიშის გახსნაში."
    },
    {
      question: "მცირე ბიზნესის სტატუსი რა სარგებელს იძლევა?",
      answer: "მცირე ბიზნესის სტატუსი იძლევა 1% გადასახადს ბრუნვაზე, წლიური 500,000 ლარის ლიმიტით. გარკვეული აქტივობები შეზღუდულია — დეტალურად გაცნობებთ კონსულტაციაზე."
    },
    {
      question: "შეიცავს თუ არა ფასი ყველა დეკლარაციას?",
      answer: "დიახ, ყველა სტანდარტული პაკეტი მოიცავს ყოველთვიური, კვარტალური და წლიური დეკლარაციების მომზადებასა და ჩაბარებას."
    },
    {
      question: "რა მოხდება თუ არ ვიცი როდის არის დეკლარაციის ჩაბარების დრო?",
      answer: "ეს ჩვენი პასუხისმგებლობაა. თქვენ დროდადრო მიიღებთ შეტყობინებებს სასურველი ქმედებების შესახებ, მაგრამ ფორმალური ვადების თვალთვალი ჩვენი გუნდის ხელშია."
    },
    {
      question: "შემიძლია გადავიდე მეორე პაკეტზე?",
      answer: "რა თქმა უნდა — პაკეტს შეგიძლია შეცვალო ნებისმიერ დროს. ცვლილება ძალაში შედის შემდეგი თვის პირველი რიცხვიდან."
    }
  ],

  // ====== BLOG POSTS ======
  blog: [
    {
      title: "2026 წლის საგადასახადო ცვლილებები საქართველოში",
      slug: "2026-tax-changes",
      category: "საგადასახადო",
      date: "2026-04-10",
      readTime: "5 წუთი",
      excerpt: "ახალი კანონმდებლობა, რომელიც შედის ძალაში 2026 წლის პირველი ივლისიდან — რა უნდა იცოდეთ ბიზნესმა.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=85",
      featured: true
    },
    {
      title: "შპს vs ი/მ — რომელი აირჩიოთ 2026 წელს?",
      slug: "llc-vs-sole-prop",
      category: "ბიზნესი",
      date: "2026-03-28",
      readTime: "7 წუთი",
      excerpt: "შედარებითი ანალიზი და რეკომენდაციები ბიზნესის მოცულობის მიხედვით.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=85",
      featured: false
    },
    {
      title: "ვირტუალური ზონის სტატუსი — 0% მოგების გადასახადი",
      slug: "virtual-zone-status",
      category: "IT",
      date: "2026-03-15",
      readTime: "6 წუთი",
      excerpt: "როგორ მიიღოთ ვირტუალური ზონის სტატუსი და რა დაბრკოლებები შეიძლება შეგხვდეთ.",
      image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?auto=format&fit=crop&w=800&q=85",
      featured: false
    },
    {
      title: "დღგ-ის დაბრუნების 7 გავრცელებული შეცდომა",
      slug: "vat-mistakes",
      category: "საგადასახადო",
      date: "2026-03-05",
      readTime: "8 წუთი",
      excerpt: "რა შეცდომებს უშვებენ ყველაზე ხშირად ბუღალტრები და როგორ ავიცილოთ ჯარიმები.",
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=85",
      featured: false
    },
    {
      title: "უცხოელი დამფუძნებელი საქართველოში — გზამკვლევი",
      slug: "foreign-founder-guide",
      category: "არარეზიდენტები",
      date: "2026-02-20",
      readTime: "10 წუთი",
      excerpt: "რეგისტრაციიდან დაბეგვრამდე — ყველაფერი, რაც უცხოელ მეწარმეს სჭირდება.",
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=85",
      featured: false
    },
    {
      title: "საბუღალტრო დოკუმენტაცია — რას ინახავს კომპანია 6 წელი",
      slug: "documentation-rules",
      category: "ბუღალტერია",
      date: "2026-02-10",
      readTime: "4 წუთი",
      excerpt: "საქართველოში საბუღალტრო დოკუმენტების შენახვის ვალდებულება და რჩევები.",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=85",
      featured: false
    }
  ],

  // ====== INDUSTRIES ======
  industries: [
    { title: "Technology & IT", description: "ვირტუალური ზონის სტატუსი, SaaS კომპანიები, AI/Blockchain სტარტაპები." },
    { title: "ფინანსური სერვისები", description: "ბანკები, სადაზღვევო, საინვესტიციო ფონდები, ფინტექ სტარტაპები." },
    { title: "უძრავი ქონება", description: "დეველოპმენტი, უძრავი ქონების მართვა, მშენებლობა." },
    { title: "საცალო & E-commerce", description: "ონლაინ მაღაზიები, საცალო ქსელები, FMCG კომპანიები." },
    { title: "ლოჯისტიკა", description: "ტრანსპორტი, დისტრიბუცია, საბაჟო ოპერაციები." },
    { title: "HoReCa", description: "სასტუმროები, რესტორნები, კაფე-ბარები, ტურისტული ოპერატორები." },
    { title: "ჯანდაცვა & მედიცინა", description: "კლინიკები, ფარმაცევტული კომპანიები, სამედიცინო ცენტრები." },
    { title: "საერთაშორისო ბიზნესი", description: "უცხოური კომპანიები, ორმაგი რეზიდენტობის საკითხები, ექსპორტ-იმპორტი." }
  ],

  // ====== FOOTER ======
  footer: {
    about: "ვემსახურებით საქართველოს ბიზნესს — ბუღალტერია, გადასახადები, აუდიტი და კონსულტაცია. სანდო პარტნიორი, რომელიც გიცავს ფინანსური რისკებისგან.",
    sections: [
      {
        title: "Services",
        links: [
          { text: "Financial Audit", href: "services/audit.html" },
          { text: "Tax Returns", href: "services/tax.html" },
          { text: "Accounting", href: "services/accounting.html" },
          { text: "Consulting", href: "services/consulting.html" }
        ]
      },
      {
        title: "Industries",
        links: [
          { text: "Technology & IT", href: "#" },
          { text: "Financial Services", href: "#" },
          { text: "Real Estate", href: "#" },
          { text: "Retail", href: "#" }
        ]
      },
      {
        title: "Insights",
        links: [
          { text: "Tax Updates", href: "blog.html" },
          { text: "Research", href: "blog.html" },
          { text: "Reports", href: "blog.html" },
          { text: "Webinars", href: "blog.html" }
        ]
      },
      {
        title: "About",
        links: [
          { text: "About Us", href: "about.html" },
          { text: "Careers", href: "#" },
          { text: "Contact", href: "contact.html" },
          { text: "Privacy Policy", href: "#" }
        ]
      }
    ]
  },

  // ====== MEGA MENU (reference — synced with site) ======
  megaMenus: {
    services: {
      label: "სერვისები",
      introTitle: "სერვისები",
      introDesc: "Audit კლიენტებს ეხმარება შექმნან გრძელვადიანი ღირებულება. ჩვენი მომსახურება მოიცავს ბუღალტერიას, საგადასახადო დეკლარაციებს, აუდიტს და სტრატეგიულ კონსულტაციას.",
      ctaText: "გაეცანი",
      ctaHref: "services.html",
      spotlightTitle: "Spotlight",
      spotlightItems: [
        "Artificial Intelligence (AI)",
        "2026 საგადასახადო ცვლილებები",
        "ვირტუალური ზონის სტატუსი",
        "IFRS მიგრაცია"
      ]
    },
    industries: {
      label: "ინდუსტრიები",
      introTitle: "ინდუსტრიები",
      introDesc: "ვემსახურებით საქართველოს სხვადასხვა სექტორის კომპანიებს — სპეციფიკური ექსპერტიზით თითოეული ნიშისთვის.",
      ctaText: "ყველა ინდუსტრია",
      ctaHref: "services.html",
      spotlightTitle: "Spotlight",
      spotlightItems: [
        "Tech Startup Growth",
        "ფინტექ რეგულაციები 2026",
        "E-commerce დაბეგვრა"
      ]
    }
  }
};
