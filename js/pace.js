// 一夜之内的节奏分段：开门 → 正常营业 → 夜宵高峰 → 打烊前。
// 只管"这一刻客人来得多不多、耐不耐烦、传送带快不快"，不管关卡整体难度（那是 data/levels.js 的 difficulty）。
//   关卡里写 phases: 'std'    用下面的默认四段（段长会按 duration 等比缩放）
//   关卡里写 phases: [...]    自定义，字段同 STD
//   不写 / phases: false      完全沿用旧行为（difficulty.seatRespawn，耐心和传送带不受段落影响）
// 对外：
//   SG.pace.begin(level)   开店时调用
//   SG.pace.tick(dt)       每帧调用（只负责切段提示）
//   SG.pace.respawn()      → [min, max] 客人离开后再来的间隔
//   SG.pace.patienceMul()  → 耐心倍率（乘在难度曲线上，店铺升级的加成不受影响）
//   SG.pace.beltAdd()      → 传送带额外速度
//   SG.pace.canSpawn()     → 打烊前几秒不再放新客人
//   SG.pace.current()      → 当前段 { id, name, ... }，没有分段时为 null
(function (SG) {
  const { G, pop, sfx } = SG;

  // 默认四段（总长 180 秒）。respawn 是每个座位空出来后、下一位客人进门的间隔。
  const STD = [
    { id: 'open', name: '开门',     dur: 30, respawn: [1.6, 3.2], patienceMul: 1.10, beltAdd: 0 },
    { id: 'busy', name: '正常营业', dur: 90, respawn: [0.9, 2.2], patienceMul: 1.00, beltAdd: 0 },
    { id: 'rush', name: '夜宵高峰', dur: 45, respawn: [0.35, 1.0], patienceMul: 0.88, beltAdd: 4 },
    { id: 'last', name: '打烊前',   dur: 15, respawn: [2.2, 4.0], patienceMul: 1.00, beltAdd: 0 },
  ];
  SG.PACE_STD = STD;

  const STOP_SPAWN_LAST = 8;   // 最后这几秒不再放新客人（来了也做不完，白白占座）

  let segs = null;             // [{...phase, t0, t1}]，按关卡时长缩放后的绝对秒数
  let shownId = null;          // 已经弹过提示的段 id

  function resolve(L) {
    const p = L && L.phases;
    if (!p) return null;
    const list = (p === 'std' || p === true) ? STD : (Array.isArray(p) ? p : null);
    if (!list || !list.length) return null;
    const sum = list.reduce((a, s) => a + (s.dur || 0), 0);
    if (sum <= 0) return null;
    const k = (L.duration || sum) / sum;       // 关卡时长和段长总和对不上时等比缩放
    let t = 0;
    return list.map(s => {
      const t0 = t; t += (s.dur || 0) * k;
      return Object.assign({}, s, { t0, t1: t });
    });
  }

  function begin(level) {
    segs = resolve(level);
    shownId = segs ? segs[0].id : null;        // 第一段不弹提示
  }

  function current() {
    if (!segs) return null;
    const t = G.elapsed;
    for (const s of segs) if (t < s.t1) return s;
    return segs[segs.length - 1];
  }

  // 切段时提示。只有"夜宵高峰"值得打断玩家，其余段静默切换。
  function tick() {
    const s = current();
    if (!s || s.id === shownId) return;
    shownId = s.id;
    if (s.announce === false) return;
    if (s.id === 'rush' || s.announce) {
      pop(s.name, SG.CFG.W / 2, 120, 'gold', 9);
      if (sfx && sfx.unlock) sfx.unlock();
    }
  }

  function respawn() {
    const s = current();
    if (s && s.respawn) return s.respawn;
    const d = G.level && G.level.difficulty;
    return (d && d.seatRespawn) || [0.9, 2.2];
  }
  function patienceMul() { const s = current(); return (s && s.patienceMul != null) ? s.patienceMul : 1; }
  function beltAdd()     { const s = current(); return (s && s.beltAdd) || 0; }
  function canSpawn()    { return !segs || G.timeLeft > STOP_SPAWN_LAST; }

  SG.pace = { begin, tick, respawn, patienceMul, beltAdd, canSpawn, current };
})(window.SG = window.SG || {});