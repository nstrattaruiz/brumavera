/* Motor de audio ambiental.
   - Nunca suena sin un gesto del usuario.
   - Si el contenido define archivos (content.audio.ambient) se usan; si no, se sintetiza todo
     con Web Audio: viento, hojas, insectos, gotas y pequeños efectos. */

let ctx = null, master = null, ambientNodes = [], timers = [], fileAmbient = null;
let enabled = false, config = { ambient: null, volume: 0.5 };

function noiseBuffer(type = 'brown', seconds = 4) {
  const len = ctx.sampleRate * seconds;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
    else d[i] = w;
  }
  return buf;
}

function ensureContext() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
}

function startWind() {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer('brown', 6);
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  lp.Q.value = 0.6;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 220;
  lfo.connect(lfoGain).connect(lp.frequency);
  const g = ctx.createGain();
  g.gain.value = 0.55;
  src.connect(lp).connect(g).connect(master);
  src.start();
  lfo.start();
  ambientNodes.push(src, lfo);
}

function schedule(fn, min, max) {
  const loop = () => {
    const id = setTimeout(() => { if (enabled) fn(); loop(); }, min + Math.random() * (max - min));
    timers.push(id);
  };
  loop();
}

/* ---- Efectos sintetizados ---- */

const sfx = {
  rustle(vol = 0.18) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer('white', 0.6);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2400 + Math.random() * 2000;
    bp.Q.value = 0.8;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    src.connect(bp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.6);
  },
  drop(vol = 0.12) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t = ctx.currentTime;
    const f = 900 + Math.random() * 900;
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.22);
  },
  cricket(vol = 0.025) {
    const t0 = ctx.currentTime;
    const f = 4200 + Math.random() * 900;
    const pulses = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < pulses; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = t0 + i * 0.075;
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      g.gain.linearRampToValueAtTime(0, t + 0.045);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.05);
    }
  },
  chime(vol = 0.08) {
    const t = ctx.currentTime;
    [523.25, 784.0, 1046.5, 1318.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.004);
      g.gain.setValueAtTime(0, t + i * 0.09);
      g.gain.linearRampToValueAtTime(vol / (i + 1), t + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 2.4);
      o.connect(g).connect(master);
      o.start(t + i * 0.09);
      o.stop(t + i * 0.09 + 2.5);
    });
  },
  wood(vol = 0.25) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.25);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.32);
    sfx.rustle(vol * 0.3);
  },
  breath(vol = 0.12) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer('white', 2.4);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 1.4;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.9);
    g.gain.linearRampToValueAtTime(0, t + 2.2);
    src.connect(bp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 2.4);
  },
  whoosh(vol = 0.22) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer('white', 1.8);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.7;
    const t = ctx.currentTime;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 1.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    src.connect(bp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 1.8);
    sfx.rustle(vol * 0.6);
  },
};

export const audio = {
  configure(c = {}) { config = { ...config, ...c }; },
  get enabled() { return enabled; },

  /** Debe llamarse dentro de un gesto del usuario. */
  enable() {
    ensureContext();
    if (!ctx) return;
    ctx.resume();
    enabled = true;
    const target = 0.6 * (config.volume ?? 0.5);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(target, ctx.currentTime, 1.2);

    if (config.ambient) {
      if (!fileAmbient) {
        fileAmbient = new Audio(config.ambient);
        fileAmbient.loop = true;
        fileAmbient.volume = 0.4 * (config.volume ?? 0.5);
      }
      fileAmbient.play().catch(() => {});
    } else if (!ambientNodes.length) {
      startWind();
      schedule(() => sfx.rustle(0.06), 4000, 11000);
      schedule(() => sfx.cricket(), 2500, 9000);
      schedule(() => sfx.drop(0.05), 3000, 12000);
    }
  },

  disable() {
    enabled = false;
    if (fileAmbient) fileAmbient.pause();
    if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  },

  toggle() { enabled ? this.disable() : this.enable(); return enabled; },

  /** Efecto puntual. Silencioso si el sonido está desactivado. */
  play(name, vol) {
    if (!enabled || !ctx || !sfx[name]) return;
    sfx[name](vol);
  },
};
