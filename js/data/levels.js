// 关卡定义。新增关卡：往数组里追加一个对象即可，标题页会自动出现选关按钮。
//   duration           营业时长(秒)
//   startIngredients   开局可用食材（id 见 ingredients.js）
//   unlocks            [{at: 秒, id}] 到时间解锁新食材
//   difficulty         难度曲线，公式见 docs/RULES.md
//   ranks              结算称号，按 min 分数从小到大
(function (SG) {
  SG.LEVELS = [
    {
      id: 'l1',
      name: '第一关 · 开店营业',
      duration: 90,
      startIngredients: ['salmon', 'tuna', 'egg'],
      unlocks: [{ at: 30, id: 'shrimp' }],
      difficulty: {
        pressDur:  { start: 1.15, perCombo: 0.02, perSec: 0.003, min: 0.55 }, // 捏一个饭团的秒数（越小越难）
        goldWidth: { start: 4,    perCombo: 0.12, min: 1.5 },                 // 金圈半宽(px)
        belt:      { start: 26,   perSec: 0.25,   perCombo: 0.6, max: 62 },   // 传送带速度(px/s)
        patience:  { start: 22,   perSec: 0.08,   min: 12 },                  // 客人耐心(秒)
        seatRespawn: [0.8, 2.2],                                              // 客人离开后再来的间隔
        firstSeatDelays: [0.4, 1.5, 2.7],                                     // 开局三位客人出现时间
      },
      ranks: [
        { min: 0,    name: '见习学徒' },
        { min: 800,  name: '寿司师傅' },
        { min: 2000, name: '板前大师' },
        { min: 4000, name: '寿司之神' },
      ],
    },
  ];
})(window.SG = window.SG || {})