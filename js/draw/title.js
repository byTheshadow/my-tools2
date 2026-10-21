// 开屏夜景：雪夜小巷尽头一间亮着灯的寿司屋。
// 同一块画布还负责"玩法说明"的卡片动画（SG.registerHowtoArt 登记，新玩法加一个函数即可）。
//   SG.titleScene.update(dt)  推进雪花
//   SG.titleScene.draw()      按 G.screen 画：夜景 [+ 暗化 + 说明卡]
(function (SG) {
  const ctx = SG.ctx, G = SG.G, { W, H } = SG.CFG;
  const { R, ellipse, ringFill } = SG.px;
  const SP = SG.sprites;
  const FONT = '"DotGothic16","PingFang SC","Microsoft YaHei",monospace';

  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => k * k * (3 - 2 * k);
  function rng(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

  // ---------- 天空 ----------
  const SKY = [[9, 7, 30], [26, 17, 58], [66, 38, 88], [128, 68, 96]];     // 顶 → 地平线
  function skyAt(y) {
    const k = cl(y / 176, 0, 1) * (SKY.length - 1), i = Math.min(SKY.length - 2, k | 0), f = k - i;
    const a = SKY[i], b = SKY[i + 1];
    return `rgb(${lerp(a[0], b[0], f) | 0},${lerp(a[1], b[1], f) | 0},${lerp(a[2], b[2], f) | 0})`;
  }
  const SKY_BANDS = []; for (let y = 0; y < 176; y += 4) SKY_BANDS.push(skyAt(y + 2));

  const STARS = (() => { const r = rng(11), a = []; for (let i = 0; i < 40; i++) a.push({ x: r() * W | 0, y: r() * 118 | 0, ph: r() * 6.28, big: r() < .22 }); return a; })();
  function stars(t) {
    for (const s of STARS) {
      const a = .5 + .5 * Math.sin(t * 1.6 + s.ph);
      if (a < .3) continue;
      R(s.x, s.y, 1, 1, a > .8 ? '#ffffff' : '#a9a5cf');
      if (s.big && a > .85) { R(s.x - 1, s.y, 3, 1, '#cfcaf0'); R(s.x, s.y - 1, 1, 3, '#cfcaf0'); }
    }
  }

  function moon() {
    const cx = 151, cy = 29;
    ellipse(cx, cy, 20, 20, 'rgba(255,236,190,.05)');
    ellipse(cx, cy, 15, 15, 'rgba(255,236,190,.07)');
    // 月牙：大圆减去右上偏移的小圆，逐行画，不会和天空渐变接缝
    for (let dy = -8; dy <= 8; dy++) {
      const ow = Math.floor(Math.sqrt(64 - dy * dy)), d2 = dy + 2;
      let right = ow;
      if (Math.abs(d2) <= 7) right = Math.min(ow, 3 - Math.floor(Math.sqrt(49 - d2 * d2)) - 1);
      if (right >= -ow) R(cx - ow, cy + dy, right + ow + 1, 1, '#f6ecd0');
    }
  }

  // ---------- 远景楼群 ----------
  function skyline(seed, base, hMin, hMax, wMin, wMax, col, chance) {
    const r = rng(seed), out = []; let x = -4;
    while (x < W) {
      const w = (wMin + r() * (wMax - wMin)) | 0, h = (hMin + r() * (hMax - hMin)) | 0, b = { x, w, top: base - h, h, col, wins: [] };
      for (let wy = b.top + 4; wy < base - 3; wy += 5) for (let wx = x + 2; wx < x + w - 2; wx += 4)
        if (r() < chance) b.wins.push({ x: wx, y: wy, c: r() < .2 ? '#8fb8ff' : '#e0a03a', k: r() * 40 });
      out.push(b); x += w + (r() < .3 ? 1 : 0);
    }
    return out;
  }
  const FAR = skyline(7, 178, 20, 54, 10, 18, '#241a3d', .34);
  const NEAR = skyline(21, 186, 10, 32, 12, 22, '#150f24', .18);
  function buildings(list, t) {
    for (const b of list) {
      R(b.x, b.top, b.w, b.h, b.col);
      for (const w of b.wins) if (Math.sin(t * .13 + w.k) > -.6) R(w.x, w.y, 2, 2, w.c);
    }
  }

  // ---------- 雪 ----------
  function flakes(n, seed, vy, size, col) {
    const r = rng(seed), a = [];
    for (let i = 0; i < n; i++) a.push({ x: r() * W, y: r() * H, vy: vy * (.7 + r() * .6), ph: r() * 6.28, sw: 2 + r() * 4, size, col });
    return a;
  }
  const SNOW_FAR = flakes(34, 5, 9, 1, '#8c93bd');
  const SNOW_NEAR = flakes(30, 9, 19, 1, '#e8ecff').concat(flakes(10, 13, 25, 2, '#ffffff'));
  function snowStep(list, dt) { for (const f of list) { f.y += f.vy * dt; if (f.y > H + 2) { f.y = -2; } } }
  function snowDraw(list, t) { for (const f of list) R(f.x + Math.sin(t * .9 + f.ph) * f.sw, f.y, f.size, f.size, f.col); }

  // ---------- 寿司屋 ----------
  function smoke(t) {
    for (let i = 0; i < 6; i++) {
      const p = ((t * .28 + i / 6) % 1), a = (1 - p) * .38, s = 2 + p * 4 | 0;
      ctx.fillStyle = `rgba(235,235,255,${a.toFixed(2)})`;
      ctx.fillRect(Math.round(133 + Math.sin(p * 5 + i) * 3 + p * 9), Math.round(130 - p * 30), s, s);
    }
  }

  function roof() {
    for (let r = 0; r < 10; r++) {
      const y = 146 + r * 2, l = 40 - r * 3, rt = 140 + r * 3;
      R(l, y, rt - l, 2, r % 2 ? '#3a2d4f' : '#2e2340');
      for (let x = l + (r % 2) * 3 + 2; x < rt - 1; x += 6) R(x, y, 1, 2, '#1d1620');
    }
    R(40, 144, 100, 3, '#e8ecff'); R(38, 147, 104, 1, '#aab4da');          // 屋脊积雪
    for (const x of [46, 60, 75, 91, 108, 124]) R(x, 143, 5, 1, '#e8ecff');
    for (const x of [16, 34, 58, 82, 112, 138, 154]) { R(x, 164, 7, 2, '#e8ecff'); R(x + 1, 166, 4, 1, '#aab4da'); }
  }

  function interior(t) {
    R(34, 172, 112, 50, '#f6c46a');
    R(34, 172, 112, 12, '#d98f3a'); R(34, 184, 112, 14, '#ecab4e');
    R(40, 196, 100, 1, '#a8653a'); R(40, 197, 100, 1, '#6e3f22');           // 酒架
    const cols = ['#3f9d74', '#d0574a', '#4a7bd0', '#e0a03a', '#8a5cc2'];
    for (let i = 0, x = 44; x < 136; x += 7, i++) { const h = 5 + (i * 3) % 4; R(x, 196 - h, 3, h, cols[i % 5]); R(x, 196 - h, 1, h, 'rgba(255,255,255,.35)'); }
    // 柜台后的人影：左右是客人，中间是戴白帽的你
    for (const [x, chef] of [[58, 0], [90, 1], [122, 0]]) {
      const bob = Math.round(Math.sin(t * 1.3 + x) * .6);
      R(x - 6, 213 + bob, 12, 10, '#2a1e18');
      ellipse(x, 208 + bob, 4, 4, '#2a1e18');
      if (chef) { R(x - 4, 201 + bob, 8, 3, '#f7f2e6'); R(x - 3, 198 + bob, 6, 4, '#f7f2e6'); }
      else R(x - 4, 203 + bob, 8, 2, '#1a120e');
    }
    R(34, 222, 112, 3, '#e8b77a'); R(34, 225, 112, 13, '#a8653a'); R(34, 231, 112, 1, '#965730'); R(34, 238, 112, 2, '#6e3f22');
  }

  function posts() {
    for (const x of [24, 146]) { R(x, 170, 10, 70, '#4a2c1c'); R(x + 1, 170, 1, 70, '#6e3f22'); R(x + 8, 170, 1, 70, '#2f1c12'); }
    R(8, 166, 164, 3, '#6e3f22'); R(8, 166, 164, 1, '#a8653a'); R(8, 169, 164, 1, '#2b1d22');
    R(20, 238, 18, 3, '#e8ecff'); R(142, 238, 18, 3, '#e8ecff');
  }

  function noren(t) {
    R(30, 171, 120, 2, '#2b1d22');
    for (let i = 0; i < 4; i++) {
      const x0 = 34 + i * 28;
      for (let y = 173; y < 194; y++) {
        const dx = Math.round(Math.sin(t * 1.4 + i * .8) * (y - 173) / 21 * 1.4);
        R(x0 + dx, y, 26, 1, y > 190 ? '#e8e2d0' : '#27366a');
        R(x0 + dx, y, 1, 1, '#3b4d8f'); R(x0 + 25 + dx, y, 1, 1, '#1b2548');
      }
    }
    ellipse(90, 183, 11, 8, '#2b1d22'); ellipse(90, 183, 10, 7, '#f7f2e6');
    SP.miniSushi(90, 184, 'salmon');
  }

  function fairy(t) {
    const cols = ['#ff6b5b', '#f2b134', '#8be08b', '#7ec8ff'];
    for (let i = 0, x = 14; x < 168; x += 8, i++) {
      const on = Math.sin(t * 3 + i * 1.7) > -.35;
      R(x, 167, 2, 2, on ? cols[i % 4] : '#4a3a2a');
      if (on) { ctx.fillStyle = 'rgba(255,220,150,.10)'; ctx.fillRect(x - 2, 165, 6, 6); }
    }
  }

  function lanterns(t) {
    for (const x of [13, 159]) {
      const sw = Math.round(Math.sin(t * 1.8 + x) * 1.5);
      R(x + 3, 169, 1, 8, '#2a1e18');
      ctx.save(); ctx.translate(sw, 0);
      ellipse(x + 4, 183, 14, 14, 'rgba(255,170,90,.07)');
      SP.lantern(x, 178);
      ctx.restore();
    }
  }

  function ground() {
    R(0, 240, W, 80, '#1a1322');
    const rows = [240, 252, 266, 282, 300, 320];
    for (let i = 0; i < rows.length - 1; i++) {
      R(0, rows[i], W, 1, '#251c31');
      for (let x = (i % 2) * 16; x < W; x += 32) R(x, rows[i], 1, rows[i + 1] - rows[i], '#251c31');
    }
    for (let r = 0; r < 34; r++) {                                              // 门里漏出来的暖光
      const a = .24 * Math.pow(1 - r / 34, 1.6), half = 54 + r * 1.5;
      ctx.fillStyle = `rgba(255,198,107,${a.toFixed(3)})`;
      ctx.fillRect(Math.round(90 - half), 240 + r, Math.round(half * 2), 1);
    }
    ellipse(17, 251, 6, 2, 'rgba(200,51,44,.28)'); ellipse(163, 251, 6, 2, 'rgba(200,51,44,.28)');   // 灯笼倒影
    for (const [x, y, w] of [[8, 262, 10], [150, 270, 14], [64, 296, 9], [118, 306, 12], [30, 312, 8]]) R(x, y, w, 1, '#3a3350');
  }

  function cat(t) {
    const u = (t + 16) % 24;
    if (u > 9) return;
    const x = Math.round(36 + u * 12), y = 143, c = '#120e19', f = (t * 6 | 0) % 2;
    R(x - 4, y - 5, 8, 4, c); R(x + 3, y - 7, 5, 4, c);                         // 身体、头
    R(x + 3, y - 9, 1, 2, c); R(x + 6, y - 9, 1, 2, c);                         // 耳朵
    R(x + 6, y - 6, 1, 1, '#f2d24a');                                           // 眼睛
    R(x - 3 + f, y - 1, 1, 2, c); R(x + 2 - f, y - 1, 1, 2, c);                 // 腿
    const tw = Math.round(Math.sin(t * 3) * 1);
    R(x - 5, y - 6, 1, 2, c); R(x - 6 + tw, y - 9, 1, 3, c);                    // 尾巴
  }

  function scene(t) {
    R(0, 0, W, H, '#1a1322');
    for (let i = 0; i < SKY_BANDS.length; i++) R(0, i * 4, W, 4, SKY_BANDS[i]);
    stars(t); moon();
    buildings(FAR, t);
    snowDraw(SNOW_FAR, t);
    buildings(NEAR, t);
    R(0, 186, W, 60, '#150f24');
    R(128, 134, 10, 14, '#3a2d4f'); R(126, 132, 14, 3, '#2d2231'); R(126, 131, 14, 1, '#e8ecff');   // 烟囱
    roof(); cat(t); smoke(t);
    interior(t); posts(); noren(t); fairy(t); lanterns(t);
    ground();
    snowDraw(SNOW_NEAR, t);
  }

  // ---------- 暗化 + 说明卡 ----------
  function dim(a) { ctx.fillStyle = `rgba(12,8,22,${a})`; ctx.fillRect(0, 0, W, H); }

  // 卡片里的文字用 DOM 画（比画布文字清晰），每帧登记、帧末统一刷新
  const labEl = document.createElement('div');
  labEl.id = 'lab'; SG.wrap.appendChild(labEl);
  const pool = []; let labs = [];
  const txt = (s, x, y, col, size = 8) => labs.push({ s, x, y, col, size });
  function flushLabels() {
    while (pool.length < labs.length) { const d = document.createElement('div'); d.className = 'lab'; labEl.appendChild(d); pool.push(d); }
    pool.forEach((d, i) => {
      const l = labs[i];
      if (!l) { d.style.display = 'none'; return; }
      d.style.display = '';
      if (d.textContent !== l.s) d.textContent = l.s;
      d.style.left = l.x * SG.S + 'px'; d.style.top = l.y * SG.S + 'px'; d.style.fontSize = l.size * SG.S + 'px'; d.style.color = l.col;
    });
    labs = [];
  }

  // 指尖在 (x, y)；press 时下压 1px 并荡出一圈涟漪
  function finger(x, y, press, since) {
    const o = '#2a1e18', sk = '#f6d2b0', sh = '#e8b48c', yy = y + (press ? 1 : 0);
    R(x - 6, yy + 8, 12, 9, o); R(x - 5, yy + 9, 10, 7, sk); R(x - 5, yy + 14, 10, 2, sh);     // 手掌
    R(x - 8, yy + 11, 3, 5, o); R(x - 7, yy + 12, 2, 3, sk);                                    // 拇指
    R(x - 3, yy - 1, 6, 11, o); R(x - 2, yy, 4, 10, sk); R(x - 1, yy + 1, 2, 2, '#ffe9d6');     // 食指
    if (press && since >= 0 && since < .3) ringFill(x, y, Math.round(2 + since * 24), Math.round(3 + since * 24), `rgba(255,255,255,${(.8 - since * 2.6).toFixed(2)})`);
  }

  const CARD = { x: 14, y: 28, w: 152, h: 124 };
  function card() {
    const { x, y, w, h } = CARD;
    R(x - 3, y - 3, w + 6, h + 6, '#1d1620'); R(x - 2, y - 2, w + 4, h + 4, '#c9a96a'); R(x - 1, y - 1, w + 2, h + 2, '#1d1620');
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const art = SG.reg.howtoArts[(SG.HOWTO[G.howPage] || {}).art];
    if (art) art(G.t);
    ctx.restore();
  }

  const board = (x, y, w, h) => { R(x, y, w, h, '#e5bf88'); for (let gy = y + 14; gy < y + h; gy += 19) R(x, gy, w, 1, '#d6ad74'); };
  const wall = (x, y, w, h) => { R(x, y, w, h, '#3a2c3f'); for (let gx = x + 6; gx < x + w; gx += 12) R(gx, y, 1, h, '#33263a'); };

  // ① 捏饭团：按住 → 圈缩小 → 金圈里松手
  SG.registerHowtoArt('rice', () => {
    const T = G.t % 3.8, cx = 90, cy = 92, R0 = 40, GC = 13, gw = 4;
    board(CARD.x, CARD.y, CARD.w, CARD.h);
    const pressing = T >= .5 && T < 1.28, released = T >= 1.28 && T < 3.3;
    const u = cl((T - .5) / 1.2, 0, 1), ringR = pressing ? R0 * (1 - u) : R0;
    const p = pressing ? 1 - ringR / R0 : released ? .7 : 0;
    const { rw, rh } = SP.riceSize(p);
    SP.rice(cx, cy, rw, rh);
    if (!released) {
      ringFill(cx, cy, GC - gw, GC + gw, pressing ? 'rgba(242,177,52,.85)' : 'rgba(242,177,52,.5)');
      const rr = pressing ? ringR : R0 - (Math.sin(G.t * 4) > 0 ? 0 : 1);
      ringFill(cx, cy, Math.max(0, rr - 1.5), rr + .5, pressing ? '#ffffff' : 'rgba(255,255,255,.55)');
      if (pressing && ringR <= GC + gw) txt('现在松手！', cx, 44, '#f2b134', 8);
      else if (pressing) txt('按住…', cx, 44, '#fff3c4', 8);
    } else {
      const k = T - 1.28;
      if (k < .45) ringFill(cx, cy, 13, 14, `rgba(255,255,255,${(1 - k / .45).toFixed(2)})`);
      txt('完美！', cx, 52, '#f2b134', 10);
      if (k < .6) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, d = 6 + k * 46; R(cx + Math.cos(a) * d, cy - 4 + Math.sin(a) * d * .8, 2, 2, i % 2 ? '#f2b134' : '#fff3c4'); }
    }
    finger(cx + 22, cy + 22, pressing || (T >= 1.28 && T < 1.4), T - .5);
  });

  // ② 放鱼片：鱼片到中线时点一下
  const BELT_TYPES = ['salmon', 'tuna', 'egg'], SPEED = 102 / 3.6;          // 3.6 秒刚好走 3 个鱼片，循环无缝
  SG.registerHowtoArt('fish', () => {
    const T = G.t % 3.6, cx = 90, ry = 124, TAP = 1.4;
    board(CARD.x, CARD.y, CARD.w, CARD.h);
    R(CARD.x, 30, CARD.w, 24, '#2a2830'); R(CARD.x, 32, CARD.w, 20, '#55515e');
    for (let x = CARD.x - (T * SPEED) % 6; x < CARD.x + CARD.w; x += 6) R(x, 34, 1, 16, '#4a4653');
    for (let k = -4; k <= 5; k++) {
      if (k === 0 && T >= TAP) continue;
      const x = cx + k * 34 + (TAP - T) * SPEED;
      SP.slice(x, 43, BELT_TYPES[((k % 3) + 3) % 3], 24, 8);
    }
    R(cx - 2, 55, 5, 1, '#f2b134'); R(cx - 1, 56, 3, 1, '#f2b134'); R(cx, 57, 1, 1, '#f2b134');
    const { rw, rh } = SP.riceSize(.7), land = ry - rh - 1, tau = T - TAP;
    const y = 43 + .5 * 1100 * tau * tau, landed = T >= TAP && y >= land;
    if (!landed) for (let gy = 60; gy < 108; gy += 5) R(cx, gy, 1, 2, (G.t * 4 | 0) % 2 ? '#f2b134' : '#c98a24');
    if (!landed) {
      SP.rice(cx, ry, rw, rh);
      if (T >= TAP) SP.slice(cx, y, 'salmon', rw * 2 + 6, 8);
    } else {
      R(cx - 17, ry + 6, 35, 3, 'rgba(60,35,20,.2)');
      SP.bigSushi(cx, ry, { riceP: .7, type: 'salmon', dx: 0, lop: 0 });
      if (T < 3.3) txt('正中！', cx, 84, '#f2b134', 10);
    }
    finger(cx + 30, 138, T >= TAP - .05 && T < TAP + .15, T - TAP);
  });

  // ③ 上菜：点点了这道菜的客人
  const mkCust = (x, type, skin, hair, shirt) => ({ i: 0, x, state: 'wait', anim: 1, pat: 1, maxP: 1, type, mood: 'idle', shakeT: 0, skin, hair, shirt });
  const C1 = mkCust(56, 'salmon', '#f6d2b0', '#2b1d1a', '#4a7bd0'), C2 = mkCust(124, 'tuna', '#e8b48c', '#d9d2c9', '#d0574a');
  SG.registerHowtoArt('serve', () => {
    const T = G.t % 4.2, TAP = 1.7, FLY = .38;
    wall(CARD.x, CARD.y, CARD.w, 82);
    const served = T >= TAP + FLY;
    C1.state = served ? 'leave' : 'wait'; C1.mood = served ? 'happy' : 'idle'; C1.pat = 1 - T / 9;
    C2.state = 'wait'; C2.pat = .8 - T / 14;
    SP.customer(C1); SP.customer(C2);
    SP.bubble(C1); SP.bubble(C2);
    R(CARD.x, 106, CARD.w, 4, '#e8b77a'); R(CARD.x, 110, CARD.w, 14, '#a8653a'); R(CARD.x, 115, CARD.w, 1, '#965730'); R(CARD.x, 124, CARD.w, 2, '#6e3f22');
    board(CARD.x, 126, CARD.w, 26);
    if (T < TAP) { R(73, 144, 35, 3, 'rgba(60,35,20,.2)'); SP.bigSushi(90, 138, { riceP: .7, type: 'salmon', dx: 0, lop: 0 }); }
    else if (T < TAP + FLY) {
      const k = (T - TAP) / FLY;
      SP.miniSushi(Math.round(lerp(90, 56, k)), Math.round(lerp(138, 98, k) - Math.sin(Math.PI * k) * 24), 'salmon');
    }
    if (served && T < TAP + 1.6) txt('+148', 56, 50 - (T - TAP - FLY) * 12, '#8be08b', 9);
    const fx = ease(cl(T / TAP, 0, 1));
    finger(Math.round(lerp(104, 56, fx)), Math.round(lerp(146, 94, fx)), T >= TAP - .08 && T < TAP + .12, T - TAP);
  });

  SG.titleScene = {
    update(dt) { snowStep(SNOW_FAR, dt); snowStep(SNOW_NEAR, dt); },
    draw() {
      scene(G.t);
      if (G.screen === 'howto') { dim(.86); card(); }
      else if (G.screen === 'levels') dim(.78);
      else if (G.screen === 'intro') dim(.55);
      flushLabels();
    },
  };
})(window.SG = window.SG || {});
