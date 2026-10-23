// 游戏流程：开局/结算、客人、传送带、难度曲线，以及"按做法的步骤表往下走"的流程跑道。
// 具体玩法（捏饭团/放鱼片/炙烧/上菜…）在 steps/*.js，剧情在 story.js，数值见 config.js 与 data/levels.js，规则见 docs/RULES.md。
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
  // 座位状态：empty 空 | arrive 走进来 | wait 等上菜 | guest 特殊客人头顶 ✦ 等你点 | talk 正在对话 | leave 离开
  function newSeat(i, wait) {
    return { i, x: CFG.seats[i], state: 'empty', wait, anim: 0, pat: 0, maxP: 1, type: null, mood: 'idle', shakeT: 0, leaveDelay: 0, npc: null, acc: null, stayT: 0 };
  }
  function spawnCustomer(s) {
    const L = SG.LOOKS;
    s.state = 'arrive'; s.anim = 0; s.type = pick(G.unlocked); s.mood = 'idle'; s.npc = null; s.acc = null;
    s.maxP = patienceMax(); s.pat = s.maxP;
    s.skin = pick(L.skins); s.hair = pick(L.hairs); s.shirt = pick(L.shirts);
  }

  // 教学用：让某个座位立刻来一位客人，并指定他点什么
  function spawnGuest(i, type) {
    const s = G.seats[i];
    if (!s || s.state !== 'empty') return;
    spawnCustomer(s);
    if (type) s.type = type;
  }

  // 教学用：把离中线最近的一片鱼片挪到正中线上（传送带没动时也一定能放准）
  function alignBelt() {
    if (!G.belt.length) return;
    let near = G.belt[0];
    for (const b of G.belt) if (Math.abs(b.x - CFG.rice.x) < Math.abs(near.x - CFG.rice.x)) near = b;
    const dx = CFG.rice.x - near.x;
    for (const b of G.belt) b.x += dx;
  }

  // ---------- 传送带 ----------
  // 有一定概率放出客人正在点的鱼片，避免长时间等不到（特殊客人的专属菜也靠这个出现）
  function pickBeltType() {
    const want = G.seats.filter(s => s.state === 'wait' || s.state === 'arrive').map(s => s.type).filter(Boolean);
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
  // 步骤模块接口见 steps/*.js：{ hint, enter, update, draw, drawUnder, drawOver, down, up, key }
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
  const ctx = {
    G, CFG, next, restart: beginFlow,
    ev: name => SG.tutorial.event(name),          // 通知教学夜：玩家完成了某个动作
    api: { breakCombo, comboMult, pressDuration, goldWidth, beltSpeed },
  };

  // ---------- 开局 / 结算 ----------
  function init() {   // 标题页的背景：传送带在转，没有客人
    G.unlocked = Object.keys(SG.INGREDIENTS).filter(id => !(SG.DISHES[id] && SG.DISHES[id].from && SG.DISHES[id].from.story));
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
    if (!L.tutorial) for (const id of SG.save.data.dishes) if (SG.DISHES[id] && !G.unlocked.includes(id)) G.unlocked.push(id);   // 剧情解锁过的菜
    G.seats = CFG.seats.map((_, i) => newSeat(i, L.difficulty.firstSeatDelays[i] ?? 1));
    G.particles = []; G.fallen = []; G.flying = []; G.dropSlice = null; G.lockT = 0; G.torch = null;
    SG.econ.begin(L);                        // 清空账本；只有"当前这一夜"才真正记账
    SG.story.begin(L);                       // 特殊客人：只在真记账的当前夜、且关卡 npcs 允许时才会来
    fillBelt();
    G.mode = 'play';
    if (L.tutorial) SG.tutorial.start(); else SG.tutorial.stop();
    beginFlow();
    SG.ui.hideOverlay(); SG.fxEl.innerHTML = '';
    SG.ui.setHint();
  }

  function end() {
    G.mode = 'over'; G.overT = 0; SG.pressSound.stop(); G.pressing = false; if (G.torch) G.torch.on = false;
    SG.ui.setTalk(''); SG.ui.setTask('');
    if (G.level.tutorial) {                  // 教学夜不记最高分、不计失败
      SG.save.data.seenTutorial = true; SG.save.write();
      SG.ui.showTutorialOver();
      return;
    }
    const isBest = G.score > G.best;
    if (isBest) { G.best = G.score; SG.saveBest(); }
    const ledger = SG.econ.close();          // 算账：入账 / 闭店回档 / Game Over（练习夜为 null）
    SG.save.write();                         // 图鉴等累计数据
    SG.ui.showOver(isBest, ledger);
  }

  // ---------- 输入：转交给当前步骤 ----------
  function down(lx, ly) {
    if (G.mode !== 'play') return;
    SG.audioInit();
    if (SG.tutorial.down()) return;          // 澄姐在说话：这一下只用来翻页
    if (SG.story.down(lx, ly)) return;       // 点 ✦ / 对话中翻页 / 互动
    const st = step();
    if (st && st.down) st.down(ctx, lx, ly);
  }
  function up() {
    if (SG.story.busy()) { SG.story.up(); return; }
    const st = step(); if (st && st.up) st.up(ctx);
  }
  function key(code, isDown) {
    if (G.mode !== 'play') return;
    if (SG.story.key(code, isDown)) return;
    const st = step();
    if (st && st.key) st.key(ctx, code, isDown);
  }

  // ---------- 每帧更新 ----------
  function update(dt) {
    const allow = SG.tutorial.allow, tut = SG.tutorial.active();
    if (tut && SG.tutorial.speaking()) {     // 澄姐说话时，整个店先停一停
      SG.updateFx(dt); SG.ui.updateHud();
      return;
    }
    if (SG.story.busy()) {                   // 剧情对话 / 互动时同样全店暂停：时间不走、耐心不掉
      SG.story.update(dt); SG.updateFx(dt); SG.ui.updateHud();
      return;
    }
    if (!tut || allow.timer) {
      G.elapsed += dt; G.timeLeft -= dt;
      if (G.timeLeft <= 0) { G.timeLeft = 0; end(); return; }
    }

    for (const u of G.level.unlocks || []) {
      if (G.elapsed >= u.at && !G.unlocked.includes(u.id)) {
        G.unlocked.push(u.id);
        pop('新菜品：' + SG.INGREDIENTS[u.id].name, 90, 120, 'gold', 8);
        sfx.unlock();
      }
    }
    SG.story.tick(dt);

    G.lockT -= dt;
    updateBelt(dt, tut && !allow.belt ? 0 : beltSpeed());

    const st = step();
    if (st && st.update) st.update(ctx, dt);
    if (G.sushi) G.sushi.landT += dt;

    const [rmin, rmax] = diff().seatRespawn;
    for (const s of G.seats) {
      s.shakeT = Math.max(0, s.shakeT - dt);
      if (s.state === 'empty') { if (!tut || allow.customers) { s.wait -= dt; if (s.wait <= 0) spawnCustomer(s); } }
      else if (s.state === 'arrive') {
        s.anim += dt * 3;
        if (s.anim >= 1) { s.anim = 1; s.state = s.npc && s.npc.stage === 'guest' ? 'guest' : 'wait'; }
      }
      else if (s.state === 'guest') {                // 特殊客人：没人点 ✦ 就安静离开，不扣连击不扣钱
        s.stayT -= dt;
        if (s.stayT <= 0) { SG.story.walkAway(s); s.state = 'leave'; s.leaveDelay = .3; }
      }
      else if (s.state === 'wait') {
        if (!tut || allow.patience) s.pat -= dt;
        if (s.pat <= 0) {
          if (s.npc) { SG.story.walkAway(s); s.state = 'leave'; s.leaveDelay = .3; }   // 特殊客人等不到也是安静离开
          else {
            s.state = 'leave'; s.mood = 'angry'; s.leaveDelay = .6;
            pop('不等了', s.x, 50, 'bad', 7); sfx.wrong(); breakCombo();
          }
        }
      } else if (s.state === 'leave') {
        s.leaveDelay -= dt;
        if (s.leaveDelay <= 0) {
          s.anim -= dt * 3;
          if (s.anim <= 0) { s.anim = 0; s.state = 'empty'; s.wait = rnd(rmin, rmax); s.npc = null; s.acc = null; }
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

  SG.game = { init, start, end, update, idle, down, up, key, step, ctx, spawnGuest, alignBelt, goldWidth, pressDuration, comboMult };
})(window.SG = window.SG || {});