// Arabic (ar) — right-to-left. UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const ar: Dict = {
  subtitle:
    'لوائح الذكاء الاصطناعي في العالم، مُجمَّعة على خريطة. انقر على أي دولة لرؤية الأطر المُلزِمة فيها، والمعايير العالمية المطبَّقة في كل مكان، وجداول التناظر من CSOAI — ثم اعرض أدواتك من الشريط الجانبي فوقها. ملف واحد، الكوكب بأكمله.',
  searchPlaceholder: 'ابحث عن دولة…',
  searchAria: 'البحث عن دولة',
  frameworkOverlay: 'طبقة الأطر',
  csoaiTools: 'أدوات CSOAI',
  language: 'اللغة',
  statusBar:
    '{jurisdictions} ولاية قضائية لديها قانون خاص بالذكاء الاصطناعي · {frameworks} إطارًا · {countries} دولة نشطة · اسحب للتحريك، مرِّر للتكبير',
  statusLoading: '—',
  zoomIn: 'تكبير',
  zoomOut: 'تصغير',
  resetView: 'إعادة ضبط العرض',
  atlasError: 'تعذّر تحميل أطلس الخريطة ({error}). تحقق من الاتصال وأعد التحميل.',
  atlasLoading: 'جارٍ تحميل أطلس العالم…',
  hoverNational: '{name} · {count} إطار وطني',
  hoverGlobalSuffix: ' · تنطبق المعايير العالمية',
  legendDensity: 'كثافة التنظيم:',
  densityNone: 'لا شيء',
  densityLight: 'خفيفة',
  densityModerate: 'متوسطة',
  densityDense: 'كثيفة',
  region: 'المنطقة',
  nationalLaw: 'قانون الذكاء الاصطناعي الوطني / للتكتل ({count})',
  globalStandards: 'المعايير العالمية المطبَّقة أيضًا ({count})',
  closePanel: 'إغلاق لوحة المنطقة',
  emptyState:
    'لا يوجد بعدُ قانون مُلزِم خاص بالذكاء الاصطناعي مُدرَج هنا. المعايير العالمية أدناه لا تزال سارية، وتراقب CSOAI هذه الولاية القضائية — {flagLink}.',
  emptyStateFlagLink: 'الإبلاغ عن تطوّر',
  binding: 'مُلزِم',
  voluntary: 'طوعي',
  effective: 'سارٍ اعتبارًا من: {date}',
  csoaiCrosswalk: 'جدول تناظر CSOAI',

  headlineDeadlinePrefix: 'الموعد النهائي المُلزِم التالي',
  daysOut: 'متبقٍّ {days} يومًا',
  entityHoverSystems: '{count} نظامًا',
  inScopeCount: '{count} ضمن النطاق',
  complianceDeadlines: 'مواعيد الامتثال النهائية ({count})',
  companiesHere: 'شركات الذكاء الاصطناعي والروبوتات هنا ({count})',
  helpFirstSignals: 'إشارات المساعدة أولًا — نطاق وموعد، وليست حُكمًا',
  helpComply: '← مساعدة هذه المؤسسة على الامتثال',

  radarSubtitle:
    'كل موعد نهائي قادم لتنظيم الذكاء الاصطناعي على الأرض، على ساعة واحدة — الأقرب أولًا. النظام يعرف مسبقًا متى يبدأ سريان كل التزام، فلا يفاجئك أي موعد.',
  nextBindingAnywhere: 'الموعد النهائي المُلزِم التالي في أي مكان',
  daysOutShort: 'الأيام المتبقية',
  filter: 'تصفية',
  bindingOnly: 'المُلزِمة فقط',
  bindingOnlyActive: 'المُلزِمة فقط ✓',
  allJurisdictions: 'جميع الولايات القضائية',
  radarCount: '{upcoming} قادمة · {binding} مُلزِمة',
  radarEmpty: 'لا توجد مواعيد نهائية قادمة تطابق عوامل التصفية هذه. حاول إزالة عامل تصفية الولاية القضائية أو الإلزام.',
  radarFootnote:
    'تُستخرج التواريخ من نص بدء السريان المنشور لكل إطار. تُحسب العدّات التنازلية مباشرةً بالنسبة لليوم. يتتبع هذا الرادار متى تدخل الالتزامات حيز التنفيذ — وليس استشارة قانونية.',
  bindingBadge: 'مُلزِم',
  voluntaryBadge: 'طوعي',
  global: 'عالمي',

  inForce: 'ساري المفعول',
  oneDay: 'يوم واحد',
  daysCountdown: '{days} يومًا',

  landscapeSubtitle:
    'معلومات مجمّعة عن المشهد للجهات التنظيمية وصانعي السياسات — من يقع ضمن النطاق ومتى، بحيث يمكن مساعدة السوق على الامتثال. هذه خريطة هيكلية للالتزامات والمواعيد، وليست سجلًّا للاتهامات.',
  landscapePostureTitle: 'مجمَّع وبلا أسماء بحكم التصميم.',
  landscapePostureBody:
    'لا تُذكر أي شركة في هذا العرض. الأرقام هي حقائق عن النطاق والموعد عبر ولاية قضائية — وليست استنتاجًا بأن أي مؤسسة غير ممتثلة. الهدف هو التواصل القائم على المساعدة أولًا، لا الإنفاذ.',
  jurisdiction: 'الولاية القضائية',
  allCoveredJurisdictions: 'جميع الولايات القضائية المشمولة',
  entitiesTracked: 'الكيانات المتتبَّعة',
  frameworksInScope: 'الأطر ضمن النطاق',
  distinctBindingFrameworks: 'إطارًا مُلزِمًا مختلفًا يُلزِم هذه المجموعة',
  nearestDeadline: 'أقرب موعد نهائي',
  daysLabel: '{days} يومًا',
  noDatedObligation: 'لم يُحدَّد أي التزام له تاريخ.',
  inScopeByFramework: 'ضمن النطاق حسب الإطار',
  noInScopeObligation: 'لا يوجد بعدُ إطار مُلزِم يحدد التزامًا ضمن النطاق لهذه المجموعة.',
  pressureDistribution: 'توزيع ضغط الامتثال',
  entitiesCount: '{count} كيانًا',
  pressureNote:
    'الضغط = قرب الموعد النهائي × موثوقية النطاق — إشارة لترتيب الأولويات لمن يحتاج المساعدة أولًا، وليست درجة امتثال ولا احتمال مخالفة. الأعمدة هي أعداد مجهولة للكيانات.',
  landscapeFootnote:
    'أرقام مجمّعة مستمدة من رسم معلومات CSOAI. لا تُعرَّف أي مؤسسة في هذه الصفحة. للتعاون القائم على المساعدة أولًا على مستوى الولاية القضائية، تواصل مع البرنامج التنظيمي لـ CSOAI. ليست استشارة قانونية.',
  bucketLow: 'منخفض',
  bucketModest: 'طفيف',
  bucketModerate: 'متوسط',
  bucketElevated: 'مرتفع',
  bucketUrgent: 'عاجل',
};

export default ar;
