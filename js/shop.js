// 店铺升级：查等级、查效果、买。数据在 data/upgrades.js，界面在 ui-shop.js，装饰画法在 draw/deco.js。
//   SG.shop.level(id)      已买到第几档（0 = 没买）
//   SG.shop.fx(key)        这一项效果的当前合计值（没有就是 0）
//   SG.shop.seatCount()    当前座位数（3 ~ 5）
//   SG.shop.seatXs(n)      座位的 x 坐标表
//   SG.shop.buy(id)        买下一档；成功返回这一档的定义，失败返回 null
// 存档：save.data.upgrades 是一个字符串数组，买一档就推一个 id（同名重复 = 多档），不需要升存档版本。
(function (SG) {
  const CFG = SG.CFG;
  const defs = {};
  for (const u of SG.UPGRADES) defs[u.id] = u;

  const list = () => (SG.save.data.upgrades || (SG.save.data.upgrades = []));
  const maxLevel = id => (defs[id] ? defs[id].tiers.length : 0);

  function level(id) {
    const arr = list();
    let n = 0;
    for (const x of arr) if (x === id) n++;
    // 兼容：剧情给的装饰如果没带 deco_ 前缀，也认
    if (!n && id.indexOf('deco_') === 0) { const bare = id.slice(5); for (const x of arr) if (x === bare) n++; }
    return Math.min(n, maxLevel(id));
  }

  // 当前档位的效果值合计（一般只有一项升级提供某个 key）
  function fx(key) {
    let v = 0;
    for (const u of SG.UPGRADES) {
      const lv = level(u.id);
      if (!lv) continue;
      const f = u.tiers[lv - 1].fx;
      if (f && f[key] != null) v += f[key];
    }
    return v;
  }

  const seatCount = () => Math.max(3, Math.min(5, 3 + fx('seatsAdd')));
  const seatXs = n => (CFG.seatsBy[n || seatCount()] || CFG.seatsBy[3]).slice();

  const nextTier = id => { const u = defs[id]; if (!u) return null; const lv = level(id); return lv < u.tiers.length ? u.tiers[lv] : null; };

  // 买下一档。只在不营业的时候能买；钱不够、满级、剧情赠品都买不了。
  function buy(id) {
    const u = defs[id];
    if (!u || u.from === 'story') return null;
    if (SG.G.mode === 'play') return null;
    const t = nextTier(id);
    if (!t) return null;
    const d = SG.save.data;
    if (d.money < t.price) return null;
    d.money -= t.price;
    // 夜初资金也要跟着降，否则"打烊后买东西 → 下一夜闭店回档"等于白送
    if (d.nightStartMoney > d.money) d.nightStartMoney = d.money;
    list().push(id);
    SG.save.write();
    return t;
  }

  SG.shop = { def: id => defs[id], level, maxLevel, fx, nextTier, buy, seatCount, seatXs, has: id => level(id) > 0 };
})(window.SG = window.SG || {});