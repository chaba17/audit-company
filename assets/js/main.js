/* ==========================================================
   Audit Company — UI interactions
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Sticky header shadow on scroll
  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Mobile nav toggle
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  if (navToggle && navMenu) {
    const closeMenu = () => {
      navMenu.classList.remove("open");
      navToggle.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
      // Close any open dropdowns
      document.querySelectorAll(".has-dropdown.open").forEach(el => el.classList.remove("open"));
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

    // Close on link click (not dropdown toggle)
    navMenu.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link) closeMenu();
    });

    // ESC key closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("open")) closeMenu();
    });

    // Close when resizing to desktop
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1100 && navMenu.classList.contains("open")) closeMenu();
    });
  }

  // Dropdown tap toggle (mobile)
  document.querySelectorAll(".has-dropdown > .nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      if (window.innerWidth <= 1100) {
        e.preventDefault();
        e.stopPropagation();
        const parent = link.parentElement;
        parent.classList.toggle("open");
      }
    });
  });

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
