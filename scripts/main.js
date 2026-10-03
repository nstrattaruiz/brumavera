/* Punto de entrada: arma el mundo a partir del contenido y conecta los sistemas. */

import content from '../data/content.js';
import { env, pointer, h, $, $$ } from './core/utils.js';
import { store } from './core/store.js';
import { audio } from './core/audio.js';
import { createParticleSystem } from './core/particles.js';
import { createCursor } from './core/cursor.js';
import { startWatching } from '../components/creature.js';
import { createDiscovery } from '../components/discovery.js';
import { createNav } from '../components/nav.js';
import { createForest } from './world/forest.js';
import { createPlaces, createFooter, TONES } from './world/places.js';
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

const secrets = createSecrets({ content, audio });
const canopy = createCanopy({ audio });
const discovery = createDiscovery({ content, particles, audio, lenis });
const deps = { content, particles, audio, secrets, onOpen: (c) => discovery.open(c) };

/* ---- El mundo ---- */
const world = $('#world');
const forest = createForest({ content, particles, audio, secrets });
world.append(forest.el);
const places = createPlaces(content, deps);
places.forEach((p) => world.append(p));
world.append(createFooter(content, () => nav.travel(content.places[0].id)));

function goTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = id === content.places[0].id ? 0 : el;
  if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
  else if (top === 0) scrollTo(0, 0);
  else el.scrollIntoView();
  canopy.regrow();
}

const nav = createNav({ content, audio, particles, goTo });

/* ---- Lugar actual, tono de luz ---- */
let currentPlace = null;
function enterPlace(id, tone) {
  if (id === currentPlace) return;
  currentPlace = id;
  nav.setPlace(id);
  html.style.setProperty('--tone', tone);
  if (id !== content.places[0].id) canopy.regrow(0.8);
}
enterPlace(content.places[0].id, TONES.forest);

/* ---- Coreografía de scroll ---- */
function setupScroll() {
  if (!hasGsap) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && enterPlace(e.target.id, e.target.dataset.tone || TONES.forest)), { threshold: 0.4 });
    [forest.el, ...places].forEach((p) => io.observe(p));
    return;
  }
  const ft = forest.buildTimeline();
  places.forEach((p) => p.setupScroll?.());

  // Texto que aparece palabra por palabra
  $$('[data-words]').forEach((p) => gsap.fromTo(p.querySelectorAll('.w'), { opacity: 0.12 }, {
    opacity: 1, stagger: 0.04, ease: 'none',
    scrollTrigger: { trigger: p, start: 'top 88%', end: 'bottom 60%', scrub: true },
  }));

  // Raíces que bajan por los costados y raíces que separan lugares
  $$('.side-roots').forEach((svg) => gsap.fromTo(svg.querySelectorAll('.branch'), { '--p': 0 }, {
    '--p': 1, stagger: 0.25, ease: 'none',
    scrollTrigger: { trigger: svg.parentElement, start: 'top 75%', end: 'bottom 70%', scrub: true },
  }));
  $$('.place__divider').forEach((svg) => gsap.fromTo(svg.querySelectorAll('.branch'), { '--p': 0 }, {
    '--p': 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: svg, start: 'top bottom', end: 'top 30%', scrub: true },
  }));

  // Lugar activo
  ScrollTrigger.create({
    trigger: forest.el, start: 'top top', end: () => (ft ? ft.scrollTrigger.end : innerHeight),
    onToggle: (self) => self.isActive && enterPlace(content.places[0].id, TONES.forest),
  });
  places.forEach((p) => ScrollTrigger.create({
    trigger: p, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => self.isActive && enterPlace(p.id, p.dataset.tone),
  }));
}
setupScroll();

/* ---- Revelados y pausa fuera de pantalla ---- */
const revealIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
}), { threshold: 0.2 });
$$('[data-reveal]').forEach((el) => revealIO.observe(el));

const pauseIO = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting)), { rootMargin: '120px' });
places.forEach((p) => pauseIO.observe(p));

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
    if (hasGsap) {
      gsap.to('.forest', { opacity: 1, scale: 1, duration: 3, ease: 'power2.out', clearProps: 'scale' });
      ScrollTrigger.refresh();
    }
    document.dispatchEvent(new Event('world:entered'));
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash && document.getElementById(hash)) setTimeout(() => nav.travel(hash), 1800);
  },
});

document.fonts?.ready.then(() => hasGsap && ScrollTrigger.refresh());
addEventListener('load', () => hasGsap && ScrollTrigger.refresh());

// Sólo para depurar desde la consola
window.__world = { content, store, secrets };
