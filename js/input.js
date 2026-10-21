// 输入：指针（鼠标/触屏）+ 键盘。只负责把操作转给 SG.game。
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
    if (G.mode !== 'play') {
      if ((e.code === 'Space' || e.code === 'Enter') && (G.mode === 'title' || G.overT > .6)) {
        e.preventDefault(); game.start(G.level);
      }
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (G.phase === 'rice' || G.phase === 'fish') game.down(SG.CFG.rice.x, 200);
    } else if (/^Digit[123]$/.test(e.code) && G.phase === 'serve') {
      game.serveTo(+e.code.slice(-1) - 1);
    } else if (e.code === 'KeyX' && G.phase === 'serve') {
      game.discard();
    }
  });
  addEventListener('keyup', e => { if (e.code === 'Space') game.up(); });
})(window.SG = window.SG || {});
