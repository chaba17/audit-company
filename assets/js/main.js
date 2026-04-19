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
