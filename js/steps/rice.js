// 步骤：捏饭团。按住 → 白圈收缩 → 在金圈里松手。
// 成功后创建 G.sushi 并 c.next()；失败留在本步骤重来。
(function (SG) {
  const { CFG, G, pop, burst, sfx } = SG;
  const SP = SG.sprites, { ringFill } = SG.px;
  const RICE = CFG.rice, R0 = CFG.ring.r0, GC = CFG.ring.goldCenter;

  function fail(c, text) {
    G.pressing = false; SG.pressSound.stop();
    burst(RICE.x, RICE.y, 22, ['#f7f2e6', '#ffffff', '#d9cfb8'], 70);
    pop(text, RICE.x, RICE.y - 26, 'bad', 8);
    sfx.fail(); SG.buzz(60); G.shake = 3; c.api.breakCombo();
    G.ringR = R0; G.riceP = 0; G.lockT = CFG.failLock;
    SG.econ.riceFail();                       // 饭倒掉，记一笔小成本
    c.ev('fail');
  }

  function release(c) {
    G.pressing = false; SG.pressSound.stop();
    const d = G.ringR - GC;
    let q = null;
    if (Math.abs(d) <= G.curGw) q = 'perfect';
    else if (Math.abs(d) <= G.curGw + CFG.ring.goodExtra) q = 'good';
    if (!q) { fail(c, d > 0 ? '太松，散了' : '太硬了'); return; }
    const p = q === 'perfect' ? 0.7 : Math.min(0.85, Math.max(0.5, G.riceP));
    G.sushi = { riceQ: q, riceP: p, lop: q === 'good' ? (Math.random() < .5 ? -.35 : .35) : 0, type: null, dx: 0, fishQ: null, landT: 0 };
    if (q === 'perfect') {
      pop('完美！', RICE.x, RICE.y - 28, 'gold', 9); sfx.perfect(); SG.buzz(20);
      burst(RICE.x, RICE.y - 4, 8, ['#f2b134', '#fff3c4'], 45);
    } else { pop('不错', RICE.x, RICE.y - 28, '', 8); sfx.good(); }
    c.ev('rice');
    c.next();
  }

  const rice = {
    hint: '按住 捏饭团，金圈处松手',
    enter() { G.pressing = false; G.ringR = R0; G.riceP = 0; },

    down(c) {
      if (G.lockT > 0 || G.pressing) return;
      G.pressing = true; G.pressT = 0; G.curDur = c.api.pressDuration(); G.curGw = c.api.goldWidth(); G.inZoneTicked = false;
      SG.pressSound.start();
    },
    up(c) { if (G.pressing) release(c); },
    key(c, code, isDown) { if (code === 'Space') { if (isDown) rice.down(c); else rice.up(c); } },

    update(c, dt) {
      if (!G.pressing) return;
      G.pressT += dt;
      G.ringR = R0 * (1 - G.pressT / G.curDur);
      G.riceP = Math.min(1, 1 - G.ringR / R0);
      SG.pressSound.set(G.riceP);
      if (!G.inZoneTicked && G.ringR <= GC + G.curGw) { G.inZoneTicked = true; sfx.tick(); }
      if (G.ringR <= 2) fail(c, '捏碎了');
    },

    draw(c) {
      const t = G.t;
      if (G.lockT <= 0) {
        const { rw, rh } = SP.riceSize(G.pressing ? G.riceP : 0);
        SP.rice(RICE.x, RICE.y, rw, rh);
      }
      const gw = G.pressing ? G.curGw : c.api.goldWidth();
      ringFill(RICE.x, RICE.y, GC - gw, GC + gw, G.pressing ? 'rgba(242,177,52,.85)' : 'rgba(242,177,52,.5)');
      const rr = G.pressing ? G.ringR : R0 - (Math.sin(t * 4) > 0 ? 0 : 1);
      ringFill(RICE.x, RICE.y, Math.max(0, rr - 1.5), rr + .5, G.pressing ? '#ffffff' : 'rgba(255,255,255,.55)');
    },
  };
  SG.registerStep('rice', rice);
})(window.SG = window.SG || {});