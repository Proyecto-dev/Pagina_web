'use strict';

/* ── Header scroll ── */
(function () {
  const h = document.getElementById('site-header');
  if (!h) return;
  window.addEventListener('scroll', () => {
    h.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
})();

/* ── Hamburger ── */
(function () {
  const btn     = document.getElementById('hamburger');
  const nav     = document.getElementById('main-nav');
  const overlay = document.getElementById('mobile-overlay');
  if (!btn || !nav || !overlay) return;
  let open = false;

  function open_() {
    open = true;
    btn.classList.add('is-active');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Cerrar menú');
    nav.classList.add('is-open');
    overlay.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    const first = nav.querySelector('.nav-link');
    if (first) first.focus();
  }
  function close_() {
    open = false;
    btn.classList.remove('is-active');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');
    nav.classList.remove('is-open');
    overlay.classList.remove('is-active');
    document.body.style.overflow = '';
    btn.focus();
  }

  btn.addEventListener('click', () => open ? close_() : open_());
  overlay.addEventListener('click', close_);
  nav.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', close_));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) close_(); });
  window.matchMedia('(min-width: 861px)').addEventListener('change', e => { if (e.matches && open) close_(); });
})();

/* ── Contact form ── */
(function () {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    btn.disabled = true;
    btn.textContent = 'Enviando…';

    setTimeout(() => {
      form.style.display = 'none';
      if (success) {
        success.style.display = 'block';
        success.setAttribute('role', 'alert');
      }
    }, 1200);
  });
})();
