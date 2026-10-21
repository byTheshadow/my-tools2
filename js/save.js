// 统一存档：一个 localStorage 条目，带版本号。以后加内容只往里加字段，旧档会被自动补齐。
//   SG.save.data    当前存档（直接读写，改完调用 SG.save.write()）
//   版本升级：把 CFG.saveVersion +1，并在下面的 migrations 里写"从旧版本升上来"的函数。
(function (SG) {
  const CFG = SG.CFG;

  const defaults = () => ({
    version: CFG.saveVersion,
    seenIntro: false,
    money: 0,                 // 累计资金（可为负）
    night: 1,                 // 当前进行到第几夜
    retries: 0,               // 本轮已用掉几次"回到上一夜重做"
    upgrades: [],             // 已购买的店铺升级（id 可重复表示多档）
    dishes: [],               // 剧情解锁的菜式
    flags: {},                // 全局剧情标记
    story: {},                // { [剧情id]: { chapter, affinity, flags } }
    bestByNight: {},          // { [关卡id]: 最高分 }
    codex: { made: {} },      // 图鉴：各菜式累计做出的数量
  });

  // key = 旧版本号；函数把存档升到下一个版本
  const migrations = {
    // 1: d => { d.newField = 0; d.version = 2; return d; },
  };

  function migrate(d) {
    while (d.version < CFG.saveVersion) {
      const f = migrations[d.version];
      if (!f) break;
      d = f(d);
    }
    return d;
  }

  function backup(raw) { try { localStorage.setItem(CFG.saveSlot + ':backup', raw); } catch (e) {} }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(CFG.saveSlot); } catch (e) {}
    const d = defaults();
    if (raw) {
      try {
        const o = JSON.parse(raw);
        if (o && typeof o === 'object' && typeof o.version === 'number' && o.version <= CFG.saveVersion) {
          Object.assign(d, migrate(o));
        } else backup(raw);               // 比当前版本新或格式不对：留一份备份，用新档
      } catch (e) { backup(raw); }
    } else {
      // 第一次启动：把旧版最高分搬过来
      for (const L of SG.LEVELS || []) {
        try { const v = +localStorage.getItem(CFG.saveKey + ':' + L.id) || 0; if (v) d.bestByNight[L.id] = v; } catch (e) {}
      }
    }
    // 补齐缺失的嵌套字段（旧档遇到新字段）
    const base = defaults();
    for (const k of Object.keys(base)) if (d[k] === undefined || d[k] === null) d[k] = base[k];
    if (!d.codex.made) d.codex.made = {};
    d.version = CFG.saveVersion;
    return d;
  }

  const data = load();

  function write() { try { localStorage.setItem(CFG.saveSlot, JSON.stringify(data)); } catch (e) {} }

  SG.save = {
    data, write,
    best: id => data.bestByNight[id] || 0,
    setBest(id, v) { data.bestByNight[id] = v; write(); },
    // Game Over 后"回到最初的第一夜"：只清资金、夜数、重做次数；升级、图鉴、剧情进度、最高分都保留
    restartRun() { data.money = 0; data.night = 1; data.retries = 0; write(); },
  };
  write();
})(window.SG = window.SG || {});
