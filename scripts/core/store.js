/* Estado persistente del visitante: cesta, pedidos, colección, secretos y preferencias.
   Todo envuelto en try/catch: la experiencia funciona aunque no haya almacenamiento. */

const KEY = 'bosque-state-v2';
const listeners = new Set();

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

const state = Object.assign({ cart: [], orders: [], collection: [], secrets: [], sound: false }, load());

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin almacenamiento */ }
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get state() { return state; },
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  /* ---- Cesta ---- */
  get cartCount() { return state.cart.reduce((n, i) => n + i.qty, 0); },
  inCart: (id) => state.cart.find((i) => i.id === id)?.qty || 0,
  /** Unidades ya adoptadas en pedidos anteriores (para calcular disponibilidad). */
  purchased: (id) => state.orders.reduce((n, o) => n + o.items.filter((i) => i.id === id).reduce((a, i) => a + i.qty, 0), 0),

  addToCart(id, qty = 1, max = Infinity) {
    const line = state.cart.find((i) => i.id === id);
    if (line) line.qty = Math.min(max, line.qty + qty);
    else state.cart.push({ id, qty: Math.min(max, qty) });
    save();
  },
  setQty(id, qty, max = Infinity) {
    const line = state.cart.find((i) => i.id === id);
    if (!line) return;
    if (qty <= 0) state.cart = state.cart.filter((i) => i.id !== id);
    else line.qty = Math.min(max, qty);
    save();
  },
  removeFromCart(id) { state.cart = state.cart.filter((i) => i.id !== id); save(); },
  clearCart() { state.cart = []; save(); },

  /* ---- Pedidos y colección ---- */
  placeOrder(order) {
    state.orders.unshift(order);
    order.items.forEach((i) => { if (!state.collection.includes(i.id)) state.collection.push(i.id); });
    state.cart = [];
    save();
  },
  getOrder: (id) => state.orders.find((o) => o.id === id),
  isAdopted: (id) => state.collection.includes(id),

  /* ---- Secretos ---- */
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
