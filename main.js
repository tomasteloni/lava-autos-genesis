(function () {
  "use strict";

  /* ── Helpers ── */
  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.from((scope || document).querySelectorAll(sel)); };
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safe(fn, name) {
    try { fn(); }
    catch (e) { console.warn("[Genesis] " + name + " failed:", e); }
  }

  /* ── 2. Custom cursor ── */
  function initCursor() {
    var dot = $(".cursor-dot");
    var ring = $(".cursor-ring");
    if (!dot || !ring) return;

    /* Only active on true pointer devices */
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    var mouseX = 0, mouseY = 0;
    var ringX = 0, ringY = 0;
    var raf;

    /* Opacity 0 until first mousemove */
    document.addEventListener("mousemove", function onFirstMove(e) {
      document.body.classList.add("cursor-active");
      document.removeEventListener("mousemove", onFirstMove);
    });

    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = "translate(" + (mouseX - 4) + "px, " + (mouseY - 4) + "px)";
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.transform = "translate(" + (ringX - 18) + "px, " + (ringY - 18) + "px)";
      raf = requestAnimationFrame(animateRing);
    }
    animateRing();

    /* Grow ring on interactive elements */
    document.addEventListener("mouseover", function (e) {
      if (!e.relatedTarget && e.target !== document) return;
      var el = e.target.closest("a, button, .service-card, .gallery-item, .btn");
      if (el) ring.classList.add("hovered");
    });

    document.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget && e.target !== document) return;
      var el = e.target.closest("a, button, .service-card, .gallery-item, .btn");
      if (el) ring.classList.remove("hovered");
    });
  }

  /* ── 3. Nav solidify on scroll ── */
  function initNav() {
    var nav = $("#nav");
    if (!nav) return;

    function onScroll() {
      if (window.scrollY > 40) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── 4. Hamburger menu ── */
  function initHamburger() {
    var btn = $(".nav-hamburger");
    var menu = $(".nav-mobile");
    if (!btn || !menu) return;

    btn.setAttribute("aria-expanded", "false");

    btn.addEventListener("click", function () {
      var open = btn.classList.toggle("open");
      menu.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });

    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        btn.classList.remove("open");
        menu.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }

  /* ── 5. Hero glow reactive to mouse ── */
  function initHeroGlow() {
    var hero = $(".hero");
    var glow = $("#heroGlow");
    if (!hero || !glow) return;
    if (!matchMedia("(hover: hover)").matches) return;

    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      glow.style.background =
        "radial-gradient(700px circle at " + x + "px " + y + "px, rgba(30,144,255,0.12), transparent 40%)";
    });

    hero.addEventListener("mouseleave", function () {
      glow.style.background =
        "radial-gradient(700px circle at 50% 40%, rgba(30,144,255,0.07), transparent 40%)";
    });
  }

  /* ── 6. Tilt 3D on service cards ── */
  function initTilt() {
    var cards = $$(".service-card");
    var MAX_TILT = 7;

    cards.forEach(function (card) {
      if (card.children.length === 0) return; /* idempotence guard */

      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / (rect.width / 2);
        var dy = (e.clientY - cy) / (rect.height / 2);
        var rx = -dy * MAX_TILT;
        var ry = dx * MAX_TILT;
        card.style.transform = "perspective(700px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateZ(8px)";
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0)";
      });
    });
  }

  /* ── 7. Per-card glow following cursor ── */
  function initCardGlow() {
    var cards = $$(".service-card");

    cards.forEach(function (card) {
      var glow = card.querySelector(".service-card-glow");
      if (!glow) return;

      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        glow.style.background =
          "radial-gradient(280px circle at " + x + "px " + y + "px, rgba(30,144,255,0.1), transparent 60%)";
      });

      card.addEventListener("mouseleave", function () {
        glow.style.background =
          "radial-gradient(280px circle at 50% 50%, rgba(30,144,255,0.0), transparent 60%)";
      });
    });
  }

  /* ── 8. Counter animation on scroll ── */
  function initCounters() {
    var statItems = $$(".stat-item[data-value]");
    if (statItems.length === 0) return;

    var animated = false;

    function runCounters() {
      if (animated) return;
      animated = true;

      statItems.forEach(function (item) {
        var target = parseInt(item.getAttribute("data-value"), 10);
        var suffix = item.getAttribute("data-suffix") || "";
        var valueEl = item.querySelector(".stat-value");
        if (!valueEl) return;

        var start = 0;
        var duration = 1800;
        var startTime = null;

        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = Math.floor(eased * target);
          valueEl.innerHTML = current + '<span class="suffix">' + suffix + "</span>";
          if (progress < 1) requestAnimationFrame(step);
          else valueEl.innerHTML = target + '<span class="suffix">' + suffix + "</span>";
        }

        requestAnimationFrame(step);
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounters();
          observer.disconnect();
        }
      });
    }, { threshold: 0.05 });

    var strip = $(".stats-strip");
    if (strip) observer.observe(strip);

    /* Safety: run after 6s regardless */
    setTimeout(runCounters, 6000);
  }

  /* ── 9. Reveal on scroll ── */
  function initReveal() {
    var elements = $$(".reveal");
    if (elements.length === 0) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          /* Stagger via data-delay attribute if set */
          var delay = parseInt(entry.target.getAttribute("data-delay") || "0", 10);
          setTimeout(function () {
            entry.target.classList.add("visible");
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    elements.forEach(function (el) { observer.observe(el); });

    /* Safety: show everything after 6s */
    setTimeout(function () {
      elements.forEach(function (el) { el.classList.add("visible"); });
    }, 6000);
  }

  /* ── 10. Video scroll-scrubbing ── */
  function initVideoScrub() {
    var video = document.getElementById("video-scrub");
    var wrap  = document.querySelector(".video-scrub-wrap");
    var bar   = document.getElementById("videoProgress");
    var label = document.querySelector(".video-scrub-label");
    if (!video || !wrap) return;

    /* Configurar el video para scrubbing — jamás auto-reproduce */
    video.muted      = true;
    video.playsInline = true;
    video.preload    = "auto";
    video.pause();

    /* Calcula el progreso del scroll (0–1) y aplica al video */
    function scrub() {
      var rect  = wrap.getBoundingClientRect();
      var total = wrap.offsetHeight - window.innerHeight;
      if (total <= 0) return;

      var p = Math.max(0, Math.min(1, -rect.top / total));

      /* Actualizar fotograma del video */
      if (video.readyState >= 1 && video.duration && !isNaN(video.duration)) {
        video.currentTime = p * video.duration;
      }

      /* Barra de progreso lateral */
      if (bar) bar.style.height = (p * 100) + "%";

      /* Label central: visible entre 15% y 85% del scroll */
      if (label) label.classList.toggle("visible", p > 0.15 && p < 0.85);
    }

    /* Llamar scrub() en cada evento scroll, con RAF para 60fps */
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        scrub();
        ticking = false;
      });
    }, { passive: true });

    /* También llamar cuando el video cargue sus metadatos,
       por si el usuario ya scrolleó antes de que cargara */
    video.addEventListener("loadedmetadata", scrub);
    video.addEventListener("canplaythrough", scrub);

    /* Llamada inicial (posición al cargar la página) */
    scrub();
  }

  /* ── 12. Smooth anchor scroll ── */
  function initAnchorLinks() {
    $$('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (e) {
        var id = link.getAttribute("href");
        if (id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
        var top = target.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top: top, behavior: "smooth" });
      });
    });
  }

  /* ── 13. Dynamic footer year ── */
  function initYear() {
    var el = $(".js-year");
    if (el && window.__BRAND__) el.textContent = window.__BRAND__.year;
  }

  /* ── 14. Marquee pause on hover (CSS handles it, JS as safety) ── */
  function initMarquee() {
    var track = $(".marquee-track");
    if (!track) return;

    /* CSS already handles hover pause via animation-play-state */
    /* JS fallback for touch devices */
    track.addEventListener("touchstart", function () {
      track.style.animationPlayState = "paused";
    }, { passive: true });

    track.addEventListener("touchend", function () {
      track.style.animationPlayState = "running";
    }, { passive: true });
  }

  /* ── Boot ── */
  function boot() {
    safe(initCursor, "initCursor");
    safe(initNav, "initNav");
    safe(initHamburger, "initHamburger");
    safe(initHeroGlow, "initHeroGlow");
    safe(initTilt, "initTilt");
    safe(initCardGlow, "initCardGlow");
    safe(initCounters, "initCounters");
    safe(initReveal, "initReveal");
    safe(initVideoScrub, "initVideoScrub");
    safe(initAnchorLinks, "initAnchorLinks");
    safe(initMarquee, "initMarquee");
    safe(initYear, "initYear");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
