/* ==========================================================================
   CONTENIDO DEL MUNDO
   --------------------------------------------------------------------------
   Todo el texto, los nombres y el lore viven aquí.
   El sistema visual no conoce ninguna historia: sólo lee este archivo.
   Para crear otro universo, duplicá este archivo y cambiá los valores.

   Claves de presentación (no son texto, eligen qué dibujar):
   - places[].type    → forest | lore | shelf | market | cabinet | book | letter
   - creatures[].form → mandrake | mossling | moth | spirit | sporeling | hooded | fae | seed
   - creatures[].vessel → pot | terrarium | cage | bell | jar | box | frame | stone
   - creatures[].glow → color de acento (usar tonos apagados)
   ========================================================================== */

export default {
  meta: {
    lang: 'es',
    locale: 'es-AR',
    currency: 'USD',
    title: 'Brumavera — criaturas del bosque',
    description: 'Un bosque antiguo donde viven, crecen y se adoptan criaturas.',
  },

  world: {
    name: 'Brumavera',
    epithet: 'Criadero y gabinete de criaturas del bosque',
    introduction:
      'Antes de los caminos hubo raíces. Antes de los nombres hubo cosas que respiraban bajo el musgo.',
    description:
      'Brumavera no se fundó: se encontró. Un claro donde el bosque deja que algunas de sus criaturas sean cuidadas, estudiadas y, a veces, llevadas a otro hogar.',
    mythology:
      'Se dice que cada árbol recuerda todo lo que creció a su sombra. Las criaturas que viven aquí son esos recuerdos, que un día decidieron tener cuerpo.',
    closingLine: 'El bosque estaba aquí antes de que llegaras. Seguirá aquí cuando te vayas.',
  },

  intro: {
    phrase: 'El bosque no está vacío.',
    enter: 'Entrar',
    soundHint: 'Se recomienda sonido',
  },

  ui: {
    soundOn: 'Sonido',
    soundOff: 'Silencio',
    map: 'Mapa',
    close: 'Cerrar',
    back: 'Volver al bosque',
    scrollHint: 'Avanzá despacio',
    adopt: 'Adoptar',
    adopted: 'Ya vive contigo',
    release: 'Devolver al bosque',
    priceless: 'Sin precio',
    habitat: 'Hábitat',
    behaviour: 'Comportamiento',
    character: 'Carácter',
    rarity: 'Rareza',
    status: 'Estado',
    price: 'Ofrenda',
    inspect: 'Observar',
    all: 'Todo',
    emptyDrawer: 'Vacío',
    collectionTitle: 'Lo que vive contigo',
    collectionEmpty: 'Todavía no adoptaste ninguna criatura. Los cajones esperan.',
    findings: 'Hallazgos',
    turnPage: 'Pasar página',
    send: 'Sellar y enviar',
    sent: 'La carta ya está en camino.',
    awakening: 'Algo se mueve…',
    swipe: 'Deslizá',

    /* Tienda */
    cart: 'Cesta',
    cartTitle: 'Tu cesta',
    cartEmpty: 'La cesta está vacía. Algo te espera en el Mercado.',
    goToMarket: 'Ir al Mercado',
    addToCart: 'Adoptar',
    inCart: 'En tu cesta',
    viewCart: 'Ver la cesta',
    keepExploring: 'Seguir explorando',
    checkout: 'Finalizar adopción',
    subtotal: 'Subtotal',
    shipping: 'Envío',
    total: 'Total',
    free: 'Sin cargo',
    remove: 'Quitar',
    quantity: 'Cantidad',
    available: 'disponibles',
    unique: 'Ejemplar único',
    soldOut: 'Ya tiene hogar',
    backToMarket: 'Volver al Mercado',
    backToCart: 'Volver a la cesta',
    related: 'Otras criaturas del claro',
    nextPlace: 'Seguir hacia',
    freeShippingFrom: 'Envío sin cargo desde',
    freeShippingReached: 'Tu envío viaja sin cargo.',
    steps: ['Tus datos', 'Envío', 'Pago'],
    stepNext: 'Continuar',
    stepPrev: 'Volver',
    placeOrder: 'Confirmar adopción',
    processing: 'Sellando el pacto…',
    summary: 'Resumen',
    required: 'Completá este campo.',
    invalidEmail: 'Revisá el correo.',
    invalidCard: 'Revisá el número de tarjeta.',
    invalidExp: 'Revisá el vencimiento.',
    invalidCvc: 'Revisá el código.',
    orderTitle: 'La adopción está sellada',
    orderLead: 'Tu pedido quedó registrado con el número',
    orderNext: 'Próximos pasos',
    orderPaid: 'Pago aprobado.',
    orderCustomer: 'Quién adopta',
    orderShipTo: 'Envío',
    orderPayment: 'Pago',
    sendEmail: 'Enviar el pedido por correo',
    sendWhatsapp: 'Enviar por WhatsApp',
    goToCabinet: 'Ver tu Gabinete',
    orders: 'Tus pedidos',
    demoNotice: 'Tienda en modo demostración: no se realiza ningún cobro real.',
    notFound: 'Esa criatura no está en este claro.',
  },

  /* Comercio. Todo configurable: envíos, medios de pago y datos del pedido. */
  commerce: {
    orderPrefix: 'BRV',
    orderEmail: 'pedidos@brumavera.example',
    defaultCountry: 'Argentina',
    freeShippingFrom: 400,
    fields: {
      name: 'Nombre y apellido',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      address: 'Dirección',
      city: 'Ciudad',
      zip: 'Código postal',
      country: 'País',
      notes: 'Notas para el viaje (opcional)',
      cardName: 'Nombre en la tarjeta',
      cardNumber: 'Número de tarjeta',
      cardExp: 'Vencimiento (MM/AA)',
      cardCvc: 'Código',
    },
    shipping: [
      { id: 'retiro', name: 'Retiro en el claro', detail: 'Coordinamos día y hora por correo.', price: 0, pickup: true },
      { id: 'caja', name: 'Caja de madera con musgo', detail: 'Llega en 5 a 8 días hábiles.', price: 18 },
      { id: 'nocturno', name: 'Envío nocturno', detail: 'Viaja dormida. 2 a 3 días hábiles.', price: 35 },
    ],
    // type: card (formulario de tarjeta, modo demostración) | transfer | whatsapp | email
    payments: [
      { id: 'tarjeta', type: 'card', name: 'Tarjeta de crédito o débito', detail: 'Modo demostración: podés usar 4242 4242 4242 4242.' },
      { id: 'transferencia', type: 'transfer', name: 'Transferencia bancaria', detail: 'Te mostramos los datos al confirmar.', instructions: 'Banco del Bosque · Cuenta 0000-0000-0000 · Alias BRUMAVERA.CLARO. Enviá el comprobante respondiendo el correo del pedido.' },
      { id: 'whatsapp', type: 'whatsapp', name: 'Coordinar por WhatsApp', detail: 'Te abrimos una conversación con el pedido.', phone: '5491100000000' },
    ],
  },

  /* Lugares del mundo. El orden es el recorrido. */
  places: [
    {
      id: 'bosque',
      type: 'forest',
      numeral: 'I',
      name: 'El Bosque',
      subtitle: 'Donde empieza todo lo que no tiene nombre',
      hint: 'Avanzá despacio',
      doorInscription: 'Lo que entra, crece',
      peeker: 'velador-claro', // criatura que se esconde detrás del arbusto
    },
    {
      id: 'umbral',
      type: 'lore',
      numeral: 'II',
      name: 'El Umbral',
      subtitle: 'Lo que se cuenta en voz baja',
    },
    {
      id: 'refugio',
      type: 'shelf',
      numeral: 'III',
      name: 'El Refugio',
      subtitle: 'Las criaturas que hoy aceptan visitas',
    },
    {
      id: 'mercado',
      type: 'market',
      numeral: 'IV',
      name: 'El Mercado',
      subtitle: 'Objetos encontrados, criaturas que eligen',
    },
    {
      id: 'gabinete',
      type: 'cabinet',
      numeral: 'V',
      name: 'El Gabinete',
      subtitle: 'Tu colección',
    },
    {
      id: 'archivo',
      type: 'book',
      numeral: 'VI',
      name: 'El Archivo',
      subtitle: 'Notas sobre el mundo',
    },
    {
      id: 'estafeta',
      type: 'letter',
      numeral: 'VII',
      name: 'La Estafeta',
      subtitle: 'Escribile al bosque',
    },
  ],

  lore: {
    chapters: [
      {
        title: 'De la memoria',
        text: 'Hay lugares donde la tierra no olvida. Allí, lo que alguna vez estuvo vivo deja una forma esperando en el suelo. Con suficiente lluvia y suficiente silencio, esa forma despierta.',
      },
      {
        title: 'Del cuidado',
        text: 'Nadie posee una criatura del bosque. Se la acompaña. Se aprende su luz, su hora, su manera de esconderse. Algunas se quedan toda una vida. Otras, una estación.',
      },
      {
        title: 'Del intercambio',
        text: 'Cada adopción se paga con una ofrenda. Con ella se plantan raíces nuevas en el claro, para que siempre haya algo más esperando ser encontrado.',
      },
    ],
  },

  categories: [
    { id: 'raices', name: 'Raíces' },
    { id: 'musgos', name: 'Musgos y hongos' },
    { id: 'alados', name: 'Alados' },
    { id: 'guardianes', name: 'Guardianes' },
  ],

  creatures: [
    {
      id: 'mandragora-17',
      number: 'Nº 17',
      name: 'Mandrágora',
      form: 'mandrake',
      vessel: 'pot',
      category: 'raices',
      glow: '#9cc79a',
      epithet: 'Crece únicamente donde la tierra conserva memoria.',
      awakenLine: 'Está despierta.',
      description:
        'Pasa la mayor parte del día enterrada hasta los hombros. Al atardecer asoma un poco más, como si escuchara algo que sólo ella oye.',
      habitat: 'Suelos húmedos y lugares donde alguna vez hubo un árbol antiguo.',
      behaviour: 'No le gusta la luz directa. Se inclina hacia las voces graves.',
      character: 'Paciente. Rencorosa si la trasplantan sin aviso.',
      rarity: 'Poco común',
      status: 'Despierta',
      price: 180,
      stock: 3,
    },
    {
      id: 'musguillo-umbria',
      number: 'Nº 4',
      name: 'Musguillo de umbría',
      form: 'mossling',
      vessel: 'terrarium',
      category: 'musgos',
      glow: '#7fbfa8',
      epithet: 'Se alimenta del silencio que queda después de la lluvia.',
      awakenLine: 'Te escuchó llegar.',
      description:
        'Una bola de musgo que respira. Cuando confía, abre dos ojos pequeños y deja que la mires un rato.',
      habitat: 'Piedras sombreadas, troncos caídos, rincones donde el agua tarda en irse.',
      behaviour: 'Rueda muy lentamente hacia la humedad. Duerme casi todo el invierno.',
      character: 'Tímido. Fiel a quien no hace ruido.',
      rarity: 'Común',
      status: 'Despierto',
      price: 95,
      stock: 8,
    },
    {
      id: 'polilla-farol-3',
      number: 'Nº 3',
      name: 'Polilla farol',
      form: 'moth',
      vessel: 'cage',
      category: 'alados',
      glow: '#d9b46a',
      epithet: 'Guarda la luz del último atardecer y la devuelve de a poco.',
      awakenLine: 'Encendió su luz.',
      description:
        'Su abdomen acumula luz durante el día y la libera por la noche, apenas lo suficiente para leer una línea.',
      habitat: 'Bordes del bosque, ventanas abiertas, cerca de velas que nadie apagó.',
      behaviour: 'Vuela en círculos lentos. Se posa siempre del lado izquierdo.',
      character: 'Curiosa. Se aburre en la oscuridad completa.',
      rarity: 'Rara',
      status: 'Inquieta',
      price: 240,
      stock: 2,
    },
    {
      id: 'velador-claro',
      number: 'Nº 1',
      name: 'Velador del claro',
      form: 'spirit',
      vessel: 'bell',
      category: 'guardianes',
      glow: '#a9d2c4',
      epithet: 'Nadie lo vio llegar. Siempre estuvo.',
      awakenLine: 'Ya te estaba mirando.',
      description:
        'Un espíritu con astas de rama. No ocupa espacio, pero cuando está cerca el aire pesa un poco más.',
      habitat: 'Claros antiguos, cruces de senderos, la parte del bosque que no aparece en los mapas.',
      behaviour: 'Observa. Desaparece si se lo nombra tres veces.',
      character: 'Antiguo. Indiferente a casi todo, salvo a los árboles jóvenes.',
      rarity: 'Excepcional',
      status: 'En observación',
      price: 620,
      stock: 1,
    },
    {
      id: 'esporin-gris',
      number: 'Nº 9',
      name: 'Esporín gris',
      form: 'sporeling',
      vessel: 'jar',
      category: 'musgos',
      glow: '#86c6c0',
      epithet: 'Respira por las laminillas. Si lo escuchás, respira con vos.',
      awakenLine: 'Soltó una espora.',
      description:
        'Un hongo pequeño que decidió caminar. Sus laminillas brillan cuando está contento, o cuando tiene hambre; todavía no sabemos distinguirlo.',
      habitat: 'Madera húmeda, cortezas en descomposición, frascos con tapa floja.',
      behaviour: 'Se queda quieto si se lo mira. Se mueve si no.',
      character: 'Juguetón, a su manera.',
      rarity: 'Común',
      status: 'Despierto',
      price: 120,
      stock: 6,
    },
    {
      id: 'encapuchado-corteza',
      number: 'Nº 12',
      name: 'Encapuchado de corteza',
      form: 'hooded',
      vessel: 'box',
      category: 'guardianes',
      glow: '#e0b46a',
      epithet: 'Vigila los cruces de caminos que ya nadie usa.',
      awakenLine: 'Te dejó ver sus ojos.',
      description:
        'Lleva una capa de corteza que él mismo teje. Nunca se le ha visto la cara; sólo dos puntos de luz y unas manos muy largas.',
      habitat: 'Huecos de árboles, cajas olvidadas, debajo de los puentes de madera.',
      behaviour: 'Colecciona objetos pequeños. Devuelve los que no le gustan.',
      character: 'Desconfiado, pero justo.',
      rarity: 'Rara',
      status: 'Desconfiado',
      price: 310,
      stock: 2,
    },
    {
      id: 'hada-prensada',
      number: 'Nº 22',
      name: 'Hada prensada',
      form: 'fae',
      vessel: 'frame',
      category: 'alados',
      glow: '#c9c08f',
      epithet: 'No está muerta. Está esperando.',
      awakenLine: 'Movió un ala.',
      description:
        'Encontrada entre las páginas de un herbario. Sus alas son nervaduras secas. A veces cambia de postura durante la noche.',
      habitat: 'Libros cerrados, cajones de herbolarios, lugares donde el tiempo se detuvo.',
      behaviour: 'Permanece inmóvil durante semanas. Luego, un día, ya no está donde la dejaste.',
      character: 'Melancólica. Atenta.',
      rarity: 'Rara',
      status: 'En letargo',
      price: 450,
      stock: 1,
    },
    {
      id: 'semilla-sin-nombre',
      number: 'Nº 0',
      name: 'Semilla sin nombre',
      form: 'seed',
      vessel: 'jar',
      category: 'raices',
      glow: '#b8d6a0',
      hidden: true, // sólo aparece cuando se encuentran suficientes secretos
      epithet: 'No figura en ningún registro.',
      awakenLine: 'Abrió un ojo.',
      description:
        'Apareció sola, dentro de un frasco que nadie recuerda haber cerrado. Sólo se deja ver ante quien buscó con paciencia.',
      habitat: 'Desconocido.',
      behaviour: 'Duerme. Sueña con un árbol que todavía no existe.',
      character: 'Por descubrir.',
      rarity: 'Única',
      status: 'Sin despertar',
      price: 77,
      stock: 1,
    },
  ],

  archive: {
    pages: [
      {
        title: 'Sobre el clima',
        text: 'En Brumavera llueve tres días de cada cinco. Los otros dos, la niebla hace el trabajo. Las criaturas prefieren las horas grises: el mediodía es para dormir.',
      },
      {
        title: 'Sobre la luz',
        text: 'Ninguna luz es completamente nuestra. Los hongos la prestan, las polillas la guardan, las velas la gastan. Se recomienda no encender más de una por habitación.',
      },
      {
        title: 'Sobre los nombres',
        text: 'Cada criatura llega con un número, nunca con un nombre. El nombre lo pone quien la acompaña, y sólo después de la primera luna compartida.',
      },
      {
        title: 'Sobre el regreso',
        text: 'Toda criatura puede volver al bosque. No es un fracaso: es una estación que terminó. Las raíces siempre dejan el camino abierto.',
      },
      {
        title: 'Sobre los envíos',
        text: 'Las criaturas viajan dormidas, en cajas de madera con musgo fresco. Llegan cuando llegan. Algunas se adelantan.',
      },
      {
        title: 'Nota al margen',
        text: 'Si alguna vez sentís que algo te observa desde la esquina de la pantalla, no es un error. Saludá.',
      },
    ],
  },

  contact: {
    lead: 'Las cartas se dejan en el hueco del roble. Alguien las recoge al anochecer.',
    email: 'hola@brumavera.example',
    fields: {
      name: 'Tu nombre',
      email: 'Dónde responderte',
      message: 'Lo que querés contarle al bosque',
    },
    subject: 'Una carta para Brumavera',
  },

  /* Secretos repartidos por el mundo. El id lo usa el sistema; el texto es libre. */
  secrets: {
    unlockThreshold: 3,
    unlockMessage: 'Algo nuevo apareció en el Mercado.',
    items: [
      { id: 'wisp', mark: '✶', message: 'La luz se dejó tocar. Estaba cansada de huir.' },
      { id: 'sigil', mark: '᛭', message: 'Alguien talló esto antes de que existieran los caminos.' },
      { id: 'watcher', mark: '◉', message: 'Algo te observa desde que llegaste. No es hostil.' },
      { id: 'branch', mark: '❦', message: 'La rama soltó una hoja. Tenía algo escrito: «gracias».' },
      { id: 'shadow', mark: '☾', message: 'Sólo pasa una vez. La viste.' },
    ],
  },

  /* Frases que el bosque deja caer de vez en cuando. */
  whispers: [
    '¿Eso se movió?',
    'Hace un rato había algo ahí.',
    'No todas las ramas son ramas.',
    'Escuchá: el musgo también respira.',
  ],

  /* Arquitectura de audio. Si se definen archivos, se usan; si no, se sintetiza. */
  audio: {
    ambient: null, // ej: 'assets/audio/bosque.mp3'
    volume: 0.5,
  },
};
