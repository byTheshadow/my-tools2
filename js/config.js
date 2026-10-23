// 全局常量：画布尺寸、布局坐标、判定与计分数值。
// 想调手感/分数，优先改这里或 data/levels.js。
(function (SG) {
  SG.CFG = {
    W: 180, H: 320,                    // 逻辑分辨率（像素风，整数倍放大）
    seats: [30, 90, 150],              // 默认三座的 x（兼容旧代码；实际用 seatsBy）
    seatsBy: {                         // 不同座位数的 x 坐标（扩建升级后用，见 js/shop.js）
      3: [30, 90, 150],
      4: [24, 68, 112, 156],
      5: [20, 55, 90, 125, 160],
    },
    rice: { x: 90, y: 236 },           // 饭团/寿司在砧板上的位置
    belt: { y: 141, gap: 34, orderBias: 0.55 }, // 传送带高度、鱼片间距、"出现客人点单鱼片"的概率
    ring: { r0: 40, goldCenter: 13, goodExtra: 5 }, // 圆环起始半径、金圈半径、"不错"额外容差
    drop: { perfectDist: 2.5, goodDist: 7, missDist: 13 }, // 鱼片落点偏差判定(px)，磨刀石升级会整体放宽
    score: {
      rice: { perfect: 30, good: 15 },
      fish: { perfect: 30, good: 15, meh: 5 },
      serveBase: 40,                   // 上对菜的基础分
      patienceMax: 30,                 // 耐心满格时的额外分
      perfectMult: 1.5,                // 完美寿司倍率
      comboStep: 0.1, comboCap: 20,    // 连击每层 +0.1 倍，最多 20 层
    },
    failLock: 0.35,                    // 捏失败后的冷却(秒)
    // 经营结算（economy.js 读这里；每夜的房租/水电在 data/levels.js）
    econ: {
      moneyComboStep: 0.03, moneyComboCap: 10,  // 售价倍率 = 1 + min(连击, 10) × 0.03，最高 ×1.3（和计分倍率分开算）
      tipRate: 0.15,                   // 完美寿司的打赏 = 售价 × 15%（招财猫升级会加）
      luckyTipRate: 0.5,               // 招财猫让普通寿司也打赏时，按完美打赏的这个比例给
      riceFailCost: 6,                 // 捏饭团失败：饭倒掉的固定成本
      fishMissRate: 0.5,               // 鱼片没放上：按该鱼片成本的一半计
      utilityRate: 0.10,               // 水电 = 房租 × 这个数（关卡里写了 utilityRate 就用关卡的）
      tightRatio: 0.5,                 // 资金落到 闭店线 × 这个数 以下，结算页提醒"账本有点紧"
    },
    // 整局流程（经营与闭店规则在步骤 3 启用）
    run: {
      totalNights: 8,                  // 全部夜数（选关页的格子数）
      retryMax: 2,                     // 闭店后"回到上一夜重做"最多几次，用完再闭店就是 Game Over
      closeLineRentMult: 2,            // 闭店线 = −(当夜房租 × 这个数)
    },
    saveSlot: 'deepNightSushi:save',   // 统一存档的 localStorage key
    saveVersion: 2,                    // 存档版本号：改存档结构时 +1，并在 save.js 里写迁移
    saveKey: 'pixelSushiBest',         // 旧版最高分的 key，只用于第一次启动时迁移
  };
})(window.SG = window.SG || {});