// 输入：指针（鼠标/触屏）+ 键盘。只负责把操作转给 SG.game（再由当前步骤处理）。
(function (SG) {
  const G = SG.G, game = SG.game;

  SG.wrap.addEventListener('pointerdown', e => {
    e.preventDefault();
    const [x, y] = SG.toLogical(e);
    game.down(x, y);
  });
  addEventListener('pointerup', game.up);
  addEventListener('pointercancel', game.up);
  SG.wrap.addEventListener('contextmenu', e => e.preventDefault());

  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.target.closest && e.target.closest('button')) return;      // 焦点在按钮上时，空格/回车交给按钮自己
    if (G.mode !== 'play') {
      if (e.code !== 'Space' && e.code !== 'Enter') return;
      if (G.mode === 'title' && G.screen === 'main') { e.preventDefault(); SG.ui.startCurrent(); }
      else if (G.mode === 'over' && G.overT > .6) { e.preventDefault(); SG.ui.overDefault(); }
      return;
    }
    if (e.code === 'Space') e.preventDefault();
    game.key(e.code, true);
  });
  addEventListener('keyup', e => { if (G.mode === 'play') game.key(e.code, false); });
})(window.SG = window.SG || {});