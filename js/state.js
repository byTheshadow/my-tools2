// 所有会变化的游戏状态都放在 SG.G 里（只修改，不重新赋值）。
//   mode:  'title' | 'play' | 'over'
//   phase: 'rice'(捏饭团) | 'fish'(等放鱼片) | 'drop'(鱼片下落) | 'serve'(等上菜)
(function (SG) {
  SG.G = {
    mode: 'title', phase: 'rice',
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
    // 特效
    particles: [], fallen: [], flying: [], shake: 0,
    muted: false,
  };

  const key = () => SG.CFG.saveKey + ':' + SG.G.level.id;
  SG.loadBest = () => { try { SG.G.best = +localStorage.getItem(key()) || 0; } catch (e) { SG.G.best = 0; } };
  SG.saveBest = () => { try { localStorage.setItem(key(), SG.G.best); } catch (e) {} };
})(window.SG = window.SG || {});
