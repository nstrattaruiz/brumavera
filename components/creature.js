/* Criaturas dibujadas en SVG. El contenido elige la forma (data.form) y el color de luz
   (data.glow); el resto —nombre, historia, precio— nunca se usa aquí.
   Lienzo de referencia: 200 × 240, suelo en y≈222. */

import { rng, smoothPath, fmt, SVG_NS } from '../scripts/core/utils.js';
import { leafPath } from './branch.js';

let uidCounter = 0;
const uid = (p) => `${p}${++uidCounter}`;

function eyes(points, r, glow) {
  return `<g class="c-eyes">${points
    .map(([x, y]) => `<g class="c-eye"><circle cx="${x}" cy="${y}" r="${fmt(r * 2.8)}" fill="${glow}" opacity=".14"/><circle cx="${x}" cy="${y}" r="${r}" fill="${glow}"/></g>`)
    .join('')}</g>`;
}

function halo(cx, cy, rr, glow, id) {
  return `<radialGradient id="${id}"><stop offset="0" stop-color="${glow}" stop-opacity=".35"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
  <circle class="c-glow" cx="${cx}" cy="${cy}" r="${rr}" fill="url(#${id})"/>`;
}

const forms = {
  mandrake(glow) {
    const gb = uid('mb'), gh = uid('mh');
    const leaves = [-158, -128, -100, -78, -52, -24]
      .map((a, i) => `<g transform="translate(100 74) rotate(${a})"><path class="c-leaf" style="--i:${i}" d="${leafPath(38 + (i % 3) * 9, 15)}" fill="${i % 2 ? '#2b3a2a' : '#34432f'}"/></g>`)
      .join('');
    const r = rng(17);
    // Pelos de raíz: trazos finos e irregulares que salen del cuerpo
    const hairs = Array.from({ length: 16 }, () => {
      const y = r.range(96, 186), side = r.sign();
      const x = 100 + side * (30 - Math.abs(y - 128) * 0.26);
      return `<path d="M${fmt(x)} ${fmt(y)}q${fmt(side * r.range(4, 9))} ${fmt(r.range(-2, 5))} ${fmt(side * r.range(9, 16))} ${fmt(r.range(2, 10))}"/>`;
    }).join('');
    return `
      <defs><radialGradient id="${gb}" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#8f7b52"/><stop offset=".55" stop-color="#5e4f33"/><stop offset="1" stop-color="#2a2216"/></radialGradient></defs>
      ${halo(100, 90, 70, glow, gh)}
      <g class="c-crown">${leaves}</g>
      <g class="c-body">
        <g fill="none" stroke="#4f4229" stroke-linecap="round">
          <path d="M73 118C62 128 58 140 50 150C46 156 40 158 36 164" stroke-width="2.6"/><path d="M56 144C50 142 46 138 41 138" stroke-width="1.2"/>
          <path d="M127 120C136 132 140 146 149 154C153 158 158 160 161 167" stroke-width="2.4"/><path d="M143 148C149 148 152 144 157 143" stroke-width="1.1"/>
          <path d="M93 192C88 204 80 212 72 226C70 230 66 232 62 236" stroke-width="2.4"/><path d="M107 194C112 208 120 214 126 226" stroke-width="2.2"/>
          <path d="M100 202C102 214 97 224 99 236" stroke-width="1.6"/><path d="M84 212C78 214 72 210 66 210" stroke-width=".8"/>
          <path d="M117 214C123 219 128 217 134 220" stroke-width=".8"/>
        </g>
        <path d="M100 72C84 72 72 86 69 104C66 122 70 136 74 150C79 166 86 180 93 193L99 205L106 194C114 180 124 164 128 146C132 130 134 112 130 98C126 82 114 72 100 72Z" fill="url(#${gb})"/>
        <g fill="none" stroke="#3a301e" stroke-linecap="round" stroke-width=".7" opacity=".85">${hairs}</g>
        <g fill="none" stroke="#2f2718" stroke-linecap="round" opacity=".75">
          <path d="M76 134Q92 139 104 135Q114 132 126 135" stroke-width="1"/><path d="M75 146Q90 152 102 148Q114 145 126 141" stroke-width=".9"/>
          <path d="M86 172Q96 176 108 171" stroke-width=".8"/><path d="M84 90Q92 86 99 89" stroke-width=".7"/>
        </g>
        <ellipse cx="89" cy="105" rx="5" ry="4" fill="#1d170e"/><ellipse cx="111" cy="104" rx="5" ry="4" fill="#1d170e"/>
        ${eyes([[89, 105], [111, 104]], 1.7, glow)}
      </g>`;
  },

  mossling(glow) {
    const r = rng(42), gm = uid('mg'), gh = uid('mh');
    const pts = Array.from({ length: 22 }, (_, i) => {
      const a = (i / 22) * Math.PI * 2;
      const rad = 54 + r.range(-4, 4);
      return [100 + Math.cos(a) * rad * 1.05, 162 + Math.sin(a) * rad * 0.92];
    });
    const specks = Array.from({ length: 40 }, () => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 46;
      return `<circle cx="${fmt(100 + Math.cos(a) * d)}" cy="${fmt(162 + Math.sin(a) * d * 0.9)}" r="${fmt(r.range(0.6, 2))}" fill="${r() < 0.7 ? '#4a5a3e' : '#1b2419'}"/>`;
    }).join('');
    return `
      <defs><radialGradient id="${gm}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#3f5138"/><stop offset=".7" stop-color="#243226"/><stop offset="1" stop-color="#111812"/></radialGradient></defs>
      ${halo(100, 160, 80, glow, gh)}
      <g class="c-body">
        <ellipse cx="82" cy="214" rx="9" ry="4" fill="#111812"/><ellipse cx="118" cy="214" rx="9" ry="4" fill="#111812"/>
        <path d="${smoothPath(pts, true)}" fill="url(#${gm})"/>
        ${specks}
        <g class="c-crown" fill="none" stroke="#5b6e48" stroke-linecap="round" stroke-width="1.6">
          <path class="c-leaf" style="--i:0" d="M92 112C88 96 96 86 104 90C110 94 106 102 100 100"/>
          <path class="c-leaf" style="--i:1" d="M110 114C114 100 124 96 128 102C130 108 124 110 122 106"/>
          <path class="c-leaf" style="--i:2" d="M80 118C72 108 74 98 80 98C85 99 84 105 80 104"/>
        </g>
        ${eyes([[86, 156], [114, 156]], 3.2, glow)}
      </g>`;
  },

  moth(glow) {
    const gw = uid('mw'), gh = uid('mh');
    const wingL = `<path d="M100 122C82 84 42 66 20 86C10 108 34 138 98 136Z" fill="url(#${gw})"/>
      <path d="M100 136C76 142 48 160 54 188C68 200 92 172 100 150Z" fill="url(#${gw})" opacity=".9"/>
      <circle cx="54" cy="102" r="10" fill="#211c12"/><circle cx="54" cy="102" r="4.5" fill="#b39a63" opacity=".55"/>
      <g fill="none" stroke="#2a2418" stroke-width=".7" opacity=".8"><path d="M98 128C80 112 56 96 30 92"/><path d="M98 132C74 128 50 124 26 112"/><path d="M98 142C84 156 70 170 60 184"/></g>`;
    return `
      <defs><linearGradient id="${gw}" x1="0" x2="1"><stop offset="0" stop-color="#594c32"/><stop offset="1" stop-color="#34432f"/></linearGradient></defs>
      ${halo(100, 156, 70, glow, gh)}
      <g class="c-body">
        <g class="c-wing c-wing--l">${wingL}</g>
        <g class="c-wing c-wing--r"><g transform="translate(200 0) scale(-1 1)">${wingL}</g></g>
        <g fill="none" stroke="#806b42" stroke-width="1" stroke-linecap="round">
          <path d="M97 106C90 90 82 82 72 78"/><path d="M103 106C110 90 118 82 128 78"/>
          <path d="M88 88l-4-4M84 84l-4-2M92 94l-5-3M112 88l4-4M116 84l4-2M108 94l5-3" stroke-width=".7"/>
        </g>
        <ellipse cx="100" cy="138" rx="7" ry="24" fill="#2a2418"/>
        <ellipse class="c-glow c-abdomen" cx="100" cy="156" rx="5.5" ry="11" fill="${glow}" opacity=".85"/>
        <circle cx="100" cy="112" r="7" fill="#2a2418"/>
        ${eyes([[96.5, 110], [103.5, 110]], 1.7, glow)}
      </g>`;
  },

  spirit(glow) {
    const gv = uid('sv'), gh = uid('sh');
    const antler = (side) => {
      const m = side < 0 ? '' : 'transform="translate(200 0) scale(-1 1)"';
      return `<g ${m} fill="none" stroke="#806b42" stroke-linecap="round">
        <path d="M90 80C82 64 74 52 60 40" stroke-width="2.6"/><path d="M60 40C54 34 50 26 50 18" stroke-width="1.6"/>
        <path d="M74 56C66 54 58 50 50 42" stroke-width="1.5"/><path d="M66 46C66 38 70 30 74 24" stroke-width="1.3"/>
        <path d="M84 70C78 70 70 72 62 70" stroke-width="1.2"/><path d="M52 44C46 44 40 40 36 34" stroke-width=".9"/>
        <g transform="translate(74 24) rotate(-60)"><path class="c-leaf" style="--i:${side < 0 ? 0 : 1}" d="${leafPath(11, 5)}" fill="#34432f" stroke="none"/></g>
      </g>`;
    };
    return `
      <defs><linearGradient id="${gv}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e5dec7" stop-opacity=".38"/><stop offset=".6" stop-color="#d4c59a" stop-opacity=".12"/><stop offset="1" stop-color="#d4c59a" stop-opacity="0"/></linearGradient></defs>
      ${halo(100, 110, 90, glow, gh)}
      <g class="c-body c-float">
        ${antler(-1)}${antler(1)}
        <path d="M100 70C70 72 58 110 60 150C62 185 50 205 40 222C70 214 80 228 100 220C120 228 130 214 160 222C150 205 138 185 140 150C142 110 130 72 100 70Z" fill="url(#${gv})" stroke="#d4c59a" stroke-opacity=".22"/>
        <path d="M100 84C92 86 86 98 86 116C86 132 94 146 100 150C106 146 114 132 114 116C114 98 108 86 100 84Z" fill="#e5dec7" opacity=".08"/>
        <ellipse cx="89" cy="110" rx="5" ry="7.5" fill="#0b0d0a"/><ellipse cx="111" cy="110" rx="5" ry="7.5" fill="#0b0d0a"/>
        ${eyes([[89, 111], [111, 111]], 1.7, glow)}
      </g>`;
  },

  sporeling(glow) {
    const gc = uid('sc'), gs = uid('ss'), gh = uid('sh');
    const r = rng(9);
    const spots = Array.from({ length: 9 }, () => `<ellipse cx="${fmt(r.range(58, 142))}" cy="${fmt(r.range(70, 104))}" rx="${fmt(r.range(2, 5))}" ry="${fmt(r.range(1.5, 3))}" fill="#806b42" opacity=".45"/>`).join('');
    const gills = Array.from({ length: 11 }, (_, i) => {
      const x = 52 + i * 9.6;
      return `<path d="M${fmt(x)} 112Q${fmt((x + 100) / 2)} 118 100 121" />`;
    }).join('');
    return `
      <defs>
        <linearGradient id="${gc}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#594c32"/><stop offset="1" stop-color="#241f15"/></linearGradient>
        <linearGradient id="${gs}" x1="0" x2="1"><stop offset="0" stop-color="#806b42"/><stop offset=".45" stop-color="#d4c59a"/><stop offset="1" stop-color="#806b42"/></linearGradient>
      </defs>
      ${halo(100, 120, 80, glow, gh)}
      <g class="c-body">
        <path d="M84 116C80 150 78 190 82 214L118 214C122 190 120 150 116 116Z" fill="url(#${gs})" opacity=".85"/>
        <g fill="none" stroke="#b39a63" stroke-linecap="round" stroke-width="1.2"><path d="M82 160C74 166 70 174 66 182"/><path d="M118 160C126 166 130 174 134 182"/></g>
        <path d="M82 214Q74 220 70 222M118 214Q126 220 130 222" stroke="#806b42" stroke-width="1.6" fill="none"/>
        <g class="c-glow" fill="none" stroke="${glow}" stroke-width=".8" opacity=".6">${gills}</g>
        <path d="M40 112C44 70 80 52 100 52C120 52 156 70 160 112C140 120 60 120 40 112Z" fill="url(#${gc})"/>
        ${spots}
        ${eyes([[92, 138], [108, 138]], 2.3, glow)}
      </g>`;
  },

  hooded(glow) {
    const gc = uid('hc'), gh = uid('hh');
    const r = rng(5);
    const bark = Array.from({ length: 9 }, (_, i) => {
      const x = 74 + i * 6.5;
      return `<path d="M${x} ${fmt(r.range(96, 130))}C${fmt(x + r.range(-3, 3))} 160 ${fmt(x + r.range(-4, 4))} 190 ${fmt(x - 8 + i * 2)} 220"/>`;
    }).join('');
    return `
      <defs><linearGradient id="${gc}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34432f"/><stop offset="1" stop-color="#141a12"/></linearGradient></defs>
      ${halo(100, 112, 50, glow, gh)}
      <g class="c-body">
        <path d="M100 48C92 62 80 90 76 120C70 160 62 196 56 222L144 222C138 196 130 160 124 120C120 90 108 62 100 48Z" fill="url(#${gc})"/>
        <g fill="none" stroke="#1b2419" stroke-width="1.1" opacity=".9">${bark}</g>
        <ellipse cx="100" cy="114" rx="16" ry="21" fill="#050605"/>
        ${eyes([[93.5, 114], [106.5, 114]], 2, glow)}
        <g fill="none" stroke="#b39a63" stroke-linecap="round" stroke-width="1.1" opacity=".85">
          <path d="M84 158C78 170 76 182 70 192"/><path d="M84 160C80 172 80 184 76 194"/><path d="M85 162C83 174 84 186 82 196"/>
          <path d="M116 158C122 170 124 182 130 192"/><path d="M116 160C120 172 120 184 124 194"/>
        </g>
        <line x1="70" y1="192" x2="70" y2="202" stroke="#806b42" stroke-width=".8"/>
        <rect x="65" y="202" width="10" height="13" rx="2" fill="#241f15" stroke="#806b42" stroke-width=".8"/>
        <circle class="c-glow" cx="70" cy="208.5" r="2.6" fill="${glow}"/>
      </g>`;
  },

  fae(glow) {
    const wing = (a, len, wid, i) => `<g transform="translate(100 112) rotate(${a})"><g class="c-wing" style="--i:${i}">
      <path d="${leafPath(len, wid)}" fill="#d4c59a" fill-opacity=".14" stroke="#b39a63" stroke-opacity=".55" stroke-width=".8"/>
      <path d="M2 0L${len * 0.92} 0M${len * 0.3} 0l${len * 0.12} -${wid * 0.3}M${len * 0.5} 0l${len * 0.12} ${wid * 0.3}M${len * 0.65} 0l${len * 0.1} -${wid * 0.25}" stroke="#b39a63" stroke-opacity=".4" stroke-width=".5" fill="none"/></g></g>`;
    return `
      ${halo(100, 120, 70, '#d4c59a', uid('fh'))}
      <g class="c-body">
        ${wing(-148, 70, 30, 0)}${wing(-118, 58, 22, 1)}${wing(-32, 70, 30, 2)}${wing(-62, 58, 22, 3)}
        ${wing(150, 40, 16, 4)}${wing(30, 40, 16, 5)}
        <g fill="none" stroke="#806b42" stroke-linecap="round">
          <path d="M100 98L100 168" stroke-width="2.4"/>
          <path d="M100 120C92 128 88 138 84 150" stroke-width="1"/><path d="M100 120C108 128 112 138 116 150" stroke-width="1"/>
          <path d="M100 166C96 184 94 200 92 214" stroke-width="1.1"/><path d="M100 166C104 184 106 200 108 214" stroke-width="1.1"/>
        </g>
        <circle cx="100" cy="92" r="6.5" fill="#594c32"/>
        ${eyes([[97.6, 92], [102.4, 92]], 1.2, glow)}
        <line x1="100" y1="128" x2="100" y2="104" stroke="#d4c59a" stroke-width=".8" opacity=".7"/>
        <circle cx="100" cy="128" r="2.2" fill="#b39a63"/>
      </g>`;
  },

  seed(glow) {
    const gs = uid('sd'), gh = uid('sh');
    return `
      <defs><radialGradient id="${gs}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#806b42"/><stop offset="1" stop-color="#2c2416"/></radialGradient></defs>
      ${halo(100, 160, 80, glow, gh)}
      <g class="c-body c-float">
        <path d="M100 102C96 90 98 80 104 72" fill="none" stroke="#4a5a3e" stroke-width="2"/>
        <g transform="translate(104 74) rotate(-30)"><path class="c-leaf" style="--i:0" d="${leafPath(18, 8)}" fill="#34432f"/></g>
        <g transform="translate(101 82) rotate(-160)"><path class="c-leaf" style="--i:1" d="${leafPath(14, 7)}" fill="#2b3a2a"/></g>
        <path d="M100 100C130 110 140 150 130 190C122 214 78 214 70 190C60 150 70 110 100 100Z" fill="url(#${gs})"/>
        <g fill="none" stroke="#3f3524" stroke-width=".9" opacity=".8"><path d="M86 120C80 150 82 180 90 204"/><path d="M114 120C120 150 118 180 110 204"/></g>
        ${eyes([[100, 158]], 3.6, glow)}
      </g>`;
  },
};

/** Devuelve el marcado SVG (un <g>) de una criatura, para insertarla dentro de otro dibujo. */
export function creatureMarkup(data) {
  const draw = forms[data.form] || forms.mandrake;
  return `<g class="creature c--${data.form}" data-watch>${draw(data.glow || '#9cc79a')}</g>`;
}

/** Crea una criatura como SVG independiente. */
export function createCreature(data, { className = '' } = {}) {
  const wrap = document.createElementNS(SVG_NS, 'svg');
  wrap.setAttribute('viewBox', '0 0 200 240');
  wrap.setAttribute('class', `creature-svg ${className}`);
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = creatureMarkup(data);
  return wrap;
}

/* ---- Ojos que siguen al cursor ----
   Un único bucle para todas las criaturas visibles. */
const watched = new Set();
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? watched.add(e.target) : watched.delete(e.target))))
  : null;

export function watchCursor(el) {
  if (io) io.observe(el); else watched.add(el);
}

export function startWatching(pointer) {
  const loop = () => {
    for (const el of watched) {
      const b = el.getBoundingClientRect();
      if (!b.width) continue;
      const dx = pointer.x - (b.left + b.width / 2), dy = pointer.y - (b.top + b.height * 0.4);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 400);
      el.querySelectorAll('.c-eyes').forEach((g) => {
        g.style.transform = `translate(${fmt((dx / d) * 1.8 * k)}px, ${fmt((dy / d) * 1.4 * k)}px)`;
      });
    }
    requestAnimationFrame(loop);
  };
  loop();
}
