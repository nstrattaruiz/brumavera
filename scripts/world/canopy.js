/* Dosel: ramas fijas en los bordes de la pantalla que acompañan todo el recorrido.
   Reaccionan al cursor (se apartan) y al viento del scroll (se mecen más).
   Es lo que hace que el bosque "invada" la interfaz en todos los lugares. */

import { svgRoot, s, env, pointer, clamp } from '../core/utils.js';
import { createBranch, bindLeafRustle, growBranches } from '../../components/branch.js';

export function createCanopy({ audio }) {
  const wrap = document.createElement('div');
  wrap.className = 'canopy';
  wrap.setAttribute('aria-hidden', 'true');
  document.body.append(wrap);
  bindLeafRustle(wrap, () => audio.play('rustle', 0.04));

  let reactive = [], W = 0, H = 0, wind = 0;

  function build() {
    W = innerWidth; H = innerHeight;
    const svg = svgRoot(`0 0 ${W} ${H}`);
    const m = Math.min(W, H);
    const small = env.mobile;
    const defs = [
      { x: -14, y: small ? 70 : 96, angle: 22, length: m * (small ? 0.5 : 0.42), width: small ? 8 : 11, seed: 71 },
      { x: W + 14, y: small ? 84 : 110, angle: 158, length: m * (small ? 0.44 : 0.38), width: small ? 7 : 10, seed: 72 },
      { x: -14, y: H * 0.8, angle: -18, length: m * 0.34, width: 9, seed: 73, skip: small },
      { x: W + 14, y: H + 14, angle: -146, length: m * (small ? 0.36 : 0.4), width: 10, seed: 74 },
      { x: W * 0.7, y: -16, angle: 96, length: m * 0.26, width: 5, seed: 75, skip: small },
    ];
    reactive = [];
    defs.filter((d) => !d.skip).forEach((d) => {
      const holder = s('g', { class: 'canopy__holder' });
      holder.style.transformOrigin = `${d.x}px ${d.y}px`;
      holder.append(createBranch({ ...d, depth: 4, leaves: 0.65, leafScale: small ? 1.2 : 1.35, bark: '#0a0c08', leafColors: ['#141c13', '#182118', '#1d281c', '#222d1f'] }));
      svg.append(holder);
      reactive.push({ el: holder, x: d.x, y: d.y, rot: 0, dir: d.x < W / 2 ? 1 : -1 });
    });
    wrap.innerHTML = '';
    wrap.append(svg);
    return svg;
  }

  let svg = build();
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (Math.abs(innerWidth - lastW) < 80) return; // ignorar cambios de la barra móvil
    lastW = innerWidth;
    svg = build();
  });

  function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    wind *= 0.94;
    for (const b of reactive) {
      let target = wind * b.dir * 0.6;
      if (pointer.active && !env.touch) {
        const dx = pointer.x - b.x, dy = pointer.y - b.y;
        const d = Math.hypot(dx, dy);
        const reach = Math.min(W, H) * 0.45;
        if (d < reach) target += (1 - d / reach) * 4 * -Math.sign(dx * dy || 1) * b.dir;
      }
      b.rot += (target - b.rot) * 0.05;
      b.el.style.transform = `rotate(${b.rot.toFixed(3)}deg)`;
    }
  }
  loop();

  return {
    el: wrap,
    /** Velocidad de scroll → viento. */
    gust(v) { wind = clamp(wind + v * 0.04, -5, 5); },
    /** Las ramas vuelven a crecer (transiciones entre lugares). */
    regrow(from = 0.55) { growBranches(svg, { from, to: 1, duration: 1.6, stagger: 0.08 }); },
    show() { wrap.classList.add('is-on'); growBranches(svg, { duration: env.reduced ? 0.01 : 3, stagger: 0.2 }); },
  };
}
