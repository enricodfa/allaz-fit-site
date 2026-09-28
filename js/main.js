/* =========================================================
   ALLAZ FIT — main.js
   ---------------------------------------------------------
   >>> CONFIGURE AQUI (única parte que você precisa editar) <<<
   ========================================================= */
const CONFIG = {
  // Número do WhatsApp com DDI + DDD, só dígitos. Ex.: '5535998765432'
  // Enquanto estiver vazio, os botões de WhatsApp levam para o Instagram.
  whatsapp: '5535960004530',

  instagram: 'https://instagram.com/allazfit'
};

/* ========================================================= */

(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const waReady = /^\d{12,13}$/.test(CONFIG.whatsapp);
  const waLink = (msg) =>
    waReady
      ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`
      : CONFIG.instagram;

  /* ---------- WhatsApp links ---------- */
  $$('.js-wa').forEach(a => {
    a.href = waLink(a.dataset.msg || 'Olá! Vim pelo site da Allaz Fit.');
    if (!waReady) a.target = '_blank', a.rel = 'noopener';
  });

  /* ---------- Header on scroll ---------- */
  const header = $('#header');
  const onScroll = () => header.style.borderBottomColor = scrollY > 8 ? 'var(--line-strong)' : 'var(--line)';
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = $('#menuToggle');
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('is-open');
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => {
    header.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', false);
  }));

  /* ---------- WhatsApp float visibility ---------- */
  const waFloat = $('#waFloat');
  setTimeout(() => waFloat.classList.add('is-visible'), 600);

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
