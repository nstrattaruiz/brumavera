/* INTRO — oscuridad, ramas apenas visibles, una frase.
   Al entrar, la cortina de ramas se abre físicamente y el bosque aparece detrás. */

import { h, esc, svgRoot, rng, env, wait } from '../core/utils.js';
import { createBranch, growBranches, bindLeafRustle } from '../../components/branch.js';
import { store } from '../core/store.js';

function curtain(side, depth) {
  const r = rng(side === 'l' ? 11 + depth : 29 + depth);
  const svg = svgRoot('0 0 800 1000', { preserveAspectRatio: `${side === 'l' ? 'xMax' : 'xMin'}YMid slice` });
  const front = depth === 1;
  const bark = front ? '#040504' : '#0b0f0a';
  const leafColors = front ? ['#050705', '#070907', '#090c08'] : ['#121a12', '#162016', '#1a2418'];
  const rows = front ? 6 : 8;
  for (let i = 0; i < rows; i++) {
    const y = (i / (rows - 1)) * 1080 - 40 + r.range(-30, 30);
    const fromX = side === 'l' ? -40 : 840;
    const base = side === 'l' ? 0 : 180;
    const tilt = r.range(-22, 22);
    svg.append(createBranch({
      x: fromX, y,
      angle: side === 'l' ? base + tilt : base - tilt,
      length: r.range(front ? 560 : 640, front ? 760 : 860),
      width: front ? r.range(16, 26) : r.range(8, 14),
      depth: 4, leaves: front ? 0.9 : 0.75, leafScale: front ? 2.4 : 1.6,
      bark, leafColors, moss: front ? 0 : 0.3, seed: i * 37 + depth * 101 + (side === 'l' ? 0 : 999),
      grown: false, sway: front ? 0.6 : 1,
    }));
  }
  return svg;
}

export function createIntro({ content, particles, audio, onEnter }) {
  const root = h('div', { class: 'intro', role: 'dialog', 'aria-label': content.world.name });
  const layers = [];
  ['l', 'r'].forEach((side) => [0, 1].forEach((depth) => {
    const el = h('div', { class: `intro__curtain intro__curtain--${side} intro__curtain--d${depth}` }, [curtain(side, depth)]);
    layers.push({ el, side, depth });
  }));

  const phrase = h('p', { class: 'intro__phrase' });
  let li = 0;
  phrase.innerHTML = content.intro.phrase.split(' ')
    .map((word) => `<span class="intro__word">${[...word].map((ch) => `<span style="--i:${li++}">${esc(ch)}</span>`).join('')}</span>`)
    .join(' ');
  const enter = h('button', { class: 'intro__enter', 'data-cursor': 'link', type: 'button' }, [h('span', { text: content.intro.enter }), h('i')]);
  const soundBtn = h('button', { class: 'intro__sound', type: 'button', 'data-cursor': 'link', 'aria-pressed': String(store.state.sound) });
  const syncSound = () => {
    soundBtn.innerHTML = `<i class="sound-wave ${store.state.sound ? 'is-on' : ''}"><b></b><b></b><b></b></i><span>${esc(store.state.sound ? content.ui.soundOn : content.ui.soundOff)}</span><em>${esc(content.intro.soundHint)}</em>`;
    soundBtn.setAttribute('aria-pressed', String(store.state.sound));
  };
  syncSound();
  soundBtn.addEventListener('click', () => { store.setSound(!store.state.sound); syncSound(); });

  const content_ = h('div', { class: 'intro__content' }, [phrase, enter, soundBtn]);
  root.append(h('div', { class: 'intro__dark' }), ...layers.map((l) => l.el), h('div', { class: 'intro__glow' }), content_);
  document.body.append(root);
  bindLeafRustle(root, () => audio.play('rustle', 0.05));

  // Las ramas emergen muy despacio de la oscuridad
  layers.forEach(({ el }, i) => growBranches(el, { duration: env.reduced ? 0.01 : 5, delay: 0.3 + i * 0.2, stagger: 0.25, ease: 'power1.out' }));
  requestAnimationFrame(() => root.classList.add('is-ready'));

  let entered = false;
  async function go() {
    if (entered) return;
    entered = true;
    if (store.state.sound) audio.enable();
    audio.play('whoosh');
    root.classList.add('is-leaving');

    if (!window.gsap || env.reduced) {
      root.classList.add('is-gone');
      await wait(env.reduced ? 400 : 900);
      root.remove();
      onEnter?.();
      return;
    }
    const tl = gsap.timeline();
    tl.to(content_, { opacity: 0, scale: 0.94, duration: 0.9, ease: 'power2.in' }, 0)
      .to('.intro__glow', { opacity: 1, duration: 1.2, ease: 'power2.out' }, 0.3)
      .call(() => particles.rush(1), null, 0.45)
      .call(() => particles.rush(0), null, 1.9);
    layers.forEach(({ el, side, depth }) => {
      const dir = side === 'l' ? -1 : 1;
      tl.to(el, {
        xPercent: dir * (depth ? 125 : 105),
        rotation: dir * (depth ? 9 : 5),
        scale: depth ? 1.9 : 1.35,
        duration: depth ? 2.1 : 2.6,
        ease: 'power3.inOut',
      }, depth ? 0.35 : 0.5);
    });
    tl.to('.intro__dark', { opacity: 0, duration: 1.8, ease: 'power1.inOut' }, 1)
      .to('.intro__glow', { opacity: 0, duration: 1.4 }, 2)
      .call(() => onEnter?.(), null, 1.6)
      .call(() => root.remove(), null, 3.2);
  }

  enter.addEventListener('click', go);
  return { root };
}
