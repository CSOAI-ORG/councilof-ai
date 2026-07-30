/**
 * Compliance Workflows — guided, multi-step journeys launched from the map's tools
 * drawer for a selected country/company. Each step links to a real CSOAI tool/page
 * and cites the real obligation it satisfies. Help-first: these help orgs PREPARE.
 * Self-contained (own types); read by OpenGridWorks' Tools drawer.
 */

export type WorkflowTrigger =
  | 'high-risk' | 'gpai' | 'deployer' | 'provider' | 'incident' | 'certification' | 'general';

export interface WorkflowStep {
  title: string;
  description: string;
  href?: string;          // a real CSOAI route the step launches
  tool?: string;          // CSOAI_TOOLS id this step maps to (classify/assess/…)
  frameworkSlug?: string;
  cite?: string;          // the article/clause the step satisfies
}

export interface Workflow {
  slug: string;
  title: string;
  description: string;
  frameworkSlugs: string[];
  trigger: WorkflowTrigger;
  estMinutes?: number;
  steps: WorkflowStep[];
}

export const WORKFLOWS: Workflow[] = [
  {
    slug: 'eu-ai-act-high-risk-readiness',
    title: 'EU AI Act — High-Risk System Readiness',
    description: 'End-to-end path to conformity for an Annex III high-risk AI system before the 2 Aug 2026 / 2 Dec 2027 cliffs.',
    frameworkSlugs: ['eu-ai-act'], trigger: 'high-risk', estMinutes: 30,
    steps: [
      { title: 'Classify the system', description: 'Determine whether your AI is high-risk under Annex III.', href: '/eu-ai-act-classifier', tool: 'classify', frameworkSlug: 'eu-ai-act', cite: 'Annex III' },
      { title: 'Risk-management system', description: 'Stand up the continuous RMS and gap-assess against it.', href: '/compliance', tool: 'assess', frameworkSlug: 'eu-ai-act', cite: 'Art. 9' },
      { title: 'Technical documentation', description: 'Assemble Annex IV technical documentation + logging.', href: '/compliance', tool: 'assess', frameworkSlug: 'eu-ai-act', cite: 'Art. 11–12' },
      { title: 'Human oversight & accuracy', description: 'Design human-oversight measures and robustness controls.', href: '/compliance', tool: 'assess', frameworkSlug: 'eu-ai-act', cite: 'Art. 14–15' },
      { title: 'Sign the attestation', description: 'Issue an Ed25519-signed CSOAI attestation of conformity.', href: '/crosswalks', tool: 'crosswalk', frameworkSlug: 'eu-ai-act', cite: 'Art. 43' },
    ],
  },
  {
    slug: 'eu-ai-act-gpai-transparency',
    title: 'EU AI Act — GPAI & Transparency',
    description: 'Meet GPAI provider duties and Article 50 transparency / content-labelling obligations (binding 2 Aug 2026).',
    frameworkSlugs: ['eu-ai-act'], trigger: 'gpai', estMinutes: 20,
    steps: [
      { title: 'Confirm GPAI scope', description: 'Establish whether you place a general-purpose AI model on the EU market.', href: '/eu-ai-act-classifier', tool: 'classify', frameworkSlug: 'eu-ai-act', cite: 'Art. 51–53' },
      { title: 'Model documentation', description: 'Prepare GPAI technical documentation + training-data summary.', href: '/compliance', tool: 'assess', frameworkSlug: 'eu-ai-act', cite: 'Art. 53, Annex XI' },
      { title: 'Transparency disclosures', description: 'Label AI-generated content and disclose AI interaction to users.', href: '/compliance', tool: 'assess', frameworkSlug: 'eu-ai-act', cite: 'Art. 50' },
    ],
  },
  {
    slug: 'ai-incident-reporting',
    title: 'Serious AI Incident Reporting',
    description: 'Detect, triage and report a serious AI incident to the authorities within the legal clock.',
    frameworkSlugs: ['eu-ai-act'], trigger: 'incident', estMinutes: 15,
    steps: [
      { title: 'Report the incident', description: 'Log the serious incident or malfunction.', href: '/watchdog', tool: 'watchdog', frameworkSlug: 'eu-ai-act', cite: 'Art. 73' },
      { title: 'Assess severity & scope', description: 'Classify severity and affected systems/users.', href: '/compliance', tool: 'assess', frameworkSlug: 'eu-ai-act', cite: 'Art. 73' },
      { title: 'Notify the authority', description: 'File with the market-surveillance authority within the deadline.', href: '/watchdog', tool: 'watchdog', frameworkSlug: 'eu-ai-act', cite: 'Art. 73' },
    ],
  },
  {
    slug: 'iso-42001-certification',
    title: 'ISO/IEC 42001 — AI Management System',
    description: 'Build and certify an AI Management System (AIMS) on the PDCA cycle.',
    frameworkSlugs: ['iso-42001'], trigger: 'certification', estMinutes: 40,
    steps: [
      { title: 'Gap assessment', description: 'Assess against the 10 clauses + Annex A controls.', href: '/compliance', tool: 'assess', frameworkSlug: 'iso-42001', cite: 'Clauses 4–10' },
      { title: 'Build the AIMS', description: 'Establish policy, roles, risk + impact assessment process.', href: '/compliance', tool: 'assess', frameworkSlug: 'iso-42001', cite: 'Annex A' },
      { title: 'Certify', description: 'Take the certification path and evidence the controls.', href: '/certification', tool: 'certify', frameworkSlug: 'iso-42001' },
    ],
  },
  {
    slug: 'nist-ai-rmf',
    title: 'NIST AI RMF Implementation',
    description: 'Operationalise the four functions — Govern, Map, Measure, Manage.',
    frameworkSlugs: ['nist-ai-rmf'], trigger: 'general', estMinutes: 30,
    steps: [
      { title: 'Govern', description: 'Establish governance, roles and accountability.', href: '/compliance', tool: 'assess', frameworkSlug: 'nist-ai-rmf', cite: 'GOVERN' },
      { title: 'Map', description: 'Map context, use, and risks of the AI system.', href: '/compliance', tool: 'assess', frameworkSlug: 'nist-ai-rmf', cite: 'MAP' },
      { title: 'Measure', description: 'Measure trustworthiness characteristics + impacts.', href: '/compliance', tool: 'assess', frameworkSlug: 'nist-ai-rmf', cite: 'MEASURE' },
      { title: 'Manage', description: 'Prioritise, respond to and monitor risks.', href: '/compliance', tool: 'assess', frameworkSlug: 'nist-ai-rmf', cite: 'MANAGE' },
    ],
  },
  {
    slug: 'content-provenance-watermarking',
    title: 'Content Provenance & Watermarking',
    description: 'Implement C2PA content credentials + AI-content labelling for transparency duties.',
    frameworkSlugs: ['eu-ai-act'], trigger: 'provider', estMinutes: 20,
    steps: [
      { title: 'Mark AI-generated output', description: 'Apply machine-readable marking to AI-generated content.', href: '/compliance', tool: 'assess', frameworkSlug: 'eu-ai-act', cite: 'Art. 50(2)' },
      { title: 'C2PA content credentials', description: 'Attach C2PA provenance manifests to media.', href: '/crosswalks', tool: 'crosswalk', frameworkSlug: 'eu-ai-act' },
      { title: 'Attest provenance', description: 'Issue a signed provenance attestation.', href: '/crosswalks', tool: 'crosswalk', frameworkSlug: 'eu-ai-act' },
    ],
  },
  {
    slug: 'gdpr-dpia',
    title: 'GDPR DPIA for High-Risk AI',
    description: 'Run a Data Protection Impact Assessment where AI processing is high-risk.',
    frameworkSlugs: ['gdpr'], trigger: 'high-risk', estMinutes: 25,
    steps: [
      { title: 'Screen for DPIA', description: 'Determine if processing is likely high-risk to data subjects.', href: '/compliance', tool: 'assess', frameworkSlug: 'gdpr', cite: 'Art. 35(1)' },
      { title: 'Assess automated decisions', description: 'Document safeguards for automated decision-making.', href: '/compliance', tool: 'assess', frameworkSlug: 'gdpr', cite: 'Art. 22' },
      { title: 'Mitigate & record', description: 'Record measures addressing the identified risks.', href: '/compliance', tool: 'assess', frameworkSlug: 'gdpr', cite: 'Art. 35(7)' },
    ],
  },
  {
    slug: 'dora-ict-incident',
    title: 'DORA ICT Incident (Financial)',
    description: 'Meet DORA major-ICT-incident reporting for the financial sector — the 4-hour clock.',
    frameworkSlugs: ['dora'], trigger: 'incident', estMinutes: 15,
    steps: [
      { title: 'Classify the incident', description: 'Determine if it is a major ICT-related incident.', href: '/compliance', tool: 'assess', frameworkSlug: 'dora', cite: 'Art. 18' },
      { title: 'Initial notification', description: 'Submit initial notification within the regulatory window.', href: '/watchdog', tool: 'watchdog', frameworkSlug: 'dora', cite: 'Art. 19' },
      { title: 'Intermediate & final reports', description: 'Follow up with intermediate and final reports.', href: '/watchdog', tool: 'watchdog', frameworkSlug: 'dora', cite: 'Art. 19' },
    ],
  },
  {
    slug: 'nis2-incident',
    title: 'NIS2 Incident Reporting',
    description: 'Essential/important entities: 24h early warning → 72h incident → 1-month final report.',
    frameworkSlugs: ['nis2'], trigger: 'incident', estMinutes: 15,
    steps: [
      { title: '24h early warning', description: 'Submit an early warning within 24 hours of becoming aware.', href: '/watchdog', tool: 'watchdog', frameworkSlug: 'nis2', cite: 'Art. 23' },
      { title: '72h incident notification', description: 'Provide an incident notification within 72 hours.', href: '/watchdog', tool: 'watchdog', frameworkSlug: 'nis2', cite: 'Art. 23' },
      { title: '1-month final report', description: 'Deliver the final report within one month.', href: '/watchdog', tool: 'watchdog', frameworkSlug: 'nis2', cite: 'Art. 23' },
    ],
  },
  {
    slug: 'korea-ai-basic-act-readiness',
    title: 'Korea AI Basic Act — High-Impact AI',
    description: 'Prepare for high-impact AI obligations and generative-AI labelling (effective 22 Jan 2026).',
    frameworkSlugs: ['korea-ai-basic-act'], trigger: 'high-risk', estMinutes: 20,
    steps: [
      { title: 'Determine high-impact status', description: 'Assess whether your AI is "high-impact" under the Act.', href: '/eu-ai-act-classifier', tool: 'classify', frameworkSlug: 'korea-ai-basic-act' },
      { title: 'Safety & risk management', description: 'Implement the required risk-management and human-oversight measures.', href: '/compliance', tool: 'assess', frameworkSlug: 'korea-ai-basic-act' },
      { title: 'GenAI labelling', description: 'Label generative-AI outputs as required.', href: '/compliance', tool: 'assess', frameworkSlug: 'korea-ai-basic-act' },
    ],
  },
  {
    slug: 'cross-framework-crosswalk',
    title: 'Multi-Framework Crosswalk',
    description: 'Map one set of controls across EU AI Act ⇄ NIST AI RMF ⇄ ISO 42001 to comply once, satisfy many.',
    frameworkSlugs: ['eu-ai-act', 'nist-ai-rmf', 'iso-42001'], trigger: 'general', estMinutes: 15,
    steps: [
      { title: 'Pick your baseline', description: 'Choose the framework you already align to.', href: '/crosswalks', tool: 'crosswalk' },
      { title: 'Crosswalk the controls', description: 'Map controls across the target frameworks.', href: '/crosswalks', tool: 'crosswalk' },
      { title: 'Close the gaps', description: 'Assess and remediate the deltas the crosswalk surfaces.', href: '/compliance', tool: 'assess' },
    ],
  },
];

export function workflowsForFramework(slug: string): Workflow[] {
  return WORKFLOWS.filter((w) => w.frameworkSlugs.includes(slug));
}

export function workflowsForTriggers(triggers: string[]): Workflow[] {
  if (!triggers.length) return WORKFLOWS;
  return WORKFLOWS.filter((w) => triggers.includes(w.trigger));
}
