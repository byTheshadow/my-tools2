// 步骤：上菜。点点了这道寿司的客人得分；不要的点右下角倒掉。完成后 c.restart() 回到做法的第一步。
// 炙烧等额外步骤做出的品质（sushi.torchQ）也算进得分和"完美寿司"。
// 座位数会随扩建升级变化（3~5），所以"点到哪位客人"一律按 G.seats[i].x 就近判断，不再写死三等份。
(function (SG) {
  const { CFG, G, pop, burst, sfx } = SG;
  const RICE = CFG.rice;
  const EXTRA_SCORE = { perfect: 30, good: 15, meh: 5 };    // 炙烧的得分，和放鱼片的档位一致

  // 横坐标最近的座位下标。优先在"等上菜"的客人里找；一个都没有就返回 -1
  function nearestSeat(x) {
    let best = -1, bd = 1e9;
    G.seats.forEach((s, i) => {
      if (s.state !== 'wait') return;
      const d = Math.abs(s.x - x);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }

  function serveTo(c, i) {
    const s = G.seats[i], sushi = G.sushi, SC = CFG.score;
    if (!s || s.state !== 'wait') return;
    if (s.type !== sushi.type) {
      s.shakeT = .35; s.mood = 'angry';
      setTimeout(() => { if (s.state === 'wait') s.mood = 'idle'; }, 500);
      pop('不是这个！', s.x, 50, 'bad', 7); sfx.wrong(); SG.buzz(80); c.api.breakCombo();
      c.ev('fail');
      return;
    }
    const isPerfect = sushi.riceQ === 'perfect' && sushi.fishQ === 'perfect' && (sushi.torchQ == null || sushi.torchQ === 'perfect');
    let base = SC.rice[sushi.riceQ] + SC.fish[sushi.fishQ] + SC.serveBase + Math.floor(s.pat / s.maxP * SC.patienceMax);
    if (sushi.torchQ) base += EXTRA_SCORE[sushi.torchQ] || 0;
    if (isPerfect) { base = Math.round(base * SC.perfectMult); G.perfectSushi++; }
    G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    const gained = Math.round(base * c.api.comboMult());
    G.score += gained; G.served++;
    const money = SG.econ.sale(sushi.type, isPerfect, G.combo);       // 记账：售价 + 打赏，扣这份的食材成本
    if (money.tip) pop('打赏 +' + money.tip, s.x, 34, 'gold', 6);
    const made = SG.save.data.codex.made;
    made[sushi.type] = (made[sushi.type] || 0) + 1;      // 图鉴：累计做出的数量
    s.mood = 'happy'; s.state = 'leave'; s.leaveDelay = .7;
    G.flying.push({ ...sushi, x0: RICE.x, y0: RICE.y, x1: s.x, y1: 98, t: 0 });
    pop('+' + gained, s.x, 46, 'gain', 8);
    sfx.coin(); SG.buzz(15);
    if (s.npc) SG.story.served(s);                       // 特殊客人的专属菜做成了：章节完成、菜式解锁
    c.ev('serve');
    c.restart();
  }

  function discard(c) {
    const lost = SG.econ.waste(G.sushi.type);                          // 倒掉也要付食材成本
    burst(160, 298, 8, ['#f7f2e6', '#d9cfb8'], 40);
    pop(lost ? '倒掉了 −' + lost : '倒掉了', 150, 284, 'bad', 6); SG.noise(.08, .05); c.api.breakCombo();
    c.ev('discard');
    c.restart();
  }

  SG.registerStep('serve', {
    hint: '点客人上菜，不要的点右下角倒掉',
    canDiscard: true,                       // 垃圾桶高亮

    down(c, x, y) {
      if (y < 124) { const i = nearestSeat(x); if (i >= 0) serveTo(c, i); }
      else if (x >= 148 && y >= 288) discard(c);
    },
    key(c, code, isDown) {
      if (!isDown) return;
      if (/^Digit[1-5]$/.test(code)) serveTo(c, +code.slice(-1) - 1);   // 1~5 号座位，不存在的座位 serveTo 里直接忽略
      else if (code === 'KeyX') discard(c);
    },
  });
})(window.SG = window.SG || {});