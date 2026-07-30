// Simplified Chinese (zh). UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const zh: Dict = {
  subtitle:
    '全球人工智能监管，尽在一图。点击任意国家，即可查看在当地具有约束力的框架、适用于各地的全球标准以及 CSOAI 对照映射，然后从侧边栏叠加您的工具。一份档案，覆盖全球。',
  searchPlaceholder: '查找国家…',
  searchAria: '搜索国家',
  frameworkOverlay: '框架叠加层',
  csoaiTools: 'CSOAI 工具',
  language: '语言',
  statusBar:
    '{jurisdictions} 个设有人工智能专项法律的司法管辖区 · {frameworks} 个框架 · {countries} 个国家已上线 · 拖动平移，滚动缩放',
  statusLoading: '—',
  zoomIn: '放大',
  zoomOut: '缩小',
  resetView: '重置视图',
  atlasError: '无法加载地图图集（{error}）。请检查网络连接并重新加载。',
  atlasLoading: '正在加载世界地图…',
  hoverNational: '{name} · {count} 个国家级框架',
  hoverGlobalSuffix: ' · 适用全球标准',
  legendDensity: '监管密度：',
  densityNone: '无',
  densityLight: '轻度',
  densityModerate: '中度',
  densityDense: '密集',
  region: '地区',
  nationalLaw: '国家／区域人工智能法律（{count}）',
  globalStandards: '同样适用的全球标准（{count}）',
  closePanel: '关闭地区面板',
  emptyState:
    '此处尚未收录人工智能专项的强制性法律。下方的全球标准仍然适用，CSOAI 正在监测该司法管辖区——{flagLink}。',
  emptyStateFlagLink: '标记一项进展',
  binding: '强制性',
  voluntary: '自愿性',
  effective: '生效日期：{date}',
  csoaiCrosswalk: 'CSOAI 对照映射',

  headlineDeadlinePrefix: '下一个具有约束力的截止期限',
  daysOut: '还有 {days} 天',
  entityHoverSystems: '{count} 个系统',
  inScopeCount: '{count} 个纳入范围',
  complianceDeadlines: '合规截止期限（{count}）',
  companiesHere: '此处的人工智能与机器人企业（{count}）',
  helpFirstSignals: '助力优先信号——范围与期限，而非判定',
  helpComply: '帮助该组织合规 →',

  radarSubtitle:
    '全球每一项即将到来的人工智能监管截止期限，集于一表，最近的排在最前。系统已掌握每项义务的生效时间，让您绝不会被任何节点打个措手不及。',
  nextBindingAnywhere: '全球下一个具有约束力的截止期限',
  daysOutShort: '剩余天数',
  filter: '筛选',
  bindingOnly: '仅约束性',
  bindingOnlyActive: '仅约束性 ✓',
  allJurisdictions: '所有司法管辖区',
  radarCount: '{upcoming} 项即将到来 · {binding} 项具约束力',
  radarEmpty: '没有符合这些筛选条件的即将到来的截止期限。请尝试清除司法管辖区或约束性筛选。',
  radarFootnote:
    '日期取自每个框架已公布的生效文本。倒计时以今日为基准实时计算。本雷达追踪义务的生效时间——并非法律意见。',
  bindingBadge: '具约束力',
  voluntaryBadge: '自愿性',
  global: '全球',

  inForce: '已生效',
  oneDay: '1 天',
  daysCountdown: '{days} 天',

  landscapeSubtitle:
    '面向监管机构与决策者的汇总态势情报——谁在范围内、何时纳入，以便协助市场达成合规。这是一份义务与期限的结构性地图，而非指控名录。',
  landscapePostureTitle: '设计上即为汇总且不具名。',
  landscapePostureBody:
    '此视图不点名任何企业。数据是某一司法管辖区内的范围与期限事实——绝非认定任何组织不合规的结论。目标是助力优先的沟通，而非执法。',
  jurisdiction: '司法管辖区',
  allCoveredJurisdictions: '所有已覆盖的司法管辖区',
  entitiesTracked: '已追踪实体',
  frameworksInScope: '范围内的框架',
  distinctBindingFrameworks: '项不同的约束性框架适用于该群组',
  nearestDeadline: '最近的截止期限',
  daysLabel: '{days} 天',
  noDatedObligation: '未解析到带日期的义务。',
  inScopeByFramework: '按框架划分的范围内情况',
  noInScopeObligation: '尚无约束性框架为该群组解析出范围内的义务。',
  pressureDistribution: '合规压力分布',
  entitiesCount: '{count} 个实体',
  pressureNote:
    '压力 = 期限临近度 × 范围置信度——用于优先排序谁最需尽早帮助的信号，并非合规评分或违规概率。柱状图为匿名实体计数。',
  landscapeFootnote:
    '汇总数据源自 CSOAI 情报图谱。本页不识别任何组织。如需司法管辖区层面的助力优先合作，请联系 CSOAI 监管项目。非法律意见。',
  bucketLow: '低',
  bucketModest: '轻微',
  bucketModerate: '中等',
  bucketElevated: '偏高',
  bucketUrgent: '紧迫',
};

export default zh;
