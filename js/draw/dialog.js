// 澄姐的对话框：画布负责框、头像和翻页箭头，文字由 ui.js 用 DOM 画（更清楚）。
// 位置写在 BOX 里，css/style.css 的 #talk 要跟着对齐。
(function (SG) {
  const ctx = SG.ctx, G = SG.G;
  const { R, ellipse } = SG.px;
  const BOX = { x: 4, y: 232, w: 172, h: 80 };

  // 澄姐：挽发、作务衣、眼神温和。画在 (x, y) 为左上角的 34×38 区域里
  function chef(x, y) {
    const O = '#2a1e18', skin = '#f3cfae', hair = '#241a24', cloth = '#2f4664';
    R(x, y, 34, 38, '#1d1620'); R(x + 1, y + 1, 32, 36, '#4a3a52');
    R(x + 1, y + 1, 32, 18, '#5a4760');
    const bob = Math.sin(G.t * 1.6) > .6 ? 1 : 0;       // 轻微呼吸
    const cx = x + 17, cy = y + 20 + bob;
    // 肩膀与衣领
    R(cx - 13, cy + 9, 26, 9, O); R(cx - 12, cy + 10, 24, 8, cloth);
    R(cx - 12, cy + 10, 24, 1, '#405a7e');
    for (let r = 0; r < 6; r++) {                      // 交叠的领口
      R(cx - 5 + r, cy + 10 + r, 2, 1, '#f7f2e6');
      R(cx + 4 - r, cy + 10 + r, 2, 1, '#e3dac6');
    }
    R(cx - 1, cy + 15, 2, 3, '#1b2a3e');
    // 发髻与头
    ellipse(cx, cy - 13, 5, 4, hair);
    R(cx + 4, cy - 15, 2, 2, '#c8332c');                // 发簪
    R(cx - 9, cy - 11, 18, 20, O); R(cx - 8, cy - 10, 16, 18, skin);
    R(cx - 9, cy - 12, 18, 5, hair); R(cx - 10, cy - 10, 3, 9, hair); R(cx + 7, cy - 10, 3, 9, hair);
    R(cx - 9, cy - 7, 6, 2, hair); R(cx + 2, cy - 7, 7, 2, hair);     // 中分的刘海
    R(cx - 8, cy - 11, 5, 1, '#3a2c3c');
    // 眼睛（偶尔眨）、笑、腮红
    const blink = (G.t % 4.2) < .12, ey = cy - 2;
    if (blink) { R(cx - 5, ey, 3, 1, O); R(cx + 2, ey, 3, 1, O); }
    else { R(cx - 5, ey - 1, 3, 3, O); R(cx + 2, ey - 1, 3, 3, O); R(cx - 4, ey - 1, 1, 1, '#f7f2e6'); R(cx + 3, ey - 1, 1, 1, '#f7f2e6'); }
    R(cx - 1, ey + 4, 3, 1, O); R(cx - 2, ey + 3, 1, 1, O); R(cx + 2, ey + 3, 1, 1, O);
    R(cx - 7, ey + 2, 2, 1, '#e59a92'); R(cx + 5, ey + 2, 2, 1, '#e59a92');
  }

  function box() {
    const { x, y, w, h } = BOX;
    R(x - 1, y - 1, w + 2, h + 2, '#1d1620');
    R(x, y, w, h, '#f7f2e6'); R(x + 1, y + 1, w - 2, h - 2, '#241b2c');
    R(x + 2, y + 2, w - 4, h - 4, '#1d1620');
    for (const [dx, dy] of [[1, 1], [w - 4, 1], [1, h - 4], [w - 4, h - 4]]) R(x + dx, y + dy, 3, 3, '#f2b134');
    chef(x + 6, y + 8);
    R(x + 6, y + 48, 34, 1, '#4a3a52');
  }

  function arrow() {
    if ((G.t * 2 | 0) % 2) return;
    const x = BOX.x + BOX.w - 14, y = BOX.y + BOX.h - 12;
    R(x, y, 7, 1, '#f2b134'); R(x + 1, y + 1, 5, 1, '#f2b134'); R(x + 2, y + 2, 3, 1, '#f2b134'); R(x + 3, y + 3, 1, 1, '#f2b134');
  }

  SG.dialog = {
    box: BOX,
    draw() {
      if (!SG.tutorial.speaking()) return;
      ctx.fillStyle = 'rgba(14,9,20,.45)'; ctx.fillRect(0, 0, SG.CFG.W, SG.CFG.H);
      box(); arrow();
    },
  };
})(window.SG = window.SG || {});