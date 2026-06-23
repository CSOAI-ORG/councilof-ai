import type { Metadata } from "next";
import HighRiskClassifierClient from "./HighRiskClassifierClient";

export const metadata: Metadata = {
  metadataBase: new URL("https://csoai.org"),
  title: {
    absolute: "Is My AI System High-Risk? — EU AI Act Annex III Checker | CSOAI",
  },
  description:
    "Free interactive decision guide to check whether your AI system is classified high-risk under EU AI Act Annex III. Walk the categories, get an instant classification, and see your obligations before the deadlines.",
  openGraph: {
    title: "Is My AI System High-Risk? — EU AI Act Annex III Checker",
    description:
      "Interactive decision guide for the EU AI Act high-risk classification. Step through Annex III categories and get an instant verdict plus your obligations.",
    url: "/high-risk-classifier",
    siteName: "CSOAI",
    type: "website",
    images: ["/assets/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Is My AI System High-Risk? — EU AI Act Annex III Checker",
    description:
      "Step through the EU AI Act Annex III categories and get an instant high-risk classification.",
    images: ["/assets/og-image.png"],
  },
  alternates: { canonical: "/high-risk-classifier" },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to determine if your AI system is high-risk under the EU AI Act",
  description:
    "A step-by-step decision guide for classifying an AI system against EU AI Act Annex III high-risk categories and prohibited practices.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Check for prohibited practices",
      text: "Confirm your system does not perform an Article 5 prohibited practice such as social scoring, untargeted facial-image scraping, or manipulative subliminal techniques. Prohibited systems cannot be placed on the EU market at all.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Test against Annex III categories",
      text: "Check whether your AI system is used in any of the eight Annex III domains: biometrics, critical infrastructure, education, employment, essential public and private services, law enforcement, migration and border control, or administration of justice and democratic processes.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Apply the Article 6(3) filter",
      text: "Even within an Annex III domain, a system is not high-risk if it performs only a narrow procedural task, improves a previously completed human activity, detects decision patterns without replacing human assessment, or performs preparatory work — unless it profiles natural persons.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Check transparency (Article 50) obligations",
      text: "Regardless of risk tier, systems that interact with people, generate synthetic content, perform emotion recognition, or create deepfakes carry Article 50 transparency duties applying from 2 August 2026.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Map your obligations",
      text: "If high-risk, prepare a risk-management system, data governance, technical documentation, logging, human oversight, accuracy and cybersecurity measures, conformity assessment, and EU database registration.",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What makes an AI system high-risk under the EU AI Act?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An AI system is high-risk if it is a safety component of a product covered by EU harmonisation legislation (Annex I), or if it is used in one of the eight Annex III domains — biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, or justice and democracy — and is not exempted by the Article 6(3) narrow-task filter.",
      },
    },
    {
      "@type": "Question",
      name: "When do high-risk obligations apply?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Annex III high-risk obligations apply from 2 December 2027 — the Digital Omnibus delayed them from 2026 — while Annex I product-safety high-risk systems apply from 2 August 2027. Article 50 transparency duties apply from 2 August 2026. Prohibited practices have applied since 2 February 2025, and general-purpose AI model obligations since 2 August 2025. DORA, NIS2 and GDPR are already in force today.",
      },
    },
    {
      "@type": "Question",
      name: "Is this classification tool legal advice?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. This guide is an educational triage tool based on the published text of Regulation (EU) 2024/1689. It does not constitute legal advice. A formal classification should be confirmed through a documented conformity assessment.",
      },
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "High-Risk Classifier",
      item: "https://csoai.org/high-risk-classifier",
    },
  ],
};

export default function HighRiskClassifierPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HighRiskClassifierClient />
    </>
  );
}
