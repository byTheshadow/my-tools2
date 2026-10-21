// 入口：初始化 + 主循环。
(function (SG) {
  const G = SG.G;
  let last = 0;

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now; G.t += dt;
    if (SG.wrap.dataset.mode !== G.mode) SG.wrap.dataset.mode = G.mode;   // CSS 据此隐藏/显示顶栏
    if (G.mode === 'play') SG.game.update(dt); else SG.game.idle(dt);
    SG.draw();
    requestAnimationFrame(loop);
  }

  SG.game.init();
  SG.loadBest();
  SG.ui.showTitle();
  requestAnimationFrame(loop);
})(window.SG = window.SG || {});
