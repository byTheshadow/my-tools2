// 步骤：上菜。点点了这道寿司的客人得分；不要的点右下角倒掉。完成后 c.restart() 回到做法的第一步。
(function (SG) {
  const { CFG, G, pop, burst, sfx } = SG;
  const RICE = CFG.rice;

  function serveTo(c, i) {
    const s = G.seats[i], sushi = G.sushi, SC = CFG.score;
    if (!s || s.state !== 'wait') return;
    if (s.type !== sushi.type) {
      s.shakeT = .35; s.mood = 'angry';
      setTimeout(() => { if (s.state === 'wait') s.mood = 'idle'; }, 500);
      pop('不是这个！', s.x, 50, 'bad', 7); sfx.wrong(); SG.buzz(80); c.api.breakCombo();
      return;
    }
    const isPerfect = sushi.riceQ === 'perfect' && sushi.fishQ === 'perfect';
    let base = SC.rice[sushi.riceQ] + SC.fish[sushi.fishQ] + SC.serveBase + Math.floor(s.pat / s.maxP * SC.patienceMax);
    if (isPerfect) { base = Math.round(base * SC.perfectMult); G.perfectSushi++; }
    G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    const gained = Math.round(base * c.api.comboMult());
    G.score += gained; G.served++;
    const made = SG.save.data.codex.made;
    made[sushi.type] = (made[sushi.type] || 0) + 1;      // 图鉴：累计做出的数量
    s.mood = 'happy'; s.state = 'leave'; s.leaveDelay = .7;
    G.flying.push({ ...sushi, x0: RICE.x, y0: RICE.y, x1: s.x, y1: 98, t: 0 });
    pop('+' + gained, s.x, 46, 'gain', 8);
    sfx.coin(); SG.buzz(15);
    c.restart();
  }

  function discard(c) {
    burst(160, 298, 8, ['#f7f2e6', '#d9cfb8'], 40);
    pop('倒掉了', 150, 284, 'bad', 6); SG.noise(.08, .05); c.api.breakCombo();
    c.restart();
  }

  SG.registerStep('serve', {
    hint: '点客人上菜，不要的点右下角倒掉',
    canDiscard: true,                       // 垃圾桶高亮

    down(c, x, y) {
      if (y < 124) serveTo(c, Math.min(2, Math.max(0, Math.floor(x / 60))));
      else if (x >= 148 && y >= 288) discard(c);
    },
    key(c, code, isDown) {
      if (!isDown) return;
      if (/^Digit[123]$/.test(code)) serveTo(c, +code.slice(-1) - 1);
      else if (code === 'KeyX') discard(c);
    },
  });
})(window.SG = window.SG || {});
