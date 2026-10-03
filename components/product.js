/* Productos como objetos encontrados: cada criatura vive dentro de un recipiente
   (maceta, frasco, jaula, campana, caja, terrario, marco). Lienzo: 240 × 300. */

import { h, esc } from '../scripts/core/utils.js';
import { creatureMarkup, watchCursor } from './creature.js';
import { store } from '../scripts/core/store.js';

let vid = 0;

const GLASS = 'rgba(229,222,199,0.045)';
const GLASS_EDGE = 'rgba(229,222,199,0.22)';
const BRASS = '#806b42';

// Cada recipiente recibe el marcado de la criatura y devuelve el dibujo completo.
const vessels = {
  pot(c) {
    const clip = `vc${++vid}`;
    return `
      <defs><clipPath id="${clip}"><rect x="0" y="0" width="240" height="226"/></clipPath></defs>
      <ellipse cx="120" cy="290" rx="74" ry="7" fill="#000" opacity=".5"/>
      <g clip-path="url(#${clip})"><g class="v-rise" style="--rise:46px;--rise-near:14px">
        <g transform="translate(20 34)">${c}</g></g></g>
      <path d="M58 222L72 288L168 288L182 222Z" fill="#594c32"/>
      <path d="M58 222L72 288L96 288L84 222Z" fill="#000" opacity=".18"/>
      <rect x="50" y="212" width="140" height="16" rx="3" fill="#6d5a37"/>
      <ellipse cx="120" cy="214" rx="64" ry="5" fill="#1d1810"/>
      <path d="M70 246Q120 252 172 244" stroke="#3f3524" stroke-width="1" fill="none" opacity=".7"/>`;
  },
  jar(c) {
    return `
      <ellipse cx="120" cy="290" rx="66" ry="6" fill="#000" opacity=".5"/>
      <g class="v-inner"><g transform="translate(58 104) scale(.62)">${c}</g></g>
      <path d="M62 96Q56 96 56 108L56 270Q56 286 72 286L168 286Q184 286 184 270L184 108Q184 96 178 96Z" fill="${GLASS}" stroke="${GLASS_EDGE}" stroke-width="1.2"/>
      <path d="M68 116L68 262" stroke="#e5dec7" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>
      <rect x="74" y="72" width="92" height="26" rx="3" fill="${BRASS}"/>
      <rect x="74" y="72" width="92" height="7" rx="3" fill="#b39a63" opacity=".35"/>
      <path d="M70 100Q120 108 170 100" stroke="#b39a63" stroke-width="1.4" fill="none"/>
      <path class="v-tag" d="M150 104L162 132L144 136Z" fill="#d4c59a" opacity=".8"/>`;
  },
  terrarium(c) {
    return `
      <ellipse cx="120" cy="292" rx="96" ry="6" fill="#000" opacity=".5"/>
      <path d="M32 252Q120 232 208 252L208 282L32 282Z" fill="#1f2b1f"/>
      <g class="v-inner"><g transform="translate(46 92) scale(.74)">${c}</g></g>
      <path d="M40 248Q80 238 120 244" stroke="#34432f" stroke-width="5" fill="none" stroke-linecap="round"/>
      <rect x="30" y="108" width="180" height="176" fill="${GLASS}" stroke="${BRASS}" stroke-width="3"/>
      <path d="M30 108L120 64L210 108" fill="${GLASS}" stroke="${BRASS}" stroke-width="3" stroke-linejoin="round"/>
      <line x1="120" y1="64" x2="120" y2="284" stroke="${BRASS}" stroke-width="1.5" opacity=".6"/>
      <circle cx="120" cy="60" r="5" fill="${BRASS}"/>
      <path d="M40 120L40 270" stroke="#e5dec7" stroke-opacity=".15" stroke-width="3"/>`;
  },
  cage(c) {
    const bars = [-1, -0.66, -0.33, 0, 0.33, 0.66, 1]
      .map((k) => `<path d="M120 52C${120 + k * 100} 70 ${120 + k * 92} 150 ${120 + k * 86} 266" fill="none"/>`)
      .join('');
    return `
      <ellipse cx="120" cy="290" rx="92" ry="6" fill="#000" opacity=".5"/>
      <g class="v-inner"><g transform="translate(44 64) scale(.76)">${c}</g></g>
      <g stroke="#6b5a39" stroke-width="1.6">${bars}</g>
      <ellipse cx="120" cy="268" rx="88" ry="10" fill="#2a2418" stroke="${BRASS}" stroke-width="2"/>
      <circle cx="120" cy="40" r="11" fill="none" stroke="${BRASS}" stroke-width="2.4"/>
      <path d="M100 160Q120 166 140 160" stroke="#3f3524" stroke-width="1" opacity="0"/>`;
  },
  bell(c) {
    return `
      <ellipse cx="120" cy="292" rx="96" ry="6" fill="#000" opacity=".5"/>
      <g class="v-inner"><g transform="translate(46 70) scale(.76)">${c}</g></g>
      <path d="M50 266L50 130C50 56 190 56 190 130L190 266Z" fill="${GLASS}" stroke="${GLASS_EDGE}" stroke-width="1.2"/>
      <path d="M64 130C64 90 90 74 112 72" stroke="#e5dec7" stroke-opacity=".22" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="120" cy="58" r="7" fill="${GLASS}" stroke="${GLASS_EDGE}"/>
      <rect x="34" y="264" width="172" height="18" rx="3" fill="#594c32"/>
      <rect x="34" y="264" width="172" height="5" rx="2" fill="#806b42"/>`;
  },
  box(c) {
    return `
      <ellipse cx="120" cy="290" rx="92" ry="6" fill="#000" opacity=".5"/>
      <rect x="44" y="178" width="152" height="18" fill="#120f0a"/>
      <g class="v-lid"><rect x="40" y="160" width="160" height="20" rx="2" fill="#594c32"/><rect x="40" y="160" width="160" height="4" fill="#806b42"/></g>
      <g class="v-rise" style="--rise:32px;--rise-near:6px"><g transform="translate(38 50) scale(.82)">${c}</g></g>
      <rect x="40" y="194" width="160" height="92" rx="2" fill="#4a3e28"/>
      <g stroke="#2c2416" stroke-width="1"><line x1="40" y1="224" x2="200" y2="224"/><line x1="40" y1="254" x2="200" y2="254"/></g>
      <rect x="110" y="210" width="20" height="14" rx="2" fill="${BRASS}"/><circle cx="120" cy="217" r="2" fill="#120f0a"/>`;
  },
  frame(c) {
    return `
      <ellipse cx="120" cy="292" rx="90" ry="6" fill="#000" opacity=".5"/>
      <rect x="28" y="34" width="184" height="250" fill="#3f3524"/>
      <rect x="40" y="46" width="160" height="226" fill="#1a1810"/>
      <rect x="40" y="46" width="160" height="226" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="4"/>
      <g class="v-inner"><g transform="translate(36 40) scale(.84)">${c}</g></g>
      <path d="M80 252L160 252" stroke="#b39a63" stroke-opacity=".5" stroke-width=".8"/>
      <path d="M86 258L144 258" stroke="#b39a63" stroke-opacity=".3" stroke-width=".6"/>
      <rect x="40" y="46" width="160" height="226" fill="${GLASS}"/>
      <path d="M52 60L52 160" stroke="#e5dec7" stroke-opacity=".1" stroke-width="3"/>`;
  },
  stone(c) {
    return `
      <ellipse cx="120" cy="290" rx="90" ry="6" fill="#000" opacity=".5"/>
      <g class="v-inner"><g transform="translate(30 20) scale(.9)">${c}</g></g>
      <path d="M40 286C36 254 60 234 120 234C180 234 206 254 200 286Z" fill="#243226"/>
      <path d="M52 250C80 238 160 238 190 252" stroke="#34432f" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  },
};

export function vesselMarkup(creature) {
  const draw = vessels[creature.vessel] || vessels.stone;
  return `<svg viewBox="0 0 240 300" class="vessel v--${creature.vessel}" aria-hidden="true">${draw(creatureMarkup(creature))}</svg>`;
}

export function formatPrice(price, content) {
  if (price == null) return content.ui.priceless;
  try {
    return new Intl.NumberFormat(content.meta.locale, { style: 'currency', currency: content.meta.currency, maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${price}`;
  }
}

/**
 * Crea un objeto/producto interactivo.
 * @param {object} creature  datos del contenido
 * @param {object} deps      { content, particles, audio, onOpen, variant }
 */
export function createProduct(creature, { content, particles, audio, onOpen, variant = 'shelf' }) {
  const el = h('article', {
    class: `object object--${variant}`,
    tabindex: 0,
    role: 'button',
    'data-id': creature.id,
    'data-category': creature.category,
    'data-cursor': 'object',
    'data-cursor-label': content.ui.inspect,
    'aria-label': `${creature.name} ${creature.number}`,
  });
  el.innerHTML = `
    <div class="object__art">${vesselMarkup(creature)}</div>
    <div class="object__tag">
      <span class="object__num">${esc(creature.number)}</span>
      <span class="object__name">${esc(creature.name)}</span>
      ${variant === 'table' ? `<span class="object__price">${esc(formatPrice(creature.price, content))}</span>` : ''}
    </div>
    <span class="object__mark" aria-hidden="true"></span>`;

  const creatureEl = el.querySelector('.creature');
  watchCursor(creatureEl);

  const syncAdopted = () => el.classList.toggle('is-adopted', store.isAdopted(creature.id));
  syncAdopted();
  store.subscribe(syncAdopted);

  let dustTimer;
  const near = () => {
    el.classList.add('is-near');
    audio?.play('rustle', 0.05);
    const b = el.querySelector('.object__art').getBoundingClientRect();
    particles?.emit(b.left + b.width / 2, b.top + b.height * 0.35, { count: 6, spread: b.width * 0.4, glow: true, size: 1.4, color: creature.glow, life: 70, lift: 0.4, alpha: 0.5 });
    clearInterval(dustTimer);
    dustTimer = setInterval(() => {
      particles?.emit(b.left + b.width * (0.3 + Math.random() * 0.4), b.top + b.height * 0.4, { size: 0.9, life: 60, color: '#d4c59a', alpha: 0.6, lift: 0.3 });
    }, 220);
  };
  const far = () => { el.classList.remove('is-near'); clearInterval(dustTimer); };

  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') near(); });
  el.addEventListener('pointerleave', far);
  el.addEventListener('focus', near);
  el.addEventListener('blur', far);
  el.addEventListener('click', () => { far(); onOpen?.(creature, el); });
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(creature, el); } });

  // De vez en cuando, la criatura abre los ojos sola: "¿había algo ahí?"
  const peek = () => {
    if (!document.hidden && !el.classList.contains('is-near')) {
      el.classList.add('is-peeking');
      setTimeout(() => el.classList.remove('is-peeking'), 1600 + Math.random() * 1400);
    }
    setTimeout(peek, 7000 + Math.random() * 16000);
  };
  setTimeout(peek, 3000 + Math.random() * 12000);

  return el;
}
