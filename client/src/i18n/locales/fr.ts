// French (fr). UI chrome only — framework legal content stays as-authored in source data.
import type { Dict } from './en';

const fr: Dict = {
  subtitle:
    "Les réglementations de l'IA dans le monde, cartographiées. Cliquez sur n'importe quel pays pour voir les cadres qui s'y appliquent, les normes mondiales valables partout et les correspondances CSOAI — puis superposez vos outils depuis la barre latérale. Un seul profil, la planète entière.",
  searchPlaceholder: 'Rechercher un pays…',
  searchAria: 'Rechercher un pays',
  frameworkOverlay: 'Calque des cadres',
  csoaiTools: 'Outils CSOAI',
  language: 'Langue',
  statusBar:
    "{jurisdictions} juridictions dotées d'une législation propre à l'IA · {frameworks} cadres · {countries} pays actifs · glissez pour déplacer, faites défiler pour zoomer",
  statusLoading: '—',
  zoomIn: 'Zoom avant',
  zoomOut: 'Zoom arrière',
  resetView: 'Réinitialiser la vue',
  atlasError: "Impossible de charger l'atlas de la carte ({error}). Vérifiez la connexion et rechargez.",
  atlasLoading: "Chargement de l'atlas mondial…",
  hoverNational: '{name} · {count} cadre(s) national(aux)',
  hoverGlobalSuffix: ' · normes mondiales applicables',
  legendDensity: 'Densité réglementaire :',
  densityNone: 'aucune',
  densityLight: 'faible',
  densityModerate: 'modérée',
  densityDense: 'dense',
  region: 'Région',
  nationalLaw: 'Législation IA nationale / de bloc ({count})',
  globalStandards: "Normes mondiales également applicables ({count})",
  closePanel: 'Fermer le panneau de région',
  emptyState:
    "Aucune législation contraignante propre à l'IA répertoriée ici pour l'instant. Les normes mondiales ci-dessous s'appliquent toujours, et CSOAI surveille cette juridiction — {flagLink}.",
  emptyStateFlagLink: 'signaler une évolution',
  binding: 'contraignant',
  voluntary: 'volontaire',
  effective: "En vigueur : {date}",
  csoaiCrosswalk: 'Correspondance CSOAI',

  headlineDeadlinePrefix: 'Prochaine échéance contraignante',
  daysOut: 'dans {days} jours',
  entityHoverSystems: '{count} systèmes',
  inScopeCount: '{count} dans le champ',
  complianceDeadlines: 'Échéances de conformité ({count})',
  companiesHere: 'Entreprises d’IA et de robotique ici ({count})',
  helpFirstSignals: 'Signaux d’aide d’abord — champ + échéance, pas un verdict',
  helpComply: 'Aider cette organisation à se mettre en conformité →',

  radarSubtitle:
    'Chaque prochaine échéance de réglementation de l’IA sur Terre, sur une seule horloge — les plus proches d’abord. Le système sait déjà quand chaque obligation s’applique, pour ne jamais être surpris par une échéance.',
  nextBindingAnywhere: 'Prochaine échéance contraignante, où que ce soit',
  daysOutShort: 'jours restants',
  filter: 'Filtrer',
  bindingOnly: 'Contraignantes uniquement',
  bindingOnlyActive: 'Contraignantes uniquement ✓',
  allJurisdictions: 'Toutes les juridictions',
  radarCount: '{upcoming} à venir · {binding} contraignantes',
  radarEmpty: 'Aucune échéance à venir ne correspond à ces filtres. Essayez de retirer le filtre de juridiction ou de contraintes.',
  radarFootnote:
    'Les dates sont extraites du texte d’entrée en vigueur publié de chaque cadre. Les comptes à rebours sont calculés en direct par rapport à aujourd’hui. Ce radar indique quand les obligations prennent effet — ce n’est pas un avis juridique.',
  bindingBadge: 'Contraignant',
  voluntaryBadge: 'Volontaire',
  global: 'Mondial',

  inForce: 'en vigueur',
  oneDay: '1 jour',
  daysCountdown: '{days} jours',

  landscapeSubtitle:
    'Intelligence agrégée du paysage pour les régulateurs et les décideurs — qui est dans le champ et quand, afin d’aider le marché à se conformer. Il s’agit d’une carte structurelle des obligations et des échéances, non d’un registre d’accusations.',
  landscapePostureTitle: 'Agrégé et sans noms par conception.',
  landscapePostureBody:
    'Aucune entreprise n’est nommée dans cette vue. Les chiffres sont des faits de champ et d’échéance à l’échelle d’une juridiction — jamais une conclusion qu’une organisation est non conforme. Le but est une démarche d’aide d’abord, pas la sanction.',
  jurisdiction: 'Juridiction',
  allCoveredJurisdictions: 'Toutes les juridictions couvertes',
  entitiesTracked: 'Entités suivies',
  frameworksInScope: 'Cadres dans le champ',
  distinctBindingFrameworks: 'cadres contraignants distincts s’appliquent à cette cohorte',
  nearestDeadline: 'Échéance la plus proche',
  daysLabel: '{days} jours',
  noDatedObligation: 'Aucune obligation datée résolue.',
  inScopeByFramework: 'Dans le champ par cadre',
  noInScopeObligation: 'Aucun cadre contraignant ne résout encore une obligation dans le champ pour cette cohorte.',
  pressureDistribution: 'Répartition de la pression de conformité',
  entitiesCount: '{count} entités',
  pressureNote:
    'Pression = proximité de l’échéance × confiance du champ — un signal de priorisation indiquant qui a besoin d’aide le plus tôt, et non un score de conformité ni une probabilité de manquement. Les barres sont des décomptes anonymes d’entités.',
  landscapeFootnote:
    'Chiffres agrégés issus du graphe d’intelligence CSOAI. Aucune organisation n’est identifiée sur cette page. Pour un engagement d’aide d’abord au niveau d’une juridiction, contactez le programme réglementaire CSOAI. Ceci n’est pas un avis juridique.',
  bucketLow: 'Faible',
  bucketModest: 'Modeste',
  bucketModerate: 'Modérée',
  bucketElevated: 'Élevée',
  bucketUrgent: 'Urgente',
};

export default fr;
