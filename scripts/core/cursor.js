/* Cursor propio (sólo dispositivos con puntero fino).
   Cambia según lo que hay debajo: [data-cursor="leaf|creature|object|link|branch"]. */

import { env, pointer, h } from './utils.js';

export function createCursor(particles) {
  if (env.touch) return null;
  const dot = h('div', { class: 'cursor__dot' });
  const ring = h('div', { class: 'cursor__ring' }, [h('span', { class: 'cursor__label' })]);
  const root = h('div', { class: 'cursor', 'aria-hidden': 'true' }, [ring, dot]);
  document.body.append(root);
  document.documentElement.classList.add('has-cursor');

  let rx = pointer.x, ry = pointer.y, moved = 0, state = '';
  const label = ring.firstChild;

  function setState(next, text = '') {
    if (next === state) return;
    root.classList.remove(`is-${state}`);
    state = next;
    if (state) root.classList.add(`is-${state}`);
    label.textContent = text;
  }

  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest?.('[data-cursor]');
    setState(t ? t.dataset.cursor : '', t?.dataset.cursorLabel || '');
  });
  document.addEventListener('pointerdown', () => root.classList.add('is-down'));
  document.addEventListener('pointerup', () => root.classList.remove('is-down'));
  document.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => root.classList.remove('is-hidden'));

  function loop() {
    rx += (pointer.x - rx) * 0.16;
    ry += (pointer.y - ry) * 0.16;
    dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;

    // Estela de polvo: casi imperceptible, sólo con movimiento real
    const speed = Math.abs(pointer.vx) + Math.abs(pointer.vy);
    moved += speed;
    if (particles && moved > 46 && !env.reduced) {
      moved = 0;
      particles.emit(pointer.x, pointer.y, { size: 0.8, life: 46, alpha: 0.55, lift: 0.12, speed: 0.35, color: '#d4c59a' });
    }
    pointer.vx *= 0.5;
    pointer.vy *= 0.5;
    requestAnimationFrame(loop);
  }
  loop();

  return { setState };
}
