// Italian (it). UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const it: Dict = {
  subtitle:
    "Le normative sull'IA del mondo, mappate. Fai clic su un paese qualsiasi per vedere i quadri normativi vincolanti in quel luogo, gli standard globali validi ovunque e le corrispondenze CSOAI, quindi sovrapponi i tuoi strumenti dalla barra laterale. Un solo profilo, l'intero pianeta.",
  searchPlaceholder: 'Trova un paese…',
  searchAria: 'Cerca un paese',
  frameworkOverlay: 'Livello quadri normativi',
  csoaiTools: 'Strumenti CSOAI',
  language: 'Lingua',
  statusBar:
    "{jurisdictions} giurisdizioni con normativa specifica sull'IA · {frameworks} quadri · {countries} paesi attivi · trascina per spostare, scorri per ingrandire",
  statusLoading: '—',
  zoomIn: 'Ingrandisci',
  zoomOut: 'Riduci',
  resetView: 'Reimposta vista',
  atlasError: "Impossibile caricare l'atlante della mappa ({error}). Controlla la connessione e ricarica.",
  atlasLoading: "Caricamento dell'atlante mondiale…",
  hoverNational: '{name} · {count} quadro/i nazionale/i',
  hoverGlobalSuffix: ' · si applicano standard globali',
  legendDensity: 'Densità normativa:',
  densityNone: 'nessuna',
  densityLight: 'lieve',
  densityModerate: 'moderata',
  densityDense: 'densa',
  region: 'Regione',
  nationalLaw: "Normativa IA nazionale / di blocco ({count})",
  globalStandards: 'Standard globali che si applicano anche qui ({count})',
  closePanel: 'Chiudi pannello regione',
  emptyState:
    "Nessuna legge vincolante specifica sull'IA ancora catalogata qui. Gli standard globali qui sotto continuano ad applicarsi e CSOAI sta monitorando questa giurisdizione — {flagLink}.",
  emptyStateFlagLink: 'segnala uno sviluppo',
  binding: 'vincolante',
  voluntary: 'volontario',
  effective: 'In vigore: {date}',
  csoaiCrosswalk: 'Corrispondenza CSOAI',

  headlineDeadlinePrefix: 'Prossima scadenza vincolante',
  daysOut: 'tra {days} giorni',
  entityHoverSystems: '{count} sistemi',
  inScopeCount: '{count} nell’ambito',
  complianceDeadlines: 'Scadenze di conformità ({count})',
  companiesHere: 'Aziende di IA e robotica qui ({count})',
  helpFirstSignals: 'Segnali di aiuto prima di tutto — ambito + scadenza, non un verdetto',
  helpComply: 'Aiuta questa organizzazione a conformarsi →',

  radarSubtitle:
    'Ogni prossima scadenza normativa sull’IA della Terra, su un unico orologio — le più vicine per prime. Il sistema sa già quando scatta ciascun obbligo, così nessuna scadenza ti coglie di sorpresa.',
  nextBindingAnywhere: 'Prossima scadenza vincolante ovunque',
  daysOutShort: 'giorni rimanenti',
  filter: 'Filtra',
  bindingOnly: 'Solo vincolanti',
  bindingOnlyActive: 'Solo vincolanti ✓',
  allJurisdictions: 'Tutte le giurisdizioni',
  radarCount: '{upcoming} in arrivo · {binding} vincolanti',
  radarEmpty: 'Nessuna scadenza in arrivo corrisponde a questi filtri. Prova a rimuovere il filtro per giurisdizione o per vincolanti.',
  radarFootnote:
    'Le date sono estratte dal testo di entrata in vigore pubblicato di ciascun quadro. I conti alla rovescia sono calcolati in tempo reale rispetto a oggi. Questo radar registra quando gli obblighi entrano in vigore — non è consulenza legale.',
  bindingBadge: 'Vincolante',
  voluntaryBadge: 'Volontario',
  global: 'Globale',

  inForce: 'in vigore',
  oneDay: '1 giorno',
  daysCountdown: '{days} giorni',

  landscapeSubtitle:
    'Intelligence aggregata del panorama per autorità di regolamentazione e responsabili politici — chi rientra nell’ambito e quando, per poter aiutare il mercato a conformarsi. È una mappa strutturale di obblighi e scadenze, non un registro di accuse.',
  landscapePostureTitle: 'Aggregato e senza nomi per progettazione.',
  landscapePostureBody:
    'In questa vista non viene nominata alcuna azienda. Le cifre sono fatti di ambito e scadenza in una giurisdizione — mai una conclusione che un’organizzazione non sia conforme. L’obiettivo è un approccio di aiuto prima di tutto, non l’applicazione coercitiva.',
  jurisdiction: 'Giurisdizione',
  allCoveredJurisdictions: 'Tutte le giurisdizioni coperte',
  entitiesTracked: 'Entità monitorate',
  frameworksInScope: 'Quadri nell’ambito',
  distinctBindingFrameworks: 'quadri vincolanti distinti vincolano questa coorte',
  nearestDeadline: 'Scadenza più vicina',
  daysLabel: '{days} giorni',
  noDatedObligation: 'Nessun obbligo datato risolto.',
  inScopeByFramework: 'Nell’ambito per quadro',
  noInScopeObligation: 'Nessun quadro vincolante risolve ancora un obbligo nell’ambito per questa coorte.',
  pressureDistribution: 'Distribuzione della pressione di conformità',
  entitiesCount: '{count} entità',
  pressureNote:
    'Pressione = prossimità della scadenza × affidabilità dell’ambito — un segnale di prioritizzazione di chi ha bisogno di aiuto prima, non un punteggio di conformità né una probabilità di violazione. Le barre sono conteggi anonimi di entità.',
  landscapeFootnote:
    'Cifre aggregate derivate dal grafo di intelligence CSOAI. Nessuna organizzazione è identificata in questa pagina. Per un coinvolgimento di aiuto prima di tutto a livello di giurisdizione, contatta il programma normativo CSOAI. Non è consulenza legale.',
  bucketLow: 'Bassa',
  bucketModest: 'Modesta',
  bucketModerate: 'Moderata',
  bucketElevated: 'Elevata',
  bucketUrgent: 'Urgente',
};

export default it;
