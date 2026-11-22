import type { Slide } from "@/components/scrollworld";

/**
 * /accountability-loop is a proposed report-to-evidence workflow.
 * Public incident intake, protected case handling, accepted reviewers and a
 * complaint compiler are not established by this design. Read-only public
 * claim records and corrections are separate operating surfaces.
 * Source artwork is retained; current explanatory copy is maintained here.
 */
export const LOOP_HERO = {
  kicker: "A proposed workflow — public incident intake is closed",
  title: "From an observation to a reviewable evidence packet",
  lede: "A useful incident review needs more than an allegation: sources, context, privacy, a fair opportunity to respond and a record of what the evidence supports. This design describes those steps. Council currently provides public claim records and corrections; it does not accept public incident reports through this page.",
  bg: {
    src: "/images/loop/outcry.webp",
    alt: "Three metal pillars under a glass panel showing an unstructured signal trace",
  },
  actions: [
    {
      href: "/watchdog/",
      label: "Inspect public claim records",
      primary: true,
    },
    { href: "/honesty", label: "Measurement scope and limitations" },
  ],
};

export const LOOP_SLIDES: Slide[] = [
  {
    kicker: "The review problem",
    title: "Keep allegations, evidence and decisions separate",
    body: "Publishing an unverified allegation can expose people to harm, compromise privacy and make fair review harder. A source may be incomplete, disputed or corrected later. The proposed workflow records those distinctions and preserves a route for challenge before a consequential decision.",
    points: [
      {
        tag: "pain",
        text: "Unverified reports can contain personal data or disputed claims",
      },
      {
        tag: "pain",
        text: "Publication can affect both a reporter and the subject of a report",
      },
      {
        tag: "benefit",
        text: "A referenced evidence packet makes support, uncertainty and missing records visible",
      },
      {
        tag: "usp",
        text: "Human review and authority must be recorded separately from automated checks",
      },
    ],
  },
  {
    kicker: "The proposed design",
    title: "Four states to evaluate before a service opens",
    body: "SIGNAL would receive an authorised report through a private channel. SHIELDED would restrict access while the report is checked. CHALLENGED would provide an appropriate opportunity to respond. ACTIONABLE would assemble a referenced packet for the recipient to assess. These are proposed stages, not evidence that a staffed intake or complaint service operates today.",
    image: {
      src: "/images/loop/four-states.webp",
      alt: "Four sealed glass cylinders holding, in turn, a rough sphere, a boxed sphere, a locked cube and a resolved gem",
    },
    points: [
      { tag: "benefit", text: "SIGNAL — authorised private intake; proposed" },
      { tag: "benefit", text: "SHIELDED — access-controlled review; proposed" },
      {
        tag: "benefit",
        text: "CHALLENGED — fair opportunity to respond; proposed",
      },
      {
        tag: "benefit",
        text: "ACTIONABLE — referenced evidence packet; proposed",
      },
    ],
  },
  {
    kicker: "Review before publication",
    title: "Build in privacy, challenge and correction",
    body: "Before any pilot, agree the source permissions, permitted data, retention, accepted reviewers and publication rules. A reviewer must distinguish what a record says from what has been independently checked. Notice and reply arrangements should fit the case, including privacy and safety considerations. Their legal effect requires separate assessment.",
    points: [
      {
        tag: "usp",
        text: "Record the source, case revision, review scope and responsible person",
      },
      {
        tag: "benefit",
        text: "Preserve dated corrections and supersession history",
      },
      {
        tag: "pain",
        text: "A role label or signed event does not establish human acceptance",
      },
    ],
    href: "/corrections/",
    cta: "Inspect the existing corrections ledger",
  },
  {
    kicker: "A possible output",
    title: "Evidence to support a complaint; the authority decides",
    body: "Article 85 of the EU AI Act provides a complaint route for a person or organisation with grounds to consider that the Regulation has been infringed. A proposed compiler could assemble observations, system versions, relevant provisions and supporting records for review. It would not determine liability, guarantee a case is opened or replace the authority’s procedures.",
    points: [
      {
        tag: "benefit",
        text: "Identify the observation, date, source and limits of each claim",
      },
      {
        tag: "pain",
        text: "A document generator cannot confer authority or decide an infringement",
      },
      {
        tag: "usp",
        text: "Measurement and the recipient’s decision remain separate",
      },
    ],
    href: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng/pdf",
    cta: "Read the primary regulation, Article 85",
  },
];

export const LOOP_NOT_CLAIMED = [
  "This is a proposed workflow. Public incident intake remains closed; accepted reviewers, privacy controls, source permissions and a defined response scope are prerequisites for a pilot.",
  "Council publishes measurements and evidence. It does not exercise regulator powers or guarantee enforcement, legal standing or a favourable outcome.",
  "A proposed protected review or reply window is not a claim of legal privilege or immunity.",
  "The read-only Watchdog claim register and corrections ledger are separate from an incident-reporting service. Do not submit personal or incident details there.",
  "The design does not remove the need for accountable people, case-specific authority and independent challenge.",
];

export const LOOP_RELATED = [
  {
    href: "/watchdog/",
    label: "Public claim records",
    what: "Inspect the read-only records; this is not public incident intake.",
  },
  {
    href: "/honesty",
    label: "Measurement scope and limitations",
    what: "How results are reviewed and corrections are published.",
  },
  {
    href: "/statute-to-predicate",
    label: "From statute to predicate",
    what: "How a provision becomes a candidate test for review.",
  },
  {
    href: "/firewall-charter",
    label: "The firewall charter",
    what: "Measurement, review and authority to act are separate.",
  },
];
