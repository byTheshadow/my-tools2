// 玩法说明卡。新玩法上线后在这里加一页；art 对应 draw/title.js 里用 SG.registerHowtoArt 登记的小动画。
(function (SG) {
  SG.HOWTO = [
    { art: 'rice',  title: '捏饭团', text: '按住屏幕，白圈会慢慢缩小。缩进金色圈里就松手，饭团才捏得刚刚好。' },
    { art: 'fish',  title: '放鱼片', text: '点一下，传送带上最靠近中线的鱼片会落到饭团上。对准中线才算正中。' },
    { art: 'serve', title: '上菜',   text: '点那位点了这道寿司的客人。送错会断连击，不要的点右下角的桶倒掉。' },
  ];
})(window.SG = window.SG || {});
