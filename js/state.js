// 所有会变化的游戏状态都放在 SG.G 里（只修改，不重新赋值）。
//   mode:   'title' | 'play' | 'over'
//   screen: 标题页下的子页面 'intro' | 'main' | 'howto' | 'levels'
//   phase:  当前步骤 id（'rice' 捏饭团 | 'fish' 放鱼片 | 'serve' 上菜…），放鱼片下落时临时为 'drop'
(function (SG) {
  SG.G = {
    mode: 'title', screen: 'main', howPage: 0, phase: 'rice',
    t: 0, overT: 0,
    level: SG.LEVELS[0],
    timeLeft: 0, elapsed: 0,
    score: 0, combo: 0, maxCombo: 0, served: 0, perfectSushi: 0, best: 0,
    unlocked: [],
    // 捏饭团
    pressing: false, pressT: 0, ringR: SG.CFG.ring.r0, riceP: 0,
    curDur: 1, curGw: 4, inZoneTicked: false, lockT: 0,
    // 传送带 / 鱼片 / 寿司
    belt: [], beltOff: 0, dropSlice: null, sushi: null,
    // 客人
    seats: [],
    // 本夜账目（economy.js 维护；on 为假表示这一夜不记账，如教学夜）
    ledger: { on: false, real: false, sales: 0, tips: 0, foodServed: 0, foodWaste: 0 },
    // 特效
    particles: [], fallen: [], flying: [], shake: 0,
    muted: false,
  };

  // 最高分放在统一存档里（save.js）
  SG.loadBest = () => { SG.G.best = SG.save.best(SG.G.level.id); };
  SG.saveBest = () => { SG.save.setBest(SG.G.level.id, SG.G.best); };
})(window.SG = window.SG || {});