/* Sistema de partículas en un único canvas: polvo en suspensión, luciérnagas,
   estelas del cursor y ráfagas de transición. Se adapta al dispositivo. */

import { env, pointer, clamp } from './utils.js';

const spriteCache = new Map();
function glowSprite(color) {
  if (spriteCache.has(color)) return spriteCache.get(color);
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, color);
  grd.addColorStop(0.18, color);
  grd.addColorStop(0.4, hexA(color, 0.25));
  grd.addColorStop(1, hexA(color, 0));
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  spriteCache.set(color, c);
  return c;
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export function createParticleSystem(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const tier = env.tier;
  const counts = {
    dust: opts.dust ?? [18, 45, 90][tier],
    fireflies: opts.fireflies ?? [3, 7, 14][tier],
  };
  const fireflyColors = opts.fireflyColors || ['#b9d98a', '#9fd3b5', '#d8c27a'];
  let W = 0, H = 0, dpr = 1;
  let dust = [], flies = [], sparks = [];
  let rush = 0, rushTarget = 0, light = 0, running = true, last = performance.now();
  let fliesVisible = 1, fliesTarget = 1;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, tier === 2 ? 1.5 : 1.25);
    W = innerWidth;
    H = innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnDust(d = {}) {
    const z = Math.random() * 0.8 + 0.2;
    return Object.assign(d, {
      x: Math.random() * W, y: Math.random() * H, z,
      vx: (Math.random() - 0.5) * 0.08, vy: -Math.random() * 0.06 - 0.01,
      r: z * 1.25, a: Math.random() * 0.4 + 0.15, tw: Math.random() * Math.PI * 2,
    });
  }

  function spawnFly() {
    return {
      x: Math.random() * W, y: H * 0.25 + Math.random() * H * 0.7,
      vx: 0, vy: 0, heading: Math.random() * Math.PI * 2,
      phase: Math.random() * Math.PI * 2, speed: 0.25 + Math.random() * 0.35,
      color: fireflyColors[Math.floor(Math.random() * fireflyColors.length)],
      size: 10 + Math.random() * 8,
    };
  }

  function init() {
    resize();
    dust = Array.from({ length: counts.dust }, () => spawnDust());
    flies = Array.from({ length: counts.fireflies }, spawnFly);
  }

  function step(now) {
    if (!running) return;
    const dt = Math.min(48, now - last) / 16.67;
    last = now;
    rush += (rushTarget - rush) * 0.06 * dt;
    fliesVisible += (fliesTarget - fliesVisible) * 0.03 * dt;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;

    // Polvo
    ctx.fillStyle = '#e5dec7';
    for (const p of dust) {
      p.tw += 0.02 * dt;
      p.x += (p.vx + Math.sin(p.tw) * 0.04) * dt;
      p.y += p.vy * dt;
      if (rush > 0.01) {
        const dx = p.x - cx, dy = p.y - cy;
        const len = Math.hypot(dx, dy) || 1;
        const v = rush * p.z * 22;
        const sx = (dx / len) * v, sy = (dy / len) * v;
        p.x += sx * dt;
        p.y += sy * dt;
        ctx.globalAlpha = clamp(p.a * (0.6 + rush), 0, 0.9);
        ctx.strokeStyle = '#e5dec7';
        ctx.lineWidth = p.r;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - sx * 2.2, p.y - sy * 2.2);
        ctx.stroke();
      } else {
        ctx.globalAlpha = p.a * (0.55 + Math.sin(p.tw * 1.3) * 0.25) * (0.7 + light * 0.6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
        spawnDust(p);
        if (rush > 0.05) { p.x = cx + (Math.random() - 0.5) * 120; p.y = cy + (Math.random() - 0.5) * 120; }
        else p.y = H + 10;
      }
    }

    // Luciérnagas: vagan, parpadean y cambian de rumbo si el cursor se acerca
    ctx.globalCompositeOperation = 'lighter';
    for (const f of flies) {
      f.phase += 0.025 * dt;
      f.heading += (Math.random() - 0.5) * 0.18 * dt;
      let ax = Math.cos(f.heading) * f.speed, ay = Math.sin(f.heading) * f.speed * 0.7;
      if (pointer.active) {
        const dx = f.x - pointer.x, dy = f.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 140) {
          const push = (1 - dist / 140) * 1.6;
          ax += (dx / dist) * push;
          ay += (dy / dist) * push;
          f.heading = Math.atan2(dy, dx) + (Math.random() - 0.5);
        }
      }
      f.vx += (ax - f.vx) * 0.05 * dt;
      f.vy += (ay - f.vy) * 0.05 * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.x < -30) f.x = W + 20; if (f.x > W + 30) f.x = -20;
      if (f.y < H * 0.1) f.heading = Math.PI / 2; if (f.y > H + 20) f.heading = -Math.PI / 2;
      const blink = Math.max(0, Math.sin(f.phase)) ** 3;
      const a = (0.15 + blink * 0.85) * fliesVisible;
      if (a < 0.02) continue;
      ctx.globalAlpha = a;
      const sz = f.size * (0.8 + blink * 0.4);
      ctx.drawImage(glowSprite(f.color), f.x - sz, f.y - sz, sz * 2, sz * 2);
    }

    // Chispas transitorias (estela del cursor, polvo de objetos)
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.life -= dt;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.vx *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const t = p.life / p.max;
      ctx.globalAlpha = t * p.a;
      const sz = p.r * (p.glow ? 6 : 1);
      if (p.glow) ctx.drawImage(glowSprite(p.color), p.x - sz, p.y - sz, sz * 2, sz * 2);
      else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    requestAnimationFrame(step);
  }

  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { last = performance.now(); requestAnimationFrame(step); }
  });

  init();
  requestAnimationFrame(step);

  return {
    /** Intensidad de ráfaga (0-1): partículas que atraviesan la pantalla. */
    rush(v) { rushTarget = v; },
    /** Luz ambiente (0-1): el polvo se vuelve más visible. */
    light(v) { light = v; },
    fireflies(v) { fliesTarget = v; },
    emit(x, y, o = {}) {
      if (sparks.length > 160) return;
      const n = o.count ?? 1;
      for (let i = 0; i < n; i++) {
        const life = (o.life ?? 50) * (0.6 + Math.random() * 0.8);
        sparks.push({
          x: x + (Math.random() - 0.5) * (o.spread ?? 4),
          y: y + (Math.random() - 0.5) * (o.spread ?? 4),
          vx: (Math.random() - 0.5) * (o.speed ?? 0.6),
          vy: (Math.random() - 0.5) * (o.speed ?? 0.6) - (o.lift ?? 0.2),
          g: o.gravity ?? -0.002,
          r: o.size ?? 0.9 + Math.random() * 0.8,
          a: o.alpha ?? 0.7,
          color: o.color ?? '#d4c59a',
          glow: !!o.glow,
          life, max: life,
        });
      }
    },
  };
}
