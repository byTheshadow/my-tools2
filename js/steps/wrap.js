// 步骤：围海苔（军舰卷）。往右拖，海苔一圈圈围上饭团；屏幕下方的轨道里有一扇金色小窗从左走到右，手指的进度要跟住它。
// 做法 gunkan = rice → fish → wrap → serve（data/methods.js）。鱼籽先放上饭团，再围海苔。
//
// 判定：从按下到围完，手指在金窗里的时间占比 ≥ 80% 服帖(perfect) / ≥ 55% 还行(good) / 否则有点皱(meh)。
//   中途松手 = 海苔弹回重来，没有惩罚。
//   拖的途中手指一直冲在金窗前面太多、持续 0.3 秒 = 海苔撕破：整份倒掉、付成本、清连击（和炙烧烧焦一样）。
//   围满之后还要等金窗走过 85% 才收口，所以一把划到头占不到时间便宜，只是品质低（有点皱），不会撕破。
// 操作：手指 / 鼠标在屏幕任意位置向右拖（约半个屏幕宽）；键盘按住 → / D / 空格前进，← / A 后退。
//   拖动自己监听 pointermove，不依赖 input.js / game.js；手指在对话期间抬起了，下一帧自动清掉进度。
// 想调手感：关卡的 difficulty.wrap 可以覆盖 { half, dur, tear }（金窗半宽 / 金窗走完的秒数 / 超前多少算撕破）。
(function (SG) {
  const { CFG, G, pop, burst, sfx } = SG;
  const { R } = SG.px;
  const SP = SG.sprites, RICE = CFG.rice;
  const BAR = { x: 45, y: 256, w: 90 };            // 轨道，位置和炙烧的火候条一样
  const TEAR_TIME = .3;                            // 超前太多持续这么久（秒）就撕破
  const KEY_V = .72;                               // 键盘：按住方向键每秒前进多少（金窗约 1/1.4 ≈ .71）
  const NEED = .995;                               // 围到这么多算围满
  const GATE = .85;                                // 围满之后，金窗还要走过这里才收口
  const NORI_SPARK = ['#1e2b25', '#2f4639', '#4f7a5a', '#ffffff'];

  function conf() {
    const o = (G.level.difficulty && G.level.difficulty.wrap) || {};
    return {
      half: Math.max(.09, (o.half != null ? o.half : .16) - G.combo * .004),
      dur: Math.max(.9, (o.dur != null ? o.dur : 1.4) - G.combo * .015),
      tear: o.tear != null ? o.tear : .38,
    };
  }
  const X = v => BAR.x + Math.round(BAR.w * v);

  // p 手指进度 / g 金窗位置（都是 0~1）/ inT outT 在窗内、窗外的累计时间 / tear 超前累计 / x0 拖动起点 / span 拖满要多少逻辑像素
  const W = { on: false, mode: null, p: 0, g: 0, t: 0, inT: 0, outT: 0, tear: 0, x0: 0, span: BAR.w, kr: 0, kl: 0, rustle: 0, lastP: 0, cfg: null };
  let held = false;                                // 手指 / 鼠标现在是不是按着（不管对话有没有打断）

  function clear() {
    W.on = false; W.mode = null; W.p = 0; W.g = 0; W.t = 0; W.lastP = 0;
    W.inT = 0; W.outT = 0; W.tear = 0; W.kr = 0; W.kl = 0;
  }
  function reset() { clear(); if (G.sushi) G.sushi.wrapK = 0; }

  function begin(mode) {
    clear(); W.on = true; W.mode = mode; W.cfg = conf(); W.rustle = 0;
    G.wrapSt = W;
  }

  addEventListener('pointerdown', () => { held = true; });
  addEventListener('pointerup', () => { held = false; });
  addEventListener('pointercancel', () => { held = false; });
  addEventListener('pointermove', e => {
    if (!W.on || W.mode !== 'ptr') return;
    if (e.pointerType === 'mouse' && !e.buttons) return;
    const x = SG.toLogical(e)[0], d = x - W.x0;
    if (d < 0) { W.x0 = x; W.p = 0; }              // 往回拖：起点跟着手指走，不会"欠账"
    else W.p = Math.min(1, d / W.span);
  });

  function torn(c) {
    clear();
    const lost = SG.econ.waste(G.sushi.type);
    burst(RICE.x, RICE.y - 10, 22, NORI_SPARK, 70);
    pop(lost ? '海苔撕破了！−' + lost : '海苔撕破了！', RICE.x, RICE.y - 30, 'bad', 9);
    sfx.fail(); SG.buzz(60); G.shake = 3; c.api.breakCombo();
    c.ev('fail');
    c.restart();
  }

  function done(c) {
    const tot = W.inT + W.outT, ratio = tot > 0 ? W.inT / tot : 0;
    const q = ratio >= .8 ? 'perfect' : ratio >= .55 ? 'good' : 'meh';
    const s = G.sushi;
    s.wrapQ = q; s.wrapK = 1;
    clear();
    if (q === 'perfect') { pop('服帖！', RICE.x, RICE.y - 30, 'gold', 9); sfx.perfect(); SG.buzz(20); burst(RICE.x, RICE.y - 8, 10, ['#f2b134', '#fff3c4', '#4f7a5a'], 50); }
    else if (q === 'good') { pop('围好了', RICE.x, RICE.y - 30, '', 8); sfx.good(); }
    else { pop('有点皱', RICE.x, RICE.y - 30, 'bad', 7); sfx.good(); }
    c.ev('wrap');
    c.next();
  }

  const wrap = {
    hint: '往右拖 围海苔，跟住金窗',
    enter() { clear(); G.wrapSt = W; if (G.sushi) G.sushi.wrapK = 0; },

    down(c, x) {
      if (W.on) return;
      const span = Math.min(BAR.w, 178 - x);       // 按得太靠右，拖不满，就提醒一下
      if (span < 40) { pop('再往左一点按', RICE.x, RICE.y - 28, '', 7); return; }
      begin('ptr'); W.x0 = x; W.span = span;
    },
    up() {
      if (!W.on || W.mode !== 'ptr') return;
      if (W.p > .12) pop('海苔弹回去了', RICE.x, RICE.y - 28, '', 7);
      reset();
    },
    key(c, code, isDown) {
      const r = code === 'ArrowRight' || code === 'KeyD' || code === 'Space';
      const l = code === 'ArrowLeft' || code === 'KeyA';
      if (r) W.kr = isDown ? 1 : 0;
      if (l) W.kl = isDown ? 1 : 0;
      if (isDown && r && !W.on) { const kr = W.kr; begin('key'); W.kr = kr; }
    },

    update(c, dt) {
      if (!W.on) return;
      const s = G.sushi;
      if (W.mode === 'ptr' && !held) { reset(); return; }          // 手指在对话期间抬起了：悄悄重来
      if (W.mode === 'key') {
        W.p = Math.max(0, Math.min(1, W.p + (W.kr - W.kl) * KEY_V * dt));
        if (!W.kr && !W.kl && W.p < .02) { reset(); return; }      // 一路退回起点又松手：算放弃
      }
      W.t += dt; W.g = Math.min(1, W.t / W.cfg.dur);
      const gap = W.p - W.g;
      if (Math.abs(gap) <= W.cfg.half) W.inT += dt; else W.outT += dt;
      // 撕破只算"还在拖的途中"拉得太靠前；一把划到头的人只是品质低，不撕（反正要等金窗走完才收口，占不到时间便宜）
      W.tear = (gap > W.cfg.tear && W.p < NEED) ? W.tear + dt : Math.max(0, W.tear - dt * 2);
      s.wrapK = W.p;
      W.rustle -= dt;
      if (Math.abs(W.p - W.lastP) > .002 && W.rustle <= 0) { SG.noise(.03, .02); W.rustle = .09; }
      W.lastP = W.p;
      if (W.tear >= TEAR_TIME) { torn(c); return; }
      if (W.p >= NEED && W.g >= GATE) done(c);
    },

    // 轨道：画在寿司下面，一直显示。金窗 = 现在手指该在的位置，绿条 = 已围上的海苔，白线 = 手指
    draw() {
      const c = W.on ? W.cfg : conf(), g = W.on ? W.g : 0, p = W.on ? W.p : 0;
      const lo = Math.max(0, g - c.half), hi = Math.min(1, g + c.half);
      R(BAR.x - 1, BAR.y - 1, BAR.w + 2, 9, '#1d1620'); R(BAR.x, BAR.y, BAR.w, 7, '#3a2c3f');
      R(X(lo), BAR.y, Math.max(2, X(hi) - X(lo)), 7, '#f2b134');                 // 金窗
      R(X(1) - 1, BAR.y - 2, 1, 11, '#cfd3d6');                                   // 终点线
      if (p > 0) R(BAR.x, BAR.y + 2, X(p) - BAR.x, 3, '#4f7a5a');                // 已围的海苔
      const warn = W.tear > 0 && (G.t * 12 | 0) % 2;
      R(X(p), BAR.y - 2, 1, 11, warn ? '#ff5a4a' : '#ffffff');                    // 手指
    },

    // 还没开始拖：饭团右边闪一个 → ，告诉玩家往哪边拖
    drawOver() {
      const s = G.sushi; if (!s || W.on || (G.t * 3 | 0) % 2) return;
      const x = RICE.x + SP.riceSize(s.riceP).rw + 8, y = RICE.y - 4;
      R(x, y, 5, 2, '#f2b134'); R(x + 4, y - 2, 1, 6, '#f2b134'); R(x + 5, y - 1, 1, 4, '#f2b134'); R(x + 6, y, 1, 2, '#f2b134');
    },
  };
  SG.registerStep('wrap', wrap);
})(window.SG = window.SG || {});