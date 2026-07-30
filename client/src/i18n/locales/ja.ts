// Japanese (ja). UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const ja: Dict = {
  subtitle:
    '世界のAI規制を地図に。任意の国をクリックすると、その地域で拘束力を持つ枠組み、どこでも適用される世界標準、そしてCSOAIクロスウォークが表示されます。さらにサイドバーからご自身のツールを重ねられます。ひとつのプロファイルで、地球全体を。',
  searchPlaceholder: '国を検索…',
  searchAria: '国を検索',
  frameworkOverlay: '枠組みオーバーレイ',
  csoaiTools: 'CSOAI ツール',
  language: '言語',
  statusBar:
    'AI固有の法律を持つ管轄区域 {jurisdictions} · 枠組み {frameworks} · 稼働中の国 {countries} · ドラッグで移動、スクロールでズーム',
  statusLoading: '—',
  zoomIn: '拡大',
  zoomOut: '縮小',
  resetView: '表示をリセット',
  atlasError: '地図アトラスを読み込めませんでした（{error}）。接続を確認して再読み込みしてください。',
  atlasLoading: '世界地図を読み込み中…',
  hoverNational: '{name} · 国内の枠組み {count} 件',
  hoverGlobalSuffix: ' · 世界標準が適用されます',
  legendDensity: '規制密度：',
  densityNone: 'なし',
  densityLight: '低',
  densityModerate: '中',
  densityDense: '高',
  region: '地域',
  nationalLaw: '国内／圏内のAI法（{count}）',
  globalStandards: '同様に適用される世界標準（{count}）',
  closePanel: '地域パネルを閉じる',
  emptyState:
    'ここにはまだAI固有の拘束力ある法律が登録されていません。以下の世界標準は引き続き適用され、CSOAIはこの管轄区域を監視しています — {flagLink}。',
  emptyStateFlagLink: '動向を報告する',
  binding: '拘束力あり',
  voluntary: '任意',
  effective: '施行：{date}',
  csoaiCrosswalk: 'CSOAI クロスウォーク',

  headlineDeadlinePrefix: '次の拘束力のある期限',
  daysOut: '残り {days} 日',
  entityHoverSystems: '{count} 件のシステム',
  inScopeCount: '{count} 件が対象範囲',
  complianceDeadlines: 'コンプライアンス期限（{count}）',
  companiesHere: 'ここにあるAI・ロボティクス企業（{count}）',
  helpFirstSignals: '支援優先のシグナル — 範囲と期限であり、判定ではありません',
  helpComply: 'この組織のコンプライアンスを支援する →',

  radarSubtitle:
    '地球上のすべての今後のAI規制期限を一つの時計に。近いものから順に表示します。各義務がいつ発効するかをシステムが把握済みなので、期限に不意を突かれることはありません。',
  nextBindingAnywhere: '世界のどこかで次に来る拘束力のある期限',
  daysOutShort: '残り日数',
  filter: 'フィルター',
  bindingOnly: '拘束力のあるもののみ',
  bindingOnlyActive: '拘束力のあるもののみ ✓',
  allJurisdictions: 'すべての法域',
  radarCount: '今後 {upcoming} 件 · 拘束力 {binding} 件',
  radarEmpty: 'これらのフィルターに一致する今後の期限はありません。法域または拘束力フィルターを解除してみてください。',
  radarFootnote:
    '日付は各フレームワークの公表された発効テキストから解析されます。カウントダウンは本日を基準にリアルタイムで計算されます。このレーダーは義務がいつ発効するかを追跡するものであり、法的助言ではありません。',
  bindingBadge: '拘束力あり',
  voluntaryBadge: '任意',
  global: 'グローバル',

  inForce: '施行中',
  oneDay: '1 日',
  daysCountdown: '{days} 日',

  landscapeSubtitle:
    '規制当局および政策立案者向けの集約ランドスケープ・インテリジェンス — 誰がいつ対象範囲に入るかを示し、市場がコンプライアンスを達成できるよう支援します。これは義務と期限の構造マップであり、告発の登録簿ではありません。',
  landscapePostureTitle: '設計上、集約かつ匿名。',
  landscapePostureBody:
    'このビューでは企業名を一切表示しません。数値は法域全体における範囲と期限の事実であり、いかなる組織が非準拠であるという判断でもありません。目的は支援優先のアウトリーチであり、執行ではありません。',
  jurisdiction: '法域',
  allCoveredJurisdictions: 'カバーされるすべての法域',
  entitiesTracked: '追跡中のエンティティ',
  frameworksInScope: '対象範囲のフレームワーク',
  distinctBindingFrameworks: '件の異なる拘束力のあるフレームワークがこのコホートに適用されます',
  nearestDeadline: '最も近い期限',
  daysLabel: '{days} 日',
  noDatedObligation: '日付付きの義務は解決されませんでした。',
  inScopeByFramework: 'フレームワーク別の対象範囲',
  noInScopeObligation: 'このコホートに対して範囲内の義務を解決する拘束力のあるフレームワークはまだありません。',
  pressureDistribution: 'コンプライアンス圧力の分布',
  entitiesCount: '{count} 件のエンティティ',
  pressureNote:
    '圧力 = 期限の近さ × 範囲の信頼度 — 誰を最優先で支援すべきかを示す優先順位付けシグナルであり、コンプライアンススコアや違反確率ではありません。バーは匿名のエンティティ数です。',
  landscapeFootnote:
    'CSOAI インテリジェンス・グラフから導出された集約数値です。このページではいかなる組織も特定されません。法域レベルの支援優先の連携については、CSOAI 規制プログラムにお問い合わせください。法的助言ではありません。',
  bucketLow: '低',
  bucketModest: 'やや低',
  bucketModerate: '中',
  bucketElevated: 'やや高',
  bucketUrgent: '緊急',
};

export default ja;
