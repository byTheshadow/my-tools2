// 特效：飘字（DOM）、粒子、飞出的寿司、屏幕抖动。
(function (SG) {
  const G = SG.G, { rnd, pick } = SG;
  SG.fxEl = document.getElementById('fx');

  SG.pop = function (text, lx, ly, cls = '', size = 7) {
    const d = document.createElement('div');
    d.className = 'pop ' + cls; d.textContent = text;
    d.style.left = lx * SG.S + 'px'; d.style.top = ly * SG.S + 'px'; d.style.fontSize = size * SG.S + 'px';
    SG.fxEl.appendChild(d); setTimeout(() => d.remove(), 950);
  };

  SG.burst = function (x, y, n, colors, spd = 60) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = rnd(spd * .3, spd);
      G.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: rnd(.35, .7), c: pick(colors), s: Math.random() < .3 ? 2 : 1 });
    }
  };

  SG.updateFx = function (dt) {
    for (const p of G.particles) { p.vy += 160 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    G.particles = G.particles.filter(p => p.life > 0);
    for (const f of G.fallen) { f.vy += 500 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.life -= dt; }
    G.fallen = G.fallen.filter(f => f.life > 0);
    for (const f of G.flying) f.t += dt * 3.2;
    G.flying = G.flying.filter(f => f.t < 1);
    G.shake = Math.max(0, G.shake - dt * 12);
  };
})(window.SG = window.SG || {});
