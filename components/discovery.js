/* Ficha de criatura (detalle de producto) como lugar propio: #/criatura/:id
   La criatura despierta antes de que aparezca la información; después, se adopta. */

import { h, esc, svgRoot, env, wait } from '../scripts/core/utils.js';
import { createCreature, watchCursor } from './creature.js';
import { createBranch, growBranches, bindLeafRustle } from './branch.js';
import { createProduct } from './product.js';
import { store } from '../scripts/core/store.js';

export function createProductView({ content, particles, audio, commerce, go, cart, secrets }) {
  const ui = content.ui;
  const el = h('section', { class: 'view place place--creature', id: 'criatura', hidden: true });
  el.innerHTML = `
    <div class="pv__frame"></div>
    <div class="pv__grid">
      <div class="pv__stage">
        <div class="pv__light"></div>
        <div class="pv__creature"></div>
        <p class="pv__whisper">${esc(ui.awakening)}</p>
        <p class="pv__awake"></p>
      </div>
      <div class="pv__info">
        <button class="pv__back" type="button" data-cursor="link"><i>←</i> ${esc(ui.backToMarket)}</button>
        <p class="pv__num"></p>
        <h1 class="pv__name"></h1>
        <blockquote class="pv__epithet"></blockquote>
        <p class="pv__desc"></p>
        <dl class="pv__facts"></dl>
        <div class="pv__buy">
          <div class="pv__price-row">
            <div><span class="pv__label">${esc(ui.price)}</span><span class="pv__price"></span></div>
            <span class="pv__stock"></span>
          </div>
          <div class="pv__actions">
            <div class="qty" role="group" aria-label="${esc(ui.quantity)}">
              <button type="button" class="qty__btn" data-d="-1" data-cursor="link" aria-label="−">−</button>
              <output class="qty__val">1</output>
              <button type="button" class="qty__btn" data-d="1" data-cursor="link" aria-label="+">+</button>
            </div>
            <button class="seal-btn pv__add" type="button" data-cursor="link"></button>
          </div>
          <div class="pv__after">
            <button type="button" class="link-btn pv__view-cart" data-cursor="link">${esc(ui.viewCart)}</button>
            <button type="button" class="link-btn pv__checkout" data-cursor="link">${esc(ui.checkout)} →</button>
          </div>
        </div>
      </div>
    </div>
    <div class="pv__related">
      <h2>${esc(ui.related)}</h2>
      <div class="pv__related-row"></div>
    </div>`;

  const $ = (c) => el.querySelector(c);
  const stage = $('.pv__creature');
  const addBtn = $('.pv__add');
  const qtyVal = $('.qty__val');
  let current = null, qty = 1, token = 0, related = [];

  // Marco de ramas que crece desde las esquinas cada vez que se entra
  const frameSvg = svgRoot('0 0 1600 1000', { preserveAspectRatio: 'xMidYMid slice' });
  [
    { x: -20, y: -20, angle: 35, seed: 101 }, { x: 1620, y: -20, angle: 145, seed: 202 },
    { x: -20, y: 1020, angle: -40, seed: 303 }, { x: 1620, y: 1020, angle: -140, seed: 404 },
  ].forEach((c) => frameSvg.append(createBranch({ ...c, length: 340, width: 12, depth: 4, leaves: 0.7, grown: false })));
  $('.pv__frame').append(frameSvg);
  bindLeafRustle(frameSvg, () => audio.play('rustle', 0.06));

  function renderFacts(c) {
    const facts = [[ui.habitat, c.habitat], [ui.behaviour, c.behaviour], [ui.character, c.character], [ui.rarity, c.rarity], [ui.status, c.status]].filter(([, v]) => v);
    $('.pv__facts').innerHTML = facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  }

  function sync() {
    if (!current) return;
    const avail = commerce.available(current);
    const addable = commerce.addable(current);
    const inCart = store.inCart(current.id);
    qty = Math.max(1, Math.min(qty, Math.max(1, addable)));
    qtyVal.textContent = qty;
    $('.pv__stock').textContent = avail === 0 ? ui.soldOut : current.stock === 1 ? ui.unique : `${avail} ${ui.available}`;
    el.classList.toggle('is-soldout', avail === 0);
    el.classList.toggle('is-incart', inCart > 0);
    addBtn.disabled = addable === 0;
    addBtn.textContent = avail === 0 ? ui.soldOut : addable === 0 ? `${ui.inCart} · ${inCart}` : ui.addToCart;
    el.querySelectorAll('.qty__btn').forEach((b) => { b.disabled = addable <= 1 || (b.dataset.d === '-1' ? qty <= 1 : qty >= addable); });
  }
  store.subscribe(sync);

  el.querySelectorAll('.qty__btn').forEach((b) => b.addEventListener('click', () => {
    qty += Number(b.dataset.d);
    audio.play('wood', 0.06);
    sync();
  }));

  addBtn.addEventListener('click', () => {
    if (!current || commerce.addable(current) === 0) return;
    store.addToCart(current.id, qty, commerce.available(current));
    audio.play('chime');
    const b = stage.getBoundingClientRect();
    particles.emit(b.left + b.width / 2, b.top + b.height * 0.45, { count: 26, spread: b.width * 0.5, glow: true, size: 1.6, color: current.glow, life: 110, speed: 1.4, lift: 0.6, alpha: 0.7 });
    el.classList.add('is-bonded');
    qty = 1;
    sync();
    setTimeout(() => cart.open(), 650);
  });

  $('.pv__back').addEventListener('click', () => go('mercado'));
  $('.pv__view-cart').addEventListener('click', () => cart.open());
  $('.pv__checkout').addEventListener('click', () => go('checkout'));

  async function enter([id]) {
    const c = content.creatures.find((x) => x.id === id && (!x.hidden || secrets.unlocked || store.isAdopted(x.id)));
    if (!c) { go('mercado'); return; }
    const my = ++token;
    current = c;
    qty = 1;
    el.classList.remove('is-awake', 'is-bonded', 'is-informed');
    el.style.setProperty('--glow', c.glow);
    stage.innerHTML = '';
    const svg = createCreature(c, { className: 'pv__svg' });
    stage.append(svg);
    watchCursor(svg.querySelector('.creature'));
    $('.pv__num').textContent = c.number;
    $('.pv__name').textContent = c.name;
    $('.pv__epithet').textContent = `«${c.epithet}»`;
    $('.pv__desc').textContent = c.description;
    $('.pv__awake').textContent = c.awakenLine;
    $('.pv__price').textContent = commerce.money(c.price);
    renderFacts(c);
    sync();

    // Relacionadas: misma categoría primero
    related.forEach((p) => p._dispose?.());
    const pool = content.creatures.filter((x) => x.id !== c.id && !x.hidden);
    pool.sort((a, b) => (b.category === c.category) - (a.category === c.category));
    related = pool.slice(0, env.mobile ? 2 : 3).map((x) => createProduct(x, { content, particles, audio, commerce, variant: 'table', onOpen: (x2) => go(`criatura/${x2.id}`) }));
    const row = $('.pv__related-row');
    row.innerHTML = '';
    related.forEach((p) => row.append(p));

    growBranches(frameSvg, { duration: env.reduced ? 0.01 : 2.2, stagger: 0.12 });
    const fast = env.reduced ? 0.2 : env.mobile ? 0.7 : 1;
    await wait(700 * fast);
    if (my !== token) return;
    el.classList.add('is-awake');
    audio.play('breath');
    await wait(1300 * fast);
    if (my !== token) return;
    el.classList.add('is-informed');
  }

  function leave() { token++; }

  return { el, enter, leave, label: () => current?.name || '' };
}
