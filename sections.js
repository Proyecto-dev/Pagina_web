/* ================================================================
   NEXUSAI — sections.js
   Funcionalidades:
   1. Hamburger menu
   2. Header scroll shadow
   3. Carousel de testimonios (responsive, auto-play, touch)
   4. Scroll reveal con IntersectionObserver
   ================================================================ */

'use strict';

/* ── 1. HAMBURGER ─────────────────────────────────────────────── */
(function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('main-nav');
  if (!btn || !nav) return;

  function toggle(forceClose) {
    const open = forceClose ? false : btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', open);
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.addEventListener('click', e => { e.stopPropagation(); toggle(); });
  nav.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => toggle(true)));
  document.addEventListener('click', e => {
    if (btn.getAttribute('aria-expanded') === 'true' && !btn.contains(e.target) && !nav.contains(e.target))
      toggle(true);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { toggle(true); btn.focus(); }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', ({ matches }) => {
    if (matches) { toggle(true); document.body.style.overflow = ''; }
  });
})();


/* ── 2. HEADER SCROLL ─────────────────────────────────────────── */
(function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:1px;height:1px;width:1px;pointer-events:none;visibility:hidden;';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);
})();


/* ── 3. CAROUSEL ─────────────────────────────────────────────── */
(function initCarousel() {
  const track      = document.getElementById('carousel-track');
  const viewport   = document.getElementById('carousel-viewport');
  const prevBtn    = document.getElementById('prev-btn');
  const nextBtn    = document.getElementById('next-btn');
  const dotsWrap   = document.getElementById('carousel-dots');

  if (!track || !viewport || !prevBtn || !nextBtn || !dotsWrap) return;

  const cards = Array.from(track.querySelectorAll('.test-card'));
  let current    = 0;
  let perPage    = calcPerPage();
  let autoTimer  = null;
  const GAP      = 20; // px — must match CSS gap: 1.25rem ≈ 20px

  /* ─ Helpers ─ */
  function calcPerPage() {
    const w = window.innerWidth;
    if (w <= 860)  return 1;
    if (w <= 1024) return 2;
    return 3;
  }

  function totalPages() {
    return Math.ceil(cards.length / perPage);
  }

  function cardWidth() {
    // Width of one card = (viewport width - gaps) / perPage
    return (viewport.clientWidth - GAP * (perPage - 1)) / perPage;
  }

  /* ─ Build dots ─ */
  function buildDots() {
    dotsWrap.innerHTML = '';
    const n = totalPages();
    for (let i = 0; i < n; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Página ${i + 1} de testimonios`);
      dot.setAttribute('aria-selected', i === 0);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    }
  }

  /* ─ Navigate ─ */
  function goTo(page) {
    const n = totalPages();
    current = ((page % n) + n) % n;  // wrap around

    const offset = current * (cardWidth() + GAP) * perPage;
    track.style.transform = `translateX(-${offset}px)`;

    dotsWrap.querySelectorAll('.carousel__dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === current);
      d.setAttribute('aria-selected', i === current);
    });

    // Button states
    prevBtn.disabled = false;
    nextBtn.disabled = false;
  }

  /* ─ Setup / resize ─ */
  function setup() {
    perPage = calcPerPage();
    current = 0;

    const cw = cardWidth();
    cards.forEach(c => {
      c.style.flex = `0 0 ${cw}px`;
    });

    buildDots();
    goTo(0);
  }

  /* ─ Auto-play ─ */
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }

  /* ─ Events ─ */
  prevBtn.addEventListener('click', () => { goTo(current - 1); startAuto(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); startAuto(); });

  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);

  /* Touch/swipe support */
  let touchStartX = 0;
  let touchDeltaX = 0;
  viewport.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchmove',  e => { touchDeltaX = e.touches[0].clientX - touchStartX; }, { passive: true });
  viewport.addEventListener('touchend', () => {
    if (Math.abs(touchDeltaX) > 50) {
      goTo(touchDeltaX < 0 ? current + 1 : current - 1);
      startAuto();
    }
    touchDeltaX = 0;
  });

  /* Resize debounce */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { setup(); startAuto(); }, 200);
  });

  /* ─ Init ─ */
  setup();
  startAuto();
})();


/* ── 4. SCROLL REVEAL ────────────────────────────────────────── */
(function initReveal() {
  const targets = document.querySelectorAll(
    '.svc-btn, .test-card, .about__media, .about__content, .section-header'
  );

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    // Stagger delay: cap at 0.4s to avoid long waits
    el.style.transitionDelay = Math.min(i % 6 * 0.08, 0.4) + 's';
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => io.observe(el));
})();
