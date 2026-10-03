/* Secciones de relato: texto que aparece palabra por palabra mientras raíces
   bajan por los costados. Todo el texto proviene del contenido. */

import { h, esc, svgRoot, rng } from '../scripts/core/utils.js';
import { createBranch } from './branch.js';

/** Envuelve cada palabra en un <span> para revelarlas con el scroll. */
export function splitWords(text) {
  return esc(text).split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
}

export function createPlaceHeader(place) {
  const head = h('header', { class: 'place__head', 'data-reveal': '' });
  head.innerHTML = `
    <span class="kicker">${esc(place.numeral || '')}</span>
    <h2>${esc(place.name)}</h2>
    ${place.subtitle ? `<p>${esc(place.subtitle)}</p>` : ''}
    <svg class="place__twig" viewBox="0 0 240 24" aria-hidden="true"><path d="M2 14C40 8 80 18 120 12S200 6 238 12" fill="none" stroke="currentColor" stroke-width="1.2" pathLength="1"/><path d="M120 12c4-6 10-8 16-8M80 14c-2 5-6 8-11 9M170 9c3 4 8 6 13 6" fill="none" stroke="currentColor" stroke-width=".9" pathLength="1"/></svg>`;
  return head;
}

/** Raíces verticales que descienden por un costado de una sección. */
export function createSideRoots(side = 'l', seed = 1, count = 5) {
  const svg = svgRoot('0 0 300 1600', { preserveAspectRatio: `${side === 'l' ? 'xMin' : 'xMax'}YMin slice`, class: `side-roots side-roots--${side}` });
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const y = (i / count) * 1600 - 40;
    svg.append(createBranch({
      x: side === 'l' ? -10 : 310, y,
      angle: side === 'l' ? r.range(35, 70) : r.range(110, 145),
      length: r.range(260, 360), width: r.range(7, 12), depth: 4, curl: 0.4,
      leaves: 0.25, moss: 0.5, bias: { angle: 90, strength: 0.25 }, seed: seed * 10 + i,
      bark: '#18140d', leafColors: ['#1f2b1f', '#243226'], grown: false, sway: 0,
    }));
  }
  return svg;
}

/**
 * Sección de lore.
 * @param {object} place     datos del lugar
 * @param {object} content   contenido completo
 * @param {object} deps      { secrets, audio, particles }
 */
export function createLoreSection(place, content, { secrets, audio, particles }) {
  const { world, lore } = content;
  const el = h('section', { class: 'place place--lore', id: place.id, 'data-place': place.id, 'aria-label': place.name });
  el.append(createSideRoots('l', 3, 6), createSideRoots('r', 8, 6));
  el.append(createPlaceHeader(place));

  const lead = h('p', { class: 'lore__lead', 'data-words': '', html: splitWords(world.introduction) });
  const chapters = h('div', { class: 'lore__chapters' });
  lore.chapters.forEach((c, i) => {
    chapters.append(h('article', { class: 'chapter', 'data-reveal': '' }, [
      h('span', { class: 'chapter__num', text: String(i + 1).padStart(2, '0') }),
      h('h3', { text: c.title }),
      h('p', { 'data-words': '', html: splitWords(c.text) }),
    ]));
  });
  const myth = h('p', { class: 'lore__myth', 'data-reveal': '', html: `<em>${esc(world.mythology)}</em>` });

  // Una ramita que, tocada tres veces, suelta una hoja (secreto)
  const twig = h('button', { class: 'lore__twig', 'data-cursor': 'branch', 'aria-label': '…', type: 'button' });
  const twigSvg = svgRoot('0 0 160 220');
  twigSvg.append(createBranch({ x: 80, y: -6, angle: 92, length: 150, width: 5, depth: 3, leaves: 1.2, leafScale: 1.3, bark: '#2a2418', leafColors: ['#34432f', '#2b3a2a', '#594c32'], seed: 1234, sway: 2.5 }));
  twig.append(twigSvg, h('span', { class: 'lore__fallen' }));
  let taps = 0;
  twig.addEventListener('click', () => {
    taps++;
    twig.classList.remove('is-shaken');
    void twig.offsetWidth;
    twig.classList.add('is-shaken');
    audio.play('rustle', 0.1);
    if (taps === 3) {
      twig.classList.add('is-dropped');
      const b = twig.getBoundingClientRect();
      particles.emit(b.left + b.width / 2, b.bottom - 30, { count: 6, size: 1, life: 80, color: '#b39a63', alpha: 0.6 });
      setTimeout(() => secrets.find('branch'), 1100);
    }
  });

  el.append(lead, twig, chapters, myth);
  return el;
}
