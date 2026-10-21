// DOM 界面：顶栏数值、操作提示、标题页、结算页、静音按钮。
(function (SG) {
  const G = SG.G;
  const $ = id => document.getElementById(id);
  const hud = { score: $('score'), combo: $('combo'), time: $('time') };
  const hintEl = $('hint'), ov = $('ov'), panel = $('panel'), muteBtn = $('mute');

  function setHint() {
    hintEl.textContent = G.phase === 'rice' ? '按住 捏饭团，金圈处松手'
      : G.phase === 'fish' || G.phase === 'drop' ? '点一下 放鱼片，对准中线'
      : '点客人上菜，不要的点右下角倒掉';
  }
  function updateHud() {
    hud.score.textContent = '★ ' + G.score;
    hud.combo.textContent = G.combo > 0 ? `连击 ${G.combo}  ×${SG.game.comboMult().toFixed(1)}` : '';
    hud.time.textContent = '⏱ ' + Math.ceil(G.timeLeft);
  }
  const hideOverlay = () => ov.classList.add('hide');

  // 把面板里带 data-level 的按钮绑定为"开始该关卡"
  function bindButtons() {
    panel.querySelectorAll('[data-level]').forEach(b => {
      b.addEventListener('pointerdown', e => e.stopPropagation());
      b.addEventListener('click', () => SG.game.start(SG.LEVELS[+b.dataset.level]));
    });
    const menu = $('menu');
    if (menu) {
      menu.addEventListener('pointerdown', e => e.stopPropagation());
      menu.addEventListener('click', showTitle);
    }
  }

  function showTitle() {
    G.mode = 'title';
    const many = SG.LEVELS.length > 1;
    const buttons = many
      ? `<div class="levels">${SG.LEVELS.map((l, i) => `<button class="btn" data-level="${i}">${l.name}</button>`).join('')}</div>`
      : `<button class="btn" data-level="0">开店</button>`;
    panel.innerHTML = `<div class="title">捏寿司</div>
      <div class="sub">${many ? '选择关卡' : `像素寿司屋 · 营业 ${SG.LEVELS[0].duration} 秒`}</div>
      <div class="steps">
        <div><b>1</b>按住捏饭团，圈缩到金色时松手</div>
        <div><b>2</b>点一下放鱼片，对准中线</div>
        <div><b>3</b>点点了这道寿司的客人上菜</div>
      </div><br>
      ${buttons}
      <div class="keys">电脑：空格 捏/放 · 1 2 3 上菜 · X 倒掉</div>`;
    ov.classList.remove('hide');
    bindButtons();
  }

  function showOver(isBest) {
    const L = G.level;
    let rank = L.ranks[0].name;
    for (const r of L.ranks) if (G.score >= r.min) rank = r.name;
    const idx = SG.LEVELS.indexOf(L);
    panel.innerHTML = `<div class="title" style="font-size:calc(var(--s)*16px)">打烊啦</div>
      <div class="big" style="margin-top:calc(var(--s)*10px)">${G.score}</div>
      <div class="rank">${isBest && G.score > 0 ? '新纪录！' : ''}称号：${rank}</div>
      <div class="stats">上菜 ${G.served} 份 / 完美寿司 ${G.perfectSushi} 份<br>最高连击 ${G.maxCombo}</div>
      <div class="levels">
        <button class="btn" data-level="${idx}">再开一次店</button>
        ${SG.LEVELS.length > 1 ? '<button class="btn" id="menu">选关</button>' : ''}
      </div>
      <div class="best">最高分 ${G.best}</div>`;
    ov.classList.remove('hide');
    bindButtons();
  }

  muteBtn.addEventListener('pointerdown', e => e.stopPropagation());
  muteBtn.addEventListener('click', () => {
    G.muted = !G.muted;
    muteBtn.textContent = G.muted ? '×' : '♪';
    if (G.muted) SG.pressSound.stop();
  });

  SG.ui = { setHint, updateHud, hideOverlay, showTitle, showOver };
})(window.SG = window.SG || {});
