// 菜式 = 食材外观（data/ingredients.js）+ 做法 + 成本 + 售价 + 解锁来源。
//   ingredient  外观，对应 SG.INGREDIENTS 的 id
//   method      做法，对应 data/methods.js
//   cost/price  每份食材成本 / 售价（步骤 3 的经营结算启用，现在只是数据）
//   from        'base' 开局就有 | 'level' 由关卡 unlocks 解锁 | { story: 剧情id } 剧情解锁
(function (SG) {
  SG.DISHES = {
    salmon: { ingredient: 'salmon', method: 'nigiri', cost: 22, price: 60, from: 'base' },
    tuna:   { ingredient: 'tuna',   method: 'nigiri', cost: 28, price: 70, from: 'base' },
    egg:    { ingredient: 'egg',    method: 'nigiri', cost: 16, price: 50, from: 'base' },
    shrimp: { ingredient: 'shrimp', method: 'nigiri', cost: 32, price: 80, from: 'level' },
  };
  SG.dishOf = id => SG.DISHES[id] || { ingredient: id, method: 'nigiri', cost: 0, price: 0, from: 'base' };
})(window.SG = window.SG || {});
