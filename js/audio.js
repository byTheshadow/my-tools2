// 全部音效用 WebAudio 合成，没有外部音频文件。
(function (SG) {
  const G = SG.G;
  let AC = null, pressOsc = null, pressGain = null;

  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function beep(f, d, type = 'square', vol = 0.07, slide = 0, delay = 0) {
    const a = ac(); if (!a || G.muted) return;
    const tt = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, tt);
    if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), tt + d);
    g.gain.setValueAtTime(vol, tt); g.gain.exponentialRampToValueAtTime(0.0001, tt + d);
    o.connect(g).connect(a.destination); o.start(tt); o.stop(tt + d + 0.02);
  }
  function noise(d = 0.15, vol = 0.08) {
    const a = ac(); if (!a || G.muted) return;
    const n = a.sampleRate * d | 0, b = a.createBuffer(1, n, a.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = vol;
    s.connect(g).connect(a.destination); s.start();
  }

  SG.audioInit = ac;
  SG.beep = beep;
  SG.noise = noise;
  SG.buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  SG.sfx = {
    perfect() { beep(880, .08); beep(1320, .14, 'square', .06, 0, .07); },
    good()    { beep(660, .1); },
    fail()    { noise(.18, .1); beep(170, .22, 'sawtooth', .05, -90); },
    drop()    { beep(240, .07, 'square', .08, -130); },
    coin()    { beep(988, .06); beep(1319, .16, 'square', .06, 0, .06); },
    wow()     { [784, 988, 1175, 1568].forEach((f, i) => beep(f, .1, 'square', .06, 0, i * .06)); },
    wrong()   { beep(220, .1); beep(150, .18, 'square', .07, 0, .1); },
    tick()    { beep(1600, .025, 'square', .035); },
    unlock()  { [784, 1047, 1319].forEach((f, i) => beep(f, .1, 'square', .05, 0, i * .08)); },
  };

  // 按住捏饭团时的"沙沙"声，音调随压力升高
  SG.pressSound = {
    start() {
      const a = ac(); if (!a || G.muted) return;
      pressOsc = a.createOscillator(); pressGain = a.createGain();
      pressOsc.type = 'triangle'; pressOsc.frequency.value = 180; pressGain.gain.value = 0.05;
      pressOsc.connect(pressGain).connect(a.destination); pressOsc.start();
    },
    set(p) { if (pressOsc) pressOsc.frequency.setTargetAtTime(180 + p * 520, AC.currentTime, 0.02); },
    stop() {
      if (!pressOsc) return;
      try { pressGain.gain.setTargetAtTime(0, AC.currentTime, 0.02); pressOsc.stop(AC.currentTime + 0.1); } catch (e) {}
      pressOsc = null;
    },
  };
})(window.SG = window.SG || {});
