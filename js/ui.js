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
  // 夜数以存档里的 night 为准（打烊没闭店才会往前走）；闭店回档不会让夜数前进
  const clearedCount = () => Math.max(0, sv().night - 1);
  const isOpen = i => i < sv().night;
  const currentIndex = () => Math.min(Math.max(sv().night, 1), SG.LEVELS.length) - 1;
  const fmt = n => (n < 0 ? '−' : '') + '¥' + Math.abs(Math.round(n)).toLocaleString('en-US');
  const sgn = n => (n < 0 ? '−' : '+') + Math.abs(Math.round(n)).toLocaleString('en-US');
  const absn = n => Math.abs(Math.round(n)).toLocaleString('en-US');
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
        <div class="foot">第 ${i + 1} 夜　资金 <span class="${sv().money < 0 ? 'neg' : ''}">${fmt(sv().money)}</span></div>
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
        const best = bestOf(L), cur = i === currentIndex();
        const em = cur ? `房租 ${fmt(L.rent || 0)}` : best ? `${best} 分 · 练习` : '练习';
        rows.push(`<button class="night${cur ? ' cur' : ''}" data-act="play" data-level="${i}"><b class="no">${i + 1}</b><span class="nm">${nightName(L)}</span>
          <span class="meta"><span class="stars">${starStr(starsOf(L, best))}</span><em>${em}</em></span></button>`);
      }
    }
    panel.innerHTML = `<div class="scr levels">
      <div class="lv-title">关　卡</div>
      <div class="lv-sub">已营业 ${clearedCount()} / ${CFG.run.totalNights} 夜　资金 ${fmt(sv().money)}　重做 ${Math.max(0, CFG.run.retryMax - sv().retries)} 次</div>
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

  // ---------- 结算页：账本 ----------
  let nextAct = null;                        // 结算页上按空格 = 主按钮
  const rankOf = L => { let n = L.ranks[0].name; for (const r of L.ranks) if (G.score >= r.min) n = r.name; return n; };

  const CLOSE_TALK = {
    retry: [
      '账先放一边。今晚就当没开过门，灯重新点上，我们再来一次。',
      '……还撑得住吗？我替你圆到这里了，这是最后一次，这回稳着点做。',
    ],
    gameover: '这间店，今晚是真的撑不住了。别难过，手艺和故事都还在，我们从头再来。',
  };

  function ledgerRows(r) {
    const out = [];
    const add = (label, val, cls = '', sub = false) => out.push({ label, val, cls, sub });
    add('营业额', sgn(r.revenue), 'pos');
    if (r.tips > 0) add('含打赏', sgn(r.tips), 'pos', true);
    add('房租', sgn(-r.rent), 'neg');
    add('水电', sgn(-r.util), 'neg');
    add('食材', sgn(-r.food), 'neg');
    if (r.foodWaste > 0) add('含倒掉、做坏', sgn(-r.foodWaste), 'neg', true);
    return out;
  }

  function showLedger(isBest, r) {
    const L = G.level, closed = r.kind !== 'ok';
    const head = r.kind === 'retry' ? '今晚店撑不住了……' : r.kind === 'gameover' ? '歇业了……' : '打烊啦';
    const stamp = r.kind === 'retry' ? ['闭店', 'bad'] : r.kind === 'gameover' ? ['歇业', 'bad'] : r.profit >= 0 ? ['盈', 'good'] : ['亏', 'bad'];
    const rows = ledgerRows(r);
    let k = 0;
    const d = () => `style="--d:${(.25 + (k++) * .17).toFixed(2)}s"`;
    const rowsHtml = rows.map(x => `<div class="rw${x.sub ? ' inc' : ''}" ${d()}><span>${x.label}</span><i></i><b class="${x.cls}">${x.val}</b></div>`).join('');
    const profitHtml = `<div class="rule"></div>
      <div class="rw total" ${d()}><span>今夜盈利</span><i></i><b class="${r.profit >= 0 ? 'pos' : 'neg'}">${sgn(r.profit)}</b><!--S--></div>`;
    const balLabel = closed ? '资金将是' : '累计资金';
    const balVal = closed ? r.after : r.after;
    const balHtml = `<div class="rw bal" ${d()}><span>${balLabel}</span><i></i><b class="${balVal < 0 ? 'neg' : ''}">${fmt(balVal)}</b></div>`;
    const lineHtml = (closed || r.tight) ? `<div class="rw inc" ${d()}><span>闭店线</span><i></i><b class="neg">${fmt(r.closeLine)}</b></div>` : '';
    const tightHtml = r.tight ? `<div class="lg-tight" ${d()}>账本有点紧了……</div>` : '';
    const stampHtml = `<div class="stamp ${stamp[1]}${stamp[0].length > 1 ? ' two' : ''}" style="--d:${(.25 + (k + 1) * .17 + .15).toFixed(2)}s">${stamp[0]}</div>`;

    let foot;
    if (r.kind === 'retry') {
      const left = r.retriesLeft;
      foot = `<div class="says">「${CLOSE_TALK.retry[Math.min(CFG.run.retryMax - left, CLOSE_TALK.retry.length) - 1]}」<br><span class="who">——澄姐</span></div>
        <div class="lg-note">资金回到 ${fmt(r.restoredTo)}，重做第 ${r.night} 夜<br>${left > 0 ? `还能重做 ${left} 次` : '重做的机会用完了'}</div>`;
    } else if (r.kind === 'gameover') {
      foot = `<div class="says">「${CLOSE_TALK.gameover}」<br><span class="who">——澄姐</span></div>
        <div class="lg-note">回到第一夜，资金归零<br>图鉴、剧情、升级、最高分都留着</div>`;
    } else {
      foot = `<div class="stats">上菜 ${G.served} 份 / 完美寿司 ${G.perfectSushi} 份 / 最高连击 ${G.maxCombo}</div>`;
    }
    const btn = r.kind === 'retry' ? `重做第 ${r.night} 夜` : r.kind === 'gameover' ? '重新开张'
      : r.advanced ? `继续第 ${r.nextNight} 夜` : '再营业一夜';
    nextAct = startCurrent;

    panel.className = 'panel';
    ov.classList.remove('hide', 'clear');
    panel.innerHTML = `<div class="lg">
      <div class="lg-head${closed ? ' bad' : ''}">${head}</div>
      ${closed ? '' : `<div class="lg-score">★ ${G.score}　${rankOf(L)}${isBest && G.score > 0 ? '　新纪录！' : ''}</div>`}
      <div class="paper${closed ? ' shut' : ''}">
        <div class="paper-top"><span>第 ${r.night} 夜 · 账本</span><span>深夜寿司屋</span></div>
        ${rowsHtml}${profitHtml.replace('<!--S-->', stampHtml)}${balHtml}${lineHtml}${tightHtml}
      </div>
      ${foot}
      <div class="levels">
        <button class="btn" data-act="start">${btn}</button>
        <span class="link" data-act="back">回到首页</span>
      </div>
    </div>`;
  }

  // 练习夜（回头重玩已通关的夜）：沿用简单结算，不入账
  function showPractice(isBest) {
    const L = G.level, idx = SG.LEVELS.indexOf(L);
    nextAct = () => SG.game.start(L);
    panel.className = 'panel';
    ov.classList.remove('hide', 'clear');
    panel.innerHTML = `<div class="title" style="font-size:calc(var(--s)*16px)">打烊啦</div>
      <div class="big" style="margin-top:calc(var(--s)*10px)">${G.score}</div>
      <div class="rank">${isBest && G.score > 0 ? '新纪录！' : ''}称号：${rankOf(L)}</div>
      <div class="stats">上菜 ${G.served} 份 / 完美寿司 ${G.perfectSushi} 份<br>最高连击 ${G.maxCombo}<br>练习营业，这一夜不入账</div>
      <div class="levels">
        <button class="btn" data-act="play" data-level="${idx}">再练一次</button>
        <button class="btn ghost" data-act="back">回到首页</button>
      </div>
      <div class="best">最高分 ${G.best}</div>`;
  }

  function showOver(isBest, r) { r ? showLedger(isBest, r) : showPractice(isBest); }

  // 教学夜结算：不报分数，只有澄姐一句话
  function showTutorialOver() {
    nextAct = startCurrent;
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

  SG.ui = { setHint, setTalk, setTask, updateHud, hideOverlay, showTitle, showOver, showTutorialOver, startCurrent, overDefault: () => nextAct && nextAct() };
})(window.SG = window.SG || {});