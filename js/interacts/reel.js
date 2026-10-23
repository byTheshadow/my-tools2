// 互动：连点收网。点得越快网收得越高，停手网会慢慢回落；没有失败，点满就收上来。
// 剧情里写法：{ act: 'reel', n: 14 }（n 是需要的点击数，默认 14）。
// 互动模块的约定：SG.registerAct(id, (host, done) => ({ update, draw, down, up, key }))，完成时 done({ ok: true })。
(function (SG) {
  const W = SG.CFG.W, H = SG.CFG.H;
  const FISH = [[-.5, -.25], [.25, -.45], [-.1, .3], [.55, .1], [-.62, .25], [.35, .42], [0, -.1]];

  SG.registerAct('reel', function (host, done) {
    const n = host.node.n || 14, decay = n * 0.18;
    const st = { v: 0, idle: 0, kick: 0, fin: false, tFin: 0, sent: false, drops: [] };
    let shown = -1;

    const ease = p => p * p * (3 - 2 * p);
    function label() {
      const k = Math.min(n, Math.floor(st.v));
      if (k !== shown) { shown = k; host.ui.setTask(st.fin ? '收上来了！' : '连点收网　' + k + ' / ' + n); }
    }
    function tap() {
      if (st.fin) return;
      st.v += 1; st.idle = 0; st.kick = 1;
      SG.beep(200 + Math.min(st.v, n) * 22, .04, 'square', .04); SG.noise(.04, .03);
      for (let i = 0; i < 3; i++) st.drops.push({ x: 90 + SG.rnd(-30, 30), y: 150 + SG.rnd(-10, 40), vx: SG.rnd(-20, 20), vy: SG.rnd(-70, -30), life: SG.rnd(.3, .6) });
      if (st.v >= n) {
        st.v = n; st.fin = true;
        SG.sfx.unlock(); SG.buzz([20, 30, 20]); SG.pop('收上来了！', 90, 150, 'gold', 11);
      }
      label();
    }
    label();

    function rope(x0, y0, x1, y1, c) {
      const R = SG.px.R, steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= steps; i++) R(Math.round(x0 + (x1 - x0) * i / steps), Math.round(y0 + (y1 - y0) * i / steps), 1, 1, c);
    }

    return {
      down: tap,
      key(code, isDown) { if (isDown && (code === 'Space' || code === 'Enter')) tap(); },

      update(dt) {
        st.kick = Math.max(0, st.kick - dt * 6);
        for (const d of st.drops) { d.vy += 260 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; }
        st.drops = st.drops.filter(d => d.life > 0);
        if (st.fin) {
          st.tFin += dt;
          if (st.tFin > 1.1 && !st.sent) { st.sent = true; host.ui.setTask(''); done({ ok: true }); }
          return;
        }
        st.idle += dt;
        if (st.idle > .5 && st.v > 0) { st.v = Math.max(0, st.v - decay * dt); label(); }
      },

      draw() {
        const ctx = SG.ctx, { R, ellipse } = SG.px, t = SG.G.t;
        const p = Math.min(1, st.v / n), e = ease(p);
        // 天色、海面、船板
        ctx.fillStyle = 'rgba(8,14,26,.9)'; ctx.fillRect(0, 17, W, H - 17);
        R(0, 17, W, 53, '#2a2340'); R(0, 56, W, 14, '#4a3050'); R(0, 66, W, 4, '#c8663a');
        ellipse(90, 70, 16, 7, '#f2a65a'); R(0, 70, W, 170, '#16324a');
        for (let y = 78, k = 0; y < 238; y += 9, k++) {
          for (let x = -((t * 14 + k * 17) % 24); x < W; x += 24) R(x, y, 8 + (k % 3) * 2, 1, k % 2 ? '#24506e' : '#1d4260');
        }
        R(0, 240, W, 6, '#a8653a'); R(0, 246, W, H - 246, '#6e3f22');
        for (let y = 258; y < H; y += 12) R(0, y, W, 1, '#55301a');
        // 网：越收越近、越大
        const cx = 90 + Math.round(Math.sin(t * 30) * st.kick * 2), cy = Math.round(112 + 112 * e - st.kick * 2);
        const rw = Math.round(16 + 40 * e), rh = Math.round(8 + 18 * e);
        rope(cx - rw + 2, cy, 40, 246, '#b8a878'); rope(cx + rw - 2, cy, 140, 246, '#b8a878');
        ellipse(cx, cy + rh + 3, rw, 2, 'rgba(0,0,0,.25)');
        ellipse(cx, cy, rw + 1, rh + 1, '#0f2233'); ellipse(cx, cy, rw, rh, '#1f4a66');
        for (let y = -rh + 1; y < rh; y++) {
          const half = Math.floor(rw * Math.sqrt(1 - (y * y) / (rh * rh)));
          for (let x = -half; x <= half; x++) if (((x + y) & 3) === 0 || ((x - y) & 3) === 0) R(cx + x, cy + y, 1, 1, '#a89868');
        }
        const m = Math.min(FISH.length, Math.floor(p * 7.99));        // 网里的鱼影，越收越多
        for (let i = 0; i < m; i++) {
          const fx = cx + Math.round(FISH[i][0] * rw * .8), fy = cy + Math.round(FISH[i][1] * rh * .8 + Math.sin(t * 6 + i) * 1.5);
          R(fx, fy, 5, 2, '#cfd8e0'); R(fx + 5, fy - 1, 1, 4, '#9fb0bf'); R(fx + 1, fy, 1, 1, '#1d1620');
        }
        for (const d of st.drops) R(Math.round(d.x), Math.round(d.y), 1, 2, '#bfe6ff');
        // 进度条
        R(29, 276, 122, 8, '#1d1620'); R(30, 277, 120, 6, '#3a2c3f');
        R(30, 277, Math.round(120 * p), 6, p >= 1 ? '#f2b134' : '#7fd36b');
        if (st.fin) { ctx.fillStyle = `rgba(255,255,255,${Math.max(0, .5 - st.tFin * .6).toFixed(2)})`; ctx.fillRect(0, 17, W, H - 17); }
      },
    };
  });
})(window.SG = window.SG || {});