// 各种像素精灵：饭团、鱼片、寿司、客人、气泡、灯笼。
// 新增鱼片花纹：在 SLICE_PATTERNS 里加一个函数，再在 data/ingredients.js 里用 pattern 名引用。
(function (SG) {
  const ctx = SG.ctx, G = SG.G;
  const { R, ellipse } = SG.px;
  const OUT = '#3b2620';

  const GRAINS = [[-5, -2], [2, -3], [-1, 1], [5, -1], [-6, 2], [3, 2], [0, -2]];
  const GRAINS2 = [[-3, -3], [4, 1], [-2, 3], [6, -3], [-7, 0]];

  // p: 0~1 捏的程度；越捏越宽越扁
  const riceSize = p => ({ rw: Math.round(8 + 4 * p), rh: Math.max(3, Math.round(8 - 3.6 * p)) });

  function rice(cx, cy, rw, rh, sk = 0) {
    ellipse(cx, cy + rh + 1, rw, 1, 'rgba(60,35,20,.28)');
    ellipse(cx, cy, rw + 1, rh + 1, '#5a4636', sk);
    ellipse(cx, cy, rw, rh, '#d9cfb8', sk);
    ellipse(cx, cy - 1, rw - 1, Math.max(1, rh - 1), '#f7f2e6', sk);
    ctx.fillStyle = '#ffffff';
    for (const [gx, gy] of GRAINS) ctx.fillRect(Math.round(cx + gx * rw / 10 + sk * gy * rh / 6), Math.round(cy - 1 + gy * rh / 7), 2, 1);
    ctx.fillStyle = '#c9bea6';
    for (const [gx, gy] of GRAINS2) ctx.fillRect(Math.round(cx + gx * rw / 10 + sk * gy * rh / 6), Math.round(cy + gy * rh / 7), 1, 1);
  }

  // 鱼片花纹。参数：左上角 x0,y0、宽高 w,h、食材定义 f
  const SLICE_PATTERNS = {
    marble(x0, y0, w, h, f) {                    // 三文鱼/金枪鱼的斜纹
      ctx.fillStyle = f.stripe;
      for (let i = 3; i < w - 2; i += 5) for (let r = 0; r < h - 1; r++) {
        const px = x0 + i + (r >> 1);
        if (px < x0 + w - 1) ctx.fillRect(px, y0 + r, 1, 1);
      }
    },
    egg(x0, y0, w, h, f) {                       // 玉子烧的亮边
      R(x0 + 2, y0, w - 4, 1, f.stripe);
      R(x0 + 1, y0 + 1, w - 2, 1, f.stripe);
    },
    shrimp(x0, y0, w, h, f) {                    // 虾的竖纹 + 虾尾
      ctx.fillStyle = f.stripe;
      for (let i = 3; i < w - 3; i += 4) ctx.fillRect(x0 + i, y0 + 1, 1, h - 2);
      R(x0 + w, y0 - 2, 3, h + 4, OUT);
      R(x0 + w, y0 - 1, 2, h + 2, '#e0402a');
      R(x0 + w, y0 + (h >> 1) - 1, 1, 2, '#ffb199');
    },
  };

  function slice(cx, cy, type, w, h) {
    const f = SG.INGREDIENTS[type];
    const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
    R(x0 + 1, y0 - 1, w - 2, h + 2, OUT); R(x0 - 1, y0 + 1, w + 2, h - 2, OUT); R(x0, y0, w, h, OUT);
    R(x0 + 1, y0, w - 2, h, f.base); R(x0, y0 + 1, w, h - 2, f.base);
    R(x0 + 1, y0 + h - 1, w - 2, 1, f.dark);
    const pat = SLICE_PATTERNS[f.pattern];
    if (pat) pat(x0, y0, w, h, f);
  }

  function nori(cx, top, bottom) {
    R(cx - 3, top, 7, bottom - top + 1, OUT);
    R(cx - 2, top, 5, bottom - top + 1, '#1e2b25');
    R(cx - 2, top, 1, bottom - top + 1, '#2f4639');
  }

  // 砧板上的大寿司（s = G.sushi）
  function bigSushi(cx, cy, s) {
    const { rw, rh } = riceSize(s.riceP);
    rice(cx, cy, rw, rh, s.lop || 0);
    if (s.type) {
      const top = cy - rh, sw = rw * 2 + 6;
      slice(cx + s.dx, top - 1, s.type, sw, 8);
      if (SG.INGREDIENTS[s.type].nori) nori(cx + s.dx, top - 6, cy + rh);
    }
  }

  // 气泡里 / 飞行中的小寿司
  function miniSushi(cx, cy, type) {
    rice(cx, cy + 2, 6, 3);
    slice(cx, cy - 1, type, 14, 4);
    if (SG.INGREDIENTS[type].nori) nori(cx, cy - 4, cy + 5);
  }

  function lantern(x, y) {
    R(x + 3, y - 4, 1, 3, '#2a1e18');
    R(x + 1, y - 1, 6, 1, '#2a1e18'); R(x + 1, y + 10, 6, 1, '#2a1e18');
    R(x, y, 8, 10, '#c8332c'); R(x - 1, y + 1, 10, 8, '#c8332c');
    R(x - 1, y + 3, 10, 1, '#9e241e'); R(x - 1, y + 6, 10, 1, '#9e241e');
    R(x + 1, y + 1, 2, 7, '#e8604f');
    const glow = 0.12 + Math.sin(G.t * 2 + x) * 0.04;
    ctx.fillStyle = `rgba(255,170,90,${glow})`; ctx.fillRect(x - 4, y - 3, 16, 16);
  }

  function customer(s) {
    const t = G.t;
    const e = 1 - Math.pow(1 - s.anim, 3);
    const bob = s.state === 'wait' ? (Math.sin(t * 2.2 + s.x) > 0.6 ? -1 : 0) : 0;
    const x = s.x + (s.shakeT > 0 ? Math.round(Math.sin(t * 70) * 2) : 0);
    const y = 112 + Math.round((1 - e) * 30) + bob;
    const O = '#2a1e18';
    // 身体
    R(x - 10, y - 15, 20, 16, O); R(x - 9, y - 16, 18, 1, O);
    R(x - 9, y - 15, 18, 15, s.shirt); R(x - 9, y - 15, 18, 2, 'rgba(255,255,255,.18)');
    R(x - 2, y - 15, 4, 3, '#f2e6d0');
    // 头
    R(x - 7, y - 30, 14, 14, O);
    R(x - 6, y - 29, 12, 13, s.skin);
    R(x - 7, y - 33, 14, 5, s.hair); R(x - 8, y - 31, 16, 3, s.hair); R(x - 8, y - 28, 2, 4, s.hair); R(x + 6, y - 28, 2, 4, s.hair);
    const ey = y - 23, ink = '#1d1620';
    const blink = ((t * 0.8 + s.x * 0.013) % 3) < 0.1;
    if (s.mood === 'happy') {
      for (const sx of [-4, 2]) { R(x + sx, ey, 1, 1, ink); R(x + sx + 1, ey - 1, 1, 1, ink); R(x + sx + 2, ey, 1, 1, ink); }
      R(x - 2, ey + 3, 1, 1, ink); R(x - 1, ey + 4, 3, 1, ink); R(x + 2, ey + 3, 1, 1, ink);
      R(x - 6, ey + 2, 2, 1, '#f08a8a'); R(x + 4, ey + 2, 2, 1, '#f08a8a');
    } else if (s.mood === 'angry') {
      R(x - 4, ey, 2, 2, ink); R(x + 2, ey, 2, 2, ink);
      R(x - 5, ey - 2, 2, 1, ink); R(x - 3, ey - 1, 1, 1, ink); R(x + 4, ey - 2, 2, 1, ink); R(x + 2, ey - 1, 1, 1, ink);
      R(x - 1, ey + 4, 3, 1, ink); R(x - 2, ey + 5, 1, 1, ink); R(x + 2, ey + 5, 1, 1, ink);
      R(x + 3, y - 31, 3, 1, '#ff4d3d'); R(x + 4, y - 32, 1, 3, '#ff4d3d');
    } else {
      if (blink) { R(x - 4, ey + 1, 2, 1, ink); R(x + 2, ey + 1, 2, 1, ink); }
      else { R(x - 4, ey, 2, 2, ink); R(x + 2, ey, 2, 2, ink); }
      const worried = s.state === 'wait' && s.pat / s.maxP < 0.3;
      if (worried) {
        R(x - 1, ey + 5, 3, 1, ink); R(x - 2, ey + 4, 1, 1, ink); R(x + 2, ey + 4, 1, 1, ink);
        if ((t * 3 | 0) % 2) { R(x + 7, ey - 3, 1, 1, '#7ec8ff'); R(x + 6, ey - 2, 3, 2, '#7ec8ff'); }
      } else R(x - 1, ey + 4, 3, 1, ink);
    }
  }

  // 订单气泡 + 耐心条
  function bubble(s) {
    if (!(s.state === 'wait' || (s.state === 'arrive' && s.anim > .6))) return;
    const x = s.x, O = '#2a1e18';
    const glow = G.phase === 'serve' && G.sushi && G.sushi.type === s.type && (G.t * 6 | 0) % 2 === 0;
    R(x - 13, 41, 26, 20, glow ? '#f2b134' : O);
    R(x - 12, 42, 24, 18, '#fffaf0');
    R(x - 6, 61, 5, 1, O); R(x - 5, 61, 3, 1, '#fffaf0'); R(x - 5, 62, 3, 1, O); R(x - 4, 62, 1, 1, '#fffaf0'); R(x - 4, 63, 1, 1, O);
    miniSushi(x, 51, s.type);
    const r = Math.max(0, s.pat / s.maxP);
    R(x - 12, 35, 24, 4, O);
    R(x - 11, 36, Math.round(22 * r), 2, r > .5 ? '#7fd36b' : r > .25 ? '#f2b134' : '#ff5a4a');
  }

  SG.SLICE_PATTERNS = SLICE_PATTERNS;
  SG.sprites = { riceSize, rice, slice, nori, bigSushi, miniSushi, lantern, customer, bubble };
})(window.SG = window.SG || {});
