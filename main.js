/* ================================================================
   NEXUSAI — main.js
   Funcionalidades:
   1. Menú hamburguesa (toggle, cierre por clic exterior y enlace)
   2. Header scroll shadow (IntersectionObserver)
   ================================================================ */

'use strict';

/* ── 1. MENÚ HAMBURGUESA ─────────────────────────────────────── */
(function initHamburger() {

  const btn = document.getElementById('hamburger-btn');
  const nav = document.getElementById('main-nav');

  if (!btn || !nav) return;  // Seguridad: salir si los elementos no existen

  /**
   * Abre o cierra el menú móvil.
   * Sincroniza: aria-expanded en el botón + clase .is-open en nav.
   */
  function toggleMenu(forceClose) {
    const isCurrentlyOpen = btn.getAttribute('aria-expanded') === 'true';
    const shouldOpen = forceClose ? false : !isCurrentlyOpen;

    btn.setAttribute('aria-expanded', shouldOpen);
    nav.classList.toggle('is-open', shouldOpen);

    // Bloquear scroll del body cuando el menú está abierto en móvil
    document.body.style.overflow = shouldOpen ? 'hidden' : '';
  }

  /* Click en el botón hamburguesa */
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  /* Click en cualquier enlace del menú → cerrar */
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => toggleMenu(true));
  });

  /* Click fuera del menú y del botón → cerrar */
  document.addEventListener('click', (e) => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    if (isOpen && !btn.contains(e.target) && !nav.contains(e.target)) {
      toggleMenu(true);
    }
  });

  /* Tecla Escape → cerrar menú */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      toggleMenu(true);
      btn.focus();  // Devuelve el foco al botón para accesibilidad
    }
  });

  /* Al redimensionar por encima de 860px → cerrar y limpiar overflow */
  const mq = window.matchMedia('(min-width: 861px)');
  mq.addEventListener('change', ({ matches }) => {
    if (matches) {
      toggleMenu(true);
      document.body.style.overflow = '';
    }
  });

})();


/* ── 2. HEADER — SHADOW AL HACER SCROLL ─────────────────────── */
(function initHeaderScroll() {

  const header = document.getElementById('site-header');
  if (!header) return;

  /*
   * Usa IntersectionObserver para detectar si el usuario ha
   * abandonado la zona superior de la página (más eficiente
   * que un listener de 'scroll').
   */
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText =
    'position:absolute;top:1px;height:1px;width:1px;pointer-events:none;visibility:hidden;';
  document.body.prepend(sentinel);

  const observer = new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    },
    { rootMargin: '0px 0px 0px 0px', threshold: 0 }
  );

  observer.observe(sentinel);

})();
