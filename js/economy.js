// 经营结算：记账（售价、打赏、食材成本、剧情奖励）、打烊算账、闭店判定、回档 / Game Over。
// 数值在 config.js 的 econ 与 run，每夜的房租水电在 data/levels.js。教学夜整个不记账。
// 店铺升级：招财猫加打赏（tipRateAdd / tipChance）、议价减房租（rentCut），见 js/shop.js。
// 进货价：关卡可写 costMult（不写 = 1.0），所有食材成本按它乘一遍——上菜的、倒掉的、做坏的都算。
// 游戏没有终点：打完最后一个关卡，night 停在最后一夜，继续按那一夜的数值真记账；以后追加关卡，玩家自然接着往下走。
//   SG.econ.begin(level)               开店时调用：清空账本，记下夜初资金
//   SG.econ.sale / waste / riceFail / fishMiss   玩法步骤调用，返回这次的金额
//   SG.econ.extra(n)                   剧情奖励：记进当夜账本，打烊时入账（闭店回档时一起退回）
//   SG.econ.close()                    打烊时调用：算账并写入存档，返回结算结果（练习夜返回 null）
//   SG.econ.costMult()                 当前这一夜的进货价系数（结算页 / HUD 想显示就读它）
(function (SG) {
  const { CFG, G } = SG;
  const E = CFG.econ, led = () => G.ledger;
  const on = () => !!led().on;
  const dish = id => SG.dishOf(id);

  // 进货价系数：鱼价一夜比一夜贵，毛利被压薄，浪费也更肉疼
  const costK = () => { const m = G.level && G.level.costMult; return m > 0 ? m : 1; };
  const costOf = type => Math.round(dish(type).cost * costK());

  // 售价倍率：比计分倍率温和，避免高连击把房租变成摆设
  const moneyMult = combo => 1 + Math.min(combo, E.moneyComboCap) * E.moneyComboStep;

  function begin(level) {
    const d = SG.save.data, l = led();
    l.sales = l.tips = l.foodServed = l.foodWaste = l.extra = 0;
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
    const rate = E.tipRate + SG.shop.fx('tipRateAdd');          // 招财猫：打赏比例上升
    let tip = perfect ? Math.round(D.price * rate) : 0;
    if (!perfect) {                                              // 招财猫：普通寿司也可能被打赏
      const ch = SG.shop.fx('tipChance');
      if (ch > 0 && Math.random() < ch) tip = Math.max(1, Math.round(D.price * rate * E.luckyTipRate));
    }
    led().sales += price; led().tips += tip; led().foodServed += costOf(type);
    return { price, tip };
  }
  // 倒掉一份做好的寿司（或炙烧烧焦、海苔撕破）：付整份成本
  function waste(type) {
    if (!on()) return 0;
    const c = costOf(type); led().foodWaste += c; return c;
  }
  // 捏饭团失败：饭倒掉
  function riceFail() {
    if (!on()) return 0;
    const c = Math.round(E.riceFailCost * costK());
    led().foodWaste += c; return c;
  }
  // 鱼片没放上掉了：付该鱼片成本的一半
  function fishMiss(type) {
    if (!on()) return 0;
    const c = Math.round(costOf(type) * E.fishMissRate); led().foodWaste += c; return c;
  }
  // 剧情奖励：只在真记账的夜里算
  function extra(n) {
    if (!led().real) return 0;
    led().extra = (led().extra || 0) + n; return n;
  }

  // 打烊：算账，并按结果改存档。kind：'ok' 正常 | 'retry' 闭店回档 | 'gameover' 第三次闭店
  function close() {
    const l = led();
    if (!l.real) return null;
    const d = SG.save.data, L = G.level, idx = SG.LEVELS.indexOf(L);
    const rentFull = L.rent || 0;
    const rentCut = Math.round(rentFull * SG.shop.fx('rentCut'));   // 议价：房东少收一点
    const rent = rentFull - rentCut;
    const util = Math.round(rent * (L.utilityRate != null ? L.utilityRate : E.utilityRate));
    const food = l.foodServed + l.foodWaste, revenue = l.sales + l.tips, bonus = l.extra || 0;
    const profit = revenue + bonus - rent - util - food;
    const before = d.money, after = before + profit;
    // 闭店线按"原房租"算：议价只省账上的钱，不该让安全线变近
    const closeLine = -Math.round(rentFull * CFG.run.closeLineRentMult);
    const closed = after < closeLine;
    const r = {
      night: idx + 1, rent, rentFull, rentCut, util, sales: l.sales, tips: l.tips, revenue, extra: bonus,
      foodServed: l.foodServed, foodWaste: l.foodWaste, food, profit, costMult: costK(),
      before, after, closeLine, closed, kind: 'ok',
      tight: !closed && after <= closeLine * E.tightRatio,
      advanced: false, retriesLeft: CFG.run.retryMax - d.retries,
    };
    if (closed && d.retries < CFG.run.retryMax) {           // 澄姐圆场：资金退回夜初，这一夜重做
      r.kind = 'retry';
      d.retries++; d.money = d.nightStartMoney;
      r.retriesLeft = CFG.run.retryMax - d.retries; r.restoredTo = d.money;
    } else if (closed) {                                    // 重做次数用完又闭店：Game Over，回到第一夜
      r.kind = 'gameover';
      SG.save.restartRun();
    } else {                                                // 正常入账
      d.money = after;
      if (d.retries > 0) d.retries--;                       // 平安过一夜，澄姐帮你"续"回一次重做的机会
      r.retriesLeft = CFG.run.retryMax - d.retries;
      const next = Math.min(idx + 2, SG.LEVELS.length);     // 最后一夜之后 night 不再前进，继续按最后一夜营业
      r.advanced = next > d.night; d.night = Math.max(d.night, next);
      d.nightStartMoney = d.money;
    }
    r.nextNight = SG.save.data.night;
    SG.save.write();
    return r;
  }

  SG.econ = { begin, sale, waste, riceFail, fishMiss, extra, close, moneyMult, costMult: costK, active: on };
})(window.SG = window.SG || {});