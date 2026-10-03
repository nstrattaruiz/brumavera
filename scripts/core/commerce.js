/* Lógica de tienda sin backend: disponibilidad, líneas de la cesta, totales y pedidos. */

import { store } from './store.js';
import { formatPrice } from '../../components/product.js';

export function createCommerce(content) {
  const cfg = content.commerce;
  const byId = (id) => content.creatures.find((c) => c.id === id);
  const money = (n) => formatPrice(n, content);

  /** Unidades que todavía pueden adoptarse (stock menos lo ya adoptado). */
  const available = (c) => Math.max(0, (c.stock ?? Infinity) - store.purchased(c.id));
  /** Cuántas más se pueden sumar a la cesta. */
  const addable = (c) => Math.max(0, available(c) - store.inCart(c.id));

  const lines = () => store.state.cart
    .map((l) => ({ ...l, creature: byId(l.id) }))
    .filter((l) => l.creature);

  const subtotal = () => lines().reduce((s, l) => s + (l.creature.price || 0) * l.qty, 0);

  function shippingCost(method, sub = subtotal()) {
    if (!method || method.pickup) return 0;
    if (cfg.freeShippingFrom && sub >= cfg.freeShippingFrom) return 0;
    return method.price || 0;
  }

  function newOrderId() {
    const n = Date.now().toString(36).slice(-4).toUpperCase() + Math.floor(Math.random() * 36).toString(36).toUpperCase();
    return `${cfg.orderPrefix || 'PED'}-${n}`;
  }

  /** Resumen en texto plano (para correo o WhatsApp). */
  function orderText(o) {
    const ui = content.ui;
    const items = o.items.map((i) => `· ${i.number} ${i.name} × ${i.qty} — ${money(i.price * i.qty)}`).join('\n');
    const ship = o.shipping.pickup ? o.shipping.name : `${o.shipping.name}\n${o.shipping.address}, ${o.shipping.city} (${o.shipping.zip}), ${o.shipping.country}`;
    return [
      `${content.world.name} — ${o.id}`,
      '',
      items,
      '',
      `${ui.subtotal}: ${money(o.subtotal)}`,
      `${ui.shipping}: ${o.shippingCost ? money(o.shippingCost) : ui.free}`,
      `${ui.total}: ${money(o.total)}`,
      '',
      `${ui.orderCustomer}: ${o.customer.name} · ${o.customer.email}${o.customer.phone ? ' · ' + o.customer.phone : ''}`,
      `${ui.orderShipTo}: ${ship}`,
      `${ui.orderPayment}: ${o.payment.name}`,
      o.notes ? `\n${o.notes}` : '',
    ].join('\n');
  }

  return { cfg, byId, money, available, addable, lines, subtotal, shippingCost, newOrderId, orderText };
}
