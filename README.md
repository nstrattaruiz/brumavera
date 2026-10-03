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
