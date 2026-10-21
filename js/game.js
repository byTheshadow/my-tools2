// 游戏规则与流程：开局/结算、捏饭团判定、放鱼片、上菜计分、客人与难度曲线。
// 具体数值见 config.js 与 data/levels.js，规则说明见 docs/RULES.md。
(function (SG) {
  const { CFG, G, rnd, pick, pop, burst, sfx } = SG;
  const RICE = CFG.rice, BELT_Y = CFG.belt.y, SP = CFG.belt.gap;
  const R0 = CFG.ring.r0, GC = CFG.ring.goldCenter;
  const diff = () => G.level.difficulty;

  // ---------- 难度曲线（随时间 / 连击变化）----------
  const pressDuration = () => { const d = diff().pressDur;  return Math.max(d.min, d.start - G.combo * d.perCombo - G.elapsed * d.perSec); };
  const goldWidth     = () => { const d = diff().goldWidth; return Math.max(d.min, d.start - G.combo * d.perCombo); };
  const beltSpeed     = () => { const d = diff().belt;      return Math.min(d.max, d.start + G.elapsed * d.perSec + G.combo * d.perCombo); };
  const patienceMax   = () => { const d = diff().patience;  return Math.max(d.min, d.start - G.elapsed * d.perSec); };
  const comboMult     = () => 1 + Math.min(G.combo, CFG.score.comboCap) * CFG.score.comboStep;

  function breakCombo() {
    if (G.combo >= 3) pop('连击中断', 90, 30, 'bad', 6);
    G.combo = 0;
  }

  // ---------- 客人 ----------
  function newSeat(i, wait) {
    return { i, x: CFG.seats[i], state: 'empty', wait, anim: 0, pat: 0, maxP: 1, type: null, mood: 'idle', shakeT: 0, leaveDelay: 0 };
  }
  function spawnCustomer(s) {
    const L = SG.LOOKS;
    s.state = 'arrive'; s.anim = 0; s.type = pick(G.unlocked); s.mood = 'idle';
    s.maxP = patienceMax(); s.pat = s.maxP;
    s.skin = pick(L.skins); s.hair = pick(L.hairs); s.shirt = pick(L.shirts);
  }

  // ---------- 传送带 ----------
  // 有一定概率放出客人正在点的鱼片，避免长时间等不到
  function pickBeltType() {
    const want = G.seats.filter(s => s.state === 'wait' || s.state === 'arrive').map(s => s.type);
    if (want.length && Math.random() < CFG.belt.orderBias) return pick(want);
    return pick(G.unlocked);
  }
  function fillBelt() {
    G.belt = [];
    for (let x = 8; x < CFG.W + 20; x += SP) G.belt.push({ type: pickBeltType(), x });
  }
  function updateBelt(dt, v) {
    G.beltOff = (G.beltOff + v * dt) % 8;
    for (const b of G.belt) b.x -= v * dt;
    while (G.belt.length && G.belt[0].x < -16) G.belt.shift();
    while (!G.belt.length || G.belt[G.belt.length - 1].x < CFG.W + 16) {
      const nx = G.belt.length ? G.belt[G.belt.length - 1].x + SP : CFG.W + 16;
      G.belt.push({ type: pickBeltType(), x: nx });
    }
  }

  // ---------- 流程 ----------
  function resetRice() {
    G.phase = 'rice'; G.sushi = null; G.pressing = false; G.ringR = R0; G.riceP = 0;
  }

  function init() {   // 标题页的背景：传送带在转，没有客人
    G.unlocked = Object.keys(SG.INGREDIENTS);
    G.seats = CFG.seats.map((_, i) => newSeat(i, 99));
    fillBelt();
  }

  function start(level) {
    SG.audioInit();
    if (level) G.level = level;
    const L = G.level;
    SG.loadBest();
    G.timeLeft = L.duration; G.elapsed = 0;
    G.score = 0; G.combo = 0; G.maxCombo = 0; G.served = 0; G.perfectSushi = 0;
    G.unlocked = L.startIngredients.slice();
    G.seats = CFG.seats.map((_, i) => newSeat(i, L.difficulty.firstSeatDelays[i] ?? 1));
    G.particles = []; G.fallen = []; G.flying = []; G.dropSlice = null; G.lockT = 0;
    resetRice(); fillBelt();
    G.mode = 'play';
    SG.ui.hideOverlay(); SG.fxEl.innerHTML = '';
    SG.ui.setHint();
  }

  function end() {
    G.mode = 'over'; G.overT = 0; SG.pressSound.stop(); G.pressing = false;
    const isBest = G.score > G.best;
    if (isBest) { G.best = G.score; SG.saveBest(); }
    SG.ui.showOver(isBest);
  }

  // ---------- 输入动作 ----------
  function down(lx, ly) {
    if (G.mode !== 'play') return;
    SG.audioInit();
    if (G.phase === 'rice') {
      if (G.lockT > 0 || G.pressing) return;
      G.pressing = true; G.pressT = 0; G.curDur = pressDuration(); G.curGw = goldWidth(); G.inZoneTicked = false;
      SG.pressSound.start();
    } else if (G.phase === 'fish') {
      dropFish();
    } else if (G.phase === 'serve') {
      if (ly < 124) serveTo(Math.min(2, Math.max(0, Math.floor(lx / 60))));
      else if (lx >= 148 && ly >= 288) discard();
    }
  }
  function up() { if (G.pressing) releasePress(); }

  // ---------- 第 1 步：捏饭团 ----------
  function riceFail(text) {
    G.pressing = false; SG.pressSound.stop();
    burst(RICE.x, RICE.y, 22, ['#f7f2e6', '#ffffff', '#d9cfb8'], 70);
    pop(text, RICE.x, RICE.y - 26, 'bad', 8);
    sfx.fail(); SG.buzz(60); G.shake = 3; breakCombo();
    G.ringR = R0; G.riceP = 0; G.lockT = CFG.failLock;
  }
  function releasePress() {
    G.pressing = false; SG.pressSound.stop();
    const d = G.ringR - GC;
    let q = null;
    if (Math.abs(d) <= G.curGw) q = 'perfect';
    else if (Math.abs(d) <= G.curGw + CFG.ring.goodExtra) q = 'good';
    if (!q) { riceFail(d > 0 ? '太松，散了' : '太硬了'); return; }
    const p = q === 'perfect' ? 0.7 : Math.min(0.85, Math.max(0.5, G.riceP));
    G.sushi = { riceQ: q, riceP: p, lop: q === 'good' ? (Math.random() < .5 ? -.35 : .35) : 0, type: null, dx: 0, fishQ: null, landT: 0 };
    if (q === 'perfect') {
      pop('完美！', RICE.x, RICE.y - 28, 'gold', 9); sfx.perfect(); SG.buzz(20);
      burst(RICE.x, RICE.y - 4, 8, ['#f2b134', '#fff3c4'], 45);
    } else { pop('不错', RICE.x, RICE.y - 28, '', 8); sfx.good(); }
    G.phase = 'fish'; SG.ui.setHint();
  }

  // ---------- 第 2 步：放鱼片 ----------
  function dropFish() {
    if (!G.belt.length) return;
    let bi = 0;
    G.belt.forEach((b, i) => { if (Math.abs(b.x - RICE.x) < Math.abs(G.belt[bi].x - RICE.x)) bi = i; });
    const b = G.belt.splice(bi, 1)[0];
    G.dropSlice = { type: b.type, x: b.x, y: BELT_Y, vy: 0, dx: b.x - RICE.x };
    G.phase = 'drop';
  }
  function landFish(target) {
    const d = G.dropSlice, ad = Math.abs(d.dx), D = CFG.drop;
    sfx.drop();
    if (ad > D.missDist) {
      G.fallen.push({ type: d.type, x: d.x, y: target, vx: Math.sign(d.dx) * 35, vy: 40, life: .7 });
      G.dropSlice = null; G.phase = 'fish';
      pop('没放上！', RICE.x, RICE.y - 30, 'bad', 8); SG.noise(.1, .06); breakCombo(); G.shake = 2;
      return;
    }
    const q = ad <= D.perfectDist ? 'perfect' : ad <= D.goodDist ? 'good' : 'meh';
    const s = G.sushi;
    s.type = d.type; s.dx = q === 'perfect' ? 0 : Math.round(d.dx); s.fishQ = q; s.landT = 0;
    G.dropSlice = null; G.phase = 'serve'; SG.ui.setHint();
    if (q === 'perfect' && s.riceQ === 'perfect') {
      pop('完美寿司！', RICE.x, RICE.y - 34, 'gold', 11); sfx.wow(); SG.buzz([20, 30, 20]);
      burst(RICE.x, RICE.y - 8, 18, ['#f2b134', '#fff3c4', '#ffffff'], 80);
    } else if (q === 'perfect') pop('正中！', RICE.x, RICE.y - 30, 'gold', 8);
    else if (q === 'good') pop('还行', RICE.x, RICE.y - 30, '', 7);
    else pop('歪了…', RICE.x, RICE.y - 30, 'bad', 7);
  }

  // ---------- 第 3 步：上菜 ----------
  function serveTo(i) {
    const s = G.seats[i], sushi = G.sushi, SC = CFG.score;
    if (s.state !== 'wait') return;
    if (s.type !== sushi.type) {
      s.shakeT = .35; s.mood = 'angry';
      setTimeout(() => { if (s.state === 'wait') s.mood = 'idle'; }, 500);
      pop('不是这个！', s.x, 50, 'bad', 7); sfx.wrong(); SG.buzz(80); breakCombo();
      return;
    }
    const isPerfect = sushi.riceQ === 'perfect' && sushi.fishQ === 'perfect';
    let base = SC.rice[sushi.riceQ] + SC.fish[sushi.fishQ] + SC.serveBase + Math.floor(s.pat / s.maxP * SC.patienceMax);
    if (isPerfect) { base = Math.round(base * SC.perfectMult); G.perfectSushi++; }
    G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo);
    const gained = Math.round(base * comboMult());
    G.score += gained; G.served++;
    s.mood = 'happy'; s.state = 'leave'; s.leaveDelay = .7;
    G.flying.push({ ...sushi, x0: RICE.x, y0: RICE.y, x1: s.x, y1: 98, t: 0 });
    pop('+' + gained, s.x, 46, 'gain', 8);
    sfx.coin(); SG.buzz(15);
    resetRice(); SG.ui.setHint();
  }
  function discard() {
    burst(160, 298, 8, ['#f7f2e6', '#d9cfb8'], 40);
    pop('倒掉了', 150, 284, 'bad', 6); SG.noise(.08, .05); breakCombo();
    resetRice(); SG.ui.setHint();
  }

  // ---------- 每帧更新 ----------
  function update(dt) {
    G.elapsed += dt; G.timeLeft -= dt;
    if (G.timeLeft <= 0) { G.timeLeft = 0; end(); return; }

    for (const u of G.level.unlocks || []) {
      if (G.elapsed >= u.at && !G.unlocked.includes(u.id)) {
        G.unlocked.push(u.id);
        pop('新菜品：' + SG.INGREDIENTS[u.id].name, 90, 120, 'gold', 8);
        sfx.unlock();
      }
    }

    G.lockT -= dt;
    updateBelt(dt, beltSpeed());

    if (G.phase === 'rice' && G.pressing) {
      G.pressT += dt;
      G.ringR = R0 * (1 - G.pressT / G.curDur);
      G.riceP = Math.min(1, 1 - G.ringR / R0);
      SG.pressSound.set(G.riceP);
      if (!G.inZoneTicked && G.ringR <= GC + G.curGw) { G.inZoneTicked = true; sfx.tick(); }
      if (G.ringR <= 2) riceFail('捏碎了');
    }
    if (G.phase === 'drop' && G.dropSlice) {
      const d = G.dropSlice;
      d.vy += 1100 * dt; d.y += d.vy * dt;
      const target = RICE.y - SG.sprites.riceSize(G.sushi.riceP).rh - 1;
      if (d.y >= target) { d.y = target; landFish(target); }
    }
    if (G.sushi) G.sushi.landT += dt;

    const [rmin, rmax] = diff().seatRespawn;
    for (const s of G.seats) {
      s.shakeT = Math.max(0, s.shakeT - dt);
      if (s.state === 'empty') { s.wait -= dt; if (s.wait <= 0) spawnCustomer(s); }
      else if (s.state === 'arrive') { s.anim += dt * 3; if (s.anim >= 1) { s.anim = 1; s.state = 'wait'; } }
      else if (s.state === 'wait') {
        s.pat -= dt;
        if (s.pat <= 0) {
          s.state = 'leave'; s.mood = 'angry'; s.leaveDelay = .6;
          pop('不等了', s.x, 50, 'bad', 7); sfx.wrong(); breakCombo();
        }
      } else if (s.state === 'leave') {
        s.leaveDelay -= dt;
        if (s.leaveDelay <= 0) {
          s.anim -= dt * 3;
          if (s.anim <= 0) { s.anim = 0; s.state = 'empty'; s.wait = rnd(rmin, rmax); }
        }
      }
    }
    SG.updateFx(dt);
    SG.ui.updateHud();
  }

  // 标题页 / 结算页：只让传送带和特效继续动
  function idle(dt) {
    if (G.mode === 'over') G.overT += dt;
    updateBelt(dt, 22);
    SG.updateFx(dt);
  }

  SG.game = { init, start, end, update, idle, down, up, serveTo, discard, goldWidth, pressDuration, comboMult };
})(window.SG = window.SG || {});
