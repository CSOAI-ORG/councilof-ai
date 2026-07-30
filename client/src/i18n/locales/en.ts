// English (en) — canonical key set for the OpenGridWorks i18n layer.
//
// IMPORTANT: This dictionary covers ONLY the app's own UI chrome. The legal
// framework descriptions, citations, names and "effective" dates that come from
// `@/data/frameworks.ts` are deliberately NOT translated here — auto-translating
// legal text is an accuracy risk, so it stays as-authored in the source data.
// Localizing framework *content* is a future pass (per-locale data overlays).
//
// Proper nouns (EU AI Act, NIST, ISO 42001, CSOAI, CEASAI, OpenGridWorks) are
// kept untranslated across every locale.
//
// To add a new language: copy this file to locales/<lang>.ts, translate the
// values (keep the keys identical and the {placeholders} intact), then register
// it in ../index.ts (LOCALES map + LANGUAGE_NAMES). That is the only wiring needed.

export type Dict = {
  // page header
  subtitle: string;
  // sidebar
  searchPlaceholder: string;
  searchAria: string;
  frameworkOverlay: string;
  csoaiTools: string;
  language: string;
  // map status bar — uses {jurisdictions} {frameworks} {countries}
  statusBar: string;
  statusLoading: string; // shown before country count resolves
  // zoom controls (aria)
  zoomIn: string;
  zoomOut: string;
  resetView: string;
  // map states
  atlasError: string; // uses {error}
  atlasLoading: string;
  // hover label — uses {name} {count}
  hoverNational: string; // "{name} · {count} national framework(s)"
  hoverGlobalSuffix: string; // " · global standards apply"
  // legend
  legendDensity: string;
  densityNone: string;
  densityLight: string;
  densityModerate: string;
  densityDense: string;
  // region panel
  region: string;
  nationalLaw: string; // uses {count}
  globalStandards: string; // uses {count}
  closePanel: string;
  emptyState: string; // honest empty-state; contains {flagLink}
  emptyStateFlagLink: string; // anchor text for the flag-a-development link
  // badges
  binding: string;
  voluntary: string;
  effective: string; // "Effective: {date}"
  csoaiCrosswalk: string;

  // ── company / deadline / dashboard chrome (OpenGridWorks + Radar + Landscape) ──
  // OpenGridWorks — headline banner + region panel intel sections
  headlineDeadlinePrefix: string; // "Next binding deadline" (label + date injected inline)
  daysOut: string; // "{days} days out"
  entityHoverSystems: string; // "{count} systems"
  inScopeCount: string; // "{count} in scope"
  complianceDeadlines: string; // "Compliance deadlines ({count})"
  companiesHere: string; // "AI & robotics companies here ({count})"
  helpFirstSignals: string; // "Help-first signals — scope + deadline, not a verdict"
  helpComply: string; // "Help this organisation comply →"

  // RegulationRadar (/radar)
  radarSubtitle: string;
  nextBindingAnywhere: string; // "Next binding deadline anywhere"
  daysOutShort: string; // "days out" (standalone caption under big number)
  filter: string; // "Filter"
  bindingOnly: string; // "Binding only"
  bindingOnlyActive: string; // "Binding only ✓"
  allJurisdictions: string; // "All jurisdictions"
  radarCount: string; // "{upcoming} upcoming · {binding} binding"
  radarEmpty: string; // no-results state
  radarFootnote: string;
  bindingBadge: string; // "Binding" (capitalised badge)
  voluntaryBadge: string; // "Voluntary" (capitalised badge)
  global: string; // "Global" jurisdiction sentinel

  // countdown labels (Radar rows)
  inForce: string; // "in force"
  oneDay: string; // "1 day"
  daysCountdown: string; // "{days} days"

  // Landscape (/landscape)
  landscapeSubtitle: string; // contains <b>/<em> handled in component; plain text here
  landscapePostureTitle: string; // "Aggregate & name-free by design."
  landscapePostureBody: string;
  jurisdiction: string; // "Jurisdiction"
  allCoveredJurisdictions: string; // "All covered jurisdictions"
  entitiesTracked: string; // "Entities tracked"
  frameworksInScope: string; // "Frameworks in scope"
  distinctBindingFrameworks: string; // "distinct binding frameworks bind this cohort"
  nearestDeadline: string; // "Nearest deadline"
  daysLabel: string; // "{days} days"
  noDatedObligation: string; // "No dated obligation resolved."
  inScopeByFramework: string; // "In scope by framework"
  noInScopeObligation: string; // empty-state for the bars
  pressureDistribution: string; // "Compliance-pressure distribution"
  entitiesCount: string; // "{count} entities"
  pressureNote: string;
  landscapeFootnote: string;
  // pressure buckets
  bucketLow: string;
  bucketModest: string;
  bucketModerate: string;
  bucketElevated: string;
  bucketUrgent: string;
};

const en: Dict = {
  subtitle:
    "The world's AI regulations, mapped. Click any country to see the frameworks that bind there, the global standards that apply everywhere, and CSOAI crosswalks — then overlay your tools from the sidebar. One profile, the whole planet.",
  searchPlaceholder: 'Find a country…',
  searchAria: 'Search for a country',
  frameworkOverlay: 'Framework overlay',
  csoaiTools: 'CSOAI tools',
  language: 'Language',
  statusBar:
    '{jurisdictions} jurisdictions with AI-specific law · {frameworks} frameworks · {countries} countries live · drag to pan, scroll to zoom',
  statusLoading: '—',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  resetView: 'Reset view',
  atlasError: "Couldn't load the map atlas ({error}). Check the connection and reload.",
  atlasLoading: 'Loading world atlas…',
  hoverNational: '{name} · {count} national framework(s)',
  hoverGlobalSuffix: ' · global standards apply',
  legendDensity: 'Regulation density:',
  densityNone: 'none',
  densityLight: 'light',
  densityModerate: 'moderate',
  densityDense: 'dense',
  region: 'Region',
  nationalLaw: 'National / bloc AI law ({count})',
  globalStandards: 'Global standards that also apply ({count})',
  closePanel: 'Close region panel',
  emptyState:
    'No AI-specific binding law catalogued here yet. The global standards below still apply, and CSOAI is monitoring this jurisdiction — {flagLink}.',
  emptyStateFlagLink: 'flag a development',
  binding: 'binding',
  voluntary: 'voluntary',
  effective: 'Effective: {date}',
  csoaiCrosswalk: 'CSOAI crosswalk',

  headlineDeadlinePrefix: 'Next binding deadline',
  daysOut: '{days} days out',
  entityHoverSystems: '{count} systems',
  inScopeCount: '{count} in scope',
  complianceDeadlines: 'Compliance deadlines ({count})',
  companiesHere: 'AI & robotics companies here ({count})',
  helpFirstSignals: 'Help-first signals — scope + deadline, not a verdict',
  helpComply: 'Help this organisation comply →',

  radarSubtitle:
    'Every upcoming AI-regulation deadline on Earth, on one clock — soonest first. The OS is already aware when each obligation bites, so you never get surprised by a cliff.',
  nextBindingAnywhere: 'Next binding deadline anywhere',
  daysOutShort: 'days out',
  filter: 'Filter',
  bindingOnly: 'Binding only',
  bindingOnlyActive: 'Binding only ✓',
  allJurisdictions: 'All jurisdictions',
  radarCount: '{upcoming} upcoming · {binding} binding',
  radarEmpty: 'No upcoming deadlines match these filters. Try clearing the jurisdiction or binding filter.',
  radarFootnote:
    "Dates are parsed from each framework's published effective text. Countdowns are computed live against today. This radar tracks when obligations take effect — it is not legal advice.",
  bindingBadge: 'Binding',
  voluntaryBadge: 'Voluntary',
  global: 'Global',

  inForce: 'in force',
  oneDay: '1 day',
  daysCountdown: '{days} days',

  landscapeSubtitle:
    'Aggregate landscape intelligence for regulators and policymakers — who is in scope and when, so the market can be helped to comply. This is a structural map of obligations and deadlines, not a register of accusations.',
  landscapePostureTitle: 'Aggregate & name-free by design.',
  landscapePostureBody:
    'No company is named on this view. Figures are scope and deadline facts across a jurisdiction — never a finding that any organisation is non-compliant. The goal is help-first outreach, not enforcement.',
  jurisdiction: 'Jurisdiction',
  allCoveredJurisdictions: 'All covered jurisdictions',
  entitiesTracked: 'Entities tracked',
  frameworksInScope: 'Frameworks in scope',
  distinctBindingFrameworks: 'distinct binding frameworks bind this cohort',
  nearestDeadline: 'Nearest deadline',
  daysLabel: '{days} days',
  noDatedObligation: 'No dated obligation resolved.',
  inScopeByFramework: 'In scope by framework',
  noInScopeObligation: 'No binding framework resolves an in-scope obligation for this cohort yet.',
  pressureDistribution: 'Compliance-pressure distribution',
  entitiesCount: '{count} entities',
  pressureNote:
    'Pressure = deadline proximity × scope confidence — a prioritisation signal for who needs help soonest, not a compliance score or breach probability. Bars are anonymous entity counts.',
  landscapeFootnote:
    'Aggregate figures derived from the CSOAI intel graph. No organisation is identified on this page. For help-first, jurisdiction-level engagement, contact the CSOAI regulatory programme. Not legal advice.',
  bucketLow: 'Low',
  bucketModest: 'Modest',
  bucketModerate: 'Moderate',
  bucketElevated: 'Elevated',
  bucketUrgent: 'Urgent',
};

export default en;
