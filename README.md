# Brumavera

Web experimental e inmersiva: un bosque antiguo donde viven, crecen y se adoptan criaturas.
Todo es HTML, CSS y JavaScript del lado del cliente (sin backend). Las ilustraciones, ramas y sonidos se generan por código.

## Ver en local

Usa módulos ES, así que necesita un servidor estático (no funciona abriendo el archivo con doble clic):

```bash
npx serve .
# o
python -m http.server
```

## Cambiar el universo

Todo el texto vive en [`data/content.js`](data/content.js): nombre del mundo, historia, lugares, criaturas, precios, categorías, secretos, frases y textos de la interfaz. El sistema visual no conoce ninguna historia, así que se puede reemplazar el lore completo sin tocar el código.

Algunas claves eligen qué dibujar (no son texto):

| Clave | Valores |
| --- | --- |
| `places[].type` | `forest`, `lore`, `shelf`, `market`, `cabinet`, `book`, `letter` |
| `creatures[].form` | `mandrake`, `mossling`, `moth`, `spirit`, `sporeling`, `hooded`, `fae`, `seed` |
| `creatures[].vessel` | `pot`, `terrarium`, `cage`, `bell`, `jar`, `box`, `frame`, `stone` |
| `creatures[].glow` | color de acento de la criatura |
| `creatures[].hidden` | sólo aparece tras encontrar `secrets.unlockThreshold` secretos |
| `audio.ambient` | ruta a un archivo de ambiente; si es `null` el sonido se sintetiza |

## Tienda

Cada lugar es una vista con su propia ruta (`#/mercado`, `#/criatura/mandragora-17`, `#/checkout`, `#/pedido/BRV-XXXX`).

- **Ficha de criatura:** cantidad, stock disponible y "Adoptar", que suma la criatura a la cesta.
- **Cesta:** panel lateral con cantidades, subtotal y progreso hacia el envío gratis.
- **Checkout en tres pasos:** datos, envío y pago.
- **Confirmación:** número de pedido y opción de enviarlo por correo o WhatsApp.
- **Gabinete:** la colección adoptada y el historial de pedidos.

Envíos, medios de pago, envío gratis y textos se configuran en `commerce` dentro de `data/content.js`; el stock, en cada criatura (`stock`).

No hay backend: los pedidos se guardan en el navegador del visitante. El pago con tarjeta es una **simulación** (sirve `4242 4242 4242 4242`). Para cobrar de verdad hace falta conectar una pasarela (Mercado Pago, Stripe Payment Links, etc.) o un backend.

## Estructura

```
data/content.js          contenido (lore, textos, criaturas)
components/              piezas reutilizables
  branch.js              createBranch, createBranchCluster, createRoots
  creature.js            createCreature (ilustraciones SVG)
  product.js             createProduct (objetos y recipientes)
  discovery.js           exploración de una criatura / detalle
  lore.js                createLoreSection
  interactive.js         createInteractiveObject, luz que huye, susurros
  nav.js                 navegación, mapa de raíces, paso entre lugares
scripts/
  core/                  utilidades, partículas, cursor, audio, estado
  world/                 intro, bosque, dosel, lugares interiores, secretos
  main.js                arma el mundo y conecta la coreografía de scroll
styles/                  base, mundo, lugares, objetos
```

Librerías (CDN): GSAP + ScrollTrigger y Lenis.
