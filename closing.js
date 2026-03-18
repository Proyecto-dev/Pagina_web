/* ================================================================
   NEXUSAI — closing.js

   MÓDULOS:
   1. AtomicField  — Canvas: nube orbital de partículas interconectadas
   2. ScrollDriver — Reacciona al scroll: escala, rotación, opacidad
   3. Hamburger    — Menú móvil
   4. HeaderScroll — Sombra progresiva del header
   5. LikeButtons  — Toggle likes con persistencia localStorage
   6. Newsletter   — Validación + feedback del formulario
   7. ScrollReveal — IntersectionObserver para reveals
   8. FooterYear   — Año dinámico en el copyright
   ================================================================ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   1. ATOMIC FIELD — Sistema de partículas orbital con Canvas 2D

   Razonamiento de diseño:
   - Cada partícula es un "átomo" que orbita un núcleo invisible
   - Las partículas más próximas entre sí se conectan con líneas
     cuya opacidad decrece con la distancia (efecto red neuronal)
   - El scrollDriver controla: rotación global, escala y opacidad
     del canvas completo, creando la ilusión de que la nube
     reacciona a la navegación del usuario
   - Usamos requestAnimationFrame para 60fps suaves
   - Colores: variantes del ámbar eléctrico y azul frío para
     cohesión con la paleta del sitio
   ════════════════════════════════════════════════════════════════ */
const AtomicField = (function () {

  const canvas = document.getElementById('atomic-canvas');
  if (!canvas) return { scroll: () => {} };

  const ctx = canvas.getContext('2d');

  /* ── Config ── */
  const CONFIG = {
    particleCount:   55,
    maxRadius:       2.4,
    minRadius:       .8,
    connectionDist:  160,
    orbitSpeedMin:   .0003,
    orbitSpeedMax:   .0012,
    colorAmber:      [245, 166, 35],
    colorBlue:       [80, 160, 255],
    colorWhite:      [200, 220, 255],
  };

  let width, height, centerX, centerY;
  let particles = [];
  let animId;

  /* ── Scroll state (updated externally) ── */
  let scrollProgress  = 0;   // 0–1 based on page scroll
  let globalRotOffset = 0;   // radians, driven by scroll
  let globalScale     = 1;
  let canvasOpacity   = 0.6;

  /* ── Particle class ── */
  class Particle {
    constructor() { this.reset(); }

    reset() {
      // Random orbital parameters around the canvas center
      this.orbitX  = centerX + (Math.random() - .5) * width  * .55;
      this.orbitY  = centerY + (Math.random() - .5) * height * .55;
      this.orbitRx = 40 + Math.random() * 260;  // semi-axis X
      this.orbitRy = 30 + Math.random() * 200;  // semi-axis Y
      this.angle   = Math.random() * Math.PI * 2;
      this.speed   = (CONFIG.orbitSpeedMin +
                      Math.random() * (CONFIG.orbitSpeedMax - CONFIG.orbitSpeedMin)) *
                      (Math.random() > .5 ? 1 : -1);
      this.tilt    = (Math.random() - .5) * Math.PI; // tilt of orbit plane

      this.radius  = CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius);
      this.opacity = .3 + Math.random() * .7;

      // Color blend: amber ↔ blue ↔ white
      const t = Math.random();
      if (t < .5) {
        this.color = lerpColor(CONFIG.colorAmber, CONFIG.colorBlue, t * 2);
      } else {
        this.color = lerpColor(CONFIG.colorBlue, CONFIG.colorWhite, (t - .5) * 2);
      }

      this.x = this.orbitX;
      this.y = this.orbitY;
    }

    update(dt, rotOffset) {
      this.angle += this.speed * dt;
      const cosT = Math.cos(this.tilt);
      const sinT = Math.sin(this.tilt);
      const localX = Math.cos(this.angle) * this.orbitRx;
      const localY = Math.sin(this.angle) * this.orbitRy;

      // Apply tilt + global rotation
      const globalAngle = rotOffset;
      const cosG = Math.cos(globalAngle);
      const sinG = Math.sin(globalAngle);

      const rx = localX * cosT - localY * sinT;
      const ry = localX * sinT + localY * cosT;

      this.x = this.orbitX + (rx * cosG - ry * sinG) * globalScale;
      this.y = this.orbitY + (rx * sinG + ry * cosG) * globalScale;
    }

    draw() {
      const [r, g, b] = this.color;
      const alpha = this.opacity * .9;

      // Glow aura
      const grad = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius * 5
      );
      grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Núcleo sólido
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }
  }

  /* ── Helpers ── */
  function lerpColor(c1, c2, t) {
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * t),
      Math.round(c1[1] + (c2[1] - c1[1]) * t),
      Math.round(c1[2] + (c2[2] - c1[2]) * t),
    ];
  }

  function resize() {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width  / 2;
    centerY = height / 2;
    // Re-seed orbits on resize
    particles.forEach(p => p.reset());
  }

  function init() {
    resize();
    particles = Array.from({ length: CONFIG.particleCount }, () => new Particle());
    window.addEventListener('resize', debounce(resize, 200));
  }

  /* ── Draw connections ── */
  function drawConnections() {
    const n = particles.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.connectionDist) {
          const alpha = (1 - dist / CONFIG.connectionDist) * .25;
          // Blend the two particle colors
          const [r1,g1,b1] = particles[i].color;
          const [r2,g2,b2] = particles[j].color;
          const r = Math.round((r1+r2)/2);
          const g = Math.round((g1+g2)/2);
          const b = Math.round((b1+b2)/2);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.lineWidth = .6;
          ctx.stroke();
        }
      }
    }
  }

  /* ── Main loop ── */
  let lastTime = 0;
  function loop(timestamp) {
    const dt = Math.min(timestamp - lastTime, 50); // cap delta
    lastTime = timestamp;

    ctx.clearRect(0, 0, width, height);

    canvas.style.opacity = String(canvasOpacity);

    particles.forEach(p => p.update(dt, globalRotOffset));
    drawConnections();
    particles.forEach(p => p.draw());

    animId = requestAnimationFrame(loop);
  }

  function start() {
    init();
    animId = requestAnimationFrame(loop);
  }

  /* ── Public API for scroll driver ── */
  function updateScroll(progress) {
    scrollProgress  = progress;
    globalRotOffset = progress * Math.PI * 1.2;           // rotate up to ~216°
    globalScale     = 1 + progress * .35;                 // expand to 1.35×
    canvasOpacity   = Math.max(.2, .65 - progress * .3);  // fade slightly
  }

  start();

  return { updateScroll };
})();


/* ════════════════════════════════════════════════════════════════
   2. SCROLL DRIVER — Mapea scroll → efectos atómicos
   ════════════════════════════════════════════════════════════════ */
(function ScrollDriver() {
  function onScroll() {
    const scrollTop  = window.scrollY || document.documentElement.scrollTop;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const progress   = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    AtomicField.updateScroll(progress);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial call
})();


/* ════════════════════════════════════════════════════════════════
   3. HAMBURGER
   ════════════════════════════════════════════════════════════════ */
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
    if (btn.getAttribute('aria-expanded') === 'true' &&
        !btn.contains(e.target) && !nav.contains(e.target)) toggle(true);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      toggle(true); btn.focus();
    }
  });
  window.matchMedia('(min-width:861px)').addEventListener('change', ({ matches }) => {
    if (matches) { toggle(true); document.body.style.overflow = ''; }
  });
})();


/* ════════════════════════════════════════════════════════════════
   4. HEADER SCROLL SHADOW
   ════════════════════════════════════════════════════════════════ */
(function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:1px;height:1px;width:1px;pointer-events:none;visibility:hidden;';
  document.body.prepend(sentinel);
  new IntersectionObserver(
    ([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting)
  ).observe(sentinel);
})();


/* ════════════════════════════════════════════════════════════════
   5. LIKE BUTTONS — toggle + localStorage
   ════════════════════════════════════════════════════════════════ */
(function initLikes() {
  const STORE_KEY = 'nexusai_likes';

  function getLiked() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveLiked(liked) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(liked)); } catch {}
  }

  const liked = getLiked();

  document.querySelectorAll('.like-btn').forEach(btn => {
    const postId    = btn.dataset.post;
    const countEl   = btn.querySelector('.like-count');
    let   count     = parseInt(countEl.textContent, 10);

    // Restore persisted state
    if (liked[postId]) {
      btn.classList.add('is-liked');
      btn.setAttribute('aria-label', `Quitar like. ${count} likes`);
    }

    btn.addEventListener('click', () => {
      const isLiked = btn.classList.toggle('is-liked');
      count += isLiked ? 1 : -1;
      countEl.textContent = count;
      btn.setAttribute('aria-label', `${isLiked ? 'Quitar like' : 'Me gusta'}. ${count} likes`);

      // Micro animación del conteo
      countEl.style.transform = 'scale(1.4)';
      setTimeout(() => { countEl.style.transform = ''; }, 180);

      liked[postId] = isLiked;
      saveLiked(liked);
    });
  });
})();


/* ════════════════════════════════════════════════════════════════
   6. NEWSLETTER — validación + feedback visual
   ════════════════════════════════════════════════════════════════ */
(function initNewsletter() {
  const btn     = document.getElementById('newsletter-submit');
  const input   = document.getElementById('newsletter-email');
  const success = document.getElementById('newsletter-success');
  if (!btn || !input || !success) return;

  const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  btn.addEventListener('click', () => {
    const val = input.value.trim();

    if (!RE_EMAIL.test(val)) {
      // Shake animation para error
      input.style.animation = 'none';
      input.offsetHeight; // reflow
      input.style.animation = 'shake .35s var(--ease)';
      input.focus();
      return;
    }

    // Simulación de envío exitoso
    btn.disabled = true;
    btn.style.opacity = '.5';
    setTimeout(() => {
      input.value = '';
      success.hidden = false;
      btn.disabled = false;
      btn.style.opacity = '';
      // Ocultar éxito tras 6s
      setTimeout(() => { success.hidden = true; }, 6000);
    }, 800);
  });

  // Enviar con Enter
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click();
  });

  // Inyectar animación shake
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-6px); }
      40%      { transform: translateX(6px); }
      60%      { transform: translateX(-4px); }
      80%      { transform: translateX(4px); }
    }
    .like-count { transition: transform .18s cubic-bezier(.34,1.56,.64,1); display: inline-block; }
  `;
  document.head.appendChild(style);
})();


/* ════════════════════════════════════════════════════════════════
   7. SCROLL REVEAL — IntersectionObserver
   ════════════════════════════════════════════════════════════════ */
(function initReveal() {
  const targets = document.querySelectorAll(
    '.blog-card, .pre-footer-cta__inner, .footer-col, .section-header'
  );

  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = Math.min(i % 5 * 0.09, 0.36) + 's';
  });

  new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          // Remove delay after first reveal so re-entries are instant
          setTimeout(() => { e.target.style.transitionDelay = '0s'; }, 800);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  ).observe(document.querySelectorAll('.reveal').length
    ? document.querySelectorAll('.reveal')[0]
    : document.body);

  // Separate observer for each target
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );
  targets.forEach(el => io.observe(el));
})();


/* ════════════════════════════════════════════════════════════════
   8. COPYRIGHT YEAR — dinámico
   ════════════════════════════════════════════════════════════════ */
(function setYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();


/* ════════════════════════════════════════════════════════════════
   UTILIDAD GLOBAL: debounce
   ════════════════════════════════════════════════════════════════ */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
