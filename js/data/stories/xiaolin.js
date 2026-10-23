// 加班的上班族·小林健太：单夜上菜 ≥ 10 份时登场（第 4 夜起）。一个完整的"客人包"，格式和 songshu.js 一样。
// 首章：他连续加班十七天，推门进来累得说不出话。三个选项只影响好感度和台词；
//       之后他点专属菜"鲑鱼籽军舰卷"，做成功才算章节完成、菜式解锁。
// 新玩法：军舰卷 = 围海苔（js/steps/wrap.js），做法 gunkan 登记在 data/methods.js。
// 好感度（rec.affinity）现在只写进存档，还没有地方用；二章（辞职 / 回来 / 带同事来）和好感度加成留到以后补。
(function (SG) {
  SG.registerStory({
    id: 'xiaolin',
    name: '小林健太',
    when: { night: [4, 99], stat: { served: 10 } },
    stay: 20,            // 头顶 ✦ 没人点，坐这么多秒就安静离开
    patience: 45,        // 点了专属菜之后愿意等多久
    look: { skin: '#f3cfae', hair: '#2a2230', shirt: '#9aa3b5', acc: 'tie' },

    ingredients: {
      // gunkan: true = 画寿司时围一圈海苔（draw/sprites.js）；菜式 id 要和食材 id 一致
      ikura: { name: '鲑鱼籽军舰', base: '#e8662a', stripe: '#ffb25c', dark: '#a83a18', pattern: 'roe', gunkan: true },
    },
    dishes: {
      ikura: { method: 'gunkan', cost: 36, price: 95 },     // 做法在 data/methods.js，围海苔步骤在 steps/wrap.js
    },

    chapters: [
      {
        id: 'c1',
        script: [
          { say: '（推开门，领带已经松到了胸口）……请问，还营业吗？' },
          { say: '营业着呢。进来坐，外头冷。', who: 'chef' },
          { say: '谢谢。我路过，看见灯还亮着，腿就自己拐进来了。' },
          { say: '今天是连续加班的……第十七天？十八天？我数不清了。' },
          { say: '你先说的是十七。数得清的，只是不想数了吧。', who: 'chef' },
          { say: '（愣了一下，苦笑）……可能吧。' },
          { choice: [
            { text: '（递上热毛巾）先擦把脸。', affinity: 2,
              then: [
                { say: '……热的。（把毛巾敷在脸上，很久没有动）' },
                { say: '原来热毛巾是这种感觉。谢谢。' },
              ] },
            { text: '今晚想吃点什么？', affinity: 1,
              then: [{ say: '什么都行……不，我想吃点有嚼劲的。让我觉得自己还醒着的那种。' }] },
            { text: '先坐，我给您推荐一道。',
              then: [{ say: '（松了口气）你直接定，我反而轻松。我今天已经做了太多决定了。' }] },
          ] },
          { say: '我想吃个……一口就能吃完，又不用动脑子的东西。' },
          { say: '那就是军舰卷了。海苔围一圈，上面堆满鲑鱼籽，一口一个。', who: 'chef' },
          { say: '你坐着别动，我来。', who: 'chef' },
          { say: '……交给你了。我先闭会儿眼，就一小会儿。' },
          { order: 'ikura' },
        ],
      },
    ],
  });

  // 鱼籽花纹：错行排开的小圆珠，每颗左上一点高光、右下一点暗边。别的籽类食材也可以直接用 pattern: 'roe'
  SG.registerSlicePattern('roe', function (x0, y0, w, h, f) {
    const R = SG.px.R;
    for (let r = 0, j = 0; r < h - 1; r += 2, j++) {
      for (let i = (j % 2) * 2 + 1; i < w - 2; i += 4) {
        R(x0 + i, y0 + r, 2, 2, f.stripe);
        R(x0 + i + 1, y0 + r + 1, 1, 1, f.dark);
        R(x0 + i, y0 + r, 1, 1, '#fff3c4');
      }
    }
  });

  // 场景里的配饰：松垮的领带 + 头顶翘起的一撮呆毛。y 是客人身体的底线，领口在 y-15
  SG.registerAccessory('tie', function (x, y, s) {
    const R = SG.px.R, O = '#2a1e18';
    R(x - 2, y - 14, 5, 3, O); R(x - 1, y - 14, 3, 2, '#c8433a');                  // 领结（松的）
    R(x - 2, y - 11, 5, 8, O); R(x - 1, y - 11, 3, 7, '#a5302a'); R(x - 1, y - 11, 1, 7, '#c8433a');   // 领带身
    R(x - 1, y - 4, 3, 1, O);
    const T = [[3, -37], [2, -36], [1, -35], [0, -34]];                              // 呆毛：往右斜的一缕细发梢
    for (const [dx, dy] of T) R(x + dx - 1, y + dy, 4, 1, O);
    for (const [dx, dy] of T) R(x + dx, y + dy, 2, 1, s.hair || '#2a2230');
  });

  // 对话框里的头像（34×38 的框，背景由对话框画好）：眼皮沉重，偶尔慢慢往下沉一格，像快睡着了
  SG.registerPortrait('xiaolin', function (x, y) {
    const R = SG.px.R, O = '#2a1e18', t = SG.G.t, HAIR = '#2a2230';
    const cx = x + 17, cy = y + 20 + (Math.sin(t * 1.2) > .7 ? 1 : 0);
    // 衬衫 + 领口 + 领带
    R(cx - 13, cy + 9, 26, 9, O); R(cx - 12, cy + 10, 24, 8, '#9aa3b5'); R(cx - 12, cy + 10, 24, 1, '#b9c1d0');
    R(cx - 5, cy + 9, 10, 3, '#f2e6d0');
    R(cx - 2, cy + 11, 5, 7, O); R(cx - 1, cy + 11, 3, 6, '#a5302a'); R(cx - 1, cy + 11, 1, 6, '#c8433a');
    // 脸
    R(cx - 8, cy - 9, 16, 18, O); R(cx - 7, cy - 8, 14, 16, '#f3cfae');
    // 头发：乱，额前一缕，头顶一撮呆毛
    R(cx - 9, cy - 14, 18, 7, O); R(cx - 8, cy - 13, 16, 6, HAIR);
    R(cx - 9, cy - 8, 3, 5, O); R(cx - 8, cy - 8, 2, 4, HAIR); R(cx + 6, cy - 8, 3, 5, O); R(cx + 6, cy - 8, 2, 4, HAIR);
    R(cx - 3, cy - 8, 6, 2, HAIR); R(cx - 1, cy - 6, 2, 1, HAIR);
    const T = [[4, -19], [3, -18], [2, -17], [1, -16], [0, -15]];                  // 呆毛：往右斜的一缕细发梢
    for (const [dx, dy] of T) R(cx + dx - 1, cy + dy, 4, 1, O);
    for (const [dx, dy] of T) R(cx + dx, cy + dy, 2, 1, HAIR);
    // 眼睛：眼皮压得很低，黑眼圈
    const blink = (t % 5.2) < .15, ey = cy - 2;
    R(cx - 6, ey - 4, 3, 1, HAIR); R(cx + 3, ey - 3, 3, 1, HAIR);                 // 耷拉的眉
    R(cx - 6, ey - 1, 4, 1, O); R(cx + 2, ey - 1, 4, 1, O);                        // 沉重的眼皮
    if (!blink) { R(cx - 5, ey, 2, 1, O); R(cx + 3, ey, 2, 1, O); }
    R(cx - 6, ey + 2, 4, 1, '#b79aa8'); R(cx + 2, ey + 2, 4, 1, '#b79aa8');        // 黑眼圈
    R(cx - 7, ey + 5, 2, 1, '#e59a92'); R(cx + 5, ey + 5, 2, 1, '#e59a92');
    R(cx - 2, cy + 5, 4, 1, '#8a4a44');                                             // 抿着的嘴
  });
})(window.SG = window.SG || {});