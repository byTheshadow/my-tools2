// 步骤：放鱼片。点一下，离中线最近的鱼片落下；落点偏差决定判定。
// 落上饭团后根据鱼片所属菜式的 method 决定后面走哪条做法，然后 c.next({ method })。
// 磨刀石升级（SG.shop.fx('dropEase')）会把三档判定一起放宽。
(function (SG) {
  const { CFG, G, pop, burst, sfx } = SG;
  const { R } = SG.px;
  const RICE = CFG.rice, BELT_Y = CFG.belt.y;

  // 当前的落点判定（基础值 + 磨刀石）
  function dropSpec() {
    const e = SG.shop.fx('dropEase'), D = CFG.drop;
    return { perfectDist: D.perfectDist + e, goodDist: D.goodDist + e, missDist: D.missDist + e };
  }

  function dropFish() {
    if (!G.belt.length) return;
    let bi = 0;
    G.belt.forEach((b, i) => { if (Math.abs(b.x - RICE.x) < Math.abs(G.belt[bi].x - RICE.x)) bi = i; });
    const b = G.belt.splice(bi, 1)[0];
    G.dropSlice = { type: b.type, x: b.x, y: BELT_Y, vy: 0, dx: b.x - RICE.x };
    G.phase = 'drop';
  }

  function land(c, target) {
    const d = G.dropSlice, ad = Math.abs(d.dx), D = dropSpec();
    sfx.drop();
    if (ad > D.missDist) {
      G.fallen.push({ type: d.type, x: d.x, y: target, vx: Math.sign(d.dx) * 35, vy: 40, life: .7 });
      G.dropSlice = null; G.phase = 'fish';
      pop('没放上！', RICE.x, RICE.y - 30, 'bad', 8); SG.noise(.1, .06); c.api.breakCombo(); G.shake = 2;
      SG.econ.fishMiss(d.type);               // 鱼片掉了，记一半成本
      c.ev('fail');
      return;
    }
    const q = ad <= D.perfectDist ? 'perfect' : ad <= D.goodDist ? 'good' : 'meh';
    const s = G.sushi;
    s.type = d.type; s.dx = q === 'perfect' ? 0 : Math.round(d.dx); s.fishQ = q; s.landT = 0;
    G.dropSlice = null;
    c.ev('fish');
    c.next({ method: SG.dishOf(s.type).method });
    if (q === 'perfect' && s.riceQ === 'perfect') {
      pop('完美寿司！', RICE.x, RICE.y - 34, 'gold', 11); sfx.wow(); SG.buzz([20, 30, 20]);
      burst(RICE.x, RICE.y - 8, 18, ['#f2b134', '#fff3c4', '#ffffff'], 80);
    } else if (q === 'perfect') pop('正中！', RICE.x, RICE.y - 30, 'gold', 8);
    else if (q === 'good') pop('还行', RICE.x, RICE.y - 30, '', 7);
    else pop('歪了…', RICE.x, RICE.y - 30, 'bad', 7);
  }

  const fish = {
    hint: '点一下 放鱼片，对准中线',

    down() { if (G.phase === 'fish') dropFish(); },
    key(c, code, isDown) { if (code === 'Space' && isDown) fish.down(c); },

    update(c, dt) {
      if (G.phase !== 'drop' || !G.dropSlice) return;
      const d = G.dropSlice;
      d.vy += 1100 * dt; d.y += d.vy * dt;
      const target = RICE.y - SG.sprites.riceSize(G.sushi.riceP).rh - 1;
      if (d.y >= target) { d.y = target; land(c, target); }
    },

    // 画在垃圾桶之前：中线提示
    drawUnder() {
      for (let y = 153; y < 220; y += 5) R(RICE.x, y, 1, 2, (G.t * 4 | 0) % 2 ? '#f2b134' : '#c98a24');
    },
  };
  SG.registerStep('fish', fish);
})(window.SG = window.SG || {});