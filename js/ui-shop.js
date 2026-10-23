// 小店（店铺升级商店）：一页 DOM 界面，挂在 ui.js 的开屏页面体系里。
// 数据在 data/upgrades.js，逻辑在 shop.js，样式在 css/shop.css。
(function (SG) {
  const panel = document.getElementById('panel');
  const fmt = SG.ui.fmt;
  const pips = (lv, max) => (max > 1 ? `<i class="pips">${'●'.repeat(lv)}${'○'.repeat(max - lv)}</i>` : '');

  function rowOf(u) {
    const lv = SG.shop.level(u.id), max = u.tiers.length;
    const nxt = SG.shop.nextTier(u.id);
    let note, price, cls = '', attr = '';
    if (u.from === 'story') {
      note = lv ? '已经摆上了' : u.desc;
      price = lv ? '✔' : '剧情';
      cls = lv ? ' own' : ' lock';
    } else if (!nxt) {
      note = u.deco ? '已经摆上了' : u.tiers[max - 1].note + '（满）';
      price = '✔';
      cls = ' own';
    } else {
      note = nxt.note;
      price = '¥' + nxt.price.toLocaleString('en-US');
      if (SG.save.data.money >= nxt.price) attr = ` data-act="buy" data-id="${u.id}"`;
      else cls = ' poor';
    }
    return `<div class="up${cls}"${attr}>
      <span class="nm">${u.name}${pips(lv, max)}</span>
      <span class="pr">${price}</span>
      <span class="ds">${note}</span>
    </div>`;
  }

  function render() {
    const groups = {};
    for (const u of SG.UPGRADES) (groups[u.cat] = groups[u.cat] || []).push(u);
    let html = '';
    for (const cat of SG.UPGRADE_CATS) {
      const arr = groups[cat];
      if (!arr) continue;
      html += `<div class="up-cat">${cat}</div>` + arr.map(rowOf).join('');
    }
    panel.innerHTML = `<div class="scr shop">
      <div class="lv-title">小　店</div>
      <div class="lv-sub">资金 ${fmt(SG.save.data.money)}　座位 ${SG.shop.seatCount()}</div>
      <div class="ups">${html}</div>
      <div class="up-tip">升级永久生效，闭店回档也不会退</div>
      <button class="btn small ghost lv-back" data-act="back">返回</button>
    </div>`;
  }

  SG.ui.addScreen('shop', render);
  SG.ui.addAct('shop', () => SG.ui.setScreen('shop'));
  SG.ui.addAct('buy', b => {
    const t = SG.shop.buy(b.dataset.id);
    if (t) { SG.beep(880, .09, 'square', .05); SG.beep(1320, .07, 'square', .04); }
    render();
  });
})(window.SG = window.SG || {});