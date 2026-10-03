/* Enrutador por hash: #/mercado, #/criatura/mandragora-17, #/checkout, #/pedido/BRV-1234.
   Cada lugar es una vista independiente: sólo una está visible a la vez. */

export function createRouter(onRoute) {
  let started = false;
  const parse = () => {
    const [view = '', ...params] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    return { view, params };
  };
  addEventListener('hashchange', () => started && onRoute(parse()));

  return {
    get current() { return parse(); },
    /** Navega a una ruta ('mercado', 'criatura/id'). opts se reenvía a la vista. */
    go(path, opts = {}) {
      const target = `#/${path}`;
      this.pendingOpts = opts;
      if (location.hash === target) onRoute(parse());
      else location.hash = target;
    },
    pendingOpts: {},
    start() { started = true; onRoute(parse()); },
  };
}
