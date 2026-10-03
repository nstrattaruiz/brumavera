/* EL BOSQUE — primer gran espacio. Capas (fondo, medio, puerta, suelo, primer plano),
   niebla, hongos, una luz que huye, una criatura escondida y la puerta hacia el interior.
   Todas las capas comparten el mismo lienzo (1600 × 1000) para que el parallax sea coherente. */

import { rng, s, svgRoot, smoothPath, fmt, env, pointer, h, esc, lerp, clamp } from '../core/utils.js';
import { createBranch, bindLeafRustle, leafPath } from '../../components/branch.js';
import { creatureMarkup } from '../../components/creature.js';
import { createWisp, createInteractiveObject } from '../../components/interactive.js';

const VB = '0 0 1600 1000';
const DOOR = { x: 800, y: 765 };

/* ---------- Piezas de dibujo ---------- */

function trunk(r, { x, base, top, lean = 0, fill, ground = 1000, height = 1100 }) {
  const N = 9, left = [], right = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = ground - t * height;
    let w = lerp(base, top, Math.pow(t, 0.6));
    if (i === 0) w *= 1.9; else if (i === 1) w *= 1.2;
    const cx = x + lean * t * t + r.range(-3, 3);
    left.push([cx - w / 2 + r.range(-2, 2), y]);
    right.push([cx + w / 2 + r.range(-2, 2), y]);
  }
  return s('path', { d: smoothPath([...left, ...right.reverse()], true), fill });
}

function radial(id, stops) {
  const g = s('radialGradient', { id });
  stops.forEach(([o, c, a = 1]) => g.append(s('stop', { offset: o, 'stop-color': c, 'stop-opacity': a })));
  return g;
}

function mushrooms(r, x, y, n, glow, gid) {
  const g = s('g', { class: 'shroom', 'data-cursor': 'object', style: `--glow:${glow}` });
  g.append(s('ellipse', { cx: x, cy: y - 8, rx: 46, ry: 30, fill: `url(#${gid})`, class: 'shroom__halo' }));
  for (let i = 0; i < n; i++) {
    const mx = x + r.range(-22, 22), hgt = r.range(8, 22), cap = r.range(4, 9);
    g.append(s('path', { d: `M${fmt(mx - 1.2)} ${y}L${fmt(mx - 0.8)} ${fmt(y - hgt)}L${fmt(mx + 0.8)} ${fmt(y - hgt)}L${fmt(mx + 1.2)} ${y}Z`, fill: '#2a3a33' }));
    g.append(s('path', { d: `M${fmt(mx - cap)} ${fmt(y - hgt)}Q${fmt(mx)} ${fmt(y - hgt - cap * 1.3)} ${fmt(mx + cap)} ${fmt(y - hgt)}Z`, fill: glow, class: 'shroom__cap', opacity: r.range(0.55, 0.9) }));
  }
  return g;
}

function fern(r, x, y, angle, len, seed) {
  return createBranch({
    x, y, angle, length: len, width: 2.2, depth: 2, leaves: 1.6, leafScale: 1.15, curl: 0.5,
    bark: '#1a2418', leafColors: ['#162016', '#1b261a', '#1f2b1f'], moss: 0, seed, spread: [40, 70], sway: 2,
  });
}

/* ---------- Capas ---------- */

function buildFar() {
  const r = rng(21);
  const svg = svgRoot(VB, { preserveAspectRatio: 'xMidYMax slice' });
  const defs = s('defs');
  defs.append(radial('moon', [[0, '#d4c59a', 0.16], [0.5, '#806b42', 0.05], [1, '#000', 0]]));
  svg.append(defs, s('circle', { cx: 860, cy: 260, r: 420, fill: 'url(#moon)' }));
  for (let i = 0; i < 18; i++) {
    const x = (i / 17) * 1700 - 50 + r.range(-30, 30);
    const fill = r() < 0.5 ? '#131b14' : '#162017';
    svg.append(trunk(r, { x, base: r.range(26, 52), top: r.range(8, 16), lean: r.range(-40, 40), fill, ground: 900, height: 1000 }));
    if (r() < 0.6) {
      svg.append(createBranch({ x: x + r.range(-6, 6), y: r.range(260, 560), angle: r.pick([-30, -150, -60, -120]), length: r.range(90, 180), width: 5, depth: 3, leaves: 0.35, bark: fill, leafColors: ['#151d15', '#182119'], moss: 0, seed: i * 17 + 3, sway: 0.4 }));
    }
  }
  svg.append(s('rect', { x: 0, y: 880, width: 1600, height: 120, fill: '#0f150f' }));
  return svg;
}

function buildMid(onSigil) {
  const r = rng(77);
  const svg = svgRoot(VB, { preserveAspectRatio: 'xMidYMax slice' });
  const defs = s('defs');
  const lg = s('linearGradient', { id: 'bark-mid', x1: 0, x2: 1 });
  [[0, '#1a231b'], [0.35, '#0e130e'], [1, '#090c08']].forEach(([o, c]) => lg.append(s('stop', { offset: o, 'stop-color': c })));
  defs.append(lg);
  svg.append(defs);

  const trunks = [
    { x: 150, base: 120, top: 46, lean: 30 }, { x: 390, base: 96, top: 34, lean: -20 },
    { x: 585, base: 70, top: 24, lean: -40 }, { x: 1040, base: 64, top: 22, lean: 30 },
    { x: 1250, base: 104, top: 40, lean: 20 }, { x: 1480, base: 130, top: 50, lean: -30 },
  ];
  trunks.forEach((t, i) => {
    svg.append(trunk(r, { ...t, fill: 'url(#bark-mid)', ground: 930, height: 1050 }));
    const side = t.x < 800 ? 1 : -1;
    for (let k = 0; k < 2; k++) {
      svg.append(createBranch({
        x: t.x + side * t.top * 0.4, y: r.range(180, 520), angle: side > 0 ? r.range(-50, -15) : r.range(-165, -130),
        length: r.range(160, 260), width: t.top * 0.32, depth: 4, leaves: 0.7, bark: '#0c100b', seed: i * 41 + k * 9, sway: 0.6,
      }));
    }
    // raíces que salen del tronco
    [-1, 1].forEach((d, k) => svg.append(createBranch({
      x: t.x + d * t.base * 0.6, y: 925, angle: d > 0 ? 8 : 172, length: t.base * 1.4, width: t.base * 0.16, depth: 2,
      leaves: 0, curl: 0.3, bark: '#0b0e0a', bias: { angle: 90, strength: 0.3 }, seed: i * 13 + k, sway: 0,
    })));
  });

  // Ramas que cuelgan desde arriba
  [260, 700, 980, 1360].forEach((x, i) => svg.append(createBranch({
    x, y: -30, angle: 90 + r.range(-35, 35), length: r.range(200, 300), width: 9, depth: 4, leaves: 0.9, bark: '#0b0f0a', seed: 500 + i * 23, sway: 1.1,
  })));

  // Símbolo tallado en un tronco (secreto)
  const sigil = s('g', { class: 'sigil', transform: 'translate(1040 600)', 'data-cursor': 'object' });
  sigil.innerHTML = `<circle r="26" fill="transparent"/><path d="M0 -16L0 16M-10 -8L10 8M10 -8L-10 8M-6 16L6 16" fill="none" stroke-width="2.2" stroke-linecap="round"/>`;
  svg.append(sigil);
  createInteractiveObject(sigil, { onActivate: onSigil, label: 'Símbolo tallado' });
  return svg;
}

function buildDoor(place) {
  const svg = svgRoot(VB, { preserveAspectRatio: 'xMidYMax slice', class: 'door-svg' });
  svg.innerHTML = `
    <defs>
      <radialGradient id="door-in" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#f0d99a"/><stop offset=".45" stop-color="#b38a4a"/><stop offset="1" stop-color="#3a2a14"/></radialGradient>
      <linearGradient id="door-wood" x1="0" x2="1"><stop offset="0" stop-color="#2e251a"/><stop offset=".5" stop-color="#3b2f1f"/><stop offset="1" stop-color="#211a11"/></linearGradient>
      <radialGradient id="door-spill" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e3c47e" stop-opacity=".45"/><stop offset="1" stop-color="#e3c47e" stop-opacity="0"/></radialGradient>
      <radialGradient id="lantern" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e3c47e" stop-opacity=".7"/><stop offset="1" stop-color="#e3c47e" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse class="door__spill" cx="800" cy="888" rx="150" ry="22" fill="url(#door-spill)"/>
    <text class="door__inscription" x="800" y="604" text-anchor="middle">${esc(place.doorInscription || '')}</text>
    <path d="M700 888L700 712A100 100 0 0 1 900 712L900 888Z" fill="#17160f"/>
    <g stroke="#0b0b07" stroke-width="2" fill="none" opacity=".9">
      <path d="M700 760L725 760M875 760L900 760M700 830L725 830M875 830L900 830M712 660L732 676M888 660L868 676M770 618L778 640M830 618L822 640"/>
    </g>
    <path class="door__inner" d="M725 885L725 720A75 75 0 0 1 875 720L875 885Z" fill="url(#door-in)"/>
    <g class="door__leaf door__leaf--l">
      <path d="M725 885L725 720A75 75 0 0 1 800 645L800 885Z" fill="url(#door-wood)"/>
      <g stroke="#1a140c" stroke-width="1.4"><path d="M750 662L750 885M775 650L775 885"/></g>
      <path d="M725 768L800 768M725 846L800 846" stroke="#1d1912" stroke-width="5"/>
      <circle cx="790" cy="800" r="5" fill="none" stroke="#806b42" stroke-width="1.6"/>
    </g>
    <g class="door__leaf door__leaf--r">
      <path d="M800 645A75 75 0 0 1 875 720L875 885L800 885Z" fill="url(#door-wood)"/>
      <g stroke="#1a140c" stroke-width="1.4"><path d="M825 650L825 885M850 662L850 885"/></g>
      <path d="M800 768L875 768M800 846L875 846" stroke="#1d1912" stroke-width="5"/>
      <rect class="door__keyhole" x="808" y="790" width="4" height="9" rx="2" fill="#e3c47e"/>
    </g>
    <g class="door__light"><path class="door__seam" d="M800 650L800 884" stroke="#e3c47e" stroke-width="1.2" opacity=".55"/>
    <path class="door__under" d="M727 885L873 885" stroke="#e3c47e" stroke-width="2" opacity=".6"/></g>
    <g class="door__lantern">
      <path d="M905 640L905 676" stroke="#594c32" stroke-width="1.4"/>
      <circle cx="905" cy="690" r="34" fill="url(#lantern)" class="door__lantern-glow"/>
      <rect x="898" y="676" width="14" height="20" rx="3" fill="#241c12" stroke="#806b42" stroke-width="1"/>
      <circle cx="905" cy="686" r="3" fill="#f0d99a"/>
    </g>`;
  // Raíces que trepan por el arco
  const roots = s('g', { class: 'door__roots' });
  roots.append(
    createBranch({ x: 692, y: 892, angle: -84, length: 230, width: 9, depth: 3, curl: 0.6, leaves: 0.45, bark: '#121510', seed: 811, spread: [20, 40], sway: 0.3 }),
    createBranch({ x: 908, y: 892, angle: -98, length: 200, width: 8, depth: 3, curl: 0.6, leaves: 0.45, bark: '#121510', seed: 922, spread: [20, 40], sway: 0.3 }),
    createBranch({ x: 760, y: 600, angle: 160, length: 120, width: 4, depth: 3, leaves: 0.8, bark: '#121510', seed: 933, sway: 1 }),
  );
  svg.append(roots);
  return svg;
}

function buildGround(peekerCreature, onPeek) {
  const r = rng(303);
  const svg = svgRoot(VB, { preserveAspectRatio: 'xMidYMax slice' });
  const defs = s('defs');
  const glows = ['#7fbfa8', '#9cc79a', '#86c6c0'];
  glows.forEach((c, i) => defs.append(radial(`sh${i}`, [[0, c, 0.28], [1, c, 0]])));
  const clip = s('clipPath', { id: 'peek-clip' });
  clip.append(s('rect', { x: 0, y: 0, width: 1600, height: 905 }));
  defs.append(clip);
  svg.append(defs);

  // Criatura escondida detrás del arbusto (se dibuja antes que el arbusto)
  const peekWrap = s('g', { 'clip-path': 'url(#peek-clip)' });
  const peekBody = s('g', { class: 'peeker' });
  peekBody.innerHTML = `<g transform="translate(560 790) scale(.55)">${creatureMarkup(peekerCreature)}</g>`;
  peekWrap.append(peekBody);
  svg.append(peekWrap);

  svg.append(s('path', {
    d: 'M0 1000L0 884C200 862 400 902 600 878C700 868 760 886 800 884C860 880 1000 864 1200 886C1400 906 1500 872 1600 882L1600 1000Z',
    fill: '#0a0c09',
  }));
  svg.append(s('path', { d: 'M0 884C200 862 400 902 600 878C700 868 760 886 800 884C860 880 1000 864 1200 886C1400 906 1500 872 1600 882', stroke: '#1b241a', 'stroke-width': 3, fill: 'none', opacity: 0.8 }));
  svg.append(s('path', { d: 'M690 1000C740 950 780 905 788 886L812 886C822 905 862 950 912 1000Z', fill: '#11150e' }));
  [[760, 950, 30], [840, 978, 38], [800, 918, 20]].forEach(([x, y, w]) => svg.append(s('ellipse', { cx: x, cy: y, rx: w, ry: w * 0.28, fill: '#1a1d15' })));

  // Helechos
  [[90, 990, -70], [300, 960, -110], [470, 975, -65], [1120, 965, -112], [1330, 985, -70], [1530, 990, -115], [690, 900, -100], [935, 896, -78]]
    .forEach(([x, y, a], i) => svg.append(fern(r, x, y, a, r.range(90, 150), 600 + i * 19)));

  // Hongos bioluminiscentes
  const shrooms = [[240, 900, 5, 0], [520, 905, 4, 1], [905, 896, 3, 2], [1100, 902, 5, 0], [1390, 904, 4, 1], [690, 902, 3, 1]];
  shrooms.forEach(([x, y, n, c]) => svg.append(mushrooms(r, x, y, n, glows[c], `sh${c}`)));

  // Arbusto: ojos que brillan de vez en cuando
  const bush = s('g', { class: 'bush', 'data-cursor': 'branch' });
  bush.append(s('g', { class: 'bush__eyes' }));
  bush.lastChild.innerHTML = `<circle cx="630" cy="878" r="2" fill="${peekerCreature.glow}"/><circle cx="646" cy="878" r="2" fill="${peekerCreature.glow}"/>`;
  const leaves = s('g', { class: 'bush__leaves' });
  for (let i = 0; i < 70; i++) {
    const a = r.range(-175, -5), len = r.range(26, 44);
    const bx = 640 + r.range(-40, 40), by = 906 + r.range(-6, 4);
    const wrap = s('g', { transform: `translate(${fmt(bx)} ${fmt(by)}) rotate(${fmt(a)})` });
    wrap.append(s('path', { d: leafPath(len, len * 0.42), fill: r.pick(['#121a12', '#162016', '#1b261a', '#0f160f']), class: 'leaf', 'data-cursor': 'leaf' }));
    leaves.append(wrap);
  }
  bush.append(leaves);
  svg.append(bush);
  createInteractiveObject(bush, { onNear: onPeek, onActivate: onPeek, label: 'Arbusto' });

  return { svg, peekBody, bush };
}

function buildNear(side, k = 1) {
  const svg = svgRoot(VB, { preserveAspectRatio: `${side === 'l' ? 'xMin' : 'xMax'}YMax slice` });
  const dir = side === 'l' ? 1 : -1;
  const x0 = side === 'l' ? -60 : 1660;
  const dark = { bark: '#050605', leafColors: ['#060806', '#080a07', '#0a0d09'], moss: 0 };
  const deg = (a) => (side === 'l' ? a : 180 - a);
  svg.append(
    createBranch({ ...dark, x: x0, y: 200, angle: deg(18), length: 520 * k, width: 34 * k, depth: 4, leaves: 0.7, leafScale: 2.6, seed: side === 'l' ? 1 : 2, sway: 0.5 }),
    createBranch({ ...dark, x: x0, y: 640, angle: deg(-12), length: 420 * k, width: 26 * k, depth: 4, leaves: 0.8, leafScale: 2.8, seed: side === 'l' ? 3 : 4, sway: 0.7 }),
    createBranch({ ...dark, x: x0 + dir * 120, y: 1040, angle: deg(-62), length: 380 * k, width: 6, depth: 3, leaves: 1.2, leafScale: 3, seed: side === 'l' ? 5 : 6, sway: 1.4, spread: [30, 60] }),
  );
  return svg;
}

/* ---------- Ensamblado ---------- */

export function createForest({ content, particles, audio, secrets }) {
  const place = content.places.find((p) => p.type === 'forest') || content.places[0];
  const peekerCreature = content.creatures.find((c) => c.id === place.peeker) || content.creatures.find((c) => c.form === 'spirit') || content.creatures[0];

  const section = h('section', { class: 'place place--forest', id: place.id, 'data-place': place.id, 'aria-label': place.name });
  const stage = h('div', { class: 'forest' });
  section.append(stage);

  const layer = (depth, svg, extra = '') => {
    const px = h('div', { class: 'forest__px' }, [svg]);
    const l = h('div', { class: `forest__layer forest__layer--${depth} ${extra}`, 'data-depth': depth }, [px]);
    stage.append(l);
    return l;
  };

  stage.append(h('div', { class: 'forest__sky' }));
  const far = layer('far', buildFar());
  stage.append(h('div', { class: 'fog fog--back' }), h('div', { class: 'forest__shafts' }, [h('i'), h('i'), h('i')]));
  stage.append(h('div', { class: 'forest__shadow' }));
  const mid = layer('mid', buildMid(() => {
    section.querySelector('.sigil').classList.add('is-lit');
    secrets.find('sigil');
  }));
  const doorSvg = buildDoor(place);
  const door = layer('door', doorSvg);

  let peekBusy = false;
  const ground = buildGround(peekerCreature, () => {
    if (peekBusy) return;
    peekBusy = true;
    ground.peekBody.classList.add('is-up');
    ground.bush.querySelectorAll('.leaf').forEach((l, i) => { if (i % 3 === 0) { l.classList.add('is-rustling'); l.style.setProperty('--rx', `${(i % 2 ? 1 : -1) * 18}deg`); l.addEventListener('animationend', () => l.classList.remove('is-rustling'), { once: true }); } });
    audio.play('rustle', 0.14);
    setTimeout(() => audio.play('breath', 0.07), 400);
    setTimeout(() => ground.peekBody.classList.remove('is-up'), 2600);
    setTimeout(() => { peekBusy = false; }, 4600);
  });
  const groundLayer = layer('ground', ground.svg);
  stage.append(h('div', { class: 'fog fog--front' }));
  const nearL = layer('near', buildNear('l', env.mobile ? 0.55 : 1), 'forest__near--l');
  const nearR = layer('near', buildNear('r', env.mobile ? 0.55 : 1), 'forest__near--r');

  const title = h('header', { class: 'forest__title' });
  title.innerHTML = `<span class="kicker">${esc(place.numeral)}</span><h1>${esc(place.name)}</h1><p>${esc(place.subtitle || '')}</p>`;
  const hint = h('div', { class: 'forest__hint' }, [h('span', { text: place.hint || content.ui.scrollHint }), h('i')]);
  const flood = h('div', { class: 'forest__flood' });
  const interior = h('div', { class: 'forest__interior' });
  stage.append(title, hint, flood, interior);

  bindLeafRustle(stage, () => audio.play('rustle', 0.04));

  // Hongos: al tocarlos sueltan esporas
  stage.querySelectorAll('.shroom').forEach((g) => {
    const puff = () => {
      const b = g.getBoundingClientRect();
      particles.emit(b.left + b.width / 2, b.top + b.height * 0.6, { count: 8, glow: true, size: 1.1, color: getComputedStyle(g).getPropertyValue('--glow').trim() || '#7fbfa8', life: 90, lift: 0.35, speed: 0.5, alpha: 0.6 });
      audio.play('drop', 0.05);
    };
    createInteractiveObject(g, { onNear: puff, onActivate: puff });
  });

  /* Punto de la puerta en coordenadas de pantalla (para orígenes y la luz) */
  function viewPoint(vx, vy) {
    const W = stage.clientWidth, H = stage.clientHeight;
    const sc = Math.max(W / 1600, H / 1000);
    return { x: (W - 1600 * sc) / 2 + vx * sc, y: H - 1000 * sc + vy * sc };
  }

  function setOrigins() {
    const p = viewPoint(DOOR.x, DOOR.y);
    if (window.gsap) gsap.set([far, mid, door, groundLayer, nearL, nearR], { transformOrigin: `${p.x}px ${p.y}px` });
    stage.style.setProperty('--ox', `${p.x}px`);
    stage.style.setProperty('--oy', `${p.y}px`);
  }
  setOrigins();
  addEventListener('resize', setOrigins);

  // La luz que huye
  createWisp(stage, {
    home: () => viewPoint(env.mobile ? 900 : 960, 800),
    target: () => viewPoint(810, 794),
    particles, audio,
    onCaught: () => secrets.find('wisp'),
  });

  // Parallax con el puntero (escritorio) o deriva lenta (táctil)
  const pxEls = [[far, 8], [mid, 16], [door, 16], [groundLayer, 22], [nearL, 46], [nearR, 46]].map(([l, d]) => [l.querySelector('.forest__px'), d]);
  if (window.gsap && !env.reduced) {
    if (!env.touch) {
      const movers = pxEls.map(([el, d]) => ({ x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power3' }), d }));
      addEventListener('pointermove', () => {
        const nx = pointer.x / innerWidth - 0.5, ny = pointer.y / innerHeight - 0.5;
        movers.forEach((m) => { m.x(-nx * m.d * 2); m.y(-ny * m.d); });
      }, { passive: true });
    } else {
      pxEls.forEach(([el, d], i) => gsap.to(el, { x: d * 0.6, y: d * 0.25, duration: 7 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
    }
  }

  // Click en la puerta: avanza hasta cruzarla
  let trigger = null;
  const doorHit = doorSvg.querySelector('.door__inner');
  doorSvg.querySelectorAll('.door__leaf, .door__inner').forEach((el) => {
    el.setAttribute('data-cursor', 'link');
    el.setAttribute('data-cursor-label', place.doorInscription || '');
  });
  doorSvg.addEventListener('click', (e) => {
    if (!e.target.closest('.door__leaf, .door__inner') || !trigger) return;
    audio.play('wood', 0.2);
    window.__lenis ? window.__lenis.scrollTo(trigger.end + 2, { duration: 3.2 }) : scrollTo({ top: trigger.end + 2, behavior: 'smooth' });
  });

  /* Recorrido por scroll: nos acercamos, la puerta se abre y entramos. */
  function buildTimeline() {
    if (!window.gsap || !window.ScrollTrigger) return null;
    const leafL = doorSvg.querySelector('.door__leaf--l');
    const leafR = doorSvg.querySelector('.door__leaf--r');
    const inscription = doorSvg.querySelector('.door__inscription');
    const fogFront = stage.querySelector('.fog--front');
    const len = () => innerHeight * (env.mobile ? 3 : 4);
    setOrigins();
    ScrollTrigger.addEventListener('refreshInit', setOrigins);

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${len()}`,
        pin: true,
        scrub: env.reduced ? true : 1,
        invalidateOnRefresh: true,
        onUpdate(self) {
          const p = self.progress;
          const rush = p > 0.7 && p < 0.97 ? Math.sin(((p - 0.7) / 0.27) * Math.PI) : 0;
          particles.rush(env.reduced ? 0 : rush * 0.75);
          particles.light(clamp((p - 0.55) * 3));
          document.documentElement.classList.toggle('is-interior', p > 0.94);
        },
        onLeave() { particles.rush(0); },
      },
    });
    trigger = tl.scrollTrigger;

    tl.to(title, { opacity: 0, y: -40, duration: 0.08 }, 0)
      .to(hint, { opacity: 0, duration: 0.05 }, 0)
      .to(far, { scale: 1.3, duration: 0.75 }, 0)
      .to(mid, { scale: 2.1, duration: 0.75 }, 0)
      .to(door, { scale: env.mobile ? 1.7 : 2.3, duration: 0.62, ease: 'power1.in' }, 0)
      .to(groundLayer, { scale: 2.5, duration: 0.75 }, 0)
      .to(nearL, { xPercent: -75, scale: 1.9, duration: 0.5, ease: 'power1.in' }, 0)
      .to(nearR, { xPercent: 75, scale: 1.9, duration: 0.5, ease: 'power1.in' }, 0)
      .fromTo(fogFront, { opacity: 0.3 }, { opacity: 0.95, duration: 0.3 }, 0.12)
      .to(fogFront, { opacity: 0.15, duration: 0.2 }, 0.45)
      .fromTo(inscription, { opacity: 0 }, { opacity: 0.85, duration: 0.12 }, 0.32)
      .to(inscription, { opacity: 0, duration: 0.06 }, 0.62)
      .to(leafL, { scaleX: 0.05, skewY: -4, transformOrigin: 'left center', duration: 0.15, ease: 'power2.inOut' }, 0.6)
      .to(leafR, { scaleX: 0.05, skewY: 4, transformOrigin: 'right center', duration: 0.15, ease: 'power2.inOut' }, 0.6)
      .to(doorSvg.querySelector('.door__light'), { opacity: 0, duration: 0.08 }, 0.6)
      .to(flood, { opacity: 1, duration: 0.16 }, 0.66)
      .to(door, { scale: 18, duration: 0.25, ease: 'power2.in' }, 0.75)
      .to([far, mid, groundLayer], { scale: '+=2.5', opacity: 0, duration: 0.25, ease: 'power2.in' }, 0.75)
      .to(interior, { opacity: 1, duration: 0.08 }, 0.92);
    return tl;
  }

  return { el: section, buildTimeline, get trigger() { return trigger; } };
}
