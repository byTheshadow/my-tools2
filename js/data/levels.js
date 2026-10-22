// 关卡定义。新增关卡：往 SG.LEVELS 数组末尾追加一个对象，选关页会自动出现（共 CFG.run.totalNights 格）。
//   id / name          关卡 id / 显示名（"第 N 夜 · 名字"，选关页取"·"后面的部分）
//   duration           营业时长(秒)
//   rent               房租（经营结算用）
//   utilityRate        水电占房租的比例；不写则用 config.js 的 econ.utilityRate
//   startIngredients   开局可用食材（id 见 ingredients.js）
//   unlocks            [{at: 秒, id}] 到时间解锁新食材
//   difficulty         难度曲线，公式见 docs/RULES.md 第 7 节
//   ranks              结算称号，按 min 分数从小到大
//   tutorial           true = 教学夜（不记账、不记最高分、由 tutorial.js 引导）
// 第 2、3 夜是占位数值（草案夜 1 与夜 3 之间插值），步骤 8 再正式调。
(function (SG) {
  const RANKS = [
    { min: 0,    name: '见习学徒' },
    { min: 800,  name: '寿司师傅' },
    { min: 2000, name: '板前大师' },
    { min: 4000, name: '寿司之神' },
  ];
  const BASE = ['salmon', 'tuna', 'egg'];

  // 教学夜：不算在 8 夜里。数值放松；澄姐说话时全店暂停，倒计时只在自由练习那一步才走。
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

  SG.LEVELS = [
    {
      id: 'l1',
      name: '第 1 夜 · 开店营业',
      duration: 90,
      rent: 200,
      startIngredients: BASE,
      unlocks: [{ at: 30, id: 'shrimp' }],
      difficulty: {
        pressDur:  { start: 1.15, perCombo: 0.02, perSec: 0.003, min: 0.55 }, // 捏一个饭团的秒数（越小越难）
        goldWidth: { start: 4,    perCombo: 0.12, min: 1.5 },                 // 金圈半宽(px)
        belt:      { start: 26,   perSec: 0.25,   perCombo: 0.6, max: 62 },   // 传送带速度(px/s)
        patience:  { start: 22,   perSec: 0.08,   min: 12 },                  // 客人耐心(秒)
        seatRespawn: [0.8, 2.2],                                              // 客人离开后再来的间隔
        firstSeatDelays: [0.4, 1.5, 2.7],                                     // 开局三位客人出现时间
      },
      ranks: RANKS,
    },
    {
      id: 'l2',
      name: '第 2 夜 · 雨后的客人',
      duration: 90,
      rent: 350,
      startIngredients: BASE,
      unlocks: [{ at: 20, id: 'shrimp' }],
      difficulty: {
        pressDur:  { start: 1.10, perCombo: 0.02, perSec: 0.003, min: 0.55 },
        goldWidth: { start: 3.8,  perCombo: 0.12, min: 1.5 },
        belt:      { start: 28,   perSec: 0.25,   perCombo: 0.6, max: 62 },
        patience:  { start: 21,   perSec: 0.08,   min: 12 },
        seatRespawn: [0.8, 2.2],
        firstSeatDelays: [0.4, 1.5, 2.7],
      },
      ranks: RANKS,
    },
    {
      id: 'l3',
      name: '第 3 夜 · 夜归人',
      duration: 90,
      rent: 550,
      startIngredients: BASE.concat('shrimp'),
      unlocks: [],
      difficulty: {
        pressDur:  { start: 1.05, perCombo: 0.02, perSec: 0.003, min: 0.55 },
        goldWidth: { start: 3.5,  perCombo: 0.12, min: 1.5 },
        belt:      { start: 30,   perSec: 0.25,   perCombo: 0.6, max: 62 },
        patience:  { start: 20,   perSec: 0.08,   min: 12 },
        seatRespawn: [0.8, 2.2],
        firstSeatDelays: [0.4, 1.5, 2.7],
      },
      ranks: RANKS,
    },
  ];
})(window.SG = window.SG || {});