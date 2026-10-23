// 关卡定义。新增关卡：往 SG.LEVELS 数组末尾追加一个对象，选关页会自动出现（共 CFG.run.totalNights 格）。
//   id / name          关卡 id / 显示名（"第 N 夜 · 名字"，选关页取"·"后面的部分）
//   duration           营业时长(秒)
//   phases             一夜之内的节奏分段，见 js/pace.js。'std' = 开门 30 / 正常 90 / 高峰 45 / 收尾 15
//   rent               房租（经营结算用）
//   utilityRate        水电占房租的比例；不写则用 config.js 的 econ.utilityRate
//   costMult           进货价系数：食材成本整体乘这个数（上菜的、倒掉的、做坏的都算）。不写 = 1.0
//   startIngredients   开局可用食材（id 见 ingredients.js）
//   unlocks            [{at: 秒, id}] 到时间解锁新食材
//   difficulty         难度曲线，公式见 docs/RULES.md 第 7 节
//   ranks              结算称号，按 min 分数从小到大
//   npcs               这一夜允许登场的特殊客人（剧情 id，见 data/stories/）；没写 = 不会有特殊客人
//   tutorial           true = 教学夜（不记账、不记最高分、由 tutorial.js 引导）
//
// 关于 perSec：这些系数是"每秒"的衰减/增长，一夜 180 秒，数值按 180 秒调过。
// 要是把 duration 改回 90 秒，记得把 perSec 加倍，否则后半夜的曲线会摊平。
(function (SG) {
  const BASE = ['salmon', 'tuna', 'egg'];

  // 180 秒一夜的称号线（90 秒时代是 800 / 2000 / 4000，时长翻倍后相应抬高）
  const RANKS = [
    { min: 0,    name: '见习学徒' },
    { min: 1500, name: '寿司师傅' },
    { min: 3600, name: '板前大师' },
    { min: 7000, name: '寿司之神' },
  ];

  // 八夜难度曲线的唯一数据源。改手感先改这张表。
  //   press    开局捏一个饭团的秒数（越小越难）
  //   gold     开局金圈半宽(px)
  //   belt0    传送带起始速度 / beltMax 最高速度
  //   pat      开局客人耐心(秒) / patMin 耐心下限
  const CURVE = {
    1: { press: 1.15, gold: 4.00, belt0: 26, beltMax: 50, pat: 22,   patMin: 12 },
    2: { press: 1.10, gold: 3.75, belt0: 28, beltMax: 53, pat: 21,   patMin: 12 },
    3: { press: 1.05, gold: 3.50, belt0: 30, beltMax: 56, pat: 20,   patMin: 11 },
    4: { press: 1.00, gold: 3.25, belt0: 32, beltMax: 59, pat: 19,   patMin: 11 },
    5: { press: 0.95, gold: 3.00, belt0: 34, beltMax: 62, pat: 18,   patMin: 10 },
    6: { press: 0.90, gold: 2.73, belt0: 36, beltMax: 65, pat: 16.7, patMin: 10 },
    7: { press: 0.85, gold: 2.47, belt0: 38, beltMax: 68, pat: 15.3, patMin: 9 },
    8: { press: 0.80, gold: 2.20, belt0: 40, beltMax: 72, pat: 14,   patMin: 9 },
  };

  // 把一行数值展开成 difficulty 对象。seatRespawn 只是兜底（phases 在跑时由 pace.js 接管）。
  function diffOf(n) {
    const c = CURVE[n];
    return {
      pressDur:  { start: c.press,   perCombo: 0.02, perSec: 0.0015, min: 0.55 },
      goldWidth: { start: c.gold,    perCombo: 0.12, min: 1.5 },
      belt:      { start: c.belt0,   perSec: 0.12,   perCombo: 0.6, max: c.beltMax },
      patience:  { start: c.pat,     perSec: 0.04,   min: c.patMin },
      seatRespawn: [0.9, 2.2],
      firstSeatDelays: [0.4, 1.5, 2.7, 3.6, 4.6],   // 五个，够 5 座用
    };
  }

  // 教学夜：不算在 8 夜里。数值放松；澄姐说话时全店暂停，倒计时只在自由练习那一步才走。
  // 不分段（phases 不写），客流沿用 difficulty.seatRespawn。
  SG.TUTORIAL_LEVEL = {
    id: 'tutorial',
    name: '教学夜 · 澄姐的店',
    tutorial: true,
    duration: 75,
    rent: 0,
    startIngredients: BASE,
    unlocks: [],
    difficulty: {
      pressDur:  { start: 1.4, perCombo: 0,    perSec: 0,   min: 1.4 },
      goldWidth: { start: 5,   perCombo: 0,    min: 5 },
      belt:      { start: 22,  perSec: 0,      perCombo: 0, max: 22 },
      patience:  { start: 30,  perSec: 0,      min: 30 },
      seatRespawn: [1.5, 3],
      firstSeatDelays: [0.4, 1.5, 2.7],
    },
    ranks: [{ min: 0, name: '见习学徒' }],
  };

  // 房租逐夜上涨；水电比例后期从 10% 提到 15%。
  // 进货价（costMult）从第 5 夜开始涨：前四夜毛利照旧，后四夜每一份都要算账，浪费也更肉疼。
  //   第 5 夜 ×1.20：三文鱼成本 22 → 26，毛利率 63% → 56%
  //   第 6 夜 ×1.35：22 → 30，毛利率 51%
  //   第 7 夜 ×1.50：22 → 33，毛利率 45%
  //   第 8 夜 ×1.70：22 → 37，毛利率 38%
  // 闭店线 = −(当夜房租 × 2)，所以房租也是容错线，调它等于同时调难度。
  SG.LEVELS = [
    {
      id: 'l1',
      name: '第 1 夜 · 开店营业',
      duration: 180,
      phases: 'std',
      rent: 240,
      startIngredients: BASE,
      unlocks: [{ at: 50, id: 'shrimp' }],
      difficulty: diffOf(1),
      ranks: RANKS,
    },
    {
      id: 'l2',
      name: '第 2 夜 · 雨后的客人',
      duration: 180,
      phases: 'std',
      rent: 340,
      npcs: ['songshu'],
      startIngredients: BASE,
      unlocks: [{ at: 35, id: 'shrimp' }],
      difficulty: diffOf(2),
      ranks: RANKS,
    },
    {
      id: 'l3',
      name: '第 3 夜 · 夜归人',
      duration: 180,
      phases: 'std',
      rent: 460,
      npcs: ['songshu'],
      startIngredients: BASE.concat('shrimp'),
      unlocks: [],
      difficulty: diffOf(3),
      ranks: RANKS,
    },
    {
      id: 'l4',
      name: '第 4 夜 · 加班的灯',
      duration: 180,
      phases: 'std',
      rent: 600,
      npcs: ['songshu'],
      startIngredients: BASE.concat('shrimp'),
      unlocks: [],
      difficulty: diffOf(4),
      ranks: RANKS,
    },
    {
      id: 'l5',
      name: '第 5 夜 · 月色正好',
      duration: 180,
      phases: 'std',
      rent: 760,
      utilityRate: 0.12,
      costMult: 1.20,
      startIngredients: BASE.concat('shrimp'),
      unlocks: [],
      difficulty: diffOf(5),
      ranks: RANKS,
    },
    {
      id: 'l6',
      name: '第 6 夜 · 旧街坊',
      duration: 180,
      phases: 'std',
      rent: 950,
      utilityRate: 0.12,
      costMult: 1.35,
      startIngredients: BASE.concat('shrimp'),
      unlocks: [],
      difficulty: diffOf(6),
      ranks: RANKS,
    },
    {
      id: 'l7',
      name: '第 7 夜 · 风里的铃',
      duration: 180,
      phases: 'std',
      rent: 1150,
      utilityRate: 0.15,
      costMult: 1.50,
      startIngredients: BASE.concat('shrimp'),
      unlocks: [],
      difficulty: diffOf(7),
      ranks: RANKS,
    },
    {
      id: 'l8',
      name: '第 8 夜 · 最后一班电车',
      duration: 180,
      phases: 'std',
      rent: 1400,
      utilityRate: 0.15,
      costMult: 1.70,
      startIngredients: BASE.concat('shrimp'),
      unlocks: [],
      difficulty: diffOf(8),
      ranks: RANKS,
    },
  ];
})(window.SG = window.SG || {});