// 游戏流程：开局/结算、客人、传送带、难度曲线，以及"按做法的步骤表往下走"的流程跑道。
// 具体玩法（捏饭团/放鱼片/上菜…）在 steps/*.js，数值见 config.js 与 data/levels.js，规则见 docs/RULES.md。
(function (SG) {
  const { CFG, G, rnd, pick, pop, sfx } = SG;
  const BELT_Y = CFG.belt.y, SP = CFG.belt.gap;
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

  // ---------- 流程跑道：按做法（method）的步骤表往下走 ----------
  // 每个寿司从做法的第一步开始；步骤完成时调用 c.next()；整份做完（上菜/倒掉）调用 c.restart()。
  // 步骤模块接口见 steps/*.js：{ hint, enter, update, draw, drawUnder, down, up, key }
  const DEFAULT_METHOD = 'nigiri';
  const flow = { method: null, steps: [], i: 0 };
  const step = () => G.mode === 'play' ? SG.reg.steps[flow.steps[flow.i]] || null : null;

  function enterStep() {
    const id = flow.steps[flow.i], st = SG.reg.steps[id];
    if (!st) throw new Error('[SG] 没有登记过的步骤：' + id);
    G.phase = id;
    if (st.enter) st.enter(ctx);
    SG.ui.setHint();
  }
  function beginFlow() {
    const m = SG.reg.methods[DEFAULT_METHOD];
    G.sushi = null;
    flow.method = DEFAULT_METHOD; flow.steps = m.steps.slice(); flow.i = 0;
    enterStep();
  }
  // opts.method：放好鱼片后根据菜式换做法；新步骤表必须包含刚完成的这一步
  function next(opts) {
    const done = flow.steps[flow.i];
    if (opts && opts.method && opts.method !== flow.method) {
      const m = SG.reg.methods[opts.method];
      if (!m) throw new Error('[SG] 没有登记过的做法：' + opts.method);
      const at = m.steps.indexOf(done);
      if (at < 0) throw new Error(`[SG] 做法 ${opts.method} 的步骤表里没有已完成的步骤 ${done}`);
      flow.method = opts.method; flow.steps = m.steps.slice(); flow.i = at;
    }
    flow.i++;
    if (flow.i >= flow.steps.length) { beginFlow(); return; }
    enterStep();
  }

  // 传给步骤模块的上下文
  const ctx = { G, CFG, next, restart: beginFlow, api: { breakCombo, comboMult, pressDuration, goldWidth, beltSpeed } };

  // ---------- 开局 / 结算 ----------
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
    fillBelt();
    G.mode = 'play';
    beginFlow();
    SG.ui.hideOverlay(); SG.fxEl.innerHTML = '';
    SG.ui.setHint();
  }

  function end() {
    G.mode = 'over'; G.overT = 0; SG.pressSound.stop(); G.pressing = false;
    const isBest = G.score > G.best;
    if (isBest) { G.best = G.score; SG.saveBest(); }
    SG.save.write();                         // 图鉴等累计数据
    SG.ui.showOver(isBest);
  }

  // ---------- 输入：转交给当前步骤 ----------
  function down(lx, ly) {
    if (G.mode !== 'play') return;
    SG.audioInit();
    const st = step();
    if (st && st.down) st.down(ctx, lx, ly);
  }
  function up() { const st = step(); if (st && st.up) st.up(ctx); }
  function key(code, isDown) {
    if (G.mode !== 'play') return;
    const st = step();
    if (st && st.key) st.key(ctx, code, isDown);
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

    const st = step();
    if (st && st.update) st.update(ctx, dt);
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

  // 标题页 / 结算页：传送带、特效继续动，标题页的夜景也在动
  function idle(dt) {
    if (G.mode === 'over') G.overT += dt;
    if (G.mode === 'title') SG.titleScene.update(dt);
    updateBelt(dt, 22);
    SG.updateFx(dt);
  }

  SG.game = { init, start, end, update, idle, down, up, key, step, ctx, goldWidth, pressDuration, comboMult };
})(window.SG = window.SG || {});
