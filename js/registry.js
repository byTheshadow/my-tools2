// 注册表：剧情、互动、对话节点、玩法步骤、做法、条件，全部"新增一个文件/一个函数就能扩展"。
// 其他文件通过 SG.registerXxx 往里登记，game.js / 剧情引擎按 id 去取。
(function (SG) {
  const reg = SG.reg = {
    stories: {},    // 剧情（每位特殊客人一个）
    acts: {},       // 互动小游戏（剧情里的 act 节点引用）
    nodes: {},      // 对话节点类型（say / choice / act / give / flag …）
    steps: {},      // 玩法步骤模块（rice / fish / serve / torch …）
    methods: {},    // 做法 = 步骤 id 的有序列表
    conds: {},      // 条件（登场条件、章节条件）
    howtoArts: {},  // 玩法说明卡里的小动画
  };

  const need = (ok, msg) => { if (!ok) throw new Error('[SG] ' + msg); };

  // 剧情：{ id, who, when, chapters:[{ id, when, script, reward }] }
  SG.registerStory = def => { need(def && def.id, '剧情缺少 id'); need(Array.isArray(def.chapters), '剧情缺少 chapters：' + def.id); reg.stories[def.id] = def; return def; };
  // 互动：fn(host, done)，完成时调用 done({ ok, ... })
  SG.registerAct = (id, fn) => { need(typeof fn === 'function', '互动必须是函数：' + id); reg.acts[id] = fn; };
  // 对话节点：fn(node, runner)
  SG.registerNode = (id, fn) => { need(typeof fn === 'function', '节点必须是函数：' + id); reg.nodes[id] = fn; };
  // 条件：fn(参数, env) → boolean
  SG.registerCond = (id, fn) => { need(typeof fn === 'function', '条件必须是函数：' + id); reg.conds[id] = fn; };
  // 玩法步骤：{ hint, enter, update, draw, drawUnder, down, up, key }，完成时调用 c.next()
  SG.registerStep = (id, mod) => { need(mod && typeof mod === 'object', '步骤必须是对象：' + id); mod.id = id; reg.steps[id] = mod; };
  // 做法：{ name, steps:['rice','fish','serve'] }
  SG.registerMethod = (id, def) => { need(def && Array.isArray(def.steps), '做法缺少 steps：' + id); def.id = id; reg.methods[id] = def; };
  // 玩法说明卡动画：fn() 每帧在卡片内绘制
  SG.registerHowtoArt = (id, fn) => { reg.howtoArts[id] = fn; };

  // ---------- 条件语言 ----------
  // when 是一个对象，里面每一项都要满足（且）。例：{ night: [2, 99], stat: { served: 10 }, chapterDone: 'c1' }
  const inRange = (v, r) => Array.isArray(r) ? v >= r[0] && v <= r[1] : v >= r;
  const list = v => Array.isArray(v) ? v : [v];

  SG.cond = {
    check(when, env) {
      if (!when) return true;
      for (const k of Object.keys(when)) {
        const f = reg.conds[k];
        if (!f) { console.warn('[SG] 未知条件：' + k); return false; }
        if (!f(when[k], env)) return false;
      }
      return true;
    },
    // 当前局面的快照；剧情引擎会补上 done（本剧情已完成的章节）
    env(extra) {
      const d = SG.save.data, G = SG.G;
      return Object.assign({
        night: d.night, money: d.money,
        stat: { served: G.served, perfect: G.perfectSushi, maxCombo: G.maxCombo, score: G.score },
        flags: d.flags, dishes: d.dishes, done: [],
      }, extra);
    },
  };

  SG.registerCond('night',       (r, e) => inRange(e.night, r));                                  // [最早, 最晚] 或 数字(至少)
  SG.registerCond('money',       (r, e) => inRange(e.money, r));
  SG.registerCond('stat',        (r, e) => Object.keys(r).every(k => (e.stat[k] || 0) >= r[k]));  // 本夜统计达到
  SG.registerCond('flag',        (r, e) => list(r).every(f => !!e.flags[f]));                     // 剧情标记已设置
  SG.registerCond('chapterDone', (r, e) => list(r).every(c => e.done.includes(c)));
  SG.registerCond('dishCount',   (r, e) => e.dishes.length >= r);                                 // 已解锁菜式数量
})(window.SG = window.SG || {});
