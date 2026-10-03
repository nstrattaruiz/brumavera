/* Objetos interactivos reutilizables: cualquier cosa del mundo que reacciona
   a la cercanía, al tacto o al teclado. */

import { h, env, pointer, clamp } from '../scripts/core/utils.js';

/**
 * Conecta un elemento a interacciones de cercanía/activación con soporte táctil y teclado.
 * @param {Element} el
 * @param {object} o { onNear, onFar, onActivate, cursor, label }
 */
export function createInteractiveObject(el, o = {}) {
  if (o.cursor) el.setAttribute('data-cursor', o.cursor);
  if (o.label) el.setAttribute('aria-label', o.label);
  if (o.onActivate && !el.hasAttribute('tabindex') && el.tagName !== 'BUTTON') {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
  }
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') o.onNear?.(e); });
  el.addEventListener('pointerleave', (e) => o.onFar?.(e));
  el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') o.onNear?.(e); });
  el.addEventListener('click', (e) => o.onActivate?.(e));
  el.addEventListener('keydown', (e) => {
    if (o.onActivate && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); o.onActivate(e); }
  });
  return el;
}

/**
 * Una luz pequeña que huye del cursor. Si se la persigue con paciencia, se cansa.
 * @param {Element} container  elemento posicionado que la contiene
 * @param {object} o { home():{x,y}, target():{x,y}, particles, audio, onCaught, color }
 */
export function createWisp(container, o) {
  const el = h('div', { class: 'wisp', 'data-cursor': 'creature', 'aria-hidden': 'true' }, [h('i')]);
  container.append(el);
  const color = o.color || '#e3c47e';
  el.style.setProperty('--wisp', color);

  let x = 0, y = 0, tx = 0, ty = 0, t = Math.random() * 100;
  let flees = 0, lastFlee = 0, tired = false, caught = false, visible = true, started = false;
  const fleeRadius = env.touch ? 110 : 130;

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(container);

  function flee(px, py) {
    const now = performance.now();
    const dx = x - px, dy = y - py;
    const d = Math.hypot(dx, dy) || 1;
    const home = o.home();
    const rangeX = Math.min(container.clientWidth * 0.36, 340), rangeY = 160;
    tx = clamp(x + (dx / d) * 190 + (Math.random() - 0.5) * 80, home.x - rangeX, home.x + rangeX);
    ty = clamp(y + (dy / d) * 120 + (Math.random() - 0.5) * 60, home.y - rangeY, home.y + rangeY * 0.6);
    if (now - lastFlee > 650) {
      flees++;
      lastFlee = now;
      o.audio?.play('rustle', 0.04);
      if (flees >= 6) { tired = true; el.classList.add('is-tired'); }
    }
  }

  function catchIt() {
    if (caught) return;
    caught = true;
    el.classList.add('is-caught');
    const b = container.getBoundingClientRect();
    o.particles?.emit(b.left + x, b.top + y, { count: 22, glow: true, color, size: 1.5, speed: 1.6, life: 90, alpha: 0.8 });
    o.audio?.play('chime', 0.06);
    const dest = o.target?.() || o.home();
    tx = dest.x; ty = dest.y;
    setTimeout(() => el.classList.add('is-gone'), 1400);
    o.onCaught?.();
  }

  container.addEventListener('pointerdown', (e) => {
    if (caught) return;
    const b = container.getBoundingClientRect();
    const px = e.clientX - b.left, py = e.clientY - b.top;
    const d = Math.hypot(px - x, py - y);
    if (tired && d < 60) catchIt();
    else if (d < fleeRadius) flee(px, py);
  });

  function loop() {
    requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    const home = o.home();
    if (!started) { x = tx = home.x; y = ty = home.y; started = true; }
    t += 0.008;
    if (!caught) {
      if (!tired && pointer.active && !env.touch) {
        const b = container.getBoundingClientRect();
        const px = pointer.x - b.left, py = pointer.y - b.top;
        if (Math.hypot(px - x, py - y) < fleeRadius) flee(px, py);
      }
      // Deriva suave alrededor del punto de destino
      if (performance.now() - lastFlee > 2400) {
        tx += (home.x + Math.sin(t * 1.3) * 70 - tx) * 0.004;
        ty += (home.y + Math.cos(t * 0.9) * 26 - ty) * 0.004;
      }
    }
    const speed = caught ? 0.03 : tired ? 0.025 : 0.06;
    x += (tx - x) * speed;
    y += (ty - y) * speed;
    const bob = Math.sin(t * 6) * (tired ? 1.5 : 3);
    el.style.transform = `translate3d(${x}px, ${y + bob}px, 0)`;
  }
  loop();

  return { el };
}

/** Muestra un susurro breve (secretos, frases del bosque). */
let whisperEl = null, whisperTimer = null;
export function whisper(text, mark = '') {
  // Durante el pago, el bosque guarda silencio
  if (document.documentElement.classList.contains('is-shop')) return;
  if (!whisperEl) {
    whisperEl = h('div', { class: 'whisper', role: 'status', 'aria-live': 'polite' });
    document.body.append(whisperEl);
  }
  whisperEl.innerHTML = '';
  if (mark) whisperEl.append(h('span', { class: 'whisper__mark', text: mark }));
  whisperEl.append(h('span', { class: 'whisper__text', text }));
  whisperEl.classList.remove('is-on');
  void whisperEl.offsetWidth;
  whisperEl.classList.add('is-on');
  clearTimeout(whisperTimer);
  whisperTimer = setTimeout(() => whisperEl.classList.remove('is-on'), 5600);
}
