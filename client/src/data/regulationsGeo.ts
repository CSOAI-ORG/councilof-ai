/**
 * OpenGridWorks regulation geo-data — maps CSOAI frameworks (see frameworks.ts)
 * onto geography so the world map can show, for any region, which AI regulations
 * apply + the CSOAI crosswalk for each. Region granularity is national/bloc
 * (AI law is national/EU-level today); the map supports deeper zoom for when
 * state/county data lands.
 */
import { FRAMEWORKS, type Framework } from './frameworks';

// ISO 3166-1 alpha-3 (matches world-atlas TopoJSON `id`) → framework slugs that bind/apply there.
// Org/standards frameworks (ISO, OECD, UNESCO, IEEE, G7/G20, FLI, AI-company specs) are GLOBAL — see GLOBAL_SLUGS.
const EU27 = [
  'AUT','BEL','BGR','HRV','CYP','CZE','DNK','EST','FIN','FRA','DEU','GRC','HUN',
  'IRL','ITA','LVA','LTU','LUX','MLT','NLD','POL','PRT','ROU','SVK','SVN','ESP','SWE',
];

const EU_SLUGS = ['eu-ai-act','dora','nis2','cra','gdpr'];

export const COUNTRY_FRAMEWORKS: Record<string, string[]> = {
  ...Object.fromEntries(EU27.map((c) => [c, EU_SLUGS])),
  GBR: ['uk-aisi','uk-ai-approach','gdpr'],          // UK — no comprehensive statute; AISI + pro-innovation approach + UK GDPR
  // US — no federal AI law; voluntary RMF + Colorado + sub-national state statutes (several binding/in force)
  USA: ['nist-ai-rmf','hipaa','colorado-ai-act','california-sb1001-bots','california-ab2013-training-data','california-sb942-transparency','illinois-bipa','illinois-hb3773-employment','nyc-local-law-144','texas-traiga','utah-ai-policy-act'],
  KOR: ['korea-ai-basic-act'],                      // South Korea — binding (in force 22 Jan 2026)
  CHN: ['china-genai-measures'],                    // China — binding CAC GenAI/deep-synthesis/algorithm rules
  JPN: ['japan-ai-promotion-act'],                  // Japan — in force but non-punitive (binding:false)
  SGP: ['singapore-agentic-ai'],                    // Singapore — voluntary Model AI Governance + agentic guidance
  CAN: ['canada-aida','quebec-law-25-adm'],         // Canada — AIDA lapsed (not binding) + Quebec Law 25 ADM (binding, in force)
  AUS: ['australia-voluntary-ai-standard'],         // Australia — voluntary standard; mandatory guardrails pending
  IND: ['india-it-synthetic-rules'],                // India — binding AI/deepfake content rules; no horizontal AI law
  // National AI statutes in force (binding)
  VNM: ['vietnam-ai-law'],                          // Vietnam — binding AI Law in force 1 Mar 2026
  TWN: ['taiwan-ai-basic-act'],                     // Taiwan — binding AI Basic Act (framework) in force 14 Jan 2026
  PER: ['peru-ai-law'],                             // Peru — binding AI law + in-force implementing regulation
  // National bills / voluntary frameworks (not binding AI law)
  BRA: ['brazil-pl2338'],                           // Brazil — risk-based AI bill, pending in Chamber
  CHL: ['chile-ai-bill'],                           // Chile — AI bill passed lower house, in Senate
  CHE: ['switzerland-ai-approach'],                 // Switzerland — sectoral + CoE Convention ratification (no statute)
  NOR: ['norway-ai-eea'],                           // Norway — EU AI Act pending EEA incorporation; KI-loven draft
  ARE: ['uae-ai-charter'],                          // UAE — voluntary charter/strategy (DIFC Reg 10 free-zone only)
  SAU: ['saudi-sdaia-ai-ethics'],                   // Saudi Arabia — voluntary SDAIA ethics principles
  ISR: ['israel-ai-policy'],                        // Israel — voluntary AI policy & ethics
  EGY: ['egypt-ai-charter'],                        // Egypt — voluntary charter + strategy
  TUR: ['turkey-ai-bill'],                          // Turkey — draft AI law pending
  NGA: ['nigeria-ai-strategy'],                     // Nigeria — voluntary national AI strategy
  KEN: ['kenya-ai-strategy'],                       // Kenya — voluntary national AI strategy
  ZAF: ['south-africa-ai-policy'],                  // South Africa — draft AI policy framework
  RWA: ['rwanda-ai-policy'],                        // Rwanda — voluntary national AI policy
  IDN: ['indonesia-ai-ethics'],                     // Indonesia — voluntary AI ethics circular
  PHL: ['philippines-ai-bills'],                    // Philippines — AI bills pending
  NZL: ['new-zealand-algorithm-charter'],           // New Zealand — voluntary algorithm charter
  PAK: ['pakistan-ai-policy'],                      // Pakistan — voluntary national AI policy
  MYS: ['malaysia-ai-guidelines'],                  // Malaysia — voluntary AI governance & ethics guidelines
  THA: ['thailand-ai-draft'],                       // Thailand — draft AI law (status contested)
};

// Frameworks that apply everywhere (standards, intergovernmental, voluntary, AI-company specs).
export const GLOBAL_SLUGS = FRAMEWORKS
  .filter((f) => ['ISO/IEC','OECD','UNESCO','IEEE','G7/G20','FLI','AI Company','CSOAI Original','CSOAI','Council of Europe','Amnesty','Université de Montréal','BAAI','Intergovernmental','Regional Bloc'].includes(f.region))
  .map((f) => f.slug);

export function frameworkBySlug(slug: string): Framework | undefined {
  return FRAMEWORKS.find((f) => f.slug === slug);
}

/** All frameworks that apply to a country = its national/bloc ones + the global set. */
export function frameworksForCountry(iso3: string): Framework[] {
  const national = (COUNTRY_FRAMEWORKS[iso3] || []).map(frameworkBySlug).filter(Boolean) as Framework[];
  const global = GLOBAL_SLUGS.map(frameworkBySlug).filter(Boolean) as Framework[];
  // national first (binding/most relevant), then global standards
  return [...national, ...global];
}

/** Coverage score 0-3 by count of BINDING national frameworks — drives the choropleth heat. */
export function coverageLevel(iso3: string): number {
  const binding = (COUNTRY_FRAMEWORKS[iso3] || [])
    .map(frameworkBySlug)
    .filter((f) => f?.binding).length;
  if (binding >= 4) return 3;
  if (binding >= 2) return 2;
  if (binding >= 1) return 1;
  return 0;
}

// Human-readable country names for the panel (the atlas gives codes/names; this is a fallback for our keyed set).
export const COUNTRY_NAMES: Record<string, string> = {
  USA: 'United States', GBR: 'United Kingdom', KOR: 'South Korea', SGP: 'Singapore',
  CHN: 'China', CAN: 'Canada', DEU: 'Germany', FRA: 'France', ITA: 'Italy', ESP: 'Spain',
  NLD: 'Netherlands', IRL: 'Ireland', POL: 'Poland', SWE: 'Sweden',
  JPN: 'Japan', IND: 'India', AUS: 'Australia', VNM: 'Vietnam', TWN: 'Taiwan',
  PER: 'Peru', BRA: 'Brazil', CHL: 'Chile', CHE: 'Switzerland', NOR: 'Norway',
  ARE: 'United Arab Emirates', SAU: 'Saudi Arabia', ISR: 'Israel', EGY: 'Egypt',
  TUR: 'Turkey', NGA: 'Nigeria', KEN: 'Kenya', ZAF: 'South Africa', RWA: 'Rwanda',
  IDN: 'Indonesia', PHL: 'Philippines', NZL: 'New Zealand', PAK: 'Pakistan',
  MYS: 'Malaysia', THA: 'Thailand',
};

// CSOAI tools/features that overlay onto a region from the sidebar (the "use one profile" layer).
export type OverlayTool = { id: string; label: string; blurb: string; href: string; color: string };
export const CSOAI_TOOLS: OverlayTool[] = [
  { id: 'classify', label: 'Classify a system',   blurb: 'Free EU AI Act risk classifier — is your AI high-risk here?', href: '/eu-ai-act-classifier', color: '#34d399' },
  { id: 'assess',   label: 'Run Assessment',      blurb: 'Score this region\'s frameworks against your AI system.', href: '/compliance', color: '#10b981' },
  { id: 'watchdog', label: 'Watchdog',            blurb: 'AI-incident reports & obligations for this jurisdiction.', href: '/watchdog', color: '#38bdf8' },
  { id: 'certify',  label: 'Get Certified',       blurb: 'CEASAI certification mapped to local requirements.',      href: '/certification', color: '#f59e0b' },
  { id: 'mcp',      label: 'MCP Tools',           blurb: '293 compliance MCP servers callable per framework.',      href: '/mcp', color: '#a78bfa' },
  { id: 'crosswalk',label: 'Crosswalks',          blurb: 'EU AI Act ⇄ NIST ⇄ ISO 42001 mappings.',                  href: '/crosswalks', color: '#f472b6' },
];

// world-atlas feature `id` is ISO 3166-1 NUMERIC; map the codes we hold data for → alpha-3.
// Compare by parseInt to be robust to leading-zero formatting.
// Complete ISO 3166-1 NUMERIC → alpha-3 for every country in the world-atlas (110m) dataset.
// Verified against the atlas `id` values (174 features carry a numeric id; N. Cyprus,
// Somaliland, Kosovo have no ISO numeric id in this dataset and are unmapped by design).
// MLT (470) / SGP (702) are not present in the 110m atlas geometry but kept for our keyed data.
export const NUMERIC_TO_A3: Record<number, string> = {
  4:'AFG',8:'ALB',10:'ATA',12:'DZA',24:'AGO',31:'AZE',32:'ARG',36:'AUS',40:'AUT',44:'BHS',
  50:'BGD',51:'ARM',56:'BEL',64:'BTN',68:'BOL',70:'BIH',72:'BWA',76:'BRA',84:'BLZ',90:'SLB',
  96:'BRN',100:'BGR',104:'MMR',108:'BDI',112:'BLR',116:'KHM',120:'CMR',124:'CAN',140:'CAF',
  144:'LKA',148:'TCD',152:'CHL',156:'CHN',158:'TWN',170:'COL',178:'COG',180:'COD',188:'CRI',
  191:'HRV',192:'CUB',196:'CYP',203:'CZE',204:'BEN',208:'DNK',214:'DOM',218:'ECU',222:'SLV',
  226:'GNQ',231:'ETH',232:'ERI',233:'EST',238:'FLK',242:'FJI',246:'FIN',250:'FRA',260:'ATF',
  262:'DJI',266:'GAB',268:'GEO',270:'GMB',275:'PSE',276:'DEU',288:'GHA',300:'GRC',304:'GRL',
  320:'GTM',324:'GIN',328:'GUY',332:'HTI',340:'HND',348:'HUN',352:'ISL',356:'IND',360:'IDN',
  364:'IRN',368:'IRQ',372:'IRL',376:'ISR',380:'ITA',384:'CIV',388:'JAM',392:'JPN',398:'KAZ',
  400:'JOR',404:'KEN',408:'PRK',410:'KOR',414:'KWT',417:'KGZ',418:'LAO',422:'LBN',426:'LSO',
  428:'LVA',430:'LBR',434:'LBY',440:'LTU',442:'LUX',450:'MDG',454:'MWI',458:'MYS',466:'MLI',
  470:'MLT',478:'MRT',484:'MEX',496:'MNG',498:'MDA',499:'MNE',504:'MAR',508:'MOZ',512:'OMN',
  516:'NAM',524:'NPL',528:'NLD',540:'NCL',548:'VUT',554:'NZL',558:'NIC',562:'NER',566:'NGA',
  578:'NOR',586:'PAK',591:'PAN',598:'PNG',600:'PRY',604:'PER',608:'PHL',616:'POL',620:'PRT',
  624:'GNB',626:'TLS',630:'PRI',634:'QAT',642:'ROU',643:'RUS',646:'RWA',682:'SAU',686:'SEN',
  688:'SRB',694:'SLE',702:'SGP',703:'SVK',704:'VNM',705:'SVN',706:'SOM',710:'ZAF',716:'ZWE',
  724:'ESP',728:'SSD',729:'SDN',732:'ESH',740:'SUR',748:'SWZ',752:'SWE',756:'CHE',760:'SYR',
  762:'TJK',764:'THA',768:'TGO',780:'TTO',784:'ARE',788:'TUN',792:'TUR',795:'TKM',800:'UGA',
  804:'UKR',807:'MKD',818:'EGY',826:'GBR',834:'TZA',840:'USA',854:'BFA',858:'URY',860:'UZB',
  862:'VEN',887:'YEM',894:'ZMB',
};
export function isoFromNumeric(id: string | number): string | undefined {
  return NUMERIC_TO_A3[parseInt(String(id), 10)];
}

// World atlas TopoJSON (countries, 110m) from a CDN — keeps the bundle light.
export const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
