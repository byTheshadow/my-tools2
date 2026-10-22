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
      ctx.fillRect((82 + Math.sin(t * 1.2 + i * 1.3) * (3 + p * 6) - s / 2) | 0, (140 - p * 34) | 0, s, s);
    }
  }

  function shop(t) {
    // 侧墙与屋顶阴影
    R(44, 154, 92, 54, '#1b1222');
    R(52, 160, 76, 48, '#261b2e');

    // 暖光外溢的大窗格（和风木格拉门）
    R(58, 166, 64, 38, '#281a1a');
    // 室内暖黄暖橙渐层
    R(60, 168, 60, 34, '#f0ad4e');
    R(60, 172, 60, 28, '#f5c067');
    R(60, 182, 60, 18, '#ffd485');
    // 师傅剪影（在案板前捏寿司的动作：呼吸起伏）
    const bob = Math.sin(t * 2) * .8;
    R(86, 175 + bob | 0, 8, 7, '#3d2516');                          // 头
    R(84, 182 + bob | 0, 13, 10, '#3d2516');                        // 身
    R(97, 184 + Math.sin(t * 4) * .7 | 0, 3, 5, '#3d2516');         // 手
    // 木格条纹
    for (let x = 60; x <= 120; x += 12) R(x, 168, 1, 34, '#543621');
    R(60, 178, 60, 1, '#543621');
    R(60, 188, 60, 1, '#543621');

    // 屋檐瓦当（两层飞檐）
    function roof(y, x1, x2, h) {
      for (let i = 0; i < h; i++) {
        const inset = i * 2, len = (x2 - x1) + inset * 2;
        R(x1 - inset, y - i, len, 1, i === 0 ? '#1b1424' : '#2b1e36');
      }
      // 积雪
      R(x1 - h * 2 + 2, y - h, (x2 - x1) + h * 4 - 4, 2, '#edf0fa');
      R(x1 - h * 2 + 5, y - h - 1, (x2 - x1) + h * 4 - 10, 1, '#ffffff');
    }
    roof(160, 48, 132, 5);
    roof(147, 62, 118, 4);

    // 暖帘（Noren）- 深蓝底印白字"鮨"
    const norenCols = ['#20324f', '#1c2d47', '#20324f'];
    for (let i = 0; i < 3; i++) {
      const nx = 72 + i * 12, ny = 162 + Math.sin(t * 1.5 + i) * .6 | 0;
      R(nx, ny, 11, 10, norenCols[i]);
      R(nx + 1, ny + 9, 9, 1, '#131e30');
    }
    // 帘上白纹
    R(76, 165, 3, 4, '#edf0fa');
    R(88, 165, 3, 4, '#edf0fa');
    R(100, 165, 3, 4, '#edf0fa');

    // 红灯笼（提灯）- 左右各一，夜风中轻晃
    function lantern(cx, cy, ph) {
      const sw = Math.sin(t * 1.8 + ph) * 1.2;
      const x = cx + sw | 0, y = cy;
      // 吊线
      R(cx | 0, y - 4, 1, 4, '#1b1424');
      // 辉光
      ellipse(x, y + 5, 9, 10, 'rgba(255,80,40,.09)');
      ellipse(x, y + 5, 5, 6, 'rgba(255,140,60,.16)');
      // 笼身
      R(x - 3, y, 7, 10, '#c73228');
      R(x - 4, y + 2, 9, 6, '#e03a2f');
      R(x - 2, y + 3, 5, 4, '#ff7844');
      // 黑箍
      R(x - 3, y, 7, 1, '#201214');
      R(x - 3, y + 9, 7, 1, '#201214');
      // 流苏
      R(x, y + 10, 1, 3, '#c73228');
    }
    lantern(56, 164, 0);
    lantern(124, 164, 2.1);

    // 小木招牌：すし
    R(42, 178, 6, 18, '#3b2416');
    R(43, 179, 4, 16, '#6e4428');
    R(44, 181, 2, 2, '#fff3d1');
    R(44, 185, 2, 2, '#fff3d1');
    R(44, 189, 2, 2, '#fff3d1');

    smoke(t);
  }

  // ---------- 地面与积雪 ----------
  function ground() {
    R(0, 204, W, H - 204, '#140e1f');
    // 石板路透视线
    for (let i = 0; i < 7; i++) {
      const x = 16 + i * 24;
      R(x, 205, 20, 2, '#1c152a');
      R(x + 4, 212, 24, 3, '#1c152a');
      R(x - 2, 222, 28, 4, '#1c152a');
    }
    // 暖光倒影在雪地上
    ellipse(90, 208, 46, 7, 'rgba(245,180,90,.16)');
    ellipse(90, 214, 34, 5, 'rgba(245,180,90,.08)');
    // 左右路边积雪
    R(0, 202, 38, 4, '#d7ddf0'); R(0, 201, 30, 2, '#ffffff');
    R(142, 202, 38, 4, '#d7ddf0'); R(148, 201, 32, 2, '#ffffff');
    // 杂碎雪块
    R(48, 206, 5, 2, '#b8bfdb'); R(124, 208, 6, 2, '#b8bfdb');
  }

  // ---------- 整个场景绘制 ----------
  function scene(t) {
    for (let i = 0; i < SKY_BANDS.length; i++) R(0, i * 4, W, 4, SKY_BANDS[i]);
    stars(t);
    moon();
    buildings(FAR, t);
    buildings(NEAR, t);
    snowDraw(SNOW_FAR, t);
    shop(t);
    ground();
    snowDraw(SNOW_NEAR, t);
  }

  function dim(alpha) {
    ctx.fillStyle = `rgba(10, 6, 18, ${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------- 玩法说明：复用 DOM 像素文字标签 ----------
  // 卡片内部的小字如果走 Canvas fillText，低分屏会模糊；直接在 #wrap 里贴绝对定位的 div，
  // 继承游戏主样式的 DotGothic16，最清晰整洁。
  let labEl = document.getElementById('lab');
  if (!labEl) { labEl = document.createElement('div'); labEl.id = 'lab'; SG.wrap.appendChild(labEl); }
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

  // 鼠标指针：箭头尖在 (x, y)；press 时下压 1px、变成略暗的白，并荡出一圈涟漪
  const CURSOR = [
    'X..........',
    'XX.........',
    'X#X........',
    'X##X.......',
    'X###X......',
    'X####X.....',
    'X#####X....',
    'X######X...',
    'X#######X..',
    'X########X.',
    'X#####XXXXX',
    'X##X##X....',
    'X#X.X##X...',
    'XX..X##X...',
    'X....X##X..',
    '.....X##X..',
    '......XX...',
  ];
  function finger(x, y, press, since) {
    const yy = y + (press ? 1 : 0), fill = press ? '#e6e2d6' : '#ffffff';
    for (let r = 0; r < CURSOR.length; r++) {
      const row = CURSOR[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === 'X') R(x + c, yy + r, 1, 1, '#2a1e18');
        else if (ch === '#') R(x + c, yy + r, 1, 1, fill);
      }
    }
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

  // ---------- 三页卡片动态图 ----------

  // ① 捏饭团：长按蓄力到黄圈
  SG.registerHowtoArt('rice', () => {
    const T = G.t % 3.0, cx = 90, cy = 92;
    board(CARD.x, CARD.y, CARD.w, CARD.h);
    const pressing = T >= .5 && T < 1.28, released = T >= 1.28;
    const p = pressing ? (T - .5) / .78 : (released ? 1 : 0);
    const ringR = lerp(34, 13, p);
    const GC = 13, gw = 2, R0 = 34;

    const { rw, rh } = SP.riceSize(cl(p * .7, 0, .7));
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
    finger(cx + 30, 130, T >= TAP - .05 && T < TAP + .15, T - TAP);
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
    finger(Math.round(lerp(104, 56, fx)), Math.round(lerp(134, 94, fx)), T >= TAP - .08 && T < TAP + .12, T - TAP);
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
