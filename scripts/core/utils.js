/* Utilidades compartidas: aleatoriedad con semilla, matemática, DOM y entorno. */

export const SVG_NS = 'http://www.w3.org/2000/svg';

/** Generador pseudoaleatorio determinista (mulberry32). */
export function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (min, max) => min + next() * (max - min);
  next.int = (min, max) => Math.floor(next.range(min, max + 1));
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.sign = () => (next() < 0.5 ? -1 : 1);
  return next;
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
export const rad = (deg) => (deg * Math.PI) / 180;
export const fmt = (n) => Math.round(n * 10) / 10;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Crea un elemento HTML con atributos y contenido. */
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) if (c != null) el.append(c);
  return el;
}

/** Crea un elemento SVG. */
export function s(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  return el;
}

export function svgRoot(viewBox, attrs = {}) {
  return s('svg', { viewBox, xmlns: SVG_NS, 'aria-hidden': 'true', ...attrs });
}

/** Escapa texto proveniente del contenido antes de insertarlo como HTML. */
export function esc(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Convierte una lista de puntos en un trazo suave (Catmull-Rom → Bézier). */
export function smoothPath(pts, closed = false) {
  if (pts.length < 2) return '';
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${fmt(p[1][0])} ${fmt(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2];
    const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6;
    d += ` C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(x2)} ${fmt(y2)}`;
  }
  return closed ? d + 'Z' : d;
}

/* ---- Entorno ---- */

const mq = (q) => window.matchMedia(q);

export const env = {
  get touch() { return mq('(hover: none), (pointer: coarse)').matches; },
  get mobile() { return mq('(max-width: 760px)').matches; },
  get reduced() { return mq('(prefers-reduced-motion: reduce)').matches; },
  /** 0 = mínimo, 1 = móvil / equipo modesto, 2 = escritorio completo */
  get tier() {
    if (this.reduced) return 0;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 8;
    if (this.mobile || cores <= 4 || mem <= 4) return 1;
    return 2;
  },
};

/** Ejecuta fn como máximo una vez por frame. */
export function rafThrottle(fn) {
  let queued = false, lastArgs;
  return (...args) => {
    lastArgs = args;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(...lastArgs); });
  };
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Puntero global (coordenadas de viewport), compartido por todos los sistemas. */
export const pointer = { x: innerWidth / 2, y: innerHeight / 2, vx: 0, vy: 0, active: false };
addEventListener('pointermove', (e) => {
  pointer.vx = e.clientX - pointer.x;
  pointer.vy = e.clientY - pointer.y;
  pointer.x = e.clientX;
  pointer.y = e.clientY;
  pointer.active = true;
}, { passive: true });
document.addEventListener('pointerleave', () => { pointer.active = false; });
