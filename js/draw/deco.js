// 装饰的画法。每个装饰一个函数，画在屏幕两侧原本空着的暗色竖条里，不会挡客人和气泡。
//   SG.registerDeco(id, layer, fn)   layer: 'wall' 画在墙上（客人之前）| 'floor' 画在砧板之后
// 加一个装饰：data/upgrades.js 加一条（deco: true），这里 registerDeco 一次。
(function (SG) {
  const ctx = SG.ctx, G = SG.G;
  const { R } = SG.px;
  const O = '#2a1e18';
  const regs = [];

  SG.registerDeco = (id, layer, fn) => regs.push({ id, layer, fn });

  SG.deco = {
    draw(layer) {
      for (const r of regs) if (r.layer === layer && SG.shop.has(r.id)) r.fn();
    },
  };

  // ---- 盆栽：柜台左边的地上（左侧暗条 x 0~11）----
  SG.registerDeco('deco_plant', 'floor', function () {
    const x = 2, y = 272, sway = Math.sin(G.t * 1.1) > 0 ? 0 : 1;
    R(x, y + 6, 10, 12, O); R(x + 1, y + 7, 8, 10, '#9c5432');
    R(x + 1, y + 7, 8, 2, '#b8683f'); R(x + 1, y + 13, 8, 1, '#7c3f24');
    R(x + 1, y + 4, 8, 3, O); R(x + 1, y + 5, 8, 2, '#6b4a30');
    // 叶子
    R(x + 4, y - 6, 2, 11, '#2f6b3a');
    R(x + 1 + sway, y - 4, 3, 2, '#3f8a46'); R(x + sway, y - 2, 3, 2, '#2f6b3a');
    R(x + 6 - sway, y - 7, 3, 2, '#3f8a46'); R(x + 7 - sway, y - 5, 3, 2, '#2f6b3a');
    R(x + 3 + sway, y - 10, 4, 3, '#4b9c52'); R(x + 5, y - 12, 2, 2, '#4b9c52');
  });

  // ---- 风铃：墙上，门边（左上，避开灯笼和气泡）----
  SG.registerDeco('deco_chime', 'wall', function () {
    const x = 26, sw = Math.sin(G.t * 1.7);
    const d = sw > .5 ? 1 : sw < -.5 ? -1 : 0;
    R(x, 18, 1, 6, '#6a5a4a');                       // 吊线
    R(x - 4, 24, 9, 2, O); R(x - 3, 23, 7, 2, '#cfd3d6');   // 铃铛顶
    R(x - 3, 25, 7, 5, O); R(x - 2, 25, 5, 4, '#9fb6c4');
    R(x - 2, 25, 2, 4, '#d6e6ef');
    R(x + d, 30, 1, 3, '#6a5a4a');                   // 短穗
    R(x - 1 + d, 33, 3, 5, O); R(x - 1 + d, 33, 2, 4, '#f0e2c2');   // 纸条
    if (d !== 0 && (G.t * 4 | 0) % 2) { R(x + 6, 22, 1, 1, '#fff3c4'); R(x - 6, 26, 1, 1, '#fff3c4'); }
  });

  // ---- 松叔的旧鱼篓：右侧暗条上段 ----
  SG.registerDeco('deco_fishbasket', 'floor', function () {
    const x = 168, y = 166;
    R(x, y, 11, 14, O); R(x + 1, y + 1, 9, 12, '#a87a44');
    ctx.fillStyle = '#82592e';
    for (let r = 1; r < 12; r += 3) ctx.fillRect(x + 1, y + r, 9, 1);
    for (let c = 2; c < 10; c += 3) ctx.fillRect(x + c, y + 1, 1, 12);
    R(x, y - 2, 11, 2, O); R(x + 1, y - 1, 9, 1, '#c08f52');     // 篓口
    R(x + 2, y - 6, 7, 4, O); R(x + 3, y - 5, 5, 2, '#5a4a3a');  // 提绳
    R(x + 7, y - 4, 4, 3, O); R(x + 8, y - 4, 3, 2, '#8a9aa6');  // 探出来的鱼尾
  });

  // ---- 猫窝：右侧暗条下段，偶尔真有猫 ----
  SG.registerDeco('deco_catbed', 'floor', function () {
    const x = 168, y = 266;
    R(x, y + 8, 12, 9, O); R(x + 1, y + 9, 10, 7, '#7a4a62');
    R(x + 1, y + 9, 10, 2, '#9a5f7c'); R(x + 1, y + 14, 10, 1, '#5e3a4c');
    const nap = Math.sin(G.t * .23 + 1.2) > -.2;                  // 时有时无
    if (!nap) return;
    const br = Math.sin(G.t * 1.6) > .4 ? 1 : 0;
    R(x + 2, y + 5 - br, 9, 5, O); R(x + 3, y + 6 - br, 7, 3, '#d8c9a8');   // 蜷着的身子
    R(x + 3, y + 3 - br, 2, 3, O); R(x + 8, y + 3 - br, 2, 3, O);           // 耳朵
    R(x + 4, y + 7 - br, 1, 1, O); R(x + 7, y + 7 - br, 1, 1, O);           // 眯着的眼
    R(x + 9, y + 9, 3, 1, '#d8c9a8');                                       // 尾巴
  });
})(window.SG = window.SG || {});