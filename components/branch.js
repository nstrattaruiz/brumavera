/* Ramas y raíces procedurales.
   Cada rama es un <g> SVG con trazos y hojas. Su crecimiento se controla con una sola
   variable CSS (--p, de 0 a 1), así la misma rama puede crecer por tiempo o por scroll. */

import { rng, s, rad, fmt, clamp } from '../scripts/core/utils.js';

const BARK = ['#14170f', '#191b12', '#1d1d14'];
const LEAVES = ['#1f2b1f', '#243226', '#2b3a2a', '#34432f', '#2a3324'];

function cubicAt(p, t) {
  const u = 1 - t;
  return [
    u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0],
    u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1],
  ];
}

function cubicTangent(p, t) {
  const u = 1 - t;
  const dx = 3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]);
  const dy = 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]);
  return Math.atan2(dy, dx);
}

/** Primer tramo de una Bézier cúbica cortada en t (de Casteljau). */
function cubicSplit(p, t) {
  const L = (a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const p01 = L(p[0], p[1]), p12 = L(p[1], p[2]), p23 = L(p[2], p[3]);
  const p012 = L(p01, p12), p123 = L(p12, p23);
  return [p[0], p01, p012, L(p012, p123)];
}

const dCubic = (c) =>
  `M${fmt(c[0][0])} ${fmt(c[0][1])}C${fmt(c[1][0])} ${fmt(c[1][1])} ${fmt(c[2][0])} ${fmt(c[2][1])} ${fmt(c[3][0])} ${fmt(c[3][1])}`;

/** Forma de hoja (almendrada, con nervadura) dibujada desde 0,0 hacia +x. */
export function leafPath(len, wid) {
  const w = wid / 2;
  return `M0 0C${fmt(len * 0.25)} ${fmt(-w * 1.25)} ${fmt(len * 0.7)} ${fmt(-w)} ${fmt(len)} 0C${fmt(len * 0.7)} ${fmt(w)} ${fmt(len * 0.25)} ${fmt(w * 1.25)} 0 0Z`;
}

/**
 * Crea una rama.
 * @param {object} o
 *  x, y        punto de nacimiento
 *  angle       dirección en grados (0 = derecha, -90 = arriba)
 *  length      largo del tramo principal
 *  width       grosor en la base
 *  depth       niveles de bifurcación
 *  leaves      densidad de hojas 0..1
 *  curl        curvatura 0..1
 *  bias        { angle, strength } empuja las ramas hijas hacia una dirección (p.ej. gravedad)
 *  seed        semilla
 *  bark, leafColors, leafScale, moss
 */
export function createBranch(o = {}) {
  const r = rng(o.seed ?? 7);
  const cfg = {
    depth: 4, leaves: 0.6, curl: 0.35, width: 10, length: 220, angle: -90,
    leafScale: 1, moss: 0.3, spread: [18, 46], ...o,
  };
  const bark = cfg.bark || r.pick(BARK);
  const leafColors = cfg.leafColors || LEAVES;
  const g = s('g', { class: 'branch' });
  const strokes = s('g', { class: 'branch__wood', stroke: bark, fill: 'none', 'stroke-linecap': 'round' });
  const leafLayer = s('g', { class: 'branch__leaves' });
  g.append(strokes, leafLayer);

  const timed = []; // { el, start, dur }
  let maxEnd = 0;

  function grow(x, y, angle, len, w, level, start) {
    const a = rad(angle);
    const bend = r.range(-1, 1) * cfg.curl * len * 0.5;
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    const nx = -Math.sin(a), ny = Math.cos(a);
    const pts = [
      [x, y],
      [x + Math.cos(a) * len * 0.33 + nx * bend, y + Math.sin(a) * len * 0.33 + ny * bend],
      [x + Math.cos(a) * len * 0.66 - nx * bend * 0.6, y + Math.sin(a) * len * 0.66 - ny * bend * 0.6],
      [ex, ey],
    ];
    const dur = len / 260;
    maxEnd = Math.max(maxEnd, start + dur);

    // Trazos superpuestos para simular que la rama se afina
    [[1, 0.42], [0.62, 0.72], [0.3, 1]].forEach(([frac, wf]) => {
      if (w * wf < 0.35) return;
      const path = s('path', {
        d: dCubic(frac === 1 ? pts : cubicSplit(pts, frac)),
        'stroke-width': fmt(w * wf),
        pathLength: 1,
        class: 'branch__stroke',
      });
      strokes.append(path);
      timed.push({ el: path, start, dur: dur * frac });
    });

    // Luz de borde muy tenue en los tramos gruesos
    if (w > 5) {
      const rim = s('path', {
        d: dCubic(cubicSplit(pts, 0.8)),
        'stroke-width': fmt(w * 0.16),
        stroke: '#3b4a33',
        'stroke-opacity': 0.35,
        transform: `translate(${fmt(nx * -w * 0.22)} ${fmt(ny * -w * 0.22)})`,
        pathLength: 1,
        class: 'branch__stroke',
      });
      strokes.append(rim);
      timed.push({ el: rim, start, dur: dur * 0.8 });
    }

    // Musgo
    if (w > 4 && r() < cfg.moss) {
      const t = r.range(0.1, 0.6);
      const [mx, my] = cubicAt(pts, t);
      const moss = s('g', { class: 'branch__moss', fill: '#34432f', opacity: 0.8 });
      for (let i = 0; i < 5; i++) {
        moss.append(s('circle', { cx: fmt(mx + r.range(-w, w) * 0.5), cy: fmt(my + r.range(-w, w) * 0.4), r: fmt(r.range(0.8, 2.2) * Math.min(w / 6, 1.6)) }));
      }
      leafLayer.append(moss);
      timed.push({ el: moss, start: start + dur * t, dur: 0.1, leaf: true });
    }

    // Hojas a lo largo de las ramas finas
    if (level >= cfg.depth - 2 && cfg.leaves > 0) {
      const n = Math.round((len / 16) * cfg.leaves);
      for (let i = 0; i < n; i++) {
        const t = r.range(0.25, 1);
        addLeaf(cubicAt(pts, t), cubicTangent(pts, t), start + dur * t);
      }
    }

    if (level >= cfg.depth) {
      if (cfg.leaves > 0) for (let i = 0; i < 3; i++) addLeaf([ex, ey], cubicTangent(pts, 1), start + dur);
      return;
    }

    // Ramas hijas
    const kids = level === 0 ? r.int(2, 3) : r.int(1, 3);
    for (let i = 0; i < kids; i++) {
      const t = i === kids - 1 ? 1 : r.range(0.35, 0.9);
      const [bx, by] = cubicAt(pts, t);
      const tan = (cubicTangent(pts, t) * 180) / Math.PI;
      let ca = i === kids - 1 ? tan + r.range(-14, 14) : tan + r.sign() * r.range(cfg.spread[0], cfg.spread[1]);
      if (cfg.bias) {
        let diff = ((cfg.bias.angle - ca + 540) % 360) - 180;
        ca += diff * cfg.bias.strength;
      }
      const cl = len * r.range(0.45, 0.66) * (1 - t * 0.2);
      const cw = Math.max(0.6, w * (1 - t * 0.45) * 0.68);
      grow(bx, by, ca, cl, cw, level + 1, start + dur * t);
    }
  }

  function addLeaf([x, y], tangent, start) {
    const side = r.sign();
    const ang = (tangent * 180) / Math.PI + side * r.range(25, 75);
    const len = r.range(9, 17) * cfg.leafScale;
    const wrap = s('g', { transform: `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(ang)})` });
    const grower = s('g', { class: 'branch__leafgrow' });
    const leaf = s('path', {
      d: leafPath(len, len * r.range(0.32, 0.46)),
      fill: r.pick(leafColors),
      class: 'leaf',
      'data-cursor': 'leaf',
    });
    // Nervadura apenas visible
    const vein = s('path', { d: `M1 0L${fmt(len * 0.86)} 0`, stroke: '#4a5a3e', 'stroke-width': 0.4, 'stroke-opacity': 0.5, fill: 'none', 'pointer-events': 'none' });
    grower.append(leaf, vein);
    wrap.append(grower);
    leafLayer.append(wrap);
    timed.push({ el: grower, start, dur: 0.12, leaf: true });
  }

  // `length` es el alcance total aproximado: el tramo principal mide la mitad
  // y las bifurcaciones completan el resto.
  grow(cfg.x ?? 0, cfg.y ?? 0, cfg.angle, cfg.length * 0.52, cfg.width, 0, 0);

  // Normaliza los tiempos: --s inicio y --d duración, ambos 0..1 sobre la vida total
  const total = maxEnd || 1;
  for (const t of timed) {
    t.el.style.setProperty('--s', fmt3(t.start / total));
    t.el.style.setProperty('--d', fmt3(Math.max(t.dur / total, 0.01)));
  }

  g.style.setProperty('--p', o.grown === false ? 0 : 1);
  g.style.transformOrigin = `${fmt(cfg.x ?? 0)}px ${fmt(cfg.y ?? 0)}px`;
  g.style.setProperty('--sway-delay', `${fmt(-r.range(0, 8))}s`);
  g.style.setProperty('--sway', `${fmt(cfg.sway ?? r.range(0.4, 1.2))}deg`);
  g.dataset.x = cfg.x ?? 0;
  g.dataset.y = cfg.y ?? 0;
  return g;
}

const fmt3 = (n) => Math.round(n * 1000) / 1000;

/** Varias ramas que nacen de un mismo punto, como un manojo que entra desde un borde. */
export function createBranchCluster(o = {}) {
  const r = rng(o.seed ?? 3);
  const g = s('g', { class: 'cluster' });
  const n = o.count ?? 3;
  for (let i = 0; i < n; i++) {
    g.append(createBranch({
      ...o,
      seed: (o.seed ?? 3) * 31 + i * 7,
      angle: (o.angle ?? 0) + (i - (n - 1) / 2) * (o.fan ?? 22) + r.range(-6, 6),
      length: (o.length ?? 260) * r.range(0.75, 1.1),
      width: (o.width ?? 9) * r.range(0.7, 1.05),
      x: (o.x ?? 0) + r.range(-1, 1) * (o.jitter ?? 20),
      y: (o.y ?? 0) + r.range(-1, 1) * (o.jitter ?? 20),
    }));
  }
  return g;
}

/** Raíces horizontales que atraviesan una sección (separadores orgánicos). */
export function createRoots(o = {}) {
  const width = o.width ?? 1600;
  const height = o.height ?? 160;
  const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none', class: 'roots', 'aria-hidden': 'true' });
  const r = rng(o.seed ?? 11);
  const n = o.count ?? 3;
  for (let i = 0; i < n; i++) {
    const fromLeft = i % 2 === 0;
    svg.append(createBranch({
      x: fromLeft ? -20 : width + 20,
      y: height * r.range(0.25, 0.6),
      angle: (fromLeft ? 0 : 180) + r.range(-8, 8),
      length: width * r.range(0.32, 0.48),
      width: r.range(5, 9),
      depth: 4,
      curl: 0.25,
      leaves: o.leaves ?? 0.08,
      moss: 0.5,
      spread: [20, 55],
      bias: { angle: 90, strength: 0.35 },
      seed: (o.seed ?? 11) + i * 13,
      grown: o.grown,
      sway: 0,
    }));
  }
  return svg;
}

/** Activa la reacción de las hojas al cursor / al tacto dentro de un contenedor. */
export function bindLeafRustle(root, onRustle) {
  const fire = (leaf) => {
    if (!leaf || leaf.classList.contains('is-rustling')) return;
    leaf.classList.add('is-rustling');
    leaf.style.setProperty('--rx', `${(Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 22)}deg`);
    leaf.addEventListener('animationend', () => leaf.classList.remove('is-rustling'), { once: true });
    onRustle?.(leaf);
  };
  root.addEventListener('pointerover', (e) => {
    if (e.target.classList?.contains('leaf')) fire(e.target);
  });
  root.addEventListener('pointerdown', (e) => {
    if (e.target.classList?.contains('leaf')) fire(e.target);
  });
}

/** Anima el crecimiento (--p) de todas las ramas de un nodo. */
export function growBranches(root, { duration = 2.4, delay = 0, stagger = 0.15, from = 0, to = 1, ease = 'power2.out' } = {}) {
  const items = root.classList?.contains('branch') ? [root] : [...root.querySelectorAll('.branch')];
  if (!window.gsap) { items.forEach((b) => b.style.setProperty('--p', to)); return null; }
  return gsap.fromTo(items, { '--p': from }, { '--p': to, duration, delay, stagger, ease });
}

export { clamp };
