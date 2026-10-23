// 剧情引擎：挑今夜的特殊客人 → 安排登场 → 头顶 ✦ → 点了才进对话 → 按节点执行 → 点单 / 章节完成 → 写存档。
// 剧情数据在 data/stories/，互动在 interacts/，节点类型在文末用 SG.registerNode 登记。
// 规则：一夜最多 1 位；只在"当前这一夜"（真记账的夜）出现；不点 ✦ 就自己安静离开，不扣连击不扣钱，不写任何进度。
// 对外：begin / tick / update / busy / down / up / key / drawAct / talking / speaker / arrowOn / served / walkAway
(function (SG) {
  const G = SG.G, reg = SG.reg;
  const talkEl = document.getElementById('talk'), choicesEl = document.getElementById('choices');
  talkEl.dataset.who = '澄姐';                     // 对话框上的名字（CSS 用 attr(data-who) 显示）

  const S = { on: false, visited: false, plan: null, chk: 0, run: null };
  const write = () => SG.save.write();
  const peek = id => SG.save.data.story[id] || { chapter: 0, affinity: 0, ordered: null };
  const rec = id => { const d = SG.save.data; return d.story[id] || (d.story[id] = { chapter: 0, affinity: 0, ordered: null, flags: {} }); };
  const nameOf = who => who === 'chef' ? '澄姐' : ((reg.stories[who] || {}).name || who);
  const lock = on => { SG.wrap.dataset.talk = on ? 'on' : ''; };    // 对话中隐藏底部操作提示

  // ---------- 谁今晚会来 ----------
  function eligible(def) {
    if (!(G.level.npcs || []).includes(def.id)) return false;
    const r = peek(def.id), ch = def.chapters[r.chapter];
    if (!ch) return false;
    const env = SG.cond.env({ done: def.chapters.slice(0, r.chapter).map(c => c.id) });
    return SG.cond.check(def.when, env) && SG.cond.check(ch.when, env);
  }

  function begin() {                               // 开店时调用（game.start）
    S.on = !!(G.ledger && G.ledger.real) && !G.level.tutorial;
    S.visited = false; S.plan = null; S.chk = 0;
    endRun();
  }

  // 每帧（没在对话时）：安排登场 → 到点入座
  function tick(dt) {
    if (!S.on || S.visited || S.run) return;
    if (!S.plan) {
      S.chk -= dt; if (S.chk > 0) return; S.chk = .5;
      if (G.timeLeft < 25) return;                 // 太晚了，今晚不来了
      const def = Object.values(reg.stories).find(d => eligible(d));
      if (def) S.plan = { id: def.id, at: Math.max(G.elapsed + 3, SG.rnd(.25, .6) * G.level.duration) };
      return;
    }
    if (G.elapsed >= S.plan.at) arrive();
  }

  function arrive() {
    const free = G.seats.filter(s => s.state === 'empty');
    if (!free.length) return;                      // 座位全满，等有空位
    const s = SG.pick(free), def = reg.stories[S.plan.id], r = rec(def.id), lk = def.look || {};
    s.state = 'arrive'; s.anim = 0; s.mood = 'idle'; s.shakeT = 0;
    s.skin = lk.skin || '#f3cfae'; s.hair = lk.hair || '#241a24'; s.shirt = lk.shirt || '#4a6fa5'; s.acc = lk.acc || null;
    if (r.ordered && SG.DISHES[r.ordered]) {       // 上次点了专属菜却没做成：这次不用再聊，直接接着点
      s.type = r.ordered; s.maxP = s.pat = def.patience || 45;
      s.npc = { id: def.id, stage: 'order' };
    } else {
      s.type = null; s.maxP = s.pat = 1; s.stayT = def.stay || 20;
      s.npc = { id: def.id, stage: 'guest' };
    }
    S.visited = true; S.plan = null;
    SG.beep(784, .1, 'triangle', .05);
  }

  // 不点 / 等不到：安静离开，不扣连击不扣钱，不写进度
  function walkAway(s) {
    const name = nameOf(s.npc ? s.npc.id : '');
    SG.pop(name + '悄悄起身走了', s.x, 56, '', 6);
  }

  // ---------- 对话运行 ----------
  const nodeType = n => Object.keys(n).find(k => reg.nodes[k]);

  function run() {
    const R = S.run;
    while (S.run === R && R.mode === 'idle') {
      const fr = R.stack[R.stack.length - 1];
      if (!fr) { finish(); return; }
      if (fr.i >= fr.list.length) { R.stack.pop(); continue; }
      const node = fr.list[fr.i++], type = nodeType(node);
      if (!type) { console.warn('[SG] 剧情里有不认识的节点：', node); continue; }
      reg.nodes[type](node, A);
    }
  }

  function open(s) {
    const def = reg.stories[s.npc.id], ch = def && def.chapters[peek(def.id).chapter];
    if (!ch) return;
    G.pressing = false; SG.pressSound.stop(); if (G.torch) G.torch.on = false;   // 正捏着饭团 / 喷着枪的话，先松手
    s.state = 'talk';
    S.run = { def, ch, seat: s, stack: [{ list: ch.script, i: 0 }], mode: 'idle', who: def.id, text: '', opts: null, inst: null, ignore: 0, afterAct: false };
    lock(true);
    SG.beep(660, .05, 'square', .03);
    run();
  }

  function endRun() {                              // 关掉对话界面
    S.run = null;
    choicesEl.classList.remove('on'); choicesEl.innerHTML = '';
    talkEl.dataset.who = '澄姐';
    SG.ui.setTalk(''); SG.ui.setTask(''); lock(false);
  }

  // 脚本走完且没有点单：章节完成，客人满意离开
  function finish() {
    const R = S.run, s = R.seat, r = rec(R.def.id);
    r.chapter++; r.ordered = null; write();
    s.npc.stage = 'done'; s.state = 'leave'; s.leaveDelay = .3; s.mood = 'happy';
    endRun();
  }

  function unlockDish(id) {
    const d = SG.save.data;
    if (!d.dishes.includes(id)) d.dishes.push(id);
    if (!G.unlocked.includes(id)) G.unlocked.push(id);
    write();
    SG.pop('新菜品：' + SG.INGREDIENTS[id].name, 90, 120, 'gold', 8); SG.sfx.unlock();
  }

  // 玩家把专属菜做成功交给了他（serve.js 调用）：章节完成，菜式正式解锁
  function served(s) {
    if (!s.npc || s.npc.stage !== 'order') return;
    const r = rec(s.npc.id), dish = r.ordered;
    r.chapter++; r.ordered = null; s.npc.stage = 'done';
    if (dish) unlockDish(dish); else write();
  }

  // 节点执行器用的接口
  const A = {
    get def() { return S.run.def; },
    push(list) { S.run.stack.push({ list, i: 0 }); },
    line(who, text) {
      const R = S.run;
      R.mode = 'say'; R.who = who; R.text = text; R.opts = null;
      R.ignore = R.afterAct ? .5 : .12; R.afterAct = false;      // 刚连点完互动，多等一会儿，免得手滑翻页
      choicesEl.classList.remove('on');
      talkEl.dataset.who = nameOf(who);
      SG.ui.setTalk(text); lock(true);
    },
    choices(opts) {
      const R = S.run;
      R.mode = 'choice'; R.opts = opts;
      SG.ui.setTalk(''); lock(true);
      choicesEl.innerHTML = '';
      opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.dataset.i = i; b.textContent = (i + 1) + '　' + o.text;
        choicesEl.appendChild(b);
      });
      choicesEl.classList.add('on');
    },
    act(id, node) {
      const R = S.run, f = reg.acts[id];
      if (!f) { console.warn('[SG] 没有登记过的互动：' + id); return; }
      R.mode = 'act'; SG.ui.setTalk(''); lock(true);
      R.inst = f({ node, G, CFG: SG.CFG, ui: SG.ui }, res => {
        if (S.run !== R) return;
        R.inst = null; R.mode = 'idle'; R.afterAct = true; SG.ui.setTask('');
        if (res && res.ok === false && node.fail) A.push(node.fail);
        run();
      });
    },
    give(g) {
      if (g.money) { SG.econ.extra(g.money); SG.pop('剧情奖励 +¥' + g.money, 90, 150, 'gold', 8); SG.sfx.coin(); }
      if (g.deco) {
        const up = SG.save.data.upgrades, id = 'deco_' + g.deco;
        if (!up.includes(id)) up.push(id);
        write(); SG.pop('获得：' + (g.name || g.deco), 90, 175, 'gold', 8); SG.sfx.unlock();
      }
      if (g.dish) unlockDish(g.dish);
    },
    flag(name, value) { SG.save.data.flags[name] = value === undefined ? true : value; write(); },
    affinity(n) { rec(S.run.def.id).affinity += n; write(); },
    order(dish) {
      const R = S.run, s = R.seat, def = R.def;
      if (!SG.DISHES[dish]) { console.warn('[SG] 点单的菜式不存在：' + dish); return; }
      rec(def.id).ordered = dish; write();          // 先记下"已点单"：这一夜没做成，下次来直接接着点
      s.type = dish; s.state = 'wait'; s.maxP = s.pat = def.patience || 45; s.mood = 'idle'; s.npc.stage = 'order';
      endRun();
    },
  };

  // ---------- 输入 ----------
  function advance() {
    const R = S.run;
    if (!R || R.mode !== 'say' || R.ignore > 0) return;
    R.mode = 'idle'; SG.beep(640, .04, 'square', .03);
    run();
  }

  function pick(i) {
    const R = S.run;
    if (!R || R.mode !== 'choice') return;
    const o = R.opts[i]; if (!o) return;
    choicesEl.classList.remove('on'); R.mode = 'idle'; R.opts = null;
    SG.beep(520, .05, 'square', .04);
    if (o.affinity) A.affinity(o.affinity);
    if (o.flag) A.flag(o.flag);
    if (o.then) A.push(o.then);
    run();
  }

  function guestAt(x, y) {                         // 点在 ✦ 客人身上（区域放宽，手机上好点）
    return G.seats.find(s => s.state === 'guest' && Math.abs(x - s.x) <= 24 && y > 28 && y < 124);
  }

  function down(x, y) {
    const R = S.run;
    if (R) {
      if (R.mode === 'say') advance();
      else if (R.mode === 'act' && R.inst && R.inst.down) R.inst.down(x, y);
      return true;                                 // 对话期间，点击不传给玩法
    }
    const s = guestAt(x, y);
    if (s) { open(s); return true; }
    return false;
  }
  function up() { const R = S.run; if (R && R.mode === 'act' && R.inst && R.inst.up) R.inst.up(); }

  function key(code, isDown) {
    const R = S.run;
    if (R) {
      if (!isDown) { if (R.mode === 'act' && R.inst && R.inst.key) R.inst.key(code, false); return true; }
      if (R.mode === 'say' && (code === 'Space' || code === 'Enter')) advance();
      else if (R.mode === 'choice' && /^Digit[1-9]$/.test(code)) pick(+code.slice(-1) - 1);
      else if (R.mode === 'act' && R.inst && R.inst.key) R.inst.key(code, true);
      return true;
    }
    if (isDown && /^Digit[123]$/.test(code)) {     // 键盘：按 1 2 3 点座位上的 ✦
      const s = G.seats[+code.slice(-1) - 1];
      if (s && s.state === 'guest') { open(s); return true; }
    }
    return false;
  }

  choicesEl.addEventListener('pointerdown', e => e.stopPropagation());
  choicesEl.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('button');
    if (b) pick(+b.dataset.i);
  });

  // 对话 / 互动期间的每帧更新（全店暂停）
  function update(dt) {
    const R = S.run; if (!R) return;
    if (R.ignore > 0) R.ignore -= dt;
    if (R.mode === 'act' && R.inst && R.inst.update) R.inst.update(dt);
  }
  function drawAct() { const R = S.run; if (R && R.mode === 'act' && R.inst && R.inst.draw) R.inst.draw(); }

  // 节点类型：加新节点 = 在这里 / 别处 SG.registerNode 一个函数
  SG.registerNode('say',      (n, r) => r.line(n.who || r.def.id, n.say));
  SG.registerNode('choice',   (n, r) => r.choices(n.choice));
  SG.registerNode('act',      (n, r) => r.act(n.act, n));
  SG.registerNode('give',     (n, r) => r.give(n.give));
  SG.registerNode('flag',     (n, r) => r.flag(n.flag, n.value));
  SG.registerNode('affinity', (n, r) => r.affinity(n.affinity));
  SG.registerNode('order',    (n, r) => r.order(n.order));

  SG.story = {
    begin, tick, update, down, up, key, drawAct, served, walkAway,
    busy: () => !!S.run,
    talking: () => !!S.run && S.run.mode !== 'act',
    arrowOn: () => !!S.run && S.run.mode === 'say',
    speaker: () => S.run ? S.run.who : null,
    state: S,
  };
})(window.SG = window.SG || {});