// 画布初始化、整数倍缩放、屏幕坐标 → 逻辑坐标。
(function (SG) {
  const { W, H } = SG.CFG;
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const wrap = document.getElementById('wrap');
  cv.width = W; cv.height = H;
  SG.cv = cv; SG.ctx = ctx; SG.wrap = wrap; SG.S = 2;

  function resize() {
    let s = Math.min(innerWidth / W, innerHeight / H);
    s = s >= 1 ? Math.floor(s) : s;   // 能整数倍就整数倍，像素才不糊
    SG.S = s;
    cv.style.width = W * s + 'px';
    cv.style.height = H * s + 'px';
    wrap.style.setProperty('--s', s);
  }
  addEventListener('resize', resize);
  resize();

  SG.toLogical = e => {
    const r = cv.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
  };
})(window.SG = window.SG || {});
