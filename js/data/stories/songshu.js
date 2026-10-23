// 老渔夫·松叔：第 2 夜起登场的特殊客人。这个文件就是一个完整的"客人包"：
// 登场条件、新食材（鳗鱼）、新菜式（炙烧做法）、剧情、头像、配饰、鱼片花纹，都在这里。
// 加一位新客人 = 复制这个文件改内容，再在 index.html 加一行；详见 docs/STORY.md。
//
// 剧情脚本节点（每个节点是一个对象，按出现的键决定类型）：
//   { say: '台词', who: 'chef' }        说话；who 不写就是这位客人，'chef' 是澄姐
//   { choice: [{ text, then:[节点], affinity, flag }] }   选项
//   { act: 'reel', n: 14 }              互动小游戏（js/interacts/）
//   { give: { money: 120 } }            发奖励：money 剧情奖励 / deco 装饰 / dish 直接解锁菜式
//   { flag: '名字' }                    设置全局剧情标记
//   { affinity: 1 }                     好感度 +1
//   { order: 'anago' }                  对话结束，客人点这道菜；做完才算章节完成、菜式解锁
(function (SG) {
  SG.registerStory({
    id: 'songshu',
    name: '松叔',
    when: { night: [2, 99] },
    stay: 20,            // 头顶 ✦ 没人点，坐这么多秒就安静离开（不扣连击不扣钱，下次条件还满足就再来）
    patience: 45,        // 点了专属菜之后愿意等多久；等不到也是安静离开
    look: { skin: '#d9a67a', hair: '#cfd3d6', shirt: '#2f5f7a', acc: 'strawhat' },

    ingredients: {
      anago: { name: '鳗鱼', base: '#8a5a3a', stripe: '#e0a868', dark: '#4e2f1f', pattern: 'grill' },
    },
    dishes: {
      anago: { method: 'aburi', cost: 38, price: 100 },     // 炙烧做法在 data/methods.js，步骤在 steps/torch.js
    },

    chapters: [
      {
        id: 'c1',
        script: [
          { say: '（摘下斗笠，在门口抖了抖雪）这个点还亮着灯的，整条巷子就你们一家。' },
          { say: '进来坐。外头风大，先暖暖手。', who: 'chef' },
          { say: '我每天凌晨三点出海，鱼，吃了四十年。' },
          { say: '可从没吃过一口，自己亲手捕上来的。卖的卖了，剩的喂了猫。' },
          { say: '今天这一网，我想留一条，做成寿司。能行吗？' },
          { choice: [
            { text: '当然。把网拉上来吧。', affinity: 1,
              then: [{ say: '好嘞！那就劳驾搭把手，网沉得很。' }] },
            { text: '松叔先说说，今天网里有什么？',
              then: [{ say: '嘿，我也不知道，网不拉上来，谁都不知道。来，搭把手！' }] },
          ] },
          { act: 'reel', n: 14 },
          { say: '……哟，好沉。今天这一网，值了。' },
          { say: '是鳗鱼。这个得用火炙一下，皮才香。', who: 'chef' },
          { say: '那就拜托了。我等着。' },
          { order: 'anago' },
        ],
      },
      {
        id: 'c2',
        when: { chapterDone: 'c1' },
        script: [
          { say: '又来叨扰了。今天的网，轻了些。' },
          { say: '松叔，今晚还是鳗鱼？', who: 'chef' },
          { say: '嗯。我老伴在的时候，最爱这一口。' },
          { say: '她走了三年了。船上少个人念叨，我到现在还不太习惯。' },
          { choice: [
            { text: '她一定还惦记着您的鳗鱼。', affinity: 1,
              then: [{ say: '（笑）这话我爱听。她那张嘴，是比我还馋。' }] },
            { text: '那今晚，就替她多吃一贯吧。', affinity: 1,
              then: [{ say: '好。……好。那我替她，多吃一贯。' }] },
            { text: '（默默给松叔添了热茶）',
              then: [{ say: '……谢了。这茶，暖。' }] },
          ] },
          { give: { money: 120 } },
          { say: '鱼钱，别推。这是老伴留下的规矩：吃了人家的，就得放点什么。' },
          { give: { deco: 'fishbasket', name: '松叔的旧鱼篓' } },
          { say: '这只旧鱼篓，放门口吧。老渔夫的东西，招福。' },
          { flag: 'songshu_c2' },
        ],
      },
    ],
  });

  // 鱼片花纹：炙烧的斜纹 + 酱汁高光。别的炙烧类食材也可以直接用 pattern: 'grill'
  SG.registerSlicePattern('grill', function (x0, y0, w, h, f) {
    const R = SG.px.R;
    R(x0 + 2, y0, w - 4, 1, f.stripe);
    for (let i = 4; i < w - 3; i += 6) for (let r = 1; r < h - 1; r++) R(x0 + i + (r >> 1), y0 + r, 1, 1, f.dark);
  });

  // 场景里的草帽
  SG.registerAccessory('strawhat', function (x, y) {
    const R = SG.px.R, O = '#2a1e18';
    R(x - 12, y - 32, 24, 3, O); R(x - 11, y - 33, 22, 2, '#e3c277');
    R(x - 7, y - 38, 14, 6, O); R(x - 6, y - 37, 12, 5, '#e3c277'); R(x - 6, y - 34, 12, 1, '#b8934a');
  });

  // 对话框里的头像（34×38 的框，背景由对话框画好）
  SG.registerPortrait('songshu', function (x, y) {
    const R = SG.px.R, O = '#2a1e18', t = SG.G.t;
    const cx = x + 17, cy = y + 20 + (Math.sin(t * 1.6) > .6 ? 1 : 0);
    R(cx - 13, cy + 9, 26, 9, O); R(cx - 12, cy + 10, 24, 8, '#2f5f7a'); R(cx - 12, cy + 10, 24, 1, '#4a82a0');
    R(cx - 6, cy + 9, 12, 3, '#e8dcc0');                                   // 脖子上的毛巾
    R(cx - 8, cy - 9, 16, 18, O); R(cx - 7, cy - 8, 14, 16, '#d9a67a');    // 脸
    R(cx - 7, cy + 2, 14, 2, '#cfd3d6'); R(cx - 6, cy + 4, 12, 3, '#cfd3d6'); R(cx - 3, cy + 6, 6, 1, O);   // 胡茬 + 嘴
    R(cx - 14, cy - 10, 28, 3, O); R(cx - 13, cy - 11, 26, 2, '#e3c277');  // 草帽檐
    R(cx - 8, cy - 18, 16, 8, O); R(cx - 7, cy - 17, 14, 7, '#e3c277'); R(cx - 7, cy - 13, 14, 1, '#b8934a');
    const blink = (t % 4.6) < .12, ey = cy - 3;
    R(cx - 6, ey - 2, 3, 1, '#9a9ea2'); R(cx + 3, ey - 2, 3, 1, '#9a9ea2');   // 灰眉
    if (blink) { R(cx - 5, ey + 1, 2, 1, O); R(cx + 3, ey + 1, 2, 1, O); }
    else { R(cx - 5, ey, 2, 2, O); R(cx + 3, ey, 2, 2, O); }
    R(cx - 7, ey + 4, 2, 1, '#e59a92'); R(cx + 5, ey + 4, 2, 1, '#e59a92');
  });
})(window.SG = window.SG || {});