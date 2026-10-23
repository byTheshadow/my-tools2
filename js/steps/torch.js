// 步骤：炙烧。按住喷枪，火候条一路涨，在金色的"焦香区"松手：正中完美、靠近算不错；
// 松早了（还没烤香）只是重来，没有惩罚；一直按到头就烧焦了：整份倒掉、付成本、连击清零。
// 做法 aburi = rice → fish → torch → serve（data/methods.js）。
// 想调手感：关卡的 difficulty.torch 可以覆盖 { center, half, dur }（焦香区中心 / 半宽 / 烤满要的秒数）。
(function (SG) {
  const { CFG, G, pop, burst, sfx } = SG;
  const { R } = SG.px;
  const SP = SG.sprites, RICE = CFG.rice;
  const BAR = { x: 45, y: 256, w: 90 };
  const FINE = 0.12;                               // 焦香区外再宽这么多，算"不错"

  function conf() {
    const o = (G.level.difficulty && G.level.difficulty.torch) || {};
    return {
      center: o.center != null ? o.center : .71,
      half: Math.max(.06, (o.half != null ? o.half : .09) - G.combo * .003),
      dur: Math.max(.9, (o.dur != null ? o.dur : 1.5) - G.combo * .02),
    };
  }
  const X = v => BAR.x + Math.round(BAR.w * v);

  function quality(h, c) {
    const d = Math.abs(h - c.center);
    if (d <= c.half) return 'perfect';
    if (h < c.center) return d <= c.half + FINE ? 'good' : null;      // null = 还没烤香
    return d <= c.half + FINE ? 'good' : 'meh';                         // 烤过头了一点
  }

  function burnt(c) {
    const T = G.torch; T.on = false; SG.pressSound.stop();
    const lost = SG.econ.waste(G.sushi.type);
    burst(RICE.x, RICE.y - 10, 24, ['#3a2c3f', '#5a5e67', '#1d1620', '#ff6b2b'], 70);
    pop(lost ? '烧焦了！−' + lost : '烧焦了！', RICE.x, RICE.y - 30, 'bad', 9);
    sfx.fail(); SG.buzz(60); G.shake = 3; c.api.breakCombo();
    c.ev('fail');
    c.restart();
  }

  function release(c) {
    const T = G.torch; if (!T.on) return;
    T.on = false; SG.pressSound.stop();
    const q = quality(T.heat, T.cfg);
    if (!q) { pop('还没烤香，再来', RICE.x, RICE.y - 28, '', 7); T.heat = 0; return; }
    const s = G.sushi;
    s.torchQ = q; s.char = T.heat;
    if (q === 'perfect') { pop('焦香！', RICE.x, RICE.y - 30, 'gold', 9); sfx.perfect(); SG.buzz(20); burst(RICE.x, RICE.y - 8, 10, ['#f2b134', '#fff3c4'], 50); }
    else if (q === 'good') { pop('不错', RICE.x, RICE.y - 30, '', 8); sfx.good(); }
    else { pop('有点焦了', RICE.x, RICE.y - 30, 'bad', 7); sfx.good(); }
    c.ev('torch');
    c.next();
  }

  const torch = {
    hint: '按住 喷枪烤，金色区松手',
    enter() { G.torch = { on: false, heat: 0, cfg: conf(), ember: 0 }; },

    down() {
      const T = G.torch; if (T.on) return;
      T.on = true; T.heat = 0; T.cfg = conf();
      SG.pressSound.start();
    },
    up(c) { release(c); },
    key(c, code, isDown) { if (code === 'Space') { if (isDown) torch.down(c); else torch.up(c); } },

    update(c, dt) {
      const T = G.torch; if (!T || !T.on) return;
      T.heat += dt / T.cfg.dur;
      SG.pressSound.set(Math.min(1, T.heat));
      T.ember -= dt;
      if (T.ember <= 0) { T.ember = .1; burst(RICE.x + SG.rnd(-8, 8), RICE.y - 12, 2, ['#ffb347', '#ff6b2b', '#fff3c4'], 30); }
      if (T.heat >= 1) burnt(c);
    },

    // 火候条：画在寿司下面，一直显示，让玩家知道焦香区在哪
    draw() {
      const T = G.torch, c = T && T.on ? T.cfg : conf(), h = T ? Math.min(1, T.heat) : 0;
      const lo = c.center - c.half, hi = c.center + c.half;
      R(BAR.x - 1, BAR.y - 1, BAR.w + 2, 9, '#1d1620'); R(BAR.x, BAR.y, BAR.w, 7, '#3a2c3f');
      R(X(lo - FINE), BAR.y, X(hi + FINE) - X(lo - FINE), 7, '#7a5a24');          // 不错区
      R(X(lo), BAR.y, X(hi) - X(lo), 7, '#f2b134');                                // 焦香区
      R(X(1) - 6, BAR.y, 6, 7, '#a5302a');                                          // 烧焦区
      if (h > 0) { R(BAR.x, BAR.y + 2, X(h) - BAR.x, 3, h > hi + FINE ? '#ff5a4a' : '#ffb347'); R(X(h), BAR.y - 2, 1, 11, '#ffffff'); }
    },

    // 画在寿司上面：喷枪、火苗、鱼片被烤焦的颜色
    drawOver() {
      const T = G.torch, s = G.sushi; if (!T || !s) return;
      const { rw, rh } = SP.riceSize(s.riceP), top = RICE.y - rh, cx = RICE.x + s.dx, sw = rw * 2 + 6;
      if (T.heat > 0) SP.charOverlay(cx, top - 1, sw, 8, Math.min(1, T.heat));
      const nx = cx + 2;
      R(nx - 2, top - 34, 6, 12, '#2a1e18'); R(nx - 1, top - 33, 4, 10, '#8a8f98'); R(nx - 1, top - 33, 1, 10, '#b8bec8');
      R(nx - 3, top - 22, 8, 3, '#2a1e18'); R(nx - 2, top - 22, 6, 2, '#5a5e67');
      if (T.on) {
        const f = (G.t * 18 | 0) % 2;
        R(nx - 3 - f, top - 19, 8 + 2 * f, 3, '#ff6b2b'); R(nx - 2, top - 16, 6, 4, '#ff6b2b');
        R(nx - 1, top - 12, 4, 4 + f, '#ffb347'); R(nx, top - 10, 2, 4, '#fff3c4');
      } else R(nx, top - 19, 2, 2, '#7ec8ff');                                      // 待机的小蓝火
    },
  };
  SG.registerStep('torch', torch);
})(window.SG = window.SG || {});