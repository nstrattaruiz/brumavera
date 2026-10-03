/* Checkout (#/checkout) y confirmación de pedido (#/pedido/:id).
   Sin backend: el pedido se guarda en el navegador y se ofrece enviarlo por correo o WhatsApp.
   Medios de pago, envíos y textos vienen del contenido. */

import { h, esc } from '../core/utils.js';
import { createCreature } from '../../components/creature.js';
import { createPlaceHeader } from '../../components/lore.js';
import { store } from '../core/store.js';

const SEAL = '<svg viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="24"/><path d="M30 16L30 44M20 24L40 36M40 24L20 36"/></svg>';

function luhn(num) {
  let sum = 0, dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = +num[i];
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return num.length >= 13 && sum % 10 === 0;
}

function field(name, label, attrs = {}) {
  const extra = Object.entries(attrs).map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`)).join(' ');
  const input = attrs.textarea
    ? `<textarea name="${name}" rows="3" ${extra.replace('textarea', '')}></textarea>`
    : `<input name="${name}" ${extra}>`;
  return `<label class="field field--${name}"><span>${esc(label)}</span>${input}<em class="field__err" aria-live="polite"></em></label>`;
}

function summaryItems(items, money) {
  return items.map((i) => `<li><span class="sum__name">${esc(i.number)} · ${esc(i.name)} <small>× ${i.qty}</small></span><span>${esc(money(i.price * i.qty))}</span></li>`).join('');
}

/* ---------------- Checkout ---------------- */

export function createCheckoutView({ content, audio, commerce, go, cart }) {
  const ui = content.ui;
  const cfg = commerce.cfg;
  const F = cfg.fields;
  const el = h('section', { class: 'view place place--checkout', id: 'checkout', hidden: true });
  el.append(createPlaceHeader({ numeral: '✦', name: ui.checkout, subtitle: ui.demoNotice }));

  const shipOpts = cfg.shipping.map((s, i) => `
    <label class="opt"><input type="radio" name="shipping" value="${esc(s.id)}" ${i === 0 ? 'checked' : ''}>
      <span class="opt__box"><b>${esc(s.name)}</b><small>${esc(s.detail || '')}</small></span>
      <span class="opt__price" data-ship="${esc(s.id)}"></span></label>`).join('');
  const payOpts = cfg.payments.map((p, i) => `
    <label class="opt"><input type="radio" name="payment" value="${esc(p.id)}" ${i === 0 ? 'checked' : ''}>
      <span class="opt__box"><b>${esc(p.name)}</b><small>${esc(p.detail || '')}</small></span></label>`).join('');

  const wrap = h('div', { class: 'co' });
  wrap.innerHTML = `
    <form class="co__form parchment" novalidate>
      <ol class="co__steps">${ui.steps.map((s, i) => `<li data-step="${i}"><span>${['I', 'II', 'III'][i]}</span>${esc(s)}</li>`).join('')}</ol>
      <fieldset class="co__step" data-step="0">
        <legend>${esc(ui.steps[0])}</legend>
        ${field('name', F.name, { required: true, autocomplete: 'name' })}
        ${field('email', F.email, { type: 'email', required: true, autocomplete: 'email', inputmode: 'email' })}
        ${field('phone', F.phone, { type: 'tel', autocomplete: 'tel', inputmode: 'tel' })}
      </fieldset>
      <fieldset class="co__step" data-step="1">
        <legend>${esc(ui.steps[1])}</legend>
        <div class="opts">${shipOpts}</div>
        <div class="co__address">
          ${field('address', F.address, { required: true, autocomplete: 'street-address' })}
          <div class="field-row">
            ${field('city', F.city, { required: true, autocomplete: 'address-level2' })}
            ${field('zip', F.zip, { required: true, autocomplete: 'postal-code', inputmode: 'numeric' })}
          </div>
          ${field('country', F.country, { required: true, autocomplete: 'country-name' })}
        </div>
        ${field('notes', F.notes, { textarea: true })}
      </fieldset>
      <fieldset class="co__step" data-step="2">
        <legend>${esc(ui.steps[2])}</legend>
        <div class="opts">${payOpts}</div>
        <div class="co__card">
          ${field('cardName', F.cardName, { required: true, autocomplete: 'cc-name' })}
          ${field('cardNumber', F.cardNumber, { required: true, autocomplete: 'cc-number', inputmode: 'numeric', maxlength: 23, placeholder: '4242 4242 4242 4242' })}
          <div class="field-row">
            ${field('cardExp', F.cardExp, { required: true, autocomplete: 'cc-exp', inputmode: 'numeric', maxlength: 5, placeholder: 'MM/AA' })}
            ${field('cardCvc', F.cardCvc, { required: true, autocomplete: 'cc-csc', inputmode: 'numeric', maxlength: 4, placeholder: '123' })}
          </div>
        </div>
        <p class="co__note">${esc(ui.demoNotice)}</p>
      </fieldset>
      <div class="co__nav">
        <button type="button" class="link-btn co__prev" data-cursor="link">← ${esc(ui.stepPrev)}</button>
        <button type="submit" class="seal-btn co__next" data-cursor="link"></button>
      </div>
    </form>
    <aside class="co__summary">
      <h3>${esc(ui.summary)}</h3>
      <ul class="sum__items"></ul>
      <div class="sum__row"><span>${esc(ui.subtotal)}</span><span class="sum__sub"></span></div>
      <div class="sum__row"><span>${esc(ui.shipping)}</span><span class="sum__ship"></span></div>
      <div class="sum__row sum__row--total"><span>${esc(ui.total)}</span><span class="sum__total"></span></div>
      <button type="button" class="link-btn co__edit" data-cursor="link">← ${esc(ui.backToCart)}</button>
    </aside>`;
  el.append(wrap);

  const emptyBox = h('div', { class: 'co__empty' }, [h('p', { text: ui.cartEmpty })]);
  const goMarket = h('button', { type: 'button', class: 'seal-btn', 'data-cursor': 'link', text: ui.goToMarket });
  goMarket.addEventListener('click', () => go('mercado'));
  emptyBox.append(goMarket);
  const processing = h('div', { class: 'co__processing', 'aria-live': 'assertive', html: `<span class="seal">${SEAL}</span><p>${esc(ui.processing)}</p>` });
  el.append(emptyBox, processing);

  const form = wrap.querySelector('form');
  const $ = (s) => el.querySelector(s);
  const input = (n) => form.elements[n];
  let step = 0, busy = false;

  const shipMethod = () => cfg.shipping.find((s) => s.id === form.elements.shipping.value) || cfg.shipping[0];
  const payMethod = () => cfg.payments.find((p) => p.id === form.elements.payment.value) || cfg.payments[0];

  function updateSummary() {
    const lines = commerce.lines();
    el.classList.toggle('is-empty', lines.length === 0);
    $('.sum__items').innerHTML = summaryItems(lines.map((l) => ({ ...l.creature, qty: l.qty })), commerce.money);
    const sub = commerce.subtotal();
    const ship = commerce.shippingCost(shipMethod(), sub);
    $('.sum__sub').textContent = commerce.money(sub);
    $('.sum__ship').textContent = ship ? commerce.money(ship) : ui.free;
    $('.sum__total').textContent = commerce.money(sub + ship);
    el.querySelectorAll('[data-ship]').forEach((s) => {
      const m = cfg.shipping.find((x) => x.id === s.dataset.ship);
      const cost = commerce.shippingCost(m, sub);
      s.textContent = cost ? commerce.money(cost) : ui.free;
    });
    if (step === 2) $('.co__next').textContent = `${ui.placeOrder} · ${commerce.money(sub + ship)}`;
  }
  store.subscribe(() => { if (!el.hidden) updateSummary(); });

  function setStep(n) {
    step = n;
    el.querySelectorAll('.co__step').forEach((f) => { f.hidden = Number(f.dataset.step) !== n; });
    el.querySelectorAll('.co__steps li').forEach((li) => {
      const i = Number(li.dataset.step);
      li.classList.toggle('is-current', i === n);
      li.classList.toggle('is-done', i < n);
    });
    $('.co__prev').style.visibility = n === 0 ? 'hidden' : 'visible';
    $('.co__next').textContent = n < 2 ? `${ui.stepNext} →` : ui.placeOrder;
    syncConditional();
    updateSummary();
  }

  function syncConditional() {
    const pickup = !!shipMethod().pickup;
    $('.co__address').hidden = pickup;
    $('.co__card').hidden = payMethod().type !== 'card';
  }
  form.addEventListener('change', (e) => {
    if (e.target.name === 'shipping' || e.target.name === 'payment') { syncConditional(); updateSummary(); audio.play('wood', 0.06); }
  });

  // Formato de tarjeta mientras se escribe
  input('cardNumber').addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 19);
    e.target.value = d.replace(/(.{4})/g, '$1 ').trim();
  });
  input('cardExp').addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  });
  input('cardCvc').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });
  form.addEventListener('input', (e) => {
    const lab = e.target.closest('.field');
    if (lab?.classList.contains('is-err')) { lab.classList.remove('is-err'); lab.querySelector('.field__err').textContent = ''; }
  });

  function validate(n) {
    const fs = el.querySelector(`.co__step[data-step="${n}"]`);
    let first = null;
    fs.querySelectorAll('input, textarea').forEach((inp) => {
      if (inp.type === 'radio' || inp.closest('[hidden]')) return;
      const v = inp.value.trim();
      let err = '';
      if (inp.required && !v) err = ui.required;
      else if (inp.name === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) err = ui.invalidEmail;
      else if (inp.name === 'cardNumber' && !luhn(v.replace(/\D/g, ''))) err = ui.invalidCard;
      else if (inp.name === 'cardExp') {
        const m = v.match(/^(\d{2})\/(\d{2})$/);
        const ok = m && +m[1] >= 1 && +m[1] <= 12 && new Date(2000 + +m[2], +m[1]) > new Date();
        if (!ok) err = ui.invalidExp;
      } else if (inp.name === 'cardCvc' && !/^\d{3,4}$/.test(v)) err = ui.invalidCvc;
      const lab = inp.closest('.field');
      lab.classList.toggle('is-err', !!err);
      lab.querySelector('.field__err').textContent = err;
      if (err && !first) first = inp;
    });
    if (first) {
      first.focus();
      form.classList.remove('is-invalid');
      void form.offsetWidth;
      form.classList.add('is-invalid');
      return false;
    }
    return true;
  }

  $('.co__prev').addEventListener('click', () => { if (step > 0) { setStep(step - 1); scrollToForm(); } });
  $('.co__edit').addEventListener('click', () => cart.open());

  function scrollToForm() {
    const y = wrap.getBoundingClientRect().top + scrollY - 90;
    if (scrollY > y) window.__lenis ? window.__lenis.scrollTo(y, { duration: 0.8 }) : scrollTo({ top: y, behavior: 'smooth' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !validate(step)) return;
    audio.play('rustle', 0.08);
    if (step < 2) { setStep(step + 1); scrollToForm(); return; }
    placeOrder();
  });

  function placeOrder() {
    const lines = commerce.lines();
    if (!lines.length) return;
    busy = true;
    const ship = shipMethod();
    const pay = payMethod();
    const sub = commerce.subtotal();
    const shipCost = commerce.shippingCost(ship, sub);
    const val = (n) => (input(n)?.value || '').trim();
    const order = {
      id: commerce.newOrderId(),
      date: new Date().toISOString(),
      items: lines.map(({ creature: c, qty }) => ({ id: c.id, name: c.name, number: c.number, price: c.price || 0, qty })),
      customer: { name: val('name'), email: val('email'), phone: val('phone') },
      shipping: ship.pickup
        ? { id: ship.id, name: ship.name, pickup: true }
        : { id: ship.id, name: ship.name, address: val('address'), city: val('city'), zip: val('zip'), country: val('country') },
      payment: { id: pay.id, type: pay.type, name: pay.name, last4: pay.type === 'card' ? val('cardNumber').replace(/\D/g, '').slice(-4) : undefined },
      notes: val('notes'),
      subtotal: sub,
      shippingCost: shipCost,
      total: sub + shipCost,
      status: pay.type === 'card' ? 'paid' : 'pending',
    };
    el.classList.add('is-processing');
    audio.play('wood', 0.2);
    setTimeout(() => {
      store.placeOrder(order);
      audio.play('chime');
      ['cardName', 'cardNumber', 'cardExp', 'cardCvc'].forEach((n) => { input(n).value = ''; });
      el.classList.remove('is-processing');
      busy = false;
      go(`pedido/${order.id}`);
    }, pay.type === 'card' ? 2000 : 1200);
  }

  function enter() {
    if (!input('country').value) input('country').value = cfg.defaultCountry || '';
    setStep(0);
  }

  return { el, enter, label: () => ui.checkout };
}

/* ---------------- Confirmación del pedido ---------------- */

export function createOrderView({ content, commerce, go }) {
  const ui = content.ui;
  const el = h('section', { class: 'view place place--order', id: 'pedido', hidden: true });
  let current = null;

  function enter([id]) {
    const o = store.getOrder(id);
    if (!o) { go('mercado'); return; }
    current = o;
    const pay = content.commerce.payments.find((p) => p.id === o.payment.id) || o.payment;
    const text = commerce.orderText(o);
    const mail = `mailto:${content.commerce.orderEmail || content.contact.email}?subject=${encodeURIComponent(`${content.world.name} — ${o.id}`)}&body=${encodeURIComponent(text)}`;
    let next = '';
    if (pay.type === 'card') next = `<p>${esc(ui.orderPaid)} ···· ${esc(o.payment.last4 || '')}</p>`;
    else if (pay.type === 'transfer') next = `<p>${esc(pay.instructions || pay.detail || '')}</p>`;
    else if (pay.type === 'whatsapp') next = `<p>${esc(pay.detail || '')}</p><a class="seal-btn" data-cursor="link" target="_blank" rel="noopener" href="https://wa.me/${esc(pay.phone || '')}?text=${encodeURIComponent(text)}">${esc(ui.sendWhatsapp)}</a>`;
    else next = `<p>${esc(pay.detail || '')}</p>`;

    const date = new Date(o.date).toLocaleDateString(content.meta.locale, { day: 'numeric', month: 'long', year: 'numeric' });
    const ship = o.shipping.pickup ? esc(o.shipping.name) : `${esc(o.shipping.name)}<br>${esc(o.shipping.address)}<br>${esc(o.shipping.city)} (${esc(o.shipping.zip)}), ${esc(o.shipping.country)}`;

    el.innerHTML = `
      <div class="order">
        <span class="seal order__seal">${SEAL}</span>
        <p class="kicker">${esc(date)}</p>
        <h1 class="order__title">${esc(ui.orderTitle)}</h1>
        <p class="order__lead">${esc(ui.orderLead)} <strong>${esc(o.id)}</strong></p>
        <div class="order__creatures"></div>
        <div class="order__grid">
          <div class="order__box">
            <h3>${esc(ui.summary)}</h3>
            <ul class="sum__items">${summaryItems(o.items, commerce.money)}</ul>
            <div class="sum__row"><span>${esc(ui.subtotal)}</span><span>${esc(commerce.money(o.subtotal))}</span></div>
            <div class="sum__row"><span>${esc(ui.shipping)}</span><span>${o.shippingCost ? esc(commerce.money(o.shippingCost)) : esc(ui.free)}</span></div>
            <div class="sum__row sum__row--total"><span>${esc(ui.total)}</span><span>${esc(commerce.money(o.total))}</span></div>
          </div>
          <div class="order__box">
            <h3>${esc(ui.orderCustomer)}</h3>
            <p>${esc(o.customer.name)}<br>${esc(o.customer.email)}${o.customer.phone ? `<br>${esc(o.customer.phone)}` : ''}</p>
            <h3>${esc(ui.orderShipTo)}</h3>
            <p>${ship}</p>
            <h3>${esc(ui.orderPayment)}</h3>
            <p>${esc(o.payment.name)}</p>
          </div>
        </div>
        <div class="order__next">
          <h3>${esc(ui.orderNext)}</h3>
          ${next}
          <a class="link-btn" data-cursor="link" href="${mail}">${esc(ui.sendEmail)}</a>
        </div>
        <div class="order__links">
          <button type="button" class="seal-btn" data-go="gabinete" data-cursor="link">${esc(ui.goToCabinet)}</button>
          <button type="button" class="link-btn" data-go="mercado" data-cursor="link">${esc(ui.backToMarket)}</button>
        </div>
        <p class="co__note">${esc(ui.demoNotice)}</p>
      </div>`;
    const row = el.querySelector('.order__creatures');
    o.items.forEach((i) => {
      const c = content.creatures.find((x) => x.id === i.id);
      if (c) { const svg = createCreature(c); svg.classList.add('is-awake'); row.append(svg); }
    });
    el.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
    requestAnimationFrame(() => el.classList.add('is-sealed'));
  }

  function leave() { el.classList.remove('is-sealed'); }

  return { el, enter, leave, label: () => current?.id || '' };
}
