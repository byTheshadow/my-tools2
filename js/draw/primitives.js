// 最底层的像素绘制工具。
(function (SG) {
  const ctx = SG.ctx;

  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

  // 像素椭圆；sk 为斜切，用来表现饭团歪了
  function ellipse(cx, cy, rw, rh, c, sk = 0) {
    ctx.fillStyle = c;
    for (let dy = -rh; dy <= rh; dy++) {
      const k = 1 - (dy * dy) / (rh * rh + 0.0001);
      if (k < 0) continue;
      const hw = Math.round(rw * Math.sqrt(k));
      ctx.fillRect(Math.round(cx - hw + sk * dy), Math.round(cy + dy), hw * 2 + 1, 1);
    }
  }

  // 像素圆环（r0 内半径，r1 外半径）
  function ringFill(cx, cy, r0, r1, c) {
    ctx.fillStyle = c;
    const R1 = Math.round(r1), r0s = r0 * r0;
    for (let dy = -R1; dy <= R1; dy++) {
      const outer = Math.floor(Math.sqrt(Math.max(0, r1 * r1 - dy * dy)));
      if (dy * dy < r0s) {
        const inner = Math.ceil(Math.sqrt(r0s - dy * dy));
        if (outer >= inner) {
          ctx.fillRect(cx - outer, cy + dy, outer - inner + 1, 1);
          ctx.fillRect(cx + inner, cy + dy, outer - inner + 1, 1);
        }
      } else ctx.fillRect(cx - outer, cy + dy, outer * 2 + 1, 1);
    }
  }

  SG.px = { R, ellipse, ringFill };
})(window.SG = window.SG || {});
