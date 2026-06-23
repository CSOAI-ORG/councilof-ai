export interface PainQuote {
  topic: string;
  quote: string;
  source: string;
}

export const PAIN_QUOTES: PainQuote[] = [
  {
    topic: "Vanta renewal shock",
    quote: "Price went from $12K to $28K with zero new features.",
    source: "Reddit r/compliance",
  },
  {
    topic: "Drata shallow integrations",
    quote: "Integrations only confirm the connection exists.",
    source: "HackerNews",
  },
  {
    topic: "ServiceNow complexity",
    quote: "$12M spent, still not implemented after 5 years.",
    source: "G2 review",
  },
  {
    topic: "Credo AI limitations",
    quote: "Purely governance-layer only, no runtime security.",
    source: "G2 review",
  },
  {
    topic: "OneTrust uplifts",
    quote: "22-80% mid-contract price increases.",
    source: "TrustRadius",
  },
  {
    topic: "AI governance gap",
    quote: "63% of organizations have no AI governance policies.",
    source: "IBM study",
  },
  {
    topic: "Shadow AI",
    quote: "89% of AI use escapes governance.",
    source: "Microsoft / LinkedIn research",
  },
  {
    topic: "Compliance burnout",
    quote: "Compliance team turnover costs $847K per officer.",
    source: "Industry research",
  },
];
