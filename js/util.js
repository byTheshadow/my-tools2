(function (SG) {
  SG.rnd = (a, b) => a + Math.random() * (b - a);
  SG.pick = arr => arr[Math.random() * arr.length | 0];
})(window.SG = window.SG || {});
