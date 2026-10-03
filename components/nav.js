/* Navegación discreta: nombre del mundo, sonido, mapa de raíces y lugar actual.
   Viajar entre lugares se siente como atravesar ramas, no como un salto de página. */

import { h, esc, svgRoot, env, wait, s, fmt } from '../scripts/core/utils.js';
import { createBranch, growBranches } from './branch.js';
import { store } from '../scripts/core/store.js';

export function createNav({ content, audio, particles, goTo }) {
  const ui = content.ui;
  const places = content.places;

  /* Barra superior mínima */
  const brand = h('button', { class: 'nav__brand', type: 'button', 'data-cursor': 'link' }, [h('span', { text: content.world.name })]);
  const sound = h('button', { class: 'nav__sound', type: 'button', 'data-cursor': 'link', 'aria-label': ui.soundOn });
  const mapBtn = h('button', { class: 'nav__map', type: 'button', 'data-cursor': 'link', 'aria-expanded': 'false' }, [
    h('span', { text: ui.map }),
    h('i', { class: 'nav__sigil', html: '<svg viewBox="0 0 24 24"><path d="M12 2v20M5 7l14 10M19 7L5 17"/><circle cx="12" cy="12" r="3"/></svg>' }),
  ]);
  const where = h('div', { class: 'nav__where', 'aria-live': 'polite' });
  const bar = h('nav', { class: 'nav', 'aria-label': ui.map }, [brand, h('div', { class: 'nav__right' }, [sound, mapBtn]), where]);
  document.body.append(bar);

  const syncSound = () => {
    const on = audio.enabled;
    sound.innerHTML = `<i class="sound-wave ${on ? 'is-on' : ''}"><b></b><b></b><b></b></i><span>${esc(on ? ui.soundOn : ui.soundOff)}</span>`;
    sound.setAttribute('aria-pressed', String(on));
  };
  sound.addEventListener('click', () => { const on = audio.toggle(); store.setSound(on); syncSound(); });
  syncSound();

  /* Mapa: los lugares cuelgan de una raíz */
  const map = h('div', { class: 'map', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'true', 'aria-label': ui.map });
  const rootSvg = svgRoot('0 0 200 1000', { class: 'map__root', preserveAspectRatio: 'xMidYMin meet' });
  rootSvg.append(createBranch({ x: 100, y: -10, angle: 90, length: 1000, width: 9, depth: 3, curl: 0.25, leaves: 0.3, spread: [30, 60], bias: { angle: 90, strength: 0.2 }, bark: '#2a2418', seed: 88, grown: false, sway: 0 }));
  const list = h('ol', { class: 'map__list' });
  places.forEach((p, i) => {
    const li = h('li', { style: `--i:${i}` });
    const btn = h('button', { type: 'button', 'data-cursor': 'link', 'data-id': p.id }, [
      h('span', { class: 'map__num', text: p.numeral || String(i + 1) }),
      h('span', { class: 'map__name', text: p.name }),
      h('span', { class: 'map__sub', text: p.subtitle || '' }),
    ]);
    btn.addEventListener('click', () => travel(p.id));
    li.append(btn);
    list.append(li);
  });
  const close = h('button', { class: 'map__close', type: 'button', 'data-cursor': 'link' }, [h('span', { text: ui.close })]);
  const back = h('button', { class: 'map__back', type: 'button', 'data-cursor': 'link' }, [h('span', { text: ui.back })]);
  back.addEventListener('click', () => travel(places[0].id));
  map.append(h('div', { class: 'map__paper' }), rootSvg, h('p', { class: 'map__world', text: content.world.name }), list, h('div', { class: 'map__foot' }, [back, close]));
  document.body.append(map);

  let mapOpen = false;
  function openMap() {
    mapOpen = true;
    map.classList.add('is-open');
    map.setAttribute('aria-hidden', 'false');
    mapBtn.setAttribute('aria-expanded', 'true');
    window.__lenis?.stop();
    growBranches(rootSvg, { duration: env.reduced ? 0.01 : 1.8 });
    audio.play('rustle', 0.1);
    list.querySelector('button')?.focus({ preventScroll: true });
  }
  function closeMap() {
    if (!mapOpen) return;
    mapOpen = false;
    map.classList.remove('is-open');
    map.setAttribute('aria-hidden', 'true');
    mapBtn.setAttribute('aria-expanded', 'false');
    window.__lenis?.start();
  }
  mapBtn.addEventListener('click', () => (mapOpen ? closeMap() : openMap()));
  brand.addEventListener('click', openMap);
  close.addEventListener('click', closeMap);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMap(); });

  /* Paso entre lugares: dos manojos de ramas cierran la vista y vuelven a abrirse */
  const passage = h('div', { class: 'passage', 'aria-hidden': 'true' });
  ['l', 'r'].forEach((side) => {
    const svg = svgRoot('0 0 800 1000', { preserveAspectRatio: `${side === 'l' ? 'xMax' : 'xMin'}YMid slice` });
    for (let i = 0; i < 7; i++) {
      svg.append(createBranch({
        x: side === 'l' ? -30 : 830, y: i * 170 - 20, angle: side === 'l' ? (i % 2 ? 12 : -10) : (i % 2 ? 168 : 190),
        length: 760, width: 22, depth: 4, leaves: 1, leafScale: 2.6, bark: '#050605',
        leafColors: ['#070907', '#0a0d09', '#0d110c'], moss: 0, seed: 900 + i * 3 + (side === 'l' ? 0 : 50), sway: 0.5,
      }));
    }
    passage.append(h('div', { class: `passage__side passage__side--${side}` }, [svg]));
  });
  document.body.append(passage);

  async function travel(id) {
    closeMap();
    audio.play('whoosh', 0.16);
    passage.classList.add('is-closing');
    particles.rush(0.5);
    await wait(env.reduced ? 50 : 750);
    goTo(id);
    await wait(120);
    particles.rush(0);
    passage.classList.remove('is-closing');
  }

  function setPlace(id) {
    const p = places.find((x) => x.id === id);
    if (!p) return;
    where.innerHTML = `<span>${esc(p.numeral || '')}</span><b>${esc(p.name)}</b>`;
    list.querySelectorAll('button').forEach((b) => (b.dataset.id === id ? b.setAttribute('aria-current', 'location') : b.removeAttribute('aria-current')));
  }

  return { setPlace, travel, show: () => bar.classList.add('is-on'), syncSound };
}
