/* Punto de entrada: arma el mundo a partir del contenido y conecta los sistemas.
   Cada lugar es una vista: sólo una está visible, y cambiar de lugar la reemplaza. */

import content from '../data/content.js';
import { env, pointer, h, $, $$ } from './core/utils.js';
import { store } from './core/store.js';
import { audio } from './core/audio.js';
import { createRouter } from './core/router.js';
import { createCommerce } from './core/commerce.js';
import { createParticleSystem } from './core/particles.js';
import { createCursor } from './core/cursor.js';
import { startWatching } from '../components/creature.js';
import { createProductView } from '../components/discovery.js';
import { createCart } from '../components/cart.js';
import { createPortal } from '../components/portal.js';
import { createNav } from '../components/nav.js';
import { growBranches } from '../components/branch.js';
import { createForest } from './world/forest.js';
import { createPlaces, TONES } from './world/places.js';
import { createCheckoutView, createOrderView } from './world/checkout.js';
import { createIntro } from './world/intro.js';
import { createCanopy } from './world/canopy.js';
import { createSecrets } from './world/secrets.js';

const html = document.documentElement;
html.lang = content.meta.lang;
document.title = content.meta.title;
document.querySelector('meta[name="description"]')?.setAttribute('content', content.meta.description);
html.classList.add('is-intro', 'is-locked', `tier-${env.tier}`);
if (env.touch) html.classList.add('is-touch');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

/* ---- Sistemas base ---- */
audio.configure(content.audio);
const particles = createParticleSystem($('.particles'));
createCursor(particles);
startWatching(pointer);

const hasGsap = !!(window.gsap && window.ScrollTrigger);
if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
} else {
  html.classList.add('no-gsap');
}

let lenis = null;
if (window.Lenis && !env.reduced) {
  lenis = new Lenis({ lerp: env.mobile ? 0.12 : 0.085, smoothWheel: true, syncTouch: false });
  window.__lenis = lenis;
  if (hasGsap) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  lenis.stop();
}

const commerce = createCommerce(content);
const secrets = createSecrets({ content, audio });
const canopy = createCanopy({ audio });
const portal = createPortal({ particles, audio });
const router = createRouter((route) => show(route));
const go = (path, opts) => router.go(path, opts);
const cart = createCart({ content, audio, commerce, go });
const deps = { content, particles, audio, secrets, commerce, go, onOpen: (c) => go(`criatura/${c.id}`) };

/* ---- Vistas ---- */
const world = $('#world');
const views = new Map();
const firstPlace = content.places[0].id;

const forest = createForest({
  content, particles, audio, secrets,
  onPortal: (from) => go(content.places[1]?.id || firstPlace, { portal: from }),
});
views.set(firstPlace, { el: forest.el, enter: forest.enter, tone: TONES.forest, forest: true });

createPlaces(content, deps).forEach((el) => views.set(el.id, { el, enter: el.enter, tone: el.dataset.tone }));

const productView = createProductView({ ...deps, cart });
views.set('criatura', { ...productView, tone: TONES.shelf });
const checkoutView = createCheckoutView({ ...deps, cart });
views.set('checkout', { ...checkoutView, tone: TONES.letter });
const orderView = createOrderView(deps);
views.set('pedido', { ...orderView, tone: TONES.letter });

views.forEach((v) => world.append(v.el));

const nav = createNav({ content, audio, particles, goTo: go, onCart: () => cart.toggle() });

/* ---- Cambio de vista ---- */
let current = null, ctx = null, busy = false, queued = null;

function scrollTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  scrollTo(0, 0);
}

/** Animaciones comunes de cada lugar: texto palabra por palabra, raíces que crecen. */
function enterCommon(el) {
  if (!hasGsap) return;
  $$('[data-words]', el).forEach((p) => gsap.fromTo(p.querySelectorAll('.w'), { opacity: 0.12 }, {
    opacity: 1, stagger: 0.04, ease: 'none',
    scrollTrigger: { trigger: p, start: 'top 88%', end: 'bottom 60%', scrub: true },
  }));
  $$('.side-roots', el).forEach((svg) => gsap.fromTo(svg.querySelectorAll('.branch'), { '--p': 0 }, {
    '--p': 1, stagger: 0.25, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true },
  }));
  $$('.place__divider', el).forEach((svg) => growBranches(svg, { duration: env.reduced ? 0.01 : 2.4, stagger: 0.15 }));
}

async function show(route) {
  if (busy) { queued = route; return; }
  let id = route.view || firstPlace;
  if (!views.has(id)) id = firstPlace;
  const view = views.get(id);
  const opts = router.pendingOpts || {};
  router.pendingOpts = {};
  busy = true;
  cart.close();

  // Transición: portal si se cruza la puerta, ramas en cualquier otro caso
  const transition = opts.portal ? { close: () => portal.close(opts.portal), open: () => portal.open() } : nav.curtain;
  const hadView = !!current;
  if (hadView) await transition.close();

  if (current) {
    ctx?.revert();
    current.leave?.();
    current.el.hidden = true;
  }
  view.el.hidden = false;
  current = view;
  scrollTop();
  html.classList.toggle('is-interior', !view.forest);
  html.classList.toggle('is-shop', id === 'checkout' || id === 'pedido');
  html.style.setProperty('--tone', view.tone || TONES.lore);
  particles.light(view.forest ? 0 : 0.6);
  nav.setPlace(id, view.label?.() || '');

  if (hasGsap) {
    ctx = gsap.context(() => {
      enterCommon(view.el);
      view.enter?.(route.params);
    });
    ScrollTrigger.refresh();
  } else {
    view.enter?.(route.params);
  }
  nav.setPlace(id, view.label?.() || '');
  if (view !== views.get(firstPlace)) canopy.regrow(0.7);
  document.title = id === firstPlace ? content.meta.title : `${view.label?.() || content.places.find((p) => p.id === id)?.name || ''} — ${content.world.name}`;

  if (hadView) await transition.open();
  busy = false;
  if (queued) { const q = queued; queued = null; show(q); }
}

/* ---- Revelados y pausa fuera de pantalla ---- */
const revealIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
}), { threshold: 0.2 });
$$('[data-reveal]').forEach((el) => revealIO.observe(el));

/* ---- Viento: el scroll mueve las ramas del dosel ---- */
lenis?.on('scroll', ({ velocity }) => canopy.gust(velocity));
if (!lenis) {
  let lastY = scrollY;
  addEventListener('scroll', () => { canopy.gust((scrollY - lastY) * 0.5); lastY = scrollY; }, { passive: true });
}

/* ---- Una luz tenue acompaña al cursor en el interior ---- */
if (!env.touch) {
  const lamp = h('div', { class: 'lamp', 'aria-hidden': 'true' });
  document.body.append(lamp);
  let lx = pointer.x, ly = pointer.y;
  (function loop() {
    lx += (pointer.x - lx) * 0.08;
    ly += (pointer.y - ly) * 0.08;
    lamp.style.transform = `translate3d(${lx}px, ${ly}px, 0)`;
    requestAnimationFrame(loop);
  })();
}

/* ---- Entrada ---- */
if (hasGsap) gsap.set('.forest', { opacity: 0, scale: 1.14 });

createIntro({
  content, particles, audio,
  onEnter() {
    html.classList.remove('is-intro', 'is-locked');
    lenis?.start();
    canopy.show();
    nav.show();
    nav.syncSound();
    router.start();
    if (hasGsap) gsap.to('.forest', { opacity: 1, scale: 1, duration: 3, ease: 'power2.out', clearProps: 'scale' });
    document.dispatchEvent(new Event('world:entered'));
  },
});

document.fonts?.ready.then(() => hasGsap && ScrollTrigger.refresh());

// Sólo para depurar desde la consola
window.__world = { content, store, secrets, go };
