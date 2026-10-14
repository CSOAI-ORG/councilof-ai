import { FrameworkReferencePage } from "./FrameworkLandingPage";

export default function AustraliaAIGovernancePage() {
  return (
    <FrameworkReferencePage
      region="Australia"
      introduction="Use official Australian guidance to support a review of AI accountability, impacts, testing and oversight. Guidance does not by itself establish a universal mandatory AI assessment regime or a December 2026 compliance deadline."
      sources={[
        {
          title: "Guidance for AI adoption",
          status: "Current government guidance",
          description: "The National AI Centre's implementation guidance describes six essential practices for organisations building, customising or using AI in more complex and higher-risk settings. Use the official guidance to inspect the practices and their scope.",
          href: "https://www.ai.gov.au/staying-safe-and-responsible/essential-ai-practices/guidance-ai-adoption-implementation-guidance",
        },
        {
          title: "Voluntary AI Safety Standard",
          status: "Earlier voluntary reference",
          description: "The earlier ten-guardrail standard is voluntary and does not create new legal duties. Its official page directs readers to the updated Guidance for AI Adoption published on 21 October 2025.",
          href: "https://www.industry.gov.au/publications/voluntary-ai-safety-standard/10-guardrails",
        },
      ]}
    />
  );
}
