// 做法 = 步骤的有序列表。步骤模块在 js/steps/*.js 里，用 SG.registerStep 登记。
// 新增做法：在这里写一行，再在 data/dishes.js 的菜式里用 method 引用。
// 做法可以在放完鱼片后"换轨"：菜式的 method 若不同，会换成该做法的步骤表，
// 但新步骤表里必须包含已经走过的步骤（比如都以 rice、fish 开头）。
(function (SG) {
  SG.registerMethod('nigiri', { name: '握寿司', steps: ['rice', 'fish', 'serve'] });
  // 之后：SG.registerMethod('aburi', { name: '炙烧', steps: ['rice', 'fish', 'torch', 'serve'] });
})(window.SG = window.SG || {});
