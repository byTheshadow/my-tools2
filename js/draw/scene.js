// 整个画面的绘制顺序：墙 → 客人 → 柜台 → 传送带 → 砧板 → 寿司 → 特效 → 顶栏 → 互动画面 → 对话框。
(function (SG) {
  const ctx = SG.ctx, G = SG.G, CFG = SG.CFG, { W, H } = CFG, RICE = CFG.rice;
  const { R } = SG.px;
  const SP = SG.sprites;

  SG.draw = function () {
    const t = G.t;
    if (G.mode === 'title') { SG.titleScene.draw(); return; }      // 开屏夜景
    const st = SG.game.step();                                     // 当前玩法步骤（营业中才有）
    ctx.save();
    if (G.shake > 0) ctx.translate(Math.round(SG.rnd(-G.shake, G.shake)), Math.round(SG.rnd(-G.shake, G.shake)));

    // 墙
    R(0, 0, W, 110, '#3a2c3f');
    for (let x = 6; x < W; x += 12) R(x, 18, 1, 90, '#33263a');
    R(0, 102, W, 6, '#2d2231');
    SP.lantern(5, 26); SP.lantern(167, 26);

    // 客人 + 气泡 + 特殊客人的 ✦
    for (const s of G.seats) if (s.state !== 'empty') SP.customer(s);
    for (const s of G.seats) SP.bubble(s);
    for (const s of G.seats) if (s.state === 'guest') SP.guestMark(s);

    // 柜台
    R(0, 106, W, 4, '#e8b77a'); R(0, 110, W, 14, '#a8653a');
    R(0, 115, W, 1, '#965730'); R(0, 120, W, 1, '#965730'); R(0, 124, W, 2, '#6e3f22');
    R(0, 126, W, H - 126, '#2b2224');

    // 传送带
    R(0, 131, W, 20, '#2a2830'); R(0, 133, W, 16, '#55515e');
    for (let x = -G.beltOff; x < W; x += 8) R(x, 134, 1, 14, '#4a4653');
    for (const b of G.belt) SP.slice(b.x, CFG.belt.y, b.type, 24, 8);
    R(RICE.x - 2, 127, 5, 1, '#f2b134'); R(RICE.x - 1, 128, 3, 1, '#f2b134'); R(RICE.x, 129, 1, 1, '#f2b134');

    // 砧板
    R(12, 158, 156, 130, '#3b2620'); R(13, 159, 154, 128, '#e5bf88');
    for (const gy of [172, 191, 215, 262, 276]) R(15, gy, 150, 1, '#d6ad74');
    R(13, 283, 154, 4, '#c6955a');

    // 当前步骤画在桶之前的东西（如放鱼片的中线提示）
    if (st && st.drawUnder) st.drawUnder(SG.game.ctx);

    // 垃圾桶
    const hot = !!(st && st.canDiscard);
    R(154, 293, 18, 3, '#2a1e18'); R(155, 292, 16, 3, hot ? '#b8bec8' : '#8a8f98');
    R(156, 296, 14, 16, '#2a1e18'); R(157, 296, 12, 15, hot ? '#8b919c' : '#6b707a');
    R(159, 298, 1, 11, '#5a5e67'); R(162, 298, 1, 11, '#5a5e67'); R(165, 298, 1, 11, '#5a5e67');

    // 当前步骤自己的画面（如饭团和圆环），再画成品寿司
    if (G.mode === 'play') {
      if (st && st.draw) st.draw(SG.game.ctx);
      if (G.sushi) {
        const b = G.phase === 'serve' ? Math.max(0, Math.round(Math.sin(Math.min(G.sushi.landT * 14, Math.PI)) * 3)) : 0;
        R(RICE.x - 17, RICE.y + 6, 35, 3, 'rgba(60,35,20,.2)');
        SP.bigSushi(RICE.x, RICE.y - b, G.sushi);
      }
      if (st && st.drawOver) st.drawOver(SG.game.ctx);               // 画在寿司上面的（如炙烧的喷枪和火苗）
    }
    if (G.dropSlice) {
      const { rw } = SP.riceSize(G.sushi.riceP);
      SP.slice(G.dropSlice.x, G.dropSlice.y, G.dropSlice.type, rw * 2 + 6, 8);
    }
    for (const f of G.fallen) { ctx.globalAlpha = Math.max(0, f.life / .7); SP.slice(f.x, f.y, f.type, 26, 8); ctx.globalAlpha = 1; }
    for (const f of G.flying) {
      const k = f.t, x = f.x0 + (f.x1 - f.x0) * k, y = f.y0 + (f.y1 - f.y0) * k - Math.sin(Math.PI * k) * 26;
      SP.miniSushi(Math.round(x), Math.round(y), f.type);
    }
    for (const p of G.particles) R(p.x, p.y, p.s, p.s, p.c);

    // 顶栏 + 剩余时间条
    R(0, 0, W, 17, '#1d1620');
    if (G.mode === 'play' || G.mode === 'over') {
      const r = (G.timeLeft || 0) / G.level.duration;
      R(0, 16, Math.round(W * r), 1, r > .2 ? '#f2b134' : ((t * 4 | 0) % 2 ? '#ff5a4a' : '#f2b134'));
    }
    ctx.restore();
    if (G.mode === 'play') SG.story.drawAct();   // 剧情互动（收网等）盖住整个营业画面
    SG.dialog.draw();                 // 对话框画在最上层，不跟着抖动
  };
})(window.SG = window.SG || {});