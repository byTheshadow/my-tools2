// 经营结算：记账（售价、打赏、食材成本）、打烊算账、闭店判定、回档 / Game Over。
// 数值在 config.js 的 econ 与 run，每夜的房租水电在 data/levels.js。教学夜整个不记账。
//   SG.econ.begin(level)               开店时调用：清空账本，记下夜初资金
//   SG.econ.sale / waste / riceFail / fishMiss   玩法步骤调用，返回这次的金额
//   SG.econ.close()                    打烊时调用：算账并写入存档，返回结算结果（练习夜返回 null）
(function (SG) {
  const { CFG, G } = SG;
  const E = CFG.econ, led = () => G.ledger;
  const on = () => !!led().on;
  const dish = id => SG.dishOf(id);

  // 售价倍率：比计分倍率温和，避免高连击把房租变成摆设
  const moneyMult = combo => 1 + Math.min(combo, E.moneyComboCap) * E.moneyComboStep;

  function begin(level) {
    const d = SG.save.data, l = led();
    l.sales = l.tips = l.foodServed = l.foodWaste = 0;
    l.on = !level.tutorial;
    // 只有"当前这一夜"才真正记账；回头重玩已通关的夜只算练习（不然就能刷钱）
    const idx = SG.LEVELS.indexOf(level);
    l.real = l.on && idx >= 0 && idx + 1 === d.night;
    if (l.real) { d.nightStartMoney = d.money; SG.save.write(); }
  }

  // 上菜成功：卖出一份。combo 是这份记入之后的连击数
  function sale(type, perfect, combo) {
    if (!on()) return { price: 0, tip: 0 };
    const D = dish(type), price = Math.round(D.price * moneyMult(combo));
    const tip = perfect ? Math.round(D.price * E.tipRate) : 0;
    led().sales += price; led().tips += tip; led().foodServed += D.cost;
    return { price, tip };
  }
  // 倒掉一份做好的寿司：付整份成本
  function waste(type) {
    if (!on()) return 0;
    const c = dish(type).cost; led().foodWaste += c; return c;
  }
  // 捏饭团失败：饭倒掉
  function riceFail() {
    if (!on()) return 0;
    led().foodWaste += E.riceFailCost; return E.riceFailCost;
  }
  // 鱼片没放上掉了：付该鱼片成本的一半
  function fishMiss(type) {
    if (!on()) return 0;
    const c = Math.round(dish(type).cost * E.fishMissRate); led().foodWaste += c; return c;
  }

  // 打烊：算账，并按结果改存档。kind：'ok' 正常 | 'retry' 闭店回档 | 'gameover' 第三次闭店
  function close() {
    const l = led();
    if (!l.real) return null;
    const d = SG.save.data, L = G.level, idx = SG.LEVELS.indexOf(L);
    const rent = L.rent || 0;
    const util = Math.round(rent * (L.utilityRate != null ? L.utilityRate : E.utilityRate));
    const food = l.foodServed + l.foodWaste, revenue = l.sales + l.tips;
    const profit = revenue - rent - util - food;
    const before = d.money, after = before + profit;
    const closeLine = -Math.round(rent * CFG.run.closeLineRentMult);
    const closed = after < closeLine;
    const r = {
      night: idx + 1, rent, util, sales: l.sales, tips: l.tips, revenue,
      foodServed: l.foodServed, foodWaste: l.foodWaste, food, profit,
      before, after, closeLine, closed, kind: 'ok',
      tight: !closed && after <= closeLine * E.tightRatio,
      advanced: false, retriesLeft: CFG.run.retryMax - d.retries,
    };
    if (closed && d.retries < CFG.run.retryMax) {           // 澄姐圆场：资金退回夜初，这一夜重做
      r.kind = 'retry';
      d.retries++; d.money = d.nightStartMoney;
      r.retriesLeft = CFG.run.retryMax - d.retries; r.restoredTo = d.money;
    } else if (closed) {                                    // 第三次：Game Over，回到第一夜
      r.kind = 'gameover';
      SG.save.restartRun();
    } else {                                                // 正常入账，往下一夜走
      d.money = after;
      const next = Math.min(idx + 2, SG.LEVELS.length);
      r.advanced = next > d.night; d.night = Math.max(d.night, next);
      d.nightStartMoney = d.money;
    }
    r.nextNight = SG.save.data.night;
    SG.save.write();
    return r;
  }

  SG.econ = { begin, sale, waste, riceFail, fishMiss, close, moneyMult, active: on };
})(window.SG = window.SG || {});