/* Estado persistente del visitante: colección adoptada, secretos y preferencias.
   Todo envuelto en try/catch: la experiencia funciona aunque no haya almacenamiento. */

const KEY = 'bosque-state-v1';
const listeners = new Set();

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

const state = Object.assign({ collection: [], secrets: [], sound: false }, load());

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento */ }
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get state() { return state; },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  isAdopted: (id) => state.collection.includes(id),
  adopt(id) { if (!state.collection.includes(id)) { state.collection.push(id); save(); } },
  release(id) { state.collection = state.collection.filter((c) => c !== id); save(); },

  hasSecret: (id) => state.secrets.includes(id),
  /** Devuelve true sólo la primera vez que se encuentra el secreto. */
  findSecret(id) {
    if (state.secrets.includes(id)) return false;
    state.secrets.push(id);
    save();
    return true;
  },

  setSound(on) { state.sound = !!on; save(); },
};
