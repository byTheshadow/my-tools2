// DOM 界面：顶栏数值、操作提示、开屏（序章 / 首页 / 玩法说明 / 选关）、结算页、静音按钮。
// 开屏的背景是 draw/title.js 画的夜景；这里只负责叠在上面的文字和按钮。
(function (SG) {
  const G = SG.G, CFG = SG.CFG;
  const $ = id => document.getElementById(id);
  const hud = { score: $('score'), combo: $('combo'), time: $('time') };
  const hintEl = $('hint'), ov = $('ov'), panel = $('panel'), muteBtn = $('mute');
  const talkEl = $('talk'), taskEl = $('task');
  const sv = () => SG.save.data;

  function setHint() {
    const st = SG.game.step();
    hintEl.textContent = st && st.hint ? st.hint : '';
  }
  // 澄姐的台词（对话框由 draw/dialog.js 画，文字用 DOM 才清楚）
  function setTalk(text) { talkEl.textContent = text || ''; talkEl.classList.toggle('on', !!text); SG.wrap.dataset.talk = text ? 'on' : ''; }
  // 左上角的小目标
  function setTask(text) { taskEl.textContent = text || ''; taskEl.classList.toggle('on', !!text); }

  function updateHud() {
    hud.score.textContent = '★ ' + G.score;
    hud.combo.textContent = G.combo > 0 ? `连击 ${G.combo}  ×${SG.game.comboMult().toFixed(1)}` : '';
    hud.time.textContent = SG.tutorial.active() && !SG.tutorial.allow.timer ? '教学' : '⏱ ' + Math.ceil(G.timeLeft);
  }
  const hideOverlay = () => ov.classList.add('hide');

  // ---------- 进度 ----------
  const bestOf = L => sv().bestByNight[L.id] || 0;
  const clearedCount = () => SG.LEVELS.filter(L => bestOf(L) > 0).length;
  const isOpen = i => i === 0 || bestOf(SG.LEVELS[i - 1]) > 0;
  // 下一个要营业的夜：第一个还没通关的；全通关了就是最后一夜
  function currentIndex() { let i = 0; while (i < SG.LEVELS.length - 1 && bestOf(SG.LEVELS[i]) > 0) i++; return i; }
  function starsOf(L, score) {
    if (!score) return 0;
    let idx = 0; L.ranks.forEach((r, i) => { if (score >= r.min) idx = i; });
    return Math.min(3, idx + 1);
  }
  const starStr = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  const nightName = L => L.name.replace(/^.*?·\s*/, '');

  // ---------- 开屏的各个页面 ----------
  function renderIntro() {
    panel.innerHTML = `<div class="scr intro" data-act="introDone">
      <div class="lore">${SG.LORE.map((s, i) => `<p style="animation-delay:${(i * 1.15).toFixed(2)}s">${s}</p>`).join('')}</div>
      <div class="tap" style="animation-delay:${(SG.LORE.length * 1.15 + .6).toFixed(2)}s">点一下，开始今夜的营业</div>
    </div>`;
  }

  function renderMain() {
    const i = currentIndex();
    panel.innerHTML = `<div class="scr main">
      <button class="pill" data-act="lore">序</button>
      <div class="logo-block">
        <div class="logo-over">— 捏 寿 司 —</div>
        <h1 class="logo">深夜寿司屋</h1>
        <div class="logo-kana">しんや　すしや</div>
        <div class="tagline" id="tag"></div>
      </div>
      <div class="menu">
        <button class="btn big pulse" data-act="start">开始营业</button>
        <div class="row">
          <button class="btn small ghost" data-act="howto">玩法说明</button>
          <button class="btn small ghost" data-act="levels">关　卡</button>
        </div>
        <div class="foot">第 ${i + 1} 夜　已营业 ${clearedCount()} / ${CFG.run.totalNights} 夜</div>
      </div>
    </div>`;
    const el = $('tag'); let n = 0;
    el.textContent = SG.LORE[0];
    el.addEventListener('animationiteration', () => { n = (n + 1) % SG.LORE.length; el.textContent = SG.LORE[n]; });
  }

  function renderHowto() {
    const pages = SG.HOWTO, p = pages[G.howPage], last = G.howPage === pages.length - 1;
    panel.innerHTML = `<div class="scr howto">
      <div class="how-text">
        <div class="how-title">${G.howPage + 1}　${p.title}</div>
        <div class="how-desc">${p.text}</div>
        <div class="dots">${pages.map((_, k) => `<i class="${k === G.howPage ? 'on' : ''}"></i>`).join('')}</div>
      </div>
      <div class="how-nav">
        <button class="btn small ghost" data-act="howPrev">${G.howPage ? '上一页' : '返回'}</button>
        <button class="btn small" data-act="howNext">${last ? '明白了' : '下一页'}</button>
      </div>
      <div class="keys how-keys">电脑：空格 捏/放 · 1 2 3 上菜 · X 倒掉</div>
    </div>`;
  }

  function renderLevels() {
    const T = SG.TUTORIAL_LEVEL;
    const rows = [`<button class="night tut" data-act="tutorial"><b class="no">教</b><span class="nm">${T.name.replace(' · ', '·')}</span>
      <span class="meta"><em>${sv().seenTutorial ? '可以重来一遍' : '建议先走一遍'}</em></span></button>`];
    for (let i = 0; i < CFG.run.totalNights; i++) {
      const L = SG.LEVELS[i];
      if (!L) {
        rows.push(`<div class="night locked"><b class="no">${i + 1}</b><span class="nm">？？？</span><span class="meta"><em>敬请期待</em></span></div>`);
      } else if (!isOpen(i)) {
        rows.push(`<div class="night locked"><b class="no">${i + 1}</b><span class="nm">${nightName(L)}</span><span class="meta"><em>通关上一夜解锁</em></span></div>`);
      } else {
        const best = bestOf(L);
        rows.push(`<button class="night" data-act="play" data-level="${i}"><b class="no">${i + 1}</b><span class="nm">${nightName(L)}</span>
          <span class="meta"><span class="stars">${starStr(starsOf(L, best))}</span><em>${best ? best + ' 分' : '未营业'}</em></span></button>`);
      }
    }
    panel.innerHTML = `<div class="scr levels">
      <div class="lv-title">关　卡</div>
      <div class="lv-sub">已营业 ${clearedCount()} / ${CFG.run.totalNights} 夜</div>
      <div class="nights">${rows.join('')}</div>
      <button class="btn small ghost lv-back" data-act="back">返回</button>
    </div>`;
  }

  const screens = { intro: renderIntro, main: renderMain, howto: renderHowto, levels: renderLevels };

  function setScreen(name) {
    G.mode = 'title'; G.screen = name;
    panel.className = 'panel full';
    ov.classList.remove('hide'); ov.classList.add('clear');
    screens[name]();
  }

  function showTitle() { setScreen(sv().seenIntro ? 'main' : 'intro'); }
  // 第一次开店先上教学夜
  const startCurrent = () => sv().seenTutorial ? SG.game.start(SG.LEVELS[currentIndex()]) : SG.game.start(SG.TUTORIAL_LEVEL);

  // ---------- 结算页 ----------
  function showOver(isBest) {
    const L = G.level;
    let rank = L.ranks[0].name;
    for (const r of L.ranks) if (G.score >= r.min) rank = r.name;
    const idx = SG.LEVELS.indexOf(L);
    panel.className = 'panel';
    ov.classList.remove('hide', 'clear');
    panel.innerHTML = `<div class="title" style="font-size:calc(var(--s)*16px)">打烊啦</div>
      <div class="big" style="margin-top:calc(var(--s)*10px)">${G.score}</div>
      <div class="rank">${isBest && G.score > 0 ? '新纪录！' : ''}称号：${rank}</div>
      <div class="stats">上菜 ${G.served} 份 / 完美寿司 ${G.perfectSushi} 份<br>最高连击 ${G.maxCombo}</div>
      <div class="levels">
        <button class="btn" data-act="play" data-level="${idx}">再开一次店</button>
        <button class="btn ghost" data-act="back">回到首页</button>
      </div>
      <div class="best">最高分 ${G.best}</div>`;
  }

  // 教学夜结算：不报分数，只有澄姐一句话
  function showTutorialOver() {
    panel.className = 'panel';
    ov.classList.remove('hide', 'clear');
    panel.innerHTML = `<div class="title" style="font-size:calc(var(--s)*16px)">打烊啦</div>
      <div class="rank" style="margin-top:calc(var(--s)*8px)">教学夜结束</div>
      <div class="says">「${SG.tutorial.endLine()}」<br><span class="who">——澄姐</span></div>
      <div class="stats">上菜 ${G.served} 份 / 完美寿司 ${G.perfectSushi} 份</div>
      <div class="levels">
        <button class="btn" data-act="start">开始第一夜</button>
        <button class="btn ghost" data-act="tutorial">再练一遍</button>
      </div>
      <div class="best"><span data-act="back" class="link">回到首页</span></div>`;
  }

  // ---------- 按钮：整个面板只绑一次事件（事件委托）----------
  const acts = {
    start: startCurrent,
    play: b => SG.game.start(SG.LEVELS[+b.dataset.level]),
    howto: () => { G.howPage = 0; setScreen('howto'); },
    levels: () => setScreen('levels'),
    back: () => setScreen('main'),
    tutorial: () => SG.game.start(SG.TUTORIAL_LEVEL),
    lore: () => setScreen('intro'),
    introDone: () => { if (!sv().seenIntro) { sv().seenIntro = true; SG.save.write(); } setScreen('main'); },
    howPrev: () => { if (G.howPage > 0) { G.howPage--; setScreen('howto'); } else setScreen('main'); },
    howNext: () => { if (G.howPage < SG.HOWTO.length - 1) { G.howPage++; setScreen('howto'); } else setScreen('main'); },
  };
  panel.addEventListener('pointerdown', e => e.stopPropagation());
  panel.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b || !acts[b.dataset.act]) return;
    SG.audioInit(); SG.beep(520, .05, 'square', .04);
    acts[b.dataset.act](b);
  });

  muteBtn.addEventListener('pointerdown', e => e.stopPropagation());
  muteBtn.addEventListener('click', () => {
    G.muted = !G.muted;
    muteBtn.textContent = G.muted ? '×' : '♪';
    if (G.muted) SG.pressSound.stop();
  });

  SG.ui = { setHint, setTalk, setTask, updateHud, hideOverlay, showTitle, showOver, showTutorialOver, startCurrent };
})(window.SG = window.SG || {});