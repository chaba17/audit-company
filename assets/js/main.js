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
}

// Expose globally so content-loader can call after re-render
window.initNav = initNav;

document.addEventListener("DOMContentLoaded", () => {
  initNav();

  // Re-init nav when content-loader re-renders header
  document.addEventListener("nav-rendered", () => initNav());

  // Safety net: after 2.5s, make ALL remaining .reveal elements visible
  // (in case IntersectionObserver missed any dynamic content)
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      // If element is above the fold (negative top), mark visible
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.5) {
        el.classList.add('visible');
      }
    });
  }, 2500);

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

  // Contact form stub
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const lang = document.documentElement.lang || "ka";
      const msg = lang === "ka"
        ? "მადლობა! დაგიკავშირდებით 24 საათში."
        : "Thanks! We'll get back to you within 24 hours.";
      alert(msg);
      contactForm.reset();
    });
  }
});
