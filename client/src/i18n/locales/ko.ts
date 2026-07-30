// Korean (ko). UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const ko: Dict = {
  subtitle:
    '전 세계 AI 규제를 지도로. 아무 국가나 클릭하면 해당 지역에서 구속력을 갖는 프레임워크, 어디서나 적용되는 글로벌 표준, 그리고 CSOAI 크로스워크를 확인할 수 있습니다. 사이드바에서 도구를 겹쳐 보세요. 하나의 프로필로 지구 전체를.',
  searchPlaceholder: '국가 찾기…',
  searchAria: '국가 검색',
  frameworkOverlay: '프레임워크 오버레이',
  csoaiTools: 'CSOAI 도구',
  language: '언어',
  statusBar:
    'AI 전용 법률이 있는 관할권 {jurisdictions}곳 · 프레임워크 {frameworks}개 · 활성 국가 {countries}개 · 드래그하여 이동, 스크롤하여 확대/축소',
  statusLoading: '—',
  zoomIn: '확대',
  zoomOut: '축소',
  resetView: '보기 초기화',
  atlasError: '지도 아틀라스를 불러오지 못했습니다({error}). 연결을 확인하고 다시 불러오세요.',
  atlasLoading: '세계 지도를 불러오는 중…',
  hoverNational: '{name} · 국가 프레임워크 {count}개',
  hoverGlobalSuffix: ' · 글로벌 표준 적용',
  legendDensity: '규제 밀도:',
  densityNone: '없음',
  densityLight: '낮음',
  densityModerate: '보통',
  densityDense: '높음',
  region: '지역',
  nationalLaw: '국가/연합 AI 법률 ({count})',
  globalStandards: '함께 적용되는 글로벌 표준 ({count})',
  closePanel: '지역 패널 닫기',
  emptyState:
    '아직 이곳에 등재된 AI 전용 구속력 있는 법률이 없습니다. 아래 글로벌 표준은 여전히 적용되며, CSOAI가 이 관할권을 모니터링하고 있습니다 — {flagLink}.',
  emptyStateFlagLink: '동향 제보하기',
  binding: '구속력 있음',
  voluntary: '자발적',
  effective: '시행: {date}',
  csoaiCrosswalk: 'CSOAI 크로스워크',

  headlineDeadlinePrefix: '다음 구속력 있는 기한',
  daysOut: '{days}일 남음',
  entityHoverSystems: '시스템 {count}개',
  inScopeCount: '{count}건 적용 대상',
  complianceDeadlines: '컴플라이언스 기한 ({count})',
  companiesHere: '이곳의 AI·로보틱스 기업 ({count})',
  helpFirstSignals: '지원 우선 신호 — 범위와 기한이며, 판정이 아닙니다',
  helpComply: '이 조직의 컴플라이언스 지원하기 →',

  radarSubtitle:
    '전 세계 다가오는 모든 AI 규제 기한을 하나의 시계에 — 가장 가까운 것부터. 시스템이 각 의무의 발효 시점을 이미 파악하고 있어 어떤 기한에도 불시에 당하지 않습니다.',
  nextBindingAnywhere: '전 세계에서 다음으로 다가오는 구속력 있는 기한',
  daysOutShort: '남은 일수',
  filter: '필터',
  bindingOnly: '구속력 있는 것만',
  bindingOnlyActive: '구속력 있는 것만 ✓',
  allJurisdictions: '모든 관할권',
  radarCount: '예정 {upcoming}건 · 구속력 {binding}건',
  radarEmpty: '이 필터와 일치하는 다가오는 기한이 없습니다. 관할권 또는 구속력 필터를 해제해 보세요.',
  radarFootnote:
    '날짜는 각 프레임워크의 공표된 발효 본문에서 파싱됩니다. 카운트다운은 오늘을 기준으로 실시간 계산됩니다. 이 레이더는 의무가 언제 발효되는지를 추적하며, 법률 자문이 아닙니다.',
  bindingBadge: '구속력',
  voluntaryBadge: '자발적',
  global: '글로벌',

  inForce: '시행 중',
  oneDay: '1일',
  daysCountdown: '{days}일',

  landscapeSubtitle:
    '규제 기관과 정책 입안자를 위한 집계 환경 인텔리전스 — 누가 언제 적용 대상인지를 보여주어 시장이 컴플라이언스를 달성하도록 돕습니다. 이는 의무와 기한의 구조적 지도이며, 고발 명부가 아닙니다.',
  landscapePostureTitle: '설계상 집계이며 익명입니다.',
  landscapePostureBody:
    '이 화면에서는 어떤 기업도 거명하지 않습니다. 수치는 관할권 전반의 범위 및 기한에 관한 사실이며, 특정 조직이 비준수라는 결론이 결코 아닙니다. 목적은 지원 우선 아웃리치이며 집행이 아닙니다.',
  jurisdiction: '관할권',
  allCoveredJurisdictions: '포함된 모든 관할권',
  entitiesTracked: '추적 중인 엔터티',
  frameworksInScope: '적용 대상 프레임워크',
  distinctBindingFrameworks: '개의 서로 다른 구속력 있는 프레임워크가 이 코호트에 적용됩니다',
  nearestDeadline: '가장 가까운 기한',
  daysLabel: '{days}일',
  noDatedObligation: '날짜가 지정된 의무가 확인되지 않았습니다.',
  inScopeByFramework: '프레임워크별 적용 대상',
  noInScopeObligation: '아직 이 코호트에 대해 적용 대상 의무를 확인하는 구속력 있는 프레임워크가 없습니다.',
  pressureDistribution: '컴플라이언스 압력 분포',
  entitiesCount: '엔터티 {count}개',
  pressureNote:
    '압력 = 기한 근접도 × 범위 신뢰도 — 누구를 가장 먼저 지원해야 하는지에 대한 우선순위 신호이며, 컴플라이언스 점수나 위반 확률이 아닙니다. 막대는 익명 엔터티 수입니다.',
  landscapeFootnote:
    'CSOAI 인텔리전스 그래프에서 도출된 집계 수치입니다. 이 페이지에서는 어떤 조직도 식별되지 않습니다. 관할권 수준의 지원 우선 협력에 대해서는 CSOAI 규제 프로그램에 문의하세요. 법률 자문이 아닙니다.',
  bucketLow: '낮음',
  bucketModest: '경미',
  bucketModerate: '보통',
  bucketElevated: '높음',
  bucketUrgent: '긴급',
};

export default ko;
