// 店铺升级的全部数据。加一项升级 = 在这里加一条，商店页和效果查询会自动认。
//   id        存档里的 id（装饰用 deco_ 前缀）；买一档就往 save.data.upgrades 里推一个同名 id
//   cat       分类（顺序见 SG.UPGRADE_CATS）
//   tiers     每一档：price 价格、fx 这一档的效果（绝对值，不是增量）、note 一句话说明
//   deco      true = 纯外观，画法在 js/draw/deco.js
//   from      'story' = 剧情赠送，商店里只展示不卖
// 效果键（谁在读见注释）：
//   dropEase      鱼片判定放宽的像素   steps/fish.js
//   goldBonus     金圈半宽 +           game.js goldWidth()
//   beltMaxCut    传送带最高速 −       game.js beltSpeed()
//   patienceBonus 客人耐心 +(秒)       game.js patienceMax()
//   tipRateAdd    打赏比例 +           economy.js sale()
//   tipChance     普通寿司也打赏的概率  economy.js sale()
//   seatsAdd      座位 +               shop.js seatCount()
//   rentCut       房租减免比例          economy.js close()
(function (SG) {
  SG.UPGRADE_CATS = ['手艺', '设备', '服务', '扩建', '经营', '装饰'];

  SG.UPGRADES = [
    {
      id: 'whetstone', cat: '手艺', name: '磨刀石',
      desc: '刀口利了，鱼片落上去也更听话。',
      tiers: [
        { price: 180, fx: { dropEase: 1.0 }, note: '鱼片判定放宽 1px' },
        { price: 380, fx: { dropEase: 2.0 }, note: '鱼片判定放宽 2px' },
        { price: 760, fx: { dropEase: 3.5 }, note: '鱼片判定放宽 3.5px' },
      ],
    },
    {
      id: 'ricetub', cat: '手艺', name: '保温饭桶',
      desc: '米饭一直温着，手上有准头，金圈更宽。',
      tiers: [
        { price: 200, fx: { goldBonus: 0.6 }, note: '金圈加宽 0.6px' },
        { price: 420, fx: { goldBonus: 1.2 }, note: '金圈加宽 1.2px' },
        { price: 820, fx: { goldBonus: 2.0 }, note: '金圈加宽 2px' },
      ],
    },
    {
      id: 'slowbelt', cat: '设备', name: '慢速传送带',
      desc: '给老马达换一挡，传送带不会越跑越疯。',
      tiers: [
        { price: 240, fx: { beltMaxCut: 5 }, note: '最高速度 −5' },
        { price: 480, fx: { beltMaxCut: 10 }, note: '最高速度 −10' },
        { price: 900, fx: { beltMaxCut: 16 }, note: '最高速度 −16' },
      ],
    },
    {
      id: 'teaseat', cat: '服务', name: '竹编茶座',
      desc: '坐着舒服，热茶管够，客人愿意多等一会儿。',
      tiers: [
        { price: 220, fx: { patienceBonus: 2.0 }, note: '客人耐心 +2 秒' },
        { price: 460, fx: { patienceBonus: 4.0 }, note: '客人耐心 +4 秒' },
        { price: 880, fx: { patienceBonus: 6.5 }, note: '客人耐心 +6.5 秒' },
      ],
    },
    {
      id: 'luckycat', cat: '服务', name: '招财猫',
      desc: '门口那只一直在招手。打赏更大方，普通客人也可能留下零钱。',
      tiers: [
        { price: 260, fx: { tipRateAdd: 0.05, tipChance: 0.15 }, note: '打赏 +5%，15% 概率额外打赏' },
        { price: 540, fx: { tipRateAdd: 0.10, tipChance: 0.30 }, note: '打赏 +10%，30% 概率额外打赏' },
        { price: 1000, fx: { tipRateAdd: 0.18, tipChance: 0.45 }, note: '打赏 +18%，45% 概率额外打赏' },
      ],
    },
    {
      id: 'seat', cat: '扩建', name: '加座位',
      desc: '把里间的桌子挪出来，能同时招待更多客人。',
      tiers: [
        { price: 900, fx: { seatsAdd: 1 }, note: '3 座 → 4 座' },
        { price: 1800, fx: { seatsAdd: 2 }, note: '4 座 → 5 座' },
      ],
    },
    {
      id: 'bargain', cat: '经营', name: '议价',
      desc: '澄姐和房东是老交情，话说到了，房租能少收一点。',
      tiers: [
        { price: 500, fx: { rentCut: 0.08 }, note: '房租减免 8%' },
        { price: 1200, fx: { rentCut: 0.15 }, note: '房租减免 15%' },
      ],
    },

    // ---- 装饰：纯外观 ----
    {
      id: 'deco_plant', cat: '装饰', name: '角落的盆栽', deco: true,
      desc: '摆在柜台左边的地上。夜里看着不那么冷。',
      tiers: [{ price: 150, fx: {}, note: '摆上' }],
    },
    {
      id: 'deco_chime', cat: '装饰', name: '风铃', deco: true,
      desc: '挂在门边的墙上，风一过就响一声。',
      tiers: [{ price: 220, fx: {}, note: '挂上' }],
    },
    {
      id: 'deco_catbed', cat: '装饰', name: '猫窝', deco: true,
      desc: '给常来蹭饭的那只留的。偶尔真有猫睡在里面。',
      tiers: [{ price: 300, fx: {}, note: '摆上' }],
    },
    {
      id: 'deco_fishbasket', cat: '装饰', name: '松叔的旧鱼篓', deco: true, from: 'story',
      desc: '老渔夫说，这个招福。',
      tiers: [{ price: 0, fx: {}, note: '松叔送的' }],
    },
  ];
})(window.SG = window.SG || {});