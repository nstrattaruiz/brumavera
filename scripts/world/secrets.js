/* Secretos repartidos por el mundo. Este módulo no sabe dónde están:
   cada lugar llama a secrets.find(id) cuando el visitante los descubre. */

import { store } from '../core/store.js';
import { whisper } from '../../components/interactive.js';

export function createSecrets({ content, audio }) {
  const cfg = content.secrets;
  const byId = Object.fromEntries(cfg.items.map((s) => [s.id, s]));
  let unlockedAnnounced = store.state.secrets.length >= cfg.unlockThreshold;

  const api = {
    total: cfg.items.length,
    get count() { return store.state.secrets.filter((id) => byId[id]).length; },
    get unlocked() { return api.count >= cfg.unlockThreshold; },
    items: cfg.items,
    has: (id) => store.hasSecret(id),

    find(id) {
      const s = byId[id];
      if (!s || !store.findSecret(id)) return false;
      audio.play('chime', 0.05);
      whisper(s.message, s.mark);
      if (!unlockedAnnounced && api.unlocked) {
        unlockedAnnounced = true;
        setTimeout(() => {
          whisper(cfg.unlockMessage, '✧');
          document.dispatchEvent(new CustomEvent('world:unlock'));
        }, 6200);
      }
      return true;
    },
  };

  // El que observa: aparece tras un rato de quietud, una sola vez.
  // Antes de eso, el bosque deja caer alguna frase suelta.
  let idleTimer, whisperTimer, lastWhisper = 0;
  const resetIdle = () => {
    clearTimeout(idleTimer);
    clearTimeout(whisperTimer);
    if (document.documentElement.classList.contains('is-intro')) return;
    if (/checkout|pedido/.test(location.hash)) return;
    whisperTimer = setTimeout(() => {
      const now = Date.now();
      if (now - lastWhisper > 45000 && content.whispers?.length) {
        lastWhisper = now;
        whisper(content.whispers[Math.floor(Math.random() * content.whispers.length)]);
      }
    }, 14000);
    if (!store.hasSecret('watcher')) idleTimer = setTimeout(() => api.find('watcher'), 32000);
  };
  ['pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach((ev) => addEventListener(ev, resetIdle, { passive: true }));
  document.addEventListener('world:entered', resetIdle);

  return api;
}
