// Portuguese (pt). UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const pt: Dict = {
  subtitle:
    'As regulamentações de IA do mundo, mapeadas. Clique em qualquer país para ver os marcos que vinculam ali, os padrões globais que se aplicam em todo lugar e as correspondências da CSOAI — depois sobreponha suas ferramentas pela barra lateral. Um único perfil, o planeta inteiro.',
  searchPlaceholder: 'Encontrar um país…',
  searchAria: 'Pesquisar um país',
  frameworkOverlay: 'Camada de marcos',
  csoaiTools: 'Ferramentas CSOAI',
  language: 'Idioma',
  statusBar:
    '{jurisdictions} jurisdições com legislação específica de IA · {frameworks} marcos · {countries} países ativos · arraste para mover, role para ampliar',
  statusLoading: '—',
  zoomIn: 'Ampliar',
  zoomOut: 'Reduzir',
  resetView: 'Redefinir visualização',
  atlasError: 'Não foi possível carregar o atlas do mapa ({error}). Verifique a conexão e recarregue.',
  atlasLoading: 'Carregando atlas mundial…',
  hoverNational: '{name} · {count} marco(s) nacional(is)',
  hoverGlobalSuffix: ' · padrões globais se aplicam',
  legendDensity: 'Densidade regulatória:',
  densityNone: 'nenhuma',
  densityLight: 'leve',
  densityModerate: 'moderada',
  densityDense: 'densa',
  region: 'Região',
  nationalLaw: 'Legislação de IA nacional / de bloco ({count})',
  globalStandards: 'Padrões globais que também se aplicam ({count})',
  closePanel: 'Fechar painel da região',
  emptyState:
    'Ainda não há legislação vinculante específica de IA catalogada aqui. Os padrões globais abaixo continuam se aplicando, e a CSOAI está monitorando esta jurisdição — {flagLink}.',
  emptyStateFlagLink: 'sinalizar uma novidade',
  binding: 'vinculante',
  voluntary: 'voluntário',
  effective: 'Em vigor: {date}',
  csoaiCrosswalk: 'Correspondência CSOAI',

  headlineDeadlinePrefix: 'Próximo prazo vinculativo',
  daysOut: 'faltam {days} dias',
  entityHoverSystems: '{count} sistemas',
  inScopeCount: '{count} no âmbito',
  complianceDeadlines: 'Prazos de conformidade ({count})',
  companiesHere: 'Empresas de IA e robótica aqui ({count})',
  helpFirstSignals: 'Sinais de ajuda primeiro — âmbito + prazo, não um veredito',
  helpComply: 'Ajudar esta organização a cumprir →',

  radarSubtitle:
    'Cada próximo prazo de regulação de IA da Terra, num só relógio — os mais próximos primeiro. O sistema já sabe quando cada obrigação entra em vigor, para que nenhum limite o apanhe de surpresa.',
  nextBindingAnywhere: 'Próximo prazo vinculativo em qualquer lugar',
  daysOutShort: 'dias restantes',
  filter: 'Filtrar',
  bindingOnly: 'Apenas vinculativos',
  bindingOnlyActive: 'Apenas vinculativos ✓',
  allJurisdictions: 'Todas as jurisdições',
  radarCount: '{upcoming} a chegar · {binding} vinculativos',
  radarEmpty: 'Nenhum prazo a chegar corresponde a estes filtros. Tente remover o filtro de jurisdição ou de vinculativos.',
  radarFootnote:
    'As datas são extraídas do texto de entrada em vigor publicado de cada estrutura. As contagens decrescentes são calculadas em tempo real face a hoje. Este radar regista quando as obrigações entram em vigor — não é aconselhamento jurídico.',
  bindingBadge: 'Vinculativo',
  voluntaryBadge: 'Voluntário',
  global: 'Global',

  inForce: 'em vigor',
  oneDay: '1 dia',
  daysCountdown: '{days} dias',

  landscapeSubtitle:
    'Inteligência agregada do panorama para reguladores e decisores políticos — quem está no âmbito e quando, para que o mercado possa ser ajudado a cumprir. É um mapa estrutural de obrigações e prazos, não um registo de acusações.',
  landscapePostureTitle: 'Agregado e sem nomes por conceção.',
  landscapePostureBody:
    'Nenhuma empresa é nomeada nesta vista. Os números são factos de âmbito e prazo numa jurisdição — nunca uma conclusão de que uma organização não cumpre. O objetivo é a abordagem de ajuda primeiro, não a aplicação coerciva.',
  jurisdiction: 'Jurisdição',
  allCoveredJurisdictions: 'Todas as jurisdições abrangidas',
  entitiesTracked: 'Entidades monitorizadas',
  frameworksInScope: 'Estruturas no âmbito',
  distinctBindingFrameworks: 'estruturas vinculativas distintas vinculam esta coorte',
  nearestDeadline: 'Prazo mais próximo',
  daysLabel: '{days} dias',
  noDatedObligation: 'Nenhuma obrigação datada foi resolvida.',
  inScopeByFramework: 'No âmbito por estrutura',
  noInScopeObligation: 'Ainda nenhuma estrutura vinculativa resolve uma obrigação no âmbito para esta coorte.',
  pressureDistribution: 'Distribuição da pressão de conformidade',
  entitiesCount: '{count} entidades',
  pressureNote:
    'Pressão = proximidade do prazo × confiança do âmbito — um sinal de priorização de quem precisa de ajuda mais cedo, não uma pontuação de conformidade nem uma probabilidade de infração. As barras são contagens anónimas de entidades.',
  landscapeFootnote:
    'Números agregados derivados do grafo de inteligência da CSOAI. Nenhuma organização é identificada nesta página. Para um envolvimento de ajuda primeiro ao nível da jurisdição, contacte o programa regulatório da CSOAI. Não é aconselhamento jurídico.',
  bucketLow: 'Baixa',
  bucketModest: 'Modesta',
  bucketModerate: 'Moderada',
  bucketElevated: 'Elevada',
  bucketUrgent: 'Urgente',
};

export default pt;
