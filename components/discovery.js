/* Experiencia de descubrimiento: explorar una criatura y su ficha (detalle de producto).
   La criatura despierta antes de que aparezca la información. */

import { h, esc, svgRoot, env, wait } from '../scripts/core/utils.js';
import { createCreature, watchCursor } from './creature.js';
import { createBranch, growBranches, bindLeafRustle } from './branch.js';
import { formatPrice } from './product.js';
import { store } from '../scripts/core/store.js';

export function createDiscovery({ content, particles, audio, lenis }) {
  const ui = content.ui;
  const root = h('div', { class: 'discovery', role: 'dialog', 'aria-modal': 'true', 'aria-hidden': 'true', 'aria-labelledby': 'discovery-name' });
  root.innerHTML = `
    <div class="discovery__veil"></div>
    <div class="discovery__frame"></div>
    <div class="discovery__scroll">
      <div class="discovery__stage">
        <div class="discovery__light"></div>
        <div class="discovery__creature"></div>
        <p class="discovery__whisper">${esc(ui.awakening)}</p>
        <p class="discovery__awake"></p>
      </div>
      <div class="discovery__info">
        <p class="discovery__num"></p>
        <h2 class="discovery__name" id="discovery-name"></h2>
        <blockquote class="discovery__epithet"></blockquote>
        <p class="discovery__desc"></p>
        <dl class="discovery__facts"></dl>
        <div class="discovery__buy">
          <div><span class="discovery__label">${esc(ui.price)}</span><span class="discovery__price"></span></div>
          <button class="seal-btn discovery__adopt" data-cursor="link"></button>
        </div>
      </div>
    </div>
    <button class="discovery__close" data-cursor="link" aria-label="${esc(ui.close)}"><span>${esc(ui.close)}</span><i></i></button>`;
  document.body.append(root);

  const $ = (c) => root.querySelector(c);
  const frame = $('.discovery__frame');
  const stage = $('.discovery__creature');
  const adoptBtn = $('.discovery__adopt');
  let current = null, lastFocus = null, tl = null, isOpen = false;

  // Marco de ramas que crece desde las esquinas cada vez que se abre
  const frameSvg = svgRoot('0 0 1600 1000', { preserveAspectRatio: 'xMidYMid slice' });
  const corners = [
    { x: -20, y: -20, angle: 35, seed: 101 }, { x: 1620, y: -20, angle: 145, seed: 202 },
    { x: -20, y: 1020, angle: -40, seed: 303 }, { x: 1620, y: 1020, angle: -140, seed: 404 },
  ];
  corners.forEach((c) => frameSvg.append(createBranch({ ...c, length: env.mobile ? 260 : 340, width: 12, depth: 4, leaves: 0.7, grown: false })));
  frame.append(frameSvg);
  bindLeafRustle(frameSvg, () => audio.play('rustle', 0.06));

  function renderFacts(c) {
    const facts = [
      [ui.habitat, c.habitat], [ui.behaviour, c.behaviour], [ui.character, c.character],
      [ui.rarity, c.rarity], [ui.status, c.status],
    ].filter(([, v]) => v);
    $('.discovery__facts').innerHTML = facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  }

  function syncAdopt() {
    if (!current) return;
    const adopted = store.isAdopted(current.id);
    adoptBtn.textContent = adopted ? ui.adopted : ui.adopt;
    adoptBtn.classList.toggle('is-done', adopted);
  }
  store.subscribe(syncAdopt);

  adoptBtn.addEventListener('click', () => {
    if (!current || store.isAdopted(current.id)) return;
    store.adopt(current.id);
    audio.play('chime');
    const b = stage.getBoundingClientRect();
    particles.emit(b.left + b.width / 2, b.top + b.height * 0.45, { count: 26, spread: b.width * 0.5, glow: true, size: 1.6, color: current.glow, life: 110, speed: 1.4, lift: 0.6, alpha: 0.7 });
    root.classList.add('is-bonded');
  });

  async function open(c) {
    if (isOpen) return;
    isOpen = true;
    current = c;
    lastFocus = document.activeElement;
    root.classList.remove('is-awake', 'is-bonded', 'is-informed');
    root.style.setProperty('--glow', c.glow);
    stage.innerHTML = '';
    const svg = createCreature(c, { className: 'discovery__svg' });
    stage.append(svg);
    watchCursor(svg.querySelector('.creature'));
    $('.discovery__num').textContent = c.number;
    $('.discovery__name').textContent = c.name;
    $('.discovery__epithet').textContent = `«${c.epithet}»`;
    $('.discovery__desc').textContent = c.description;
    $('.discovery__awake').textContent = c.awakenLine;
    $('.discovery__price').textContent = formatPrice(c.price, content);
    renderFacts(c);
    syncAdopt();

    lenis?.stop();
    document.documentElement.classList.add('is-locked');
    root.setAttribute('aria-hidden', 'false');
    root.classList.add('is-open');
    $('.discovery__scroll').scrollTop = 0;
    $('.discovery__close').focus({ preventScroll: true });
    audio.play('wood', 0.12);

    growBranches(frameSvg, { duration: env.reduced ? 0.01 : 2.2, stagger: 0.12 });
    const fast = env.reduced ? 0.2 : env.mobile ? 0.7 : 1;
    await wait(900 * fast);
    if (current !== c || !isOpen) return;
    root.classList.add('is-awake');
    audio.play('breath');
    await wait(1500 * fast);
    if (current !== c || !isOpen) return;
    root.classList.add('is-informed');
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove('is-open', 'is-awake', 'is-informed');
    root.setAttribute('aria-hidden', 'true');
    growBranches(frameSvg, { duration: 0.6, from: 1, to: 0, stagger: 0.05, ease: 'power2.in' });
    document.documentElement.classList.remove('is-locked');
    lenis?.start();
    audio.play('rustle', 0.08);
    lastFocus?.focus?.({ preventScroll: true });
  }

  $('.discovery__close').addEventListener('click', close);
  $('.discovery__veil').addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  return { open, close, get isOpen() { return isOpen; } };
}
