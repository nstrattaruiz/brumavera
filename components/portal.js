/* Portal: un disco de luz en espiral que nace en un punto (la puerta) y llena la pantalla.
   Se usa para cruzar del bosque al interior. */

import { h, wait, env } from '../scripts/core/utils.js';

export function createPortal({ particles, audio }) {
  const el = h('div', { class: 'portal', 'aria-hidden': 'true' });
  el.innerHTML = `
    <div class="portal__disc"><i class="portal__swirl"></i><i class="portal__swirl portal__swirl--b"></i><i class="portal__core"></i></div>
    <div class="portal__veil"></div>`;
  document.body.append(el);

  return {
    /** Abre el portal desde un punto y cubre la pantalla. */
    async close(from = { x: innerWidth / 2, y: innerHeight / 2 }) {
      el.style.setProperty('--x', `${from.x}px`);
      el.style.setProperty('--y', `${from.y}px`);
      el.classList.remove('is-done');
      el.classList.add('is-on');
      audio.play('whoosh', 0.26);
      setTimeout(() => audio.play('chime', 0.05), 500);
      particles.rush(1);
      void el.offsetWidth;
      el.classList.add('is-growing');
      await wait(env.reduced ? 100 : 1400);
      el.classList.add('is-filled');
      await wait(env.reduced ? 50 : 350);
    },
    /** Se disuelve revelando el lugar nuevo. */
    async open() {
      particles.rush(0);
      el.classList.add('is-done');
      await wait(env.reduced ? 50 : 1100);
      el.classList.remove('is-on', 'is-growing', 'is-filled', 'is-done');
    },
  };
}
