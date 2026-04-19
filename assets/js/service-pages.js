/* ==========================================================
   Service page content — detail per service, rendered by slug
   ========================================================== */

const SERVICE_DATA = {
  accounting: {
    ka: {
      title: "ბუღალტრული აღრიცხვა",
      subtitle: "სრული თვიური ბუღალტერია საქართველოში რეგისტრირებული ბიზნესისთვის",
      hero_img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=80",
      intro: "ჩვენი გუნდი იღებს თქვენს ბუღალტრულ პროცესებს სრულად და აძლევს თქვენს ბიზნესს გამოცდილი ფინანსური პარტნიორის ძალას. ფიქსირებული ფასი, გამჭვირვალე პროცესი, დროული ანგარიშგება.",
      features: [
        "პირველადი დოკუმენტების დამუშავება (ფაქტურები, ქვითრები, აქტები)",
        "საბანკო ამონაწერების ატვირთვა და კლასიფიკაცია",
        "მთავარი წიგნის წარმოება — ქართული სტანდარტებით",
        "თვიური, კვარტალური და წლიური ფინანსური ანგარიშგება",
        "რევიზია და გადამოწმება საგადასახადო ინსპექციის წინ",
        "მარაგების ინვენტარიზაცია და ცვეთის გაანგარიშება"
      ],
      faq: [
        { q: "რომელ პროგრამებს იყენებთ?", a: "ვმუშაობთ Oris, RS.ge, Excel-ზე და ჩვენს საკუთარ ონლაინ პორტალზე. კლიენტს შეუძლია ისარგებლოს ნებისმიერი მისთვის კომფორტული ინსტრუმენტით." },
        { q: "შეგიძლიათ გადმოიღოთ ბუღალტერია სხვა კომპანიისგან?", a: "კი, უფასოდ გადავიტანთ მონაცემებს ნებისმიერი სისტემიდან. მიგრაცია ჩვეულებრივ 3-7 დღეში სრულდება." }
      ]
    },
    en: {
      title: "Accounting",
      subtitle: "Complete monthly bookkeeping for businesses registered in Georgia",
      hero_img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1000&q=80",
      intro: "Our team takes over your accounting processes completely, giving your business the strength of an experienced financial partner. Fixed price, transparent process, on-time reporting.",
      features: [
        "Source document processing (invoices, receipts, acts)",
        "Bank statement upload and classification",
        "Ledger maintenance — per Georgian standards",
        "Monthly, quarterly and annual financial reporting",
        "Review and verification before tax inspection",
        "Inventory count and depreciation calculation"
      ],
      faq: [
        { q: "Which software do you use?", a: "We work with Oris, RS.ge, Excel, and our own online portal. Clients can use whichever tool is most comfortable." },
        { q: "Can you take over bookkeeping from another firm?", a: "Yes, we migrate data from any system for free. Migration typically completes in 3-7 days." }
      ]
    }
  },

  tax: {
    ka: {
      title: "საგადასახადო დეკლარაციები",
      subtitle: "დღგ, საშემოსავლო, მოგების და სხვა გადასახადების სრული სერვისი",
      hero_img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1000&q=80",
      intro: "მოვამზადებთ და ჩავაბარებთ ყველა საჭირო დეკლარაციას დროულად, გამჭვირვალედ და შეცდომების გარეშე. სანდო ექსპერტები, რომლებსაც იცნობენ საგადასახადო ცვლილებები პირველებმა.",
      features: [
        "დღგ-ის ყოველთვიური დეკლარაცია (ფორმა I)",
        "საშემოსავლო გადასახადი (დაქირავებული და დასაქმებული)",
        "მოგების გადასახადი (ესტონური მოდელი)",
        "დივიდენდებისა და საპროცენტო შემოსავლების დეკლარაცია",
        "უცხოური გადახდების დაბეგვრა (არარეზიდენტისთვის)",
        "წყაროდან დაკავებული გადასახადები (Withholding Tax)",
        "აქციზის გადასახადი",
        "შესწორების დეკლარაციების მომზადება"
      ],
      faq: [
        { q: "შეგიძლიათ მომიმზადოთ შესწორების დეკლარაცია?", a: "რა თქმა უნდა. თუ წინა პერიოდში დაშვებულია შეცდომა, მოვამზადებთ და ჩავაბარებთ შესწორების დეკლარაციას, ჯარიმების მინიმიზაციის მიზნით." },
        { q: "ვინც არ არის დღგ-ის გადამხდელი — მაინც მჭირდება დეკლარაცია?", a: "უსაფრთხო იყოს, ზოგჯერ ისე, როცა მოცულობა აჭარბებს 100,000 ლარის ზღვარს, უნდა დარეგისტრირდე. ჩვენ გეცნობებით სწორ დროს." }
      ]
    },
    en: {
      title: "Tax Returns",
      subtitle: "Full service for VAT, Income Tax, Corporate Tax and all other filings",
      hero_img: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1000&q=80",
      intro: "We prepare and file all required tax returns on time, transparently and without errors. Trusted experts who know tax changes first.",
      features: [
        "Monthly VAT return (Form I)",
        "Income tax (employer and employee)",
        "Corporate profit tax (Estonian model)",
        "Dividend and interest income filings",
        "Tax on foreign payments (for non-residents)",
        "Withholding Tax",
        "Excise tax",
        "Amendment returns"
      ],
      faq: [
        { q: "Can you prepare an amendment return?", a: "Absolutely. If prior periods have errors, we prepare and file amendment returns to minimize penalties." },
        { q: "If I'm not a VAT payer — do I still need to file?", a: "Sometimes yes, especially when turnover approaches the GEL 100,000 threshold. We'll tell you the right moment to register." }
      ]
    }
  },

  payroll: {
    ka: {
      title: "ხელფასი და HR",
      subtitle: "თანამშრომლების სრული მართვა — ხელფასი, საშემოსავლო, სოციალური, პერსონალური დოკუმენტაცია",
      hero_img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80",
      intro: "ვხურავთ ყველა HR და ხელფასის ოპერაციებს — მოქმედი კანონმდებლობის 100% დაცვით და თანამშრომლების სრული ინფორმირებულობით.",
      features: [
        "ხელფასის თვიური დარიცხვა და გადახდა",
        "საშემოსავლო გადასახადის დაკავება და ჩაბარება",
        "სოციალური შენატანი (2% დამქირავებელი + 2% დასაქმებული)",
        "შვებულებების, ბიულეტენის და დეკრეტის ანგარიშგება",
        "შრომის ხელშეკრულებების პროექტი და რეგისტრაცია",
        "ახალი დასაქმებულის რეგისტრაცია RS.ge-ზე",
        "ხელფასის ქვითარი თანამშრომლებისთვის",
        "ბონუსების და დამატებითი სარგებლების დაბეგვრა"
      ],
      faq: [
        { q: "რამდენი თანამშრომელი შედის პაკეტში?", a: "სტანდარტული ფასი 5 თანამშრომელზეა. მეტი თანამშრომლისთვის გვაქვს დამატებითი ტარიფი — 15₾ ერთ ადამიანზე თვეში." },
        { q: "ხელშეკრულებებს თქვენ ამზადებთ?", a: "კი, შრომის ხელშეკრულების ტემპლატს უფასოდ მოგამზადებთ და რეგისტრირებას ახდენთ RS.ge-ზე." }
      ]
    },
    en: {
      title: "Payroll & HR",
      subtitle: "Complete employee management — salary, income tax, social contributions, personnel records",
      hero_img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80",
      intro: "We handle all HR and payroll operations with 100% compliance and full employee visibility.",
      features: [
        "Monthly payroll calculation and payment",
        "Income tax withholding and filing",
        "Social contributions (2% employer + 2% employee)",
        "Leave, sick leave and maternity tracking",
        "Employment contracts — drafting and registration",
        "New hire registration on RS.ge",
        "Payslips for employees",
        "Taxation of bonuses and benefits"
      ],
      faq: [
        { q: "How many employees are included?", a: "Standard pricing covers up to 5 employees. For more, we charge an additional GEL 15 per employee per month." },
        { q: "Do you draft employment contracts?", a: "Yes, we prepare employment contract templates for free and register them on RS.ge." }
      ]
    }
  },

  registration: {
    ka: {
      title: "კომპანიის რეგისტრაცია",
      subtitle: "შპს, ი/მ, ფილიალი, ფონდი — ერთ დღეში, სახლიდან ამოუსვლელად",
      hero_img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80",
      intro: "დაარეგისტრირე შენი ბიზნესი სწრაფად და სწორად. ვამზადებთ ყველა დოკუმენტს, ვირჩევთ ოპტიმალურ საგადასახადო სტრუქტურას და ვატარებთ სრულ პროცესს ერთი ფასით.",
      features: [
        "შპს-ის რეგისტრაცია (1 დღე)",
        "ინდივიდუალური მეწარმის რეგისტრაცია (1 დღე)",
        "უცხოური კომპანიის ფილიალის რეგისტრაცია",
        "წესდების მომზადება და ცვლილებები",
        "საბანკო ანგარიშის გახსნის მხარდაჭერა",
        "საგადასახადო სტატუსის არჩევა (მიკრო, მცირე, ვირტუალური)",
        "RS.ge-ზე ავტორიზაცია და ელ. სერვისების კონფიგურაცია",
        "იურიდიული მისამართის მოწოდება (ოფციონალური)"
      ],
      faq: [
        { q: "რა საბუთები მჭირდება რეგისტრაციისთვის?", a: "მხოლოდ პირადობის მოწმობა (რეზიდენტებისთვის) ან პასპორტი + ფოტო (არარეზიდენტებისთვის). დანარჩენს ვამზადებთ ჩვენ." },
        { q: "რამდენი ღირს?", a: "ერთჯერადი ფასი — 350₾ (ი/მ) ან 550₾ (შპს). საბიუჯეტო მოსაკრებლები ცალკე — ~100₾." }
      ]
    },
    en: {
      title: "Company Formation",
      subtitle: "LLC, Sole Proprietor, Branch, Foundation — in 1 day, without leaving home",
      hero_img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=80",
      intro: "Register your business quickly and correctly. We prepare all documents, choose the optimal tax structure and handle the full process for one price.",
      features: [
        "LLC registration (1 day)",
        "Sole proprietor registration (1 day)",
        "Foreign company branch registration",
        "Articles of association — drafting and amendments",
        "Bank account opening assistance",
        "Tax status selection (Micro, Small, Virtual Zone)",
        "RS.ge authorization and e-service setup",
        "Legal address provision (optional)"
      ],
      faq: [
        { q: "What documents do I need?", a: "Only an ID card (residents) or passport + photo (non-residents). We handle the rest." },
        { q: "How much does it cost?", a: "One-time fee — GEL 350 (Sole Proprietor) or GEL 550 (LLC). Government fees are separate — ~GEL 100." }
      ]
    }
  },

  audit: {
    ka: {
      title: "ფინანსური აუდიტი",
      subtitle: "IFRS-ის და საქართველოს სტანდარტების შესაბამისი აუდიტი",
      hero_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80",
      intro: "სერტიფიცირებული აუდიტორის მომსახურება — როგორც სავალდებულო, ისე ნებაყოფლობითი აუდიტი. მივცემთ ობიექტურ შეფასებას და პრაქტიკულ რეკომენდაციებს.",
      features: [
        "სავალდებულო წლიური აუდიტი (PIE, დიდი კომპანიებისთვის)",
        "ნებაყოფლობითი აუდიტი — ინვესტორებისთვის და ბანკებისთვის",
        "Due Diligence (შეძენის/გაყიდვის წინ)",
        "IFRS to Georgia GAAP კონვერსია",
        "შიდა კონტროლის სისტემის შეფასება",
        "თაღლითობის რისკის ანალიზი",
        "კომპილაციის და რევიუს სერვისი"
      ],
      faq: [
        { q: "ვის სჭირდება სავალდებულო აუდიტი?", a: "კომპანიებს, რომლებიც აკმაყოფილებენ 2-ს 3-დან კრიტერიუმიდან: აქტივები >10M, ბრუნვა >20M, თანამშრომლები >50. ასევე ყველა PIE-ს." },
        { q: "რამდენი ხანი გრძელდება აუდიტი?", a: "პატარა კომპანიისთვის — 2-3 კვირა, საშუალოსთვის — 4-6 კვირა. დეტალური გეგმა ხელშეკრულების გაფორმების დროს." }
      ]
    },
    en: {
      title: "Financial Audit",
      subtitle: "IFRS and Georgian standard-compliant audit",
      hero_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80",
      intro: "Certified auditor services — both mandatory and voluntary audits. We deliver objective assessments and practical recommendations.",
      features: [
        "Mandatory annual audit (PIE, large companies)",
        "Voluntary audit — for investors and banks",
        "Due Diligence (pre-acquisition / sale)",
        "IFRS to Georgia GAAP conversion",
        "Internal control assessment",
        "Fraud risk analysis",
        "Compilation and review services"
      ],
      faq: [
        { q: "Who needs a mandatory audit?", a: "Companies meeting 2 of 3: assets >10M, turnover >20M, employees >50. Also all PIEs." },
        { q: "How long does an audit take?", a: "Small company — 2-3 weeks, mid-size — 4-6 weeks. Detailed plan set at contract signing." }
      ]
    }
  },

  consulting: {
    ka: {
      title: "საგადასახადო კონსულტაცია",
      subtitle: "პროფესიული რჩევა სპეციფიკურ საკითხებზე — სტრატეგიული დონისთვის",
      hero_img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1000&q=80",
      intro: "ხშირად ერთი სწორი გადაწყვეტილება ათიათასობით ლარის შენახვას ნიშნავს. ჩვენი კონსულტანტები გეხმარებიან რთული საგადასახადო საკითხების გადაჭრაში — დისკრეტულად და პროფესიონალურად.",
      features: [
        "საგადასახადო სტრატეგიის შემუშავება",
        "ტრანზაქციების გადასახადებრივი ოპტიმიზაცია",
        "საერთაშორისო დაბეგვრის კონსულტაცია",
        "ტრანსფერ ფრაისინგი (transfer pricing)",
        "საგადასახადო ადმინისტრაციასთან დავის მხარდაჭერა",
        "სასამართლო წარმომადგენლობა საგადასახადო საქმეებში",
        "Tax Ruling მოთხოვნების მომზადება"
      ],
      faq: [
        { q: "რა ფორმატითაა კონსულტაცია?", a: "ორი ფორმატი: ერთჯერადი კონსულტაცია (საათობრივი ტარიფი 150₾) ან თვიური აბონიმენტი (300₾/თვე ფიქს კონსულტაციებისთვის)." },
        { q: "საიდუმლოება დაცულია?", a: "100%. ყველა კლიენტთან ვდებთ NDA-ს. პროფესიული ეთიკა და საიდუმლოება ძირითადი პრინციპია." }
      ]
    },
    en: {
      title: "Tax Consulting",
      subtitle: "Expert advice on complex issues — strategic-level consulting",
      hero_img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1000&q=80",
      intro: "Often a single right decision saves tens of thousands. Our consultants help you navigate complex tax matters — discreetly and professionally.",
      features: [
        "Tax strategy development",
        "Transaction tax optimization",
        "International taxation consulting",
        "Transfer pricing",
        "Tax authority dispute support",
        "Litigation representation in tax cases",
        "Tax Ruling request preparation"
      ],
      faq: [
        { q: "What are the consulting formats?", a: "Two formats: one-time consulting (GEL 150/hr) or monthly retainer (GEL 300/month for fixed consultations)." },
        { q: "Is confidentiality guaranteed?", a: "100%. We sign NDAs with every client. Professional ethics and confidentiality are our core principles." }
      ]
    }
  },

  nonresident: {
    ka: {
      title: "არარეზიდენტებისთვის",
      subtitle: "სრული მომსახურება უცხოელი მეწარმეებისთვის, რომლებიც საქართველოში ახორციელებენ ბიზნესს",
      hero_img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80",
      intro: "საქართველო ერთ-ერთი ყველაზე მოსახერხებელი ქვეყანაა უცხოელი ბიზნესმენებისთვის — ტერიტორიული დაბეგვრა, მცირე კორუფცია, პირდაპირი კანონმდებლობა. ვეხმარებით არარეზიდენტებს ყველა ეტაპზე.",
      features: [
        "კომპანიის რეგისტრაცია დისტანციურად (Power of Attorney)",
        "საბანკო ანგარიშის გახსნის მხარდაჭერა",
        "საგადასახადო რეზიდენტობის მოპოვება",
        "Double Tax Treaty-ის გამოყენება",
        "ყოველთვიური დეკლარაციების ჩაბარება",
        "ინგლისურ ენაზე სრული მხარდაჭერა",
        "სამუშაო ნებართვის (Work Permit) მომზადება",
        "HNWI საგადასახადო სტატუსი (მაღალი ქონების მქონე პირებისთვის)"
      ],
      faq: [
        { q: "საქართველოში ფიზიკურად უნდა ვიყო რეგისტრაციისთვის?", a: "არა. ყველაფერი შეიძლება დისტანციურად — Power of Attorney-ით. ერთადერთი, რაც სჭირდება ფიზიკური ყოფნა — საბანკო ანგარიშის გახსნა (და ისიც ზოგ ბანკში ახლა დისტანციურად შეიძლება)." },
        { q: "რამდენი გადასახადი მაქვს გადასახდელი?", a: "საქართველოში ტერიტორიული დაბეგვრაა — საქართველოში მიღებული შემოსავალი იბეგრება, უცხოური შემოსავალი — არა (ზოგადად). ინდივიდუალური პასუხი — კონსულტაციაზე." }
      ]
    },
    en: {
      title: "For Non-residents",
      subtitle: "Complete service for foreign entrepreneurs doing business in Georgia",
      hero_img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80",
      intro: "Georgia is one of the most convenient countries for foreign entrepreneurs — territorial taxation, low corruption, straightforward legislation. We assist non-residents at every step.",
      features: [
        "Remote company registration (via Power of Attorney)",
        "Bank account opening support",
        "Tax residency acquisition",
        "Double Tax Treaty utilization",
        "Monthly tax return filing",
        "Full support in English",
        "Work permit preparation",
        "HNWI tax status (for high-net-worth individuals)"
      ],
      faq: [
        { q: "Do I need to be physically in Georgia for registration?", a: "No. Everything can be done remotely via Power of Attorney. The only thing that may need physical presence is bank account opening (and even that is now remote in some banks)." },
        { q: "How much tax will I pay?", a: "Georgia has territorial taxation — Georgia-sourced income is taxed, foreign income generally is not. Individual answer — at consultation." }
      ]
    }
  },

  smallbiz: {
    ka: {
      title: "მცირე და მიკრო ბიზნესის სტატუსი",
      subtitle: "სპეციალური საგადასახადო რეჟიმები მცირე ბიზნესისთვის — 1% ბრუნვაზე",
      hero_img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80",
      intro: "მცირე ბიზნესის სტატუსი ერთ-ერთი ყველაზე მომგებიანი რეჟიმია საქართველოში — 1% გადასახადი ბრუნვაზე, წლიური 500,000 ₾-მდე. ვეხმარებით სტატუსის მიღებაში და შენარჩუნებაში.",
      features: [
        "მცირე ბიზნესის სტატუსის განაცხადი (1% ბრუნვაზე)",
        "მიკრო ბიზნესის სტატუსი (0% — წლიური 30,000 ₾-მდე)",
        "სტატუსის შენარჩუნების რეკომენდაციები",
        "აკრძალული აქტივობების ანალიზი",
        "სტატუსის ცვლილების შემთხვევაში დოკუმენტაცია",
        "კვარტალური დეკლარაციების ჩაბარება",
        "ინდივიდუალური საგადასახადო კონსულტაცია"
      ],
      faq: [
        { q: "რომელი აქტივობები არ ხდება მცირე ბიზნესის სტატუსით?", a: "კონსულტაციური, საიურიდიო, სამედიცინო, არქიტექტურა, აუდიტი, სავაჭრო (საცალო) — სრული სია გაცნობებულია კონსულტაციაზე." },
        { q: "რა მოხდება, თუ 500,000₾-ს გადავაჭარბე?", a: "სტატუსი ავტომატურად იკარგება. შემდეგ გადავდივართ ზოგად რეჟიმზე (20% მოგება + 18% დღგ). გირჩევთ, მონიტორინგზე დავდგეთ ბრუნვის დინამიკა." }
      ]
    },
    en: {
      title: "Small & Micro Business Status",
      subtitle: "Special tax regimes for small businesses — 1% on turnover",
      hero_img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80",
      intro: "Small Business Status is one of the most attractive regimes in Georgia — 1% tax on turnover, annual limit GEL 500,000. We help you apply and maintain the status.",
      features: [
        "Small Business Status application (1% on turnover)",
        "Micro Business Status (0% — annual up to GEL 30,000)",
        "Status maintenance guidance",
        "Prohibited activities analysis",
        "Status change documentation",
        "Quarterly return filing",
        "Individual tax consulting"
      ],
      faq: [
        { q: "Which activities are excluded from Small Business Status?", a: "Consulting, legal, medical, architecture, audit, retail — full list provided at consultation." },
        { q: "What happens if I exceed GEL 500,000?", a: "Status is automatically lost. You then switch to the general regime (20% profit + 18% VAT). We'll monitor your turnover and warn you in advance." }
      ]
    }
  },

  virtualzone: {
    ka: {
      title: "ვირტუალური ზონის სტატუსი (IT)",
      subtitle: "0% მოგების გადასახადი IT კომპანიებისთვის საქართველოში",
      hero_img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
      intro: "ვირტუალური ზონის სტატუსი ერთ-ერთი ყველაზე მომგებიანი რეჟიმია IT კომპანიებისთვის მსოფლიოში. 0% მოგების გადასახადი, 0% დღგ ექსპორტზე. ვეხმარებით სტატუსის მიღებაში, შენარჩუნებაში და ანგარიშგებაში.",
      features: [
        "ვირტუალური ზონის სტატუსის განაცხადი",
        "აქტივობების სწორი კლასიფიკაცია",
        "არსის მოთხოვნების (Substance) მხარდაჭერა",
        "პროდუქტის განვითარების დოკუმენტაცია",
        "ცოდნის ინტელექტუალური საკუთრების დაცვა",
        "დივიდენდების დაბეგვრა (5%) — ოპტიმიზაცია",
        "ტრანსფერ ფრაისინგის (TP) დოკუმენტაცია",
        "საერთაშორისო ბანკის ანგარიშის გახსნა"
      ],
      faq: [
        { q: "რომელი აქტივობები ექცევა ვირტუალური ზონის ქვეშ?", a: "პროგრამული უზრუნველყოფის შექმნა, Web/Mobile აპლიკაციები, SaaS პროდუქტები, AI/ML, Blockchain — ყველა, რაც იწარმოება საქართველოში და ექსპორტდება." },
        { q: "რა ხდება დივიდენდებთან?", a: "ვირტუალური ზონის კომპანია 0% მოგებას იხდის, მაგრამ დივიდენდების გაცემის დროს — 5%. ჯამში მაინც მნიშვნელოვნად მომგებიანია." }
      ]
    },
    en: {
      title: "Virtual Zone Status (IT)",
      subtitle: "0% profit tax for IT companies in Georgia",
      hero_img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80",
      intro: "Virtual Zone Status is one of the most attractive regimes for IT companies globally. 0% profit tax, 0% VAT on export. We help with application, maintenance and reporting.",
      features: [
        "Virtual Zone Status application",
        "Correct activity classification",
        "Substance requirements support",
        "Product development documentation",
        "Intellectual property protection",
        "Dividend taxation (5%) — optimization",
        "Transfer Pricing (TP) documentation",
        "International bank account opening"
      ],
      faq: [
        { q: "Which activities qualify for Virtual Zone?", a: "Software development, Web/Mobile apps, SaaS products, AI/ML, Blockchain — anything produced in Georgia and exported." },
        { q: "What about dividends?", a: "Virtual Zone companies pay 0% profit tax, but 5% at dividend payout. Overall still highly advantageous." }
      ]
    }
  }
};

// ===== Slug resolution =====
// Try data-service attribute, else derive from URL path (/services/foo.html → foo or /services/foo → foo)
function resolveServiceSlug() {
  const bodySlug = document.body.getAttribute("data-service");
  if (bodySlug) return bodySlug;
  const m = location.pathname.match(/\/services\/([^\/]+?)(?:\.html)?(?:\/)?$/i);
  return m ? m[1] : null;
}

// ===== Merge content.json service data (editable via admin) with hardcoded SERVICE_DATA fallback =====
function getServiceRenderData(slug, lang) {
  const content = window.SITE_CONTENT;
  const liveService = (content && Array.isArray(content.services))
    ? content.services.find(s => s && s.id === slug)
    : null;
  const fallback = SERVICE_DATA[slug] ? SERVICE_DATA[slug][lang] : null;
  // If admin hasn't filled a field, fall back to SERVICE_DATA (if available)
  return {
    title: (liveService && liveService.title) || (fallback && fallback.title) || slug,
    subtitle: (liveService && liveService.subtitle) || (liveService && liveService.shortDesc) || (fallback && fallback.subtitle) || "",
    hero_img: (liveService && liveService.image) || (fallback && fallback.hero_img) || "",
    intro: (liveService && liveService.fullDesc) || (liveService && liveService.intro) || (fallback && fallback.intro) || "",
    features: (liveService && Array.isArray(liveService.features) && liveService.features.length ? liveService.features : (fallback && fallback.features)) || [],
    faq: (liveService && Array.isArray(liveService.faq) && liveService.faq.length ? liveService.faq.map(f => ({ q: f.q || f.question || "", a: f.a || f.answer || "" })) : (fallback && fallback.faq)) || []
  };
}

// ===== Render page =====
function renderServicePage() {
  const slug = resolveServiceSlug();
  if (!slug) return;

  // If neither live nor static data exists — show a "not found" message
  const content = window.SITE_CONTENT;
  const hasLive = content && Array.isArray(content.services) && content.services.find(s => s && s.id === slug);
  const hasStatic = !!SERVICE_DATA[slug];
  if (!hasLive && !hasStatic) {
    const titleEl = document.getElementById("svc-title");
    if (titleEl) titleEl.textContent = "სერვისი ვერ მოიძებნა";
    const introEl = document.getElementById("svc-intro");
    if (introEl) introEl.textContent = "ეს სერვისი არ არსებობს ან ჯერ არ არის აღწერილი.";
    return;
  }

  // Index: prefer live ordering, else static
  let slugIndex = 1;
  if (content && Array.isArray(content.services)) {
    const idx = content.services.findIndex(s => s && s.id === slug);
    if (idx >= 0) slugIndex = idx + 1;
  } else {
    slugIndex = Object.keys(SERVICE_DATA).indexOf(slug) + 1;
  }

  const lang = localStorage.getItem("lang") || "ka";
  const d = getServiceRenderData(slug, lang);

  const titleEl = document.getElementById("svc-title");
  const crumbEl = document.getElementById("svc-title-crumb");
  const subtitleEl = document.getElementById("svc-subtitle");
  const heroImgEl = document.getElementById("svc-hero-img");
  const introEl = document.getElementById("svc-intro");
  const featuresEl = document.getElementById("svc-features");
  const faqEl = document.getElementById("svc-faq");
  const numEl = document.getElementById("svc-num");

  if (titleEl) titleEl.textContent = d.title;
  if (crumbEl) crumbEl.textContent = d.title;
  if (subtitleEl) subtitleEl.textContent = d.subtitle;
  if (heroImgEl && d.hero_img) heroImgEl.src = d.hero_img;
  if (introEl) introEl.textContent = d.intro;
  if (numEl) numEl.textContent = "სერვისი · " + String(slugIndex).padStart(2, '0');
  document.title = d.title + " — Audit.";

  if (featuresEl) {
    featuresEl.innerHTML = (d.features || []).map((f, i) => `
      <li>
        <span class="check-num">${String(i + 1).padStart(2, '0')}.</span>
        <span>${f}</span>
      </li>
    `).join("");
  }

  if (faqEl) {
    faqEl.innerHTML = (d.faq || []).map(f => `
      <details class="faq-item reveal visible">
        <summary>${f.q}</summary>
        <p>${f.a}</p>
      </details>
    `).join("");
  }
}

// ===== Bootstrap: render now, and re-render when content is loaded / language changes =====
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(renderServicePage, 50);
});
// Re-render when content-loader finishes fetch from /api/content
document.addEventListener("content-loaded", () => {
  setTimeout(renderServicePage, 20);
});
// Re-render on language switch
document.addEventListener("click", (e) => {
  if (e.target.closest && e.target.closest(".lang-switch button")) {
    setTimeout(renderServicePage, 50);
  }
});
