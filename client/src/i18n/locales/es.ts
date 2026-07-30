// Spanish (es). UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const es: Dict = {
  subtitle:
    'Las normativas de IA del mundo, en un mapa. Haz clic en cualquier país para ver los marcos que rigen allí, los estándares globales que se aplican en todas partes y las correspondencias de CSOAI; luego superpón tus herramientas desde la barra lateral. Un solo perfil, todo el planeta.',
  searchPlaceholder: 'Buscar un país…',
  searchAria: 'Buscar un país',
  frameworkOverlay: 'Capa de marcos',
  csoaiTools: 'Herramientas CSOAI',
  language: 'Idioma',
  statusBar:
    '{jurisdictions} jurisdicciones con legislación específica de IA · {frameworks} marcos · {countries} países activos · arrastra para mover, desplaza para ampliar',
  statusLoading: '—',
  zoomIn: 'Ampliar',
  zoomOut: 'Reducir',
  resetView: 'Restablecer vista',
  atlasError: 'No se pudo cargar el atlas del mapa ({error}). Comprueba la conexión y vuelve a cargar.',
  atlasLoading: 'Cargando atlas mundial…',
  hoverNational: '{name} · {count} marco(s) nacional(es)',
  hoverGlobalSuffix: ' · se aplican estándares globales',
  legendDensity: 'Densidad normativa:',
  densityNone: 'ninguna',
  densityLight: 'ligera',
  densityModerate: 'moderada',
  densityDense: 'densa',
  region: 'Región',
  nationalLaw: 'Legislación de IA nacional / de bloque ({count})',
  globalStandards: 'Estándares globales que también aplican ({count})',
  closePanel: 'Cerrar panel de región',
  emptyState:
    'Aún no hay legislación vinculante específica de IA catalogada aquí. Los estándares globales a continuación siguen aplicándose, y CSOAI está supervisando esta jurisdicción — {flagLink}.',
  emptyStateFlagLink: 'señalar una novedad',
  binding: 'vinculante',
  voluntary: 'voluntario',
  effective: 'En vigor: {date}',
  csoaiCrosswalk: 'Correspondencia CSOAI',

  headlineDeadlinePrefix: 'Próximo plazo vinculante',
  daysOut: 'faltan {days} días',
  entityHoverSystems: '{count} sistemas',
  inScopeCount: '{count} en el ámbito',
  complianceDeadlines: 'Plazos de cumplimiento ({count})',
  companiesHere: 'Empresas de IA y robótica aquí ({count})',
  helpFirstSignals: 'Señales de ayuda primero: ámbito + plazo, no un veredicto',
  helpComply: 'Ayudar a esta organización a cumplir →',

  radarSubtitle:
    'Cada próximo plazo de regulación de IA del planeta, en un solo reloj: los más cercanos primero. El sistema ya sabe cuándo entra en vigor cada obligación, para que ningún límite te pille por sorpresa.',
  nextBindingAnywhere: 'Próximo plazo vinculante en cualquier lugar',
  daysOutShort: 'días restantes',
  filter: 'Filtrar',
  bindingOnly: 'Solo vinculantes',
  bindingOnlyActive: 'Solo vinculantes ✓',
  allJurisdictions: 'Todas las jurisdicciones',
  radarCount: '{upcoming} próximos · {binding} vinculantes',
  radarEmpty: 'Ningún plazo próximo coincide con estos filtros. Prueba a quitar el filtro de jurisdicción o de vinculantes.',
  radarFootnote:
    'Las fechas se extraen del texto de entrada en vigor publicado de cada marco. Las cuentas atrás se calculan en vivo frente a hoy. Este radar registra cuándo entran en vigor las obligaciones; no es asesoramiento legal.',
  bindingBadge: 'Vinculante',
  voluntaryBadge: 'Voluntario',
  global: 'Global',

  inForce: 'en vigor',
  oneDay: '1 día',
  daysCountdown: '{days} días',

  landscapeSubtitle:
    'Inteligencia agregada del panorama para reguladores y responsables políticos: quién está dentro del ámbito y cuándo, para poder ayudar al mercado a cumplir. Es un mapa estructural de obligaciones y plazos, no un registro de acusaciones.',
  landscapePostureTitle: 'Agregado y sin nombres por diseño.',
  landscapePostureBody:
    'En esta vista no se nombra a ninguna empresa. Las cifras son hechos de ámbito y plazo en una jurisdicción, nunca una conclusión de que una organización incumpla. El objetivo es la divulgación de ayuda primero, no la sanción.',
  jurisdiction: 'Jurisdicción',
  allCoveredJurisdictions: 'Todas las jurisdicciones cubiertas',
  entitiesTracked: 'Entidades supervisadas',
  frameworksInScope: 'Marcos en el ámbito',
  distinctBindingFrameworks: 'marcos vinculantes distintos rigen este grupo',
  nearestDeadline: 'Plazo más cercano',
  daysLabel: '{days} días',
  noDatedObligation: 'No se ha resuelto ninguna obligación con fecha.',
  inScopeByFramework: 'En el ámbito por marco',
  noInScopeObligation: 'Aún ningún marco vinculante resuelve una obligación dentro del ámbito para este grupo.',
  pressureDistribution: 'Distribución de la presión de cumplimiento',
  entitiesCount: '{count} entidades',
  pressureNote:
    'Presión = proximidad del plazo × confianza del ámbito: una señal de priorización de quién necesita ayuda antes, no una puntuación de cumplimiento ni una probabilidad de infracción. Las barras son recuentos anónimos de entidades.',
  landscapeFootnote:
    'Cifras agregadas derivadas del grafo de inteligencia de CSOAI. En esta página no se identifica a ninguna organización. Para una colaboración de ayuda primero a nivel de jurisdicción, contacta con el programa regulatorio de CSOAI. No es asesoramiento legal.',
  bucketLow: 'Bajo',
  bucketModest: 'Modesto',
  bucketModerate: 'Moderado',
  bucketElevated: 'Elevado',
  bucketUrgent: 'Urgente',
};

export default es;
