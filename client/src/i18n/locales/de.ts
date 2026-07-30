// German (de). UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const de: Dict = {
  subtitle:
    'Die KI-Regulierung der Welt, kartiert. Klicken Sie auf ein beliebiges Land, um die dort verbindlichen Rahmenwerke, die überall geltenden globalen Standards und die CSOAI-Crosswalks zu sehen — und legen Sie dann Ihre Werkzeuge aus der Seitenleiste darüber. Ein Profil, der ganze Planet.',
  searchPlaceholder: 'Land suchen…',
  searchAria: 'Nach einem Land suchen',
  frameworkOverlay: 'Rahmenwerk-Ebene',
  csoaiTools: 'CSOAI-Werkzeuge',
  language: 'Sprache',
  statusBar:
    '{jurisdictions} Rechtsräume mit KI-spezifischem Recht · {frameworks} Rahmenwerke · {countries} Länder aktiv · ziehen zum Verschieben, scrollen zum Zoomen',
  statusLoading: '—',
  zoomIn: 'Vergrößern',
  zoomOut: 'Verkleinern',
  resetView: 'Ansicht zurücksetzen',
  atlasError: 'Karten-Atlas konnte nicht geladen werden ({error}). Verbindung prüfen und neu laden.',
  atlasLoading: 'Weltatlas wird geladen…',
  hoverNational: '{name} · {count} nationale(s) Rahmenwerk(e)',
  hoverGlobalSuffix: ' · globale Standards gelten',
  legendDensity: 'Regulierungsdichte:',
  densityNone: 'keine',
  densityLight: 'gering',
  densityModerate: 'mittel',
  densityDense: 'hoch',
  region: 'Region',
  nationalLaw: 'Nationales / Block-KI-Recht ({count})',
  globalStandards: 'Ebenfalls geltende globale Standards ({count})',
  closePanel: 'Regionsfenster schließen',
  emptyState:
    'Hier ist noch kein KI-spezifisches verbindliches Recht erfasst. Die untenstehenden globalen Standards gelten weiterhin, und CSOAI beobachtet diesen Rechtsraum — {flagLink}.',
  emptyStateFlagLink: 'eine Entwicklung melden',
  binding: 'verbindlich',
  voluntary: 'freiwillig',
  effective: 'In Kraft: {date}',
  csoaiCrosswalk: 'CSOAI-Crosswalk',

  headlineDeadlinePrefix: 'Nächste verbindliche Frist',
  daysOut: 'in {days} Tagen',
  entityHoverSystems: '{count} Systeme',
  inScopeCount: '{count} im Anwendungsbereich',
  complianceDeadlines: 'Compliance-Fristen ({count})',
  companiesHere: 'KI- und Robotikunternehmen hier ({count})',
  helpFirstSignals: 'Hilfe-zuerst-Signale – Anwendungsbereich + Frist, kein Urteil',
  helpComply: 'Dieser Organisation bei der Compliance helfen →',

  radarSubtitle:
    'Jede anstehende KI-Regulierungsfrist der Welt auf einer Uhr – die nächsten zuerst. Das System weiß bereits, wann jede Pflicht greift, sodass Sie keine Frist überrascht.',
  nextBindingAnywhere: 'Nächste verbindliche Frist weltweit',
  daysOutShort: 'Tage übrig',
  filter: 'Filter',
  bindingOnly: 'Nur verbindlich',
  bindingOnlyActive: 'Nur verbindlich ✓',
  allJurisdictions: 'Alle Rechtsräume',
  radarCount: '{upcoming} anstehend · {binding} verbindlich',
  radarEmpty: 'Keine anstehenden Fristen entsprechen diesen Filtern. Entfernen Sie den Rechtsraum- oder Verbindlichkeitsfilter.',
  radarFootnote:
    'Die Daten stammen aus dem veröffentlichten Inkrafttretenstext jedes Rahmenwerks. Countdowns werden live gegen heute berechnet. Dieses Radar erfasst, wann Pflichten in Kraft treten – es ist keine Rechtsberatung.',
  bindingBadge: 'Verbindlich',
  voluntaryBadge: 'Freiwillig',
  global: 'Global',

  inForce: 'in Kraft',
  oneDay: '1 Tag',
  daysCountdown: '{days} Tage',

  landscapeSubtitle:
    'Aggregierte Landschaftsintelligenz für Regulierungsbehörden und politische Entscheidungsträger – wer wann im Anwendungsbereich ist, damit dem Markt bei der Compliance geholfen werden kann. Dies ist eine strukturelle Karte von Pflichten und Fristen, kein Register von Vorwürfen.',
  landscapePostureTitle: 'Aggregiert und namensfrei – beabsichtigt.',
  landscapePostureBody:
    'In dieser Ansicht wird kein Unternehmen genannt. Die Zahlen sind Anwendungsbereichs- und Fristfakten über einen Rechtsraum – niemals eine Feststellung, dass eine Organisation nicht konform ist. Das Ziel ist Hilfe-zuerst-Ansprache, nicht Durchsetzung.',
  jurisdiction: 'Rechtsraum',
  allCoveredJurisdictions: 'Alle erfassten Rechtsräume',
  entitiesTracked: 'Erfasste Einheiten',
  frameworksInScope: 'Rahmenwerke im Anwendungsbereich',
  distinctBindingFrameworks: 'verschiedene verbindliche Rahmenwerke binden diese Kohorte',
  nearestDeadline: 'Nächste Frist',
  daysLabel: '{days} Tage',
  noDatedObligation: 'Keine datierte Pflicht aufgelöst.',
  inScopeByFramework: 'Im Anwendungsbereich nach Rahmenwerk',
  noInScopeObligation: 'Noch löst kein verbindliches Rahmenwerk eine Pflicht im Anwendungsbereich für diese Kohorte auf.',
  pressureDistribution: 'Verteilung des Compliance-Drucks',
  entitiesCount: '{count} Einheiten',
  pressureNote:
    'Druck = Fristnähe × Anwendungsbereichssicherheit – ein Priorisierungssignal dafür, wer am dringendsten Hilfe braucht, kein Compliance-Wert und keine Verstoßwahrscheinlichkeit. Die Balken sind anonyme Einheitenzahlen.',
  landscapeFootnote:
    'Aggregierte Zahlen aus dem CSOAI-Intelligence-Graphen. Auf dieser Seite wird keine Organisation identifiziert. Für eine Hilfe-zuerst-Ansprache auf Rechtsraumebene wenden Sie sich an das CSOAI-Regulierungsprogramm. Keine Rechtsberatung.',
  bucketLow: 'Niedrig',
  bucketModest: 'Gering',
  bucketModerate: 'Mäßig',
  bucketElevated: 'Erhöht',
  bucketUrgent: 'Dringend',
};

export default de;
