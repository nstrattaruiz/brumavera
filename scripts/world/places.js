/* Lugares interiores. Cada tipo de lugar (type en el contenido) tiene una forma propia,
   pero todos comparten raíces, luz, materiales y tipografía. */

import { h, esc, svgRoot, rng, env, s, fmt } from '../core/utils.js';
import { createBranch, createRoots } from '../../components/branch.js';
import { createProduct, formatPrice } from '../../components/product.js';
import { createCreature, watchCursor } from '../../components/creature.js';
import { createLoreSection, createPlaceHeader, createSideRoots, splitWords } from '../../components/lore.js';
import { createInteractiveObject } from '../../components/interactive.js';
import { store } from '../core/store.js';

/* Tono de luz por tipo de lugar (presentación, no contenido) */
export const TONES = {
  forest: '#0b0d0a', lore: '#16120b', shelf: '#120f0a', market: '#15120c',
  cabinet: '#100d09', book: '#13110c', letter: '#0f0d09',
};

const visibleCreatures = (content, secrets) => content.creatures.filter((c) => !c.hidden || secrets.unlocked);

function section(place, extra = '') {
  return h('section', { class: `place place--${place.type} ${extra}`, id: place.id, 'data-place': place.id, 'aria-label': place.name });
}

/* ---------- EL REFUGIO: estantería que se recorre en horizontal ---------- */

function createShelf(place, content, deps) {
  const el = section(place);
  const creatures = content.creatures.filter((c) => !c.hidden);
  const viewport = h('div', { class: 'shelf__viewport' });
  const track = h('div', { class: 'shelf__track' });
  viewport.append(track);

  const introPanel = h('div', { class: 'shelf__intro' }, [createPlaceHeader(place), h('p', { class: 'shelf__desc', text: content.world.description }), h('p', { class: 'shelf__swipe', text: env.touch ? `${content.ui.swipe} →` : '' })]);
  track.append(introPanel);

  const r = rng(55);
  creatures.forEach((c, i) => {
    const niche = h('div', { class: 'niche', style: `--i:${i}` });
    niche.append(h('div', { class: 'niche__arch' }), createProduct(c, { ...deps, content, variant: 'shelf' }), h('div', { class: 'niche__plank' }));
    track.append(niche);
    if (i < creatures.length - 1) {
      const orn = h('div', { class: 'shelf__ornament', 'aria-hidden': 'true' });
      if (i % 2 === 0) {
        orn.classList.add('shelf__ornament--candle');
        orn.innerHTML = '<span class="candle"><i class="candle__flame"></i></span>';
        createInteractiveObject(orn.firstChild, { onNear: () => orn.classList.add('is-flicker'), onFar: () => orn.classList.remove('is-flicker') });
      } else {
        orn.classList.add('shelf__ornament--herbs');
        const svg = svgRoot('0 0 120 260');
        svg.append(s('path', { d: 'M60 0L60 22', stroke: '#594c32', 'stroke-width': 1.2 }));
        for (let k = 0; k < 3; k++) svg.append(createBranch({ x: 60, y: 20, angle: 90 + (k - 1) * 14 + r.range(-4, 4), length: r.range(120, 170), width: 2.4, depth: 3, leaves: 1.1, bark: '#594c32', leafColors: ['#4a4630', '#3f3d2a', '#594c32'], seed: i * 9 + k, sway: 2 }));
        orn.append(svg);
      }
      track.append(orn);
    }
  });

  // Una sombra que pasa una sola vez (secreto)
  const shadow = h('div', { class: 'shelf__shadow', 'data-cursor': 'creature', 'aria-hidden': 'true' });
  track.append(shadow);
  shadow.addEventListener('pointerdown', () => { if (deps.secrets.find('shadow')) shadow.classList.add('is-seen'); });
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !store.hasSecret('shadow')) {
      io.disconnect();
      setTimeout(() => { shadow.classList.add('is-passing'); deps.audio.play('breath', 0.05); }, 3500);
    }
  }, { threshold: 0.5 });
  io.observe(viewport);

  // Raíz continua que atraviesa todos los nichos
  const roots = svgRoot('0 0 3000 200', { preserveAspectRatio: 'none', class: 'shelf__roots' });
  roots.append(createBranch({ x: -20, y: 120, angle: 0, length: 1600, width: 10, depth: 4, curl: 0.15, leaves: 0.1, moss: 0.6, bark: '#1c160e', bias: { angle: 0, strength: 0.6 }, spread: [10, 30], seed: 4242, sway: 0 }));
  roots.append(createBranch({ x: 1500, y: 140, angle: -2, length: 1600, width: 8, depth: 4, curl: 0.15, leaves: 0.1, moss: 0.6, bark: '#1c160e', bias: { angle: 0, strength: 0.6 }, spread: [10, 30], seed: 4343, sway: 0 }));
  track.prepend(roots);

  const end = h('div', { class: 'shelf__end' }, [h('p', { text: content.world.closingLine })]);
  track.append(end);
  el.append(viewport);

  el.setupScroll = () => {
    if (!window.gsap || !window.ScrollTrigger || env.touch || env.mobile) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 761px) and (hover: hover)', () => {
      const dist = () => track.scrollWidth - innerWidth;
      const branches = roots.querySelectorAll('.branch');
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: el, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: (self) => branches.forEach((b, i) => b.style.setProperty('--p', Math.min(1, self.progress * 1.6 - i * 0.3 + 0.3))),
        },
      });
      branches.forEach((b) => b.style.setProperty('--p', 0.3));
    });
  };
  return el;
}

/* ---------- EL MERCADO: objetos sobre una mesa, unidos por raíces ---------- */

function createMarket(place, content, deps) {
  const el = section(place);
  el.append(createPlaceHeader(place));
  const tags = h('div', { class: 'market__tags', role: 'toolbar' });
  const table = h('div', { class: 'market__table' });
  const rootsSvg = svgRoot('0 0 100 100', { class: 'market__roots', preserveAspectRatio: 'none' });
  table.append(rootsSvg);

  const cats = [{ id: '*', name: content.ui.all }, ...content.categories];
  let active = '*';
  cats.forEach((c, i) => {
    const b = h('button', { class: 'tag', type: 'button', 'data-cursor': 'link', 'aria-pressed': String(c.id === active), style: `--i:${i}` }, [h('span', { text: c.name })]);
    b.addEventListener('click', () => {
      active = c.id;
      tags.querySelectorAll('.tag').forEach((t) => t.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      deps.audio.play('wood', 0.08);
      filter();
    });
    tags.append(b);
  });

  const items = [];
  function add(c, isNew = false) {
    const p = createProduct(c, { ...deps, content, variant: 'table' });
    p.style.setProperty('--tilt', `${fmt((items.length % 3 - 1) * 1.6)}deg`);
    if (isNew) p.classList.add('is-new');
    table.append(p);
    items.push(p);
  }
  visibleCreatures(content, deps.secrets).forEach((c) => add(c));
  document.addEventListener('world:unlock', () => {
    content.creatures.filter((c) => c.hidden && !items.some((i) => i.dataset.id === c.id)).forEach((c) => add(c, true));
    filter();
  });

  function filter() {
    items.forEach((p) => p.classList.toggle('is-away', active !== '*' && p.dataset.category !== active));
    requestAnimationFrame(drawRoots);
  }

  // Raíces que conectan los objetos visibles, en orden
  function drawRoots() {
    const tb = table.getBoundingClientRect();
    if (!tb.width) return;
    rootsSvg.setAttribute('viewBox', `0 0 ${fmt(tb.width)} ${fmt(tb.height)}`);
    rootsSvg.innerHTML = '';
    const pts = items.filter((p) => !p.classList.contains('is-away')).map((p) => {
      const b = p.querySelector('.object__art').getBoundingClientRect();
      return [b.left - tb.left + b.width / 2, b.top - tb.top + b.height * 0.92, b.top - tb.top + b.height * 0.2];
    });
    const r = rng(9);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, , y2top] = pts[i + 1];
      const y2 = y2top + (pts[i + 1][1] - y2top);
      const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + 40 + r.range(0, 40);
      const d = `M${fmt(x1)} ${fmt(y1)}C${fmt(x1 + r.range(-40, 40))} ${fmt(my)} ${fmt(x2 + r.range(-40, 40))} ${fmt(my)} ${fmt(x2)} ${fmt(y2)}`;
      rootsSvg.append(s('path', { d, class: 'market__root', pathLength: 1, style: `--i:${i}` }));
      rootsSvg.append(s('path', { d: `M${fmt(mx)} ${fmt(my - 6)}c${fmt(r.range(-20, 20))} 14 ${fmt(r.range(-30, 30))} 22 ${fmt(r.range(-30, 30))} 34`, class: 'market__root market__root--thin', pathLength: 1, style: `--i:${i}` }));
    }
  }
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawRoots, 200); });
  new IntersectionObserver(([e]) => { if (e.isIntersecting) { drawRoots(); table.classList.add('is-rooted'); } }, { threshold: 0.15 }).observe(table);
  el.addEventListener('load', drawRoots, true);

  el.append(tags, table);
  return el;
}

/* ---------- EL GABINETE: cajones que guardan lo adoptado ---------- */

function createCabinet(place, content, deps) {
  const el = section(place);
  const ui = content.ui;
  el.append(createPlaceHeader(place));
  const intro = h('p', { class: 'cabinet__intro', 'data-reveal': '' });
  const cabinet = h('div', { class: 'cabinet' });
  const findings = h('div', { class: 'cabinet__findings', 'data-reveal': '' });
  el.append(intro, cabinet, findings);
  const DRAWERS = 8;

  function render() {
    const adopted = store.state.collection.map((id) => content.creatures.find((c) => c.id === id)).filter(Boolean);
    intro.textContent = adopted.length ? ui.collectionTitle : ui.collectionEmpty;
    cabinet.innerHTML = '';
    const count = Math.max(DRAWERS, Math.ceil(adopted.length / 4) * 4);
    for (let i = 0; i < count; i++) {
      const c = adopted[i];
      const drawer = h('div', { class: `drawer ${c ? 'is-full' : 'is-empty'}` });
      const front = h('button', { class: 'drawer__front', type: 'button', 'data-cursor': 'object', 'aria-expanded': 'false' }, [
        h('span', { class: 'drawer__label', text: c ? `${c.number} · ${c.name}` : ui.emptyDrawer }),
        h('i', { class: 'drawer__handle' }),
      ]);
      const tray = h('div', { class: 'drawer__tray' });
      if (c) {
        const art = createCreature(c, { className: 'drawer__creature' });
        art.setAttribute('data-cursor', 'creature');
        art.addEventListener('click', () => deps.onOpen(c));
        watchCursor(art.querySelector('.creature'));
        const rel = h('button', { class: 'drawer__release', type: 'button', 'data-cursor': 'link', text: ui.release });
        rel.addEventListener('click', () => { deps.audio.play('rustle', 0.1); store.release(c.id); });
        tray.append(art, rel);
        tray.style.setProperty('--glow', c.glow);
      } else {
        tray.append(h('span', { class: 'drawer__dust' }));
      }
      front.addEventListener('click', () => {
        const open = drawer.classList.toggle('is-open');
        front.setAttribute('aria-expanded', String(open));
        deps.audio.play('wood', 0.16);
        if (open && !c) {
          const b = front.getBoundingClientRect();
          deps.particles.emit(b.left + b.width / 2, b.top + b.height / 2, { count: 10, spread: b.width * 0.6, size: 1, color: '#b39a63', life: 70, alpha: 0.5 });
        }
      });
      drawer.append(tray, front);
      cabinet.append(drawer);
    }

    const sec = deps.secrets;
    findings.innerHTML = `<span class="cabinet__count">${esc(ui.findings)} · ${sec.count} / ${sec.total}</span>
      <ul>${sec.items.map((it) => `<li class="${sec.has(it.id) ? 'is-found' : ''}" title="${sec.has(it.id) ? esc(it.message) : ''}">${sec.has(it.id) ? esc(it.mark) : '·'}</li>`).join('')}</ul>`;
  }
  render();
  store.subscribe(render);
  return el;
}

/* ---------- EL ARCHIVO: un libro que se hojea ---------- */

function createBook(place, content, deps) {
  const el = section(place);
  const { world, archive, ui } = content;
  el.append(createPlaceHeader(place));
  el.append(h('p', { class: 'book__intro', 'data-words': '', html: splitWords(world.description) }));

  const pages = [...archive.pages];
  if (pages.length % 2) pages.push({ title: '', text: world.closingLine, coda: true });
  const pageHTML = (p, n) => `<div class="page__inner ${p.coda ? 'page__inner--coda' : ''}">
      ${p.title ? `<h3>${esc(p.title)}</h3>` : ''}<p>${esc(p.text)}</p><span class="page__num">${n}</span></div>`;

  // Escritorio: doble página con hojas que giran
  const book = h('div', { class: 'book', 'data-cursor': 'object', 'data-cursor-label': ui.turnPage });
  const left = h('div', { class: 'book__left' });
  left.innerHTML = `<div class="page__inner page__inner--cover"><span class="kicker">${esc(place.numeral)}</span><h3>${esc(world.name)}</h3><p><em>${esc(world.mythology)}</em></p></div>`;
  const stack = h('div', { class: 'book__stack' });
  const leaves = [];
  for (let i = 0; i < pages.length; i += 2) {
    const leaf = h('div', { class: 'leaf-page' });
    leaf.innerHTML = `<div class="leaf-page__face leaf-page__front">${pageHTML(pages[i], i + 1)}</div><div class="leaf-page__face leaf-page__back">${pageHTML(pages[i + 1], i + 2)}</div>`;
    stack.append(leaf);
    leaves.push(leaf);
  }
  let flipped = 0;
  const sync = () => leaves.forEach((l, i) => {
    l.classList.toggle('is-flipped', i < flipped);
    l.style.zIndex = i < flipped ? i + 1 : leaves.length - i;
  });
  sync();
  stack.addEventListener('click', (e) => {
    const leaf = e.target.closest('.leaf-page');
    if (!leaf) return;
    const idx = leaves.indexOf(leaf);
    flipped = idx < flipped ? idx : idx + 1;
    deps.audio.play('rustle', 0.12);
    sync();
  });
  left.addEventListener('click', () => { if (flipped > 0) { flipped--; deps.audio.play('rustle', 0.12); sync(); } });
  book.append(left, stack, h('span', { class: 'book__spine' }));

  // Móvil: páginas que se deslizan
  const swipe = h('div', { class: 'book-swipe' });
  [{ title: world.name, text: world.mythology }, ...pages].forEach((p, i) => {
    swipe.append(h('div', { class: 'book-swipe__page', html: pageHTML(p, i || '') }));
  });

  el.append(book, swipe, h('p', { class: 'book__hint', text: env.touch ? `${ui.swipe} →` : ui.turnPage }));
  return el;
}

/* ---------- LA ESTAFETA: una carta para el bosque ---------- */

function createLetter(place, content, deps) {
  const el = section(place);
  const { contact, ui } = content;
  el.append(createPlaceHeader(place));
  const form = h('form', { class: 'letter', 'data-reveal': '', novalidate: true });
  form.innerHTML = `
    <p class="letter__lead">${esc(contact.lead)}</p>
    <label><span>${esc(contact.fields.name)}</span><input name="name" required autocomplete="name"></label>
    <label><span>${esc(contact.fields.email)}</span><input name="email" type="email" required autocomplete="email"></label>
    <label><span>${esc(contact.fields.message)}</span><textarea name="message" rows="5" required></textarea></label>
    <div class="letter__foot">
      <button class="seal-btn" type="submit" data-cursor="link">${esc(ui.send)}</button>
      <span class="letter__seal" aria-hidden="true"><svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="24"/><path d="M30 16L30 44M20 24L40 36M40 24L20 36"/></svg></span>
    </div>
    <p class="letter__sent" role="status"></p>`;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!form.checkValidity()) {
      form.classList.remove('is-invalid');
      void form.offsetWidth;
      form.classList.add('is-invalid');
      form.querySelector(':invalid')?.focus();
      return;
    }
    form.classList.add('is-sealed');
    deps.audio.play('wood', 0.2);
    form.querySelector('.letter__sent').textContent = ui.sent;
    const body = `${data.message}\n\n— ${data.name} (${data.email})`;
    setTimeout(() => {
      location.href = `mailto:${contact.email}?subject=${encodeURIComponent(contact.subject)}&body=${encodeURIComponent(body)}`;
    }, 1400);
  });
  el.append(form);
  return el;
}

/* ---------- Pie: el bosque sigue ahí ---------- */

export function createFooter(content, onBack) {
  const f = h('footer', { class: 'world-foot' });
  f.append(createRoots({ seed: 77, count: 4, height: 180, leaves: 0.3 }));
  const back = h('button', { class: 'world-foot__back', type: 'button', 'data-cursor': 'link' }, [h('span', { text: content.ui.back }), h('i')]);
  back.addEventListener('click', onBack);
  f.append(
    h('p', { class: 'world-foot__line', text: content.world.closingLine }),
    back,
    h('p', { class: 'world-foot__name', text: `${content.world.name} — ${content.world.epithet}` }),
  );
  return f;
}

/* ---------- Ensamblado ---------- */

const BUILDERS = {
  lore: (p, c, d) => createLoreSection(p, c, d),
  shelf: createShelf,
  market: createMarket,
  cabinet: createCabinet,
  book: createBook,
  letter: createLetter,
};

export function createPlaces(content, deps) {
  return content.places
    .filter((p) => p.type !== 'forest' && BUILDERS[p.type])
    .map((p, i) => {
      const el = BUILDERS[p.type](p, content, deps);
      el.dataset.tone = TONES[p.type] || TONES.lore;
      if (i > 0) {
        const divider = createRoots({ seed: 100 + i * 7, count: 3, grown: false });
        divider.classList.add('place__divider');
        el.prepend(divider);
      }
      return el;
    });
}
