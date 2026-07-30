// Hindi (hi). UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const hi: Dict = {
  subtitle:
    'दुनिया भर के एआई नियम, एक मानचित्र पर। किसी भी देश पर क्लिक करें और वहाँ बाध्यकारी ढाँचे, हर जगह लागू होने वाले वैश्विक मानक तथा CSOAI क्रॉसवॉक देखें — फिर साइडबार से अपने उपकरण ऊपर जोड़ें। एक प्रोफ़ाइल, पूरा ग्रह।',
  searchPlaceholder: 'कोई देश खोजें…',
  searchAria: 'देश खोजें',
  frameworkOverlay: 'ढाँचा ओवरले',
  csoaiTools: 'CSOAI उपकरण',
  language: 'भाषा',
  statusBar:
    'एआई-विशिष्ट कानून वाले {jurisdictions} क्षेत्राधिकार · {frameworks} ढाँचे · {countries} देश सक्रिय · खिसकाकर घुमाएँ, स्क्रॉल करके ज़ूम करें',
  statusLoading: '—',
  zoomIn: 'ज़ूम इन',
  zoomOut: 'ज़ूम आउट',
  resetView: 'दृश्य रीसेट करें',
  atlasError: 'मानचित्र एटलस लोड नहीं हो सका ({error})। कनेक्शन जाँचें और पुनः लोड करें।',
  atlasLoading: 'विश्व एटलस लोड हो रहा है…',
  hoverNational: '{name} · {count} राष्ट्रीय ढाँचा/ढाँचे',
  hoverGlobalSuffix: ' · वैश्विक मानक लागू होते हैं',
  legendDensity: 'विनियमन घनत्व:',
  densityNone: 'कोई नहीं',
  densityLight: 'हल्का',
  densityModerate: 'मध्यम',
  densityDense: 'सघन',
  region: 'क्षेत्र',
  nationalLaw: 'राष्ट्रीय / गुट एआई कानून ({count})',
  globalStandards: 'वे वैश्विक मानक जो यहाँ भी लागू होते हैं ({count})',
  closePanel: 'क्षेत्र पैनल बंद करें',
  emptyState:
    'यहाँ अभी तक कोई एआई-विशिष्ट बाध्यकारी कानून सूचीबद्ध नहीं है। नीचे दिए गए वैश्विक मानक अब भी लागू हैं, और CSOAI इस क्षेत्राधिकार की निगरानी कर रहा है — {flagLink}।',
  emptyStateFlagLink: 'किसी घटनाक्रम की सूचना दें',
  binding: 'बाध्यकारी',
  voluntary: 'स्वैच्छिक',
  effective: 'प्रभावी: {date}',
  csoaiCrosswalk: 'CSOAI क्रॉसवॉक',

  headlineDeadlinePrefix: 'अगली बाध्यकारी समय-सीमा',
  daysOut: '{days} दिन शेष',
  entityHoverSystems: '{count} सिस्टम',
  inScopeCount: '{count} दायरे में',
  complianceDeadlines: 'अनुपालन समय-सीमाएँ ({count})',
  companiesHere: 'यहाँ की AI और रोबोटिक्स कंपनियाँ ({count})',
  helpFirstSignals: 'सहायता-पहले संकेत — दायरा और समय-सीमा, निर्णय नहीं',
  helpComply: 'इस संगठन को अनुपालन में सहायता करें →',

  radarSubtitle:
    'पृथ्वी की हर आगामी AI-विनियमन समय-सीमा, एक ही घड़ी पर — सबसे निकट पहले। सिस्टम पहले से जानता है कि प्रत्येक दायित्व कब प्रभावी होता है, इसलिए कोई भी समय-सीमा आपको चौंकाती नहीं।',
  nextBindingAnywhere: 'कहीं भी अगली बाध्यकारी समय-सीमा',
  daysOutShort: 'शेष दिन',
  filter: 'फ़िल्टर',
  bindingOnly: 'केवल बाध्यकारी',
  bindingOnlyActive: 'केवल बाध्यकारी ✓',
  allJurisdictions: 'सभी क्षेत्राधिकार',
  radarCount: '{upcoming} आगामी · {binding} बाध्यकारी',
  radarEmpty: 'इन फ़िल्टरों से मेल खाती कोई आगामी समय-सीमा नहीं। क्षेत्राधिकार या बाध्यकारी फ़िल्टर हटाकर देखें।',
  radarFootnote:
    'तिथियाँ प्रत्येक ढाँचे के प्रकाशित प्रभावी-तिथि पाठ से ली जाती हैं। उलटी गिनती आज के सापेक्ष लाइव गणना की जाती है। यह रडार ट्रैक करता है कि दायित्व कब प्रभावी होते हैं — यह कानूनी सलाह नहीं है।',
  bindingBadge: 'बाध्यकारी',
  voluntaryBadge: 'स्वैच्छिक',
  global: 'वैश्विक',

  inForce: 'प्रभावी',
  oneDay: '1 दिन',
  daysCountdown: '{days} दिन',

  landscapeSubtitle:
    'नियामकों और नीति-निर्माताओं के लिए समग्र परिदृश्य आसूचना — कौन दायरे में है और कब, ताकि बाज़ार को अनुपालन में सहायता दी जा सके। यह दायित्वों और समय-सीमाओं का संरचनात्मक मानचित्र है, आरोपों का रजिस्टर नहीं।',
  landscapePostureTitle: 'डिज़ाइन से ही समग्र और नाम-रहित।',
  landscapePostureBody:
    'इस दृश्य में किसी कंपनी का नाम नहीं लिया जाता। आँकड़े किसी क्षेत्राधिकार में दायरे और समय-सीमा के तथ्य हैं — कभी यह निष्कर्ष नहीं कि कोई संगठन गैर-अनुपालक है। लक्ष्य सहायता-पहले संपर्क है, प्रवर्तन नहीं।',
  jurisdiction: 'क्षेत्राधिकार',
  allCoveredJurisdictions: 'सभी कवर किए गए क्षेत्राधिकार',
  entitiesTracked: 'ट्रैक की गई इकाइयाँ',
  frameworksInScope: 'दायरे में ढाँचे',
  distinctBindingFrameworks: 'अलग-अलग बाध्यकारी ढाँचे इस समूह को बाध्य करते हैं',
  nearestDeadline: 'निकटतम समय-सीमा',
  daysLabel: '{days} दिन',
  noDatedObligation: 'कोई तिथि-निर्धारित दायित्व हल नहीं हुआ।',
  inScopeByFramework: 'ढाँचे के अनुसार दायरे में',
  noInScopeObligation: 'अभी तक कोई बाध्यकारी ढाँचा इस समूह के लिए दायरे में दायित्व हल नहीं करता।',
  pressureDistribution: 'अनुपालन-दबाव वितरण',
  entitiesCount: '{count} इकाइयाँ',
  pressureNote:
    'दबाव = समय-सीमा निकटता × दायरा विश्वसनीयता — किसे सबसे पहले सहायता चाहिए, इसके प्राथमिकता-संकेत के रूप में; न कि अनुपालन स्कोर या उल्लंघन संभावना। बार अनाम इकाई गणनाएँ हैं।',
  landscapeFootnote:
    'समग्र आँकड़े CSOAI आसूचना ग्राफ़ से प्राप्त। इस पृष्ठ पर किसी संगठन की पहचान नहीं की जाती। क्षेत्राधिकार-स्तरीय सहायता-पहले सहभागिता के लिए, CSOAI नियामक कार्यक्रम से संपर्क करें। यह कानूनी सलाह नहीं है।',
  bucketLow: 'निम्न',
  bucketModest: 'अल्प',
  bucketModerate: 'मध्यम',
  bucketElevated: 'उच्च',
  bucketUrgent: 'अत्यावश्यक',
};

export default hi;
