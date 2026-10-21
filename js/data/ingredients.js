// 食材（鱼片）定义。新增食材：在这里加一项即可。
//   name     显示名
//   base / stripe / dark   主色 / 高光色 / 底部阴影色
//   pattern  花纹类型，对应 draw/sprites.js 里的 SLICE_PATTERNS（marble | egg | shrimp）
//   nori     true 则在寿司上加一条海苔带
(function (SG) {
  SG.INGREDIENTS = {
    salmon: { name: '三文鱼', base: '#f28c5b', stripe: '#ffd9c2', dark: '#c9653a', pattern: 'marble' },
    tuna:   { name: '金枪鱼', base: '#c9334d', stripe: '#e8667b', dark: '#8f1f33', pattern: 'marble' },
    egg:    { name: '玉子',   base: '#f7cd4a', stripe: '#fbe49a', dark: '#d19d1d', pattern: 'egg', nori: true },
    shrimp: { name: '甜虾',   base: '#f5855a', stripe: '#fff1e6', dark: '#d0502c', pattern: 'shrimp' },
  };
})(window.SG = window.SG || {});
