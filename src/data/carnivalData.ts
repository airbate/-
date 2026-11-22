export type ZoneKey = 'Q' | 'M' | 'S' | 'G' | 'W' | 'L';
export type FilterZone = 'ALL' | 'Q' | 'M' | 'S' | 'G' | 'W';

export interface ZoneMeta {
  name: string;
  color: string;
  idx: number;
}

export interface RawSpot {
  id: string;
  z: ZoneKey;
  lm?: boolean;
  ic?: string;
  sh: string;
  name: string;
  team: string;
  desc?: string;
  tags: string[];
}

export interface Spot extends Omit<RawSpot, 'desc'> {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  desc: string;
}

export const ZONES: Record<ZoneKey, ZoneMeta> = {
  Q: { name: '趣玩工坊', color: '#7B56C4', idx: 0 },
  M: { name: '人形机器人展位', color: '#EE8226', idx: 1 },
  S: { name: '桌面硬件展位', color: '#1F9D8B', idx: 2 },
  G: { name: '高校角', color: '#3D9E49', idx: 3 },
  W: { name: 'Workshop 工坊', color: '#2B8A3E', idx: 4 },
  L: { name: '嘉年华地标', color: '#2962FF', idx: 5 },
};

const RAW_SPOTS: RawSpot[] = [
  // Q6-Q1
  { id: 'Q6', z: 'Q', ic: '🧘', sh: '具身智能瑜伽搭子', name: '具身智能瑜伽搭子', team: '趣玩工坊参展团队', tags: ['运动陪伴', '姿态感知'] },
  { id: 'Q5', z: 'Q', ic: '🎨', sh: 'AI 绘画机械臂', name: 'AI 绘画机械臂', team: '趣玩工坊参展团队', tags: ['生成式AI', '艺术创作'] },
  { id: 'Q4', z: 'Q', ic: '👨‍🍳', sh: '具身餐饮机器人', name: '具身餐饮机器人', team: '趣玩工坊参展团队', tags: ['具身智能', '餐饮服务'] },
  { id: 'Q3', z: 'Q', ic: '🎲', sh: 'AI 桌游机器人', name: 'AI 桌游机器人', team: '趣玩工坊参展团队', tags: ['AI博弈', '亲子互动'] },
  { id: 'Q2', z: 'Q', ic: '🦾', sh: '桌面机械臂 D1', name: '桌面级机械臂互动 D1', team: '趣玩工坊参展团队', tags: ['桌面机械臂', '精准交互'] },
  { id: 'Q1', z: 'Q', ic: '📜', sh: '文化复活机器人', name: '文化复活机器人', team: '趣玩工坊参展团队', tags: ['文化创意', '互动体验'] },
  // M12-M15 / M8-M11 / M4-M7
  { id: 'M12', z: 'M', ic: '🤿', sh: '水下自主\n跟拍机器人', name: '水下自主跟拍机器人', team: '水下机器人团队', tags: ['水下视觉', '自主追踪'] },
  { id: 'M13', z: 'M', ic: '🦾', sh: '移动抓取\n机械臂平台', name: '移动抓取机械臂平台', team: '移动操作团队', tags: ['Mobile Manipulation', '底盘+臂'] },
  { id: 'M14', z: 'M', ic: '🩺', sh: '智诊\n机器人', name: '智诊机器人', team: '医疗具身团队', tags: ['智慧医疗', '辅助诊断'] },
  { id: 'M15', z: 'M', ic: '🦿', sh: 'Kudada\n双足机器人', name: 'Oringin Kudada 双足机器人', team: 'Oringin 团队', tags: ['双足运动', '动态平衡'] },
  { id: 'M8', z: 'M', ic: '🧠', sh: '一脑多机\n群体智能', name: '一脑多机·群体智能', team: '多机协同团队', tags: ['一脑多机', '协同调度'] },
  { id: 'M9', z: 'M', ic: '💡', sh: 'AI 远程\n互动餐灯', name: 'AI 远程互动餐灯', team: '智能硬件开发者', tags: ['远程情感', 'AI硬件'] },
  { id: 'M10', z: 'M', ic: '☕', sh: 'SynDexy\nCoffeeBot', name: 'SynDexy CoffeeBot', team: 'SynDexy 团队', tags: ['咖啡制作', '双臂协同'] },
  { id: 'M11', z: 'M', ic: '🤖', sh: 'DingDong\n科教陪伴', name: 'DingDong 科教陪伴机器人', team: '科教机器人团队', tags: ['STEM教育', '语音陪伴'] },
  { id: 'M4', z: 'M', ic: '🥣', sh: '喂饭\n机器人', name: '喂饭机器人', team: '具身辅具团队', tags: ['康养助老', '柔性抓取'] },
  {
    id: 'M5',
    z: 'M',
    ic: '🧩',
    sh: '拼豆\n机器人',
    name: '拼豆机器人',
    team: '灵生科技',
    desc: '结合视觉识别与高精度灵巧操作，现场为你自动拼出像素风机器人图案，欢迎围观互动！',
    tags: ['明星项目', '视觉定位', '灵巧操作'],
  },
  { id: 'M6', z: 'M', ic: '🧸', sh: 'IP 手办\n机器人', name: 'IP 手办机器人', team: '潮玩机器人团队', tags: ['潮玩IP', '桌面拟人'] },
  { id: 'M7', z: 'M', ic: '🚛', sh: '户外垃圾\n清运机器人', name: '户外垃圾清运机器人', team: '自主移动团队', tags: ['户外导航', '自动作业'] },
  // W1 + M1/M3/M2 + W2
  {
    id: 'W1',
    z: 'W',
    ic: '⚽',
    sh: '踢球人形机器人',
    name: '会踢球的人形机器人',
    team: 'Workshop 工坊 01 · 足球场',
    desc: '现场机器人绿茵球场！亲眼看人形机器人自主寻球、传球与射门，还可参与工坊互动！',
    tags: ['Workshop 01', '绿茵球场'],
  },
  { id: 'M1', z: 'M', ic: '🦀', sh: '「跳跳」\n螃蟹机器人', name: '「跳跳」螃蟹机器人', team: '探月社区开发者', tags: ['仿生步态', '多足机械'] },
  {
    id: 'M3',
    z: 'M',
    ic: '🚀',
    sh: '亦衍科技',
    name: '亦衍科技',
    team: '亦衍科技',
    desc: '专注前沿具身智能与机器人本体创新研发，现场可近距离体验整机交互演示。',
    tags: ['整机研发', '亦庄本土'],
  },
  { id: 'M2', z: 'M', ic: '✨', sh: '桌面具身\n交互新物种', name: '桌面具身交互新物种', team: '具身交互团队', tags: ['多模态交互', '桌面伙伴'] },
  {
    id: 'W2',
    z: 'W',
    ic: '🐕',
    sh: '智能大头机器狗',
    name: '智能大头机器狗',
    team: 'Workshop 工坊 02 · 零零后科技 张振尧',
    desc: '零零后硬核极客打造的智能大头机器狗，现场拆解结构原理并开放手把手体验！',
    tags: ['Workshop 02', '零零后科技'],
  },
  // S10-S1
  { id: 'S10', z: 'S', ic: '🦴', sh: '连续碳纤维3D打印骨骼', name: '连续碳纤维 3D 打印骨骼', team: '先进制造团队', tags: ['轻量化结构', '碳纤维3D打印'] },
  {
    id: 'S9',
    z: 'S',
    ic: '🦆',
    sh: '机器人小鸭子',
    name: '机器人小鸭子',
    team: '开源极客创客',
    desc: '超萌高人气的开源桌面仿生小鸭子！会摇头晃脑跟你互动，现场可上手近距离逗它玩。',
    tags: ['超萌人气', '仿生互动'],
  },
  { id: 'S8', z: 'S', ic: '🛋️', sh: '一个活过来的台灯', name: '一个活过来的台灯', team: '独立硬件创作者', tags: ['皮克斯风', '拟人动效'] },
  { id: 'S7', z: 'S', ic: '😷', sh: '默适语音输入口罩', name: '默适语音输入口罩', team: '可穿戴硬件团队', tags: ['静默输入', '可穿戴'] },
  { id: 'S6', z: 'S', ic: '🎇', sh: '动效·灯效桌面机器人', name: '动效·灯效桌面机器人', team: '创客实验室', tags: ['光影交互', '极客桌面'] },
  { id: 'S5', z: 'S', ic: '🐱', sh: '猫咪运动驱动套件', name: '猫咪运动驱动套件', team: '开源硬件作者', tags: ['仿生关节', '开源套件'] },
  { id: 'S4', z: 'S', ic: '💭', sh: '情绪感知桌面机器人', name: '青少年情绪感知桌面机器人', team: '情感计算团队', tags: ['情绪识别', '桌面陪伴'] },
  { id: 'S3', z: 'S', ic: '🪞', sh: '物理AI面部美学伴侣', name: '物理 AI 面部美学伴侣', team: '消费硬件团队', tags: ['Physical AI', '智能个护'] },
  { id: 'S2', z: 'S', ic: '🎵', sh: 'AI 智能音乐机', name: 'AI 智能音乐机', team: '声音硬件开发者', tags: ['AI作曲', '复古声学'] },
  { id: 'S1', z: 'S', ic: '🩺', sh: '轻量化腹部超声机器人', name: '轻量化腹部超声机器人', team: '医疗机器人团队', tags: ['医疗影像', '柔顺力控'] },
  // G12-G1
  { id: 'G12', z: 'G', sh: '北科\n职大', name: '北京科技职业大学', team: '智能制造学院团队', tags: ['工程实践', '技能创新'] },
  { id: 'G11', z: 'G', sh: '亦庄\n实验', name: '北京亦庄实验中学', team: '青少年科创社团', tags: ['少年极客', '新生代'] },
  { id: 'G10', z: 'G', sh: '哈工大\n深圳', name: '哈尔滨工业大学（深圳）', team: '哈工大（深圳）团队', tags: ['高校科研', '机器人强校'] },
  { id: 'G9', z: 'G', sh: 'RebuildZ', name: 'RebuildZ', team: 'RebuildZ 青年极客', tags: ['极客社区', '硬核自造'] },
  { id: 'G8', z: 'G', sh: '北京\n理工', name: '北京理工大学', team: '北京理工大学团队', tags: ['高校科研', '仿生机器人'] },
  { id: 'G7', z: 'G', sh: '北京\n大学', name: '北京大学', team: '北京大学具身团队', tags: ['高校科研', '通用具身'] },
  { id: 'G6', z: 'G', sh: '北京\n化工', name: '北京化工大学', team: '北京化工大学团队', tags: ['高校科研', '机电系统'] },
  { id: 'G5', z: 'G', sh: '天津\n大学', name: '天津大学', team: '天津大学机器人团队', tags: ['高校科研', '机构创新'] },
  { id: 'G4', z: 'G', sh: '北航', name: '北京航空航天大学', team: '北航机器人团队', tags: ['高校科研', '空天与控制'] },
  { id: 'G3', z: 'G', sh: '北京\n邮电', name: '北京邮电大学', team: '北邮机器人团队', tags: ['高校科研', '通信与AI'] },
  { id: 'G2', z: 'G', sh: '浙江\n大学', name: '浙江大学', team: '浙大机器人团队', tags: ['高校科研', '具身智能'] },
  { id: 'G1', z: 'G', sh: '清华\n大学', name: '清华大学', team: '清华机器人团队', tags: ['高校科研', '前沿探索'] },
  // 3 Landmarks
  {
    id: 'STAGE',
    z: 'L',
    lm: true,
    sh: '主舞台',
    name: '主舞台 · 机器人开发者盛会',
    team: '亦庄机器人 × 未来机域 × 探月社区',
    desc: '全天主题分享、重磅机器人新品演示与开发者对谈主阵地，前方设有观众席，欢迎落座围观！',
    tags: ['主舞台', '主题分享'],
  },
  {
    id: 'PHOTO',
    z: 'L',
    lm: true,
    sh: '互动打卡区',
    name: '互动打卡区',
    team: '现场拍照留念点',
    desc: '嘉年华专属主题打卡背景墙！逛展之余记得在这里和机器人立牌合影留念。',
    tags: ['拍照打卡', '嘉年华留念'],
  },
  {
    id: 'LUCKY',
    z: 'L',
    lm: true,
    sh: '抽奖区',
    name: '现场抽奖区',
    team: '嘉年华福利站',
    desc: '逛完展区别忘了来抽奖区碰碰运气！具体参与方式以现场工作人员指引为准。',
    tags: ['互动福利', '惊喜抽奖'],
  },
];

const G_ORDER = ['G12', 'G11', 'G10', 'G9', 'G8', 'G7', 'G6', 'G5', 'G4', 'G3', 'G2', 'G1'];
const M_GRID = [
  ['M12', 'M13', 'M14', 'M15'],
  ['M8', 'M9', 'M10', 'M11'],
  ['M4', 'M5', 'M6', 'M7'],
];
const M_COLS = [242, 314, 394, 466];

export const SPOTS: Spot[] = RAW_SPOTS.map((s) => {
  let x = 0;
  let y = 0;
  let w = 68;
  let h = 88;
  if (s.z === 'Q') {
    const n = 6 - parseInt(s.id.slice(1), 10);
    x = 26;
    y = 186 + n * 62;
    w = 174;
    h = 54;
  } else if (s.z === 'G') {
    const i = G_ORDER.indexOf(s.id);
    x = 24 + (i % 3) * 61;
    y = 758 + Math.floor(i / 3) * 47;
    w = 56;
    h = 41;
  } else if (s.z === 'S') {
    const n = 10 - parseInt(s.id.slice(1), 10);
    x = 578;
    y = 376 + n * 39.5;
    w = 192;
    h = 35;
  } else if (s.id === 'W2') {
    x = 568;
    y = 150;
    w = 212;
    h = 166;
  } else if (s.id === 'W1') {
    x = 314;
    y = 686;
    w = 148;
    h = 200;
  } else if (s.id === 'M1') {
    x = 242;
    y = 780;
    w = 66;
    h = 106;
  } else if (s.id === 'M3') {
    x = 468;
    y = 716;
    w = 66;
    h = 76;
  } else if (s.id === 'M2') {
    x = 468;
    y = 800;
    w = 66;
    h = 86;
  } else if (s.z === 'M') {
    for (let r = 0; r < 3; r++) {
      const c = M_GRID[r].indexOf(s.id);
      if (c > -1) {
        x = M_COLS[c];
        y = 380 + r * 100;
        w = 68;
        h = 88;
      }
    }
  } else if (s.id === 'STAGE') {
    x = 248;
    y = 126;
    w = 284;
    h = 94;
  } else if (s.id === 'PHOTO') {
    x = 18;
    y = 584;
    w = 192;
    h = 116;
  } else if (s.id === 'LUCKY') {
    x = 568;
    y = 794;
    w = 212;
    h = 158;
  }

  return {
    ...s,
    x,
    y,
    w,
    h,
    cx: x + w / 2,
    cy: y + h / 2,
    desc:
      s.desc ||
      `位于「${ZONES[s.z].name}」${s.id} 号展位的机器人创新项目。欢迎走到展位前与开发者交流、上手体验，扫码即可打卡点亮！`,
  };
});

export const BOOTHS: Spot[] = SPOTS.filter((s) => !s.lm);

export const SPOT_BY_ID: Record<string, Spot> = Object.fromEntries(
  SPOTS.map((s) => [s.id, s])
);

export const STORAGE_KEY = 'yizhuang_carnival_stamps_v3';
export const ZOOM_STOPS = [1, 1.6, 2.2, 2.9];
export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 1040;
