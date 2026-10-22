// 教学夜引擎：按 data/tutorial.js 的脚本一步步放开操作。
// 对外只有三件事：game.js 问它"现在放开了什么"、把玩家动作当事件丢进来、把点击先给它。
(function (SG) {
  const G = SG.G;

  const st = {
    on: false,        // 是否在教学夜
    i: -1,            // 当前第几步
    stage: null,
    lines: [], li: 0, // 澄姐正在说的话
    count: 0,         // 当前目标已完成次数
    saidFail: false,
    done: false,      // 脚本走完（进入自由练习）
  };
  const allow = { belt: false, customers: false, patience: false, timer: false };

  const speaking = () => st.on && st.li < st.lines.length;
  const line = () => st.lines[st.li] || '';

  function applyAllow(a) {
    allow.belt = !!(a && a.belt); allow.customers = !!(a && a.customers);
    allow.patience = !!(a && a.patience); allow.timer = !!(a && a.timer);
  }

  function taskText() {
    const s = st.stage;
    if (!st.on || speaking() || !s || !s.goal || !s.task) return '';
    return s.task.replace('{n}', `${st.count} / ${s.goal.n}`);
  }

  function enter(i) {
    st.i = i;
    st.stage = SG.TUTORIAL[i] || null;
    st.count = 0; st.saidFail = false;
    if (!st.stage) { st.done = true; applyAllow({ belt: true, customers: true, patience: true, timer: true }); return; }
    applyAllow(st.stage.allow);
    st.lines = (st.stage.say || []).slice(); st.li = 0;
    SG.ui.setTalk(line());
    SG.ui.setTask(taskText());
    if (!st.lines.length) afterSay();
  }

  // 说完话之后：有目标就等玩家做，没有目标就直接进下一步
  function afterSay() {
    const s = st.stage;
    if (!s) return;
    if (s.spawn === 'match' && SG.game.spawnGuest) SG.game.spawnGuest(1, G.sushi && G.sushi.type);
    SG.ui.setTask(taskText());
    if (!s.goal) enter(st.i + 1);
  }

  // 点一下：翻台词。返回 true 表示这次点击被教学吃掉了，不传给玩法
  function down() {
    if (!speaking()) return false;
    st.li++;
    if (st.li < st.lines.length) { SG.ui.setTalk(line()); SG.beep(640, .04, 'square', .03); }
    else { SG.ui.setTalk(''); afterSay(); }
    return true;
  }

  // 玩法步骤发来的事件
  function event(name) {
    if (!st.on || st.done) return;
    const s = st.stage;
    if (!s || !s.goal || speaking()) return;
    if (name === 'fail') {
      if (s.fail && !st.saidFail) { st.saidFail = true; st.lines = [s.fail]; st.li = 0; SG.ui.setTalk(line()); SG.ui.setTask(''); }
      return;
    }
    if (name !== s.goal.ev) return;
    st.count++;
    SG.ui.setTask(taskText());
    if (st.count < s.goal.n) return;
    // 达成：先说回应，再进下一步
    const after = (s.after || []).slice();
    st.stage = Object.assign({}, s, { goal: null, say: after, after: null });
    st.lines = after; st.li = 0;
    SG.ui.setTask('');
    if (after.length) { SG.ui.setTalk(line()); SG.sfx.unlock(); }
    else enter(st.i + 1);
  }

  // 回应说完后要继续往下走：afterSay 里 stage.goal 已清空，会直接 enter 下一步
  function start() {
    st.on = true; st.done = false;
    applyAllow(null);
    enter(0);
  }
  function stop() {
    st.on = false; st.done = false; st.stage = null; st.lines = []; st.li = 0;
    applyAllow({ belt: true, customers: true, patience: true, timer: true });
    SG.ui.setTalk(''); SG.ui.setTask('');
  }
  function endLine() {
    let t = SG.TUTORIAL_END[0].text;
    for (const e of SG.TUTORIAL_END) if (G.served >= e.min) t = e.text;
    return t;
  }

  SG.tutorial = { st, allow, start, stop, down, event, speaking, line, taskText, endLine, active: () => st.on };
})(window.SG = window.SG || {});