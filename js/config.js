// 全局常量：画布尺寸、布局坐标、判定与计分数值。
// 想调手感/分数，优先改这里或 data/levels.js。
(function (SG) {
  SG.CFG = {
    W: 180, H: 320,                    // 逻辑分辨率（像素风，整数倍放大）
    seats: [30, 90, 150],              // 三个客人座位的 x 坐标
    rice: { x: 90, y: 236 },           // 饭团/寿司在砧板上的位置
    belt: { y: 141, gap: 34, orderBias: 0.55 }, // 传送带高度、鱼片间距、"出现客人点单鱼片"的概率
    ring: { r0: 40, goldCenter: 13, goodExtra: 5 }, // 圆环起始半径、金圈半径、"不错"额外容差
    drop: { perfectDist: 2.5, goodDist: 7, missDist: 13 }, // 鱼片落点偏差判定(px)
    score: {
      rice: { perfect: 30, good: 15 },
      fish: { perfect: 30, good: 15, meh: 5 },
      serveBase: 40,                   // 上对菜的基础分
      patienceMax: 30,                 // 耐心满格时的额外分
      perfectMult: 1.5,                // 完美寿司倍率
      comboStep: 0.1, comboCap: 20,    // 连击每层 +0.1 倍，最多 20 层
    },
    failLock: 0.35,                    // 捏失败后的冷却(秒)
    saveKey: 'pixelSushiBest',
  };
})(window.SG = window.SG || {});
