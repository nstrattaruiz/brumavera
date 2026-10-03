/* La cesta: un panel lateral de madera que se desliza desde la derecha.
   Muestra las criaturas elegidas, cantidades, subtotal y el camino al checkout. */

import { h, esc, svgRoot, env } from '../scripts/core/utils.js';
import { createCreature } from './creature.js';
import { createBranch, growBranches } from './branch.js';
import { store } from '../scripts/core/store.js';

export function createCart({ content, audio, commerce, go }) {
  const ui = content.ui;
  const cfg = commerce.cfg;
  const veil = h('div', { class: 'cart-veil', 'aria-hidden': 'true' });
  const panel = h('aside', { class: 'cart', role: 'dialog', 'aria-modal': 'true', 'aria-label': ui.cartTitle, 'aria-hidden': 'true' });
  panel.innerHTML = `
    <div class="cart__branch"></div>
    <header class="cart__head">
      <h2>${esc(ui.cartTitle)}</h2>
      <button class="cart__close" type="button" data-cursor="link" aria-label="${esc(ui.close)}"><i></i></button>
    </header>
    <div class="cart__body"><ul class="cart__list"></ul><div class="cart__empty"></div></div>
    <footer class="cart__foot">
      <div class="cart__free"><span></span><i><b></b></i></div>
      <div class="cart__row"><span>${esc(ui.subtotal)}</span><strong class="cart__subtotal"></strong></div>
      <button class="seal-btn cart__checkout" type="button" data-cursor="link">${esc(ui.checkout)}</button>
      <button class="link-btn cart__keep" type="button" data-cursor="link">${esc(ui.keepExploring)}</button>
    </footer>`;
  document.body.append(veil, panel);

  const branchSvg = svgRoot('0 0 400 220');
  branchSvg.append(createBranch({ x: 420, y: -10, angle: 150, length: 300, width: 8, depth: 4, leaves: 0.8, seed: 616, grown: false }));
  panel.querySelector('.cart__branch').append(branchSvg);

  const list = panel.querySelector('.cart__list');
  const empty = panel.querySelector('.cart__empty');
  let isOpen = false;

  function render() {
    const lines = commerce.lines();
    panel.classList.toggle('is-empty', lines.length === 0);
    list.innerHTML = '';
    lines.forEach(({ creature: c, qty }) => {
      const max = commerce.available(c);
      const li = h('li', { class: 'cart-item' });
      const art = h('div', { class: 'cart-item__art' }, [createCreature(c)]);
      art.style.setProperty('--glow', c.glow);
      const info = h('div', { class: 'cart-item__info' });
      info.innerHTML = `
        <span class="cart-item__num">${esc(c.number)}</span>
        <button type="button" class="cart-item__name" data-cursor="link">${esc(c.name)}</button>
        <span class="cart-item__unit">${esc(commerce.money(c.price))}</span>
        <div class="cart-item__controls">
          <div class="qty qty--small" role="group" aria-label="${esc(ui.quantity)}">
            <button type="button" class="qty__btn" data-d="-1" data-cursor="link" aria-label="−">−</button>
            <output class="qty__val">${qty}</output>
            <button type="button" class="qty__btn" data-d="1" data-cursor="link" aria-label="+" ${qty >= max ? 'disabled' : ''}>+</button>
          </div>
          <button type="button" class="cart-item__remove" data-cursor="link">${esc(ui.remove)}</button>
        </div>`;
      const total = h('span', { class: 'cart-item__total', text: commerce.money((c.price || 0) * qty) });
      info.querySelectorAll('.qty__btn').forEach((b) => b.addEventListener('click', () => {
        store.setQty(c.id, qty + Number(b.dataset.d), max);
        audio.play('wood', 0.06);
      }));
      info.querySelector('.cart-item__remove').addEventListener('click', () => { store.removeFromCart(c.id); audio.play('rustle', 0.08); });
      info.querySelector('.cart-item__name').addEventListener('click', () => { close(); go(`criatura/${c.id}`); });
      li.append(art, info, total);
      list.append(li);
    });

    empty.innerHTML = '';
    const goMarket = h('button', { type: 'button', class: 'seal-btn', 'data-cursor': 'link', text: ui.goToMarket });
    goMarket.addEventListener('click', () => { close(); go('mercado'); });
    empty.append(h('p', { text: ui.cartEmpty }), goMarket);

    const sub = commerce.subtotal();
    panel.querySelector('.cart__subtotal').textContent = commerce.money(sub);
    const free = panel.querySelector('.cart__free');
    if (cfg.freeShippingFrom) {
      const k = Math.min(1, sub / cfg.freeShippingFrom);
      free.querySelector('span').textContent = k >= 1 ? ui.freeShippingReached : `${ui.freeShippingFrom} ${commerce.money(cfg.freeShippingFrom)}`;
      free.querySelector('b').style.width = `${k * 100}%`;
      free.hidden = false;
    } else free.hidden = true;
  }
  render();
  store.subscribe(render);

  function open() {
    if (isOpen) return;
    isOpen = true;
    render();
    panel.classList.add('is-open');
    veil.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    window.__lenis?.stop();
    document.documentElement.classList.add('is-cart');
    growBranches(branchSvg, { duration: env.reduced ? 0.01 : 1.6 });
    audio.play('wood', 0.12);
    panel.querySelector('.cart__close').focus({ preventScroll: true });
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    veil.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('is-cart');
    window.__lenis?.start();
  }

  panel.querySelector('.cart__close').addEventListener('click', close);
  panel.querySelector('.cart__keep').addEventListener('click', close);
  panel.querySelector('.cart__checkout').addEventListener('click', () => { close(); go('checkout'); });
  veil.addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  return { open, close, toggle: () => (isOpen ? close() : open()) };
}
