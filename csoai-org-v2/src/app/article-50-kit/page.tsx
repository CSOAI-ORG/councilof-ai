import type { Metadata } from "next";
import Article50KitClient from "./Article50KitClient";

export const metadata: Metadata = {
  title: "Article 50 Kit",
  description:
    "Everything you need for EU AI Act Article 50 transparency compliance before 2 August 2026. Chatbot disclosure, watermarking, human oversight and documentation.",
  openGraph: {
    title: "CSOAI Article 50 Kit",
    description: "EU AI Act Article 50 compliance toolkit for generative AI systems.",
    images: ["/api/og?title=Article%2050%20Kit&desc=EU%20AI%20Act%20Article%2050%20compliance%20toolkit%20for%20generative%20AI%20systems."],
  },
  alternates: { canonical: "/article-50-kit" },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CSOAI Article 50 Kit",
  description:
    "Emergency EU AI Act Article 50 compliance toolkit: transparency docs, C2PA-2.0 manifest templates, 25 native-language disclosure strings, and 12 months of MCP Pro.",
  brand: { "@type": "Brand", name: "CSOAI" },
  offers: {
    "@type": "Offer",
    price: "999",
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
    url: "https://csoai.org/article-50-kit",
    seller: { "@type": "Organization", name: "CSOAI LTD", url: "https://csoai.org" },
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "meok-watermark-attest-mcp",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "999",
    priceCurrency: "GBP",
  },
  featureList: [
    "Classify Art 50(1)-(5) obligations",
    "Generate per-surface × per-language disclosure text",
    "Audit content pipeline for marker embedding",
    "Sign Ed25519 compliance attestations",
    "Emit C2PA-2.0 manifests with cryptographic watermarks",
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Article 50 Kit", item: "https://csoai.org/article-50-kit" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "When does EU AI Act Article 50 apply?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Article 50 transparency obligations apply from 2 August 2026 for new AI systems. Pre-existing systems have until 2 December 2026 to comply.",
      },
    },
    {
      "@type": "Question",
      name: "What are the penalties for non-compliance?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Article 50 transparency infringements can be fined up to €15 million or 3% of total worldwide annual turnover, whichever is higher. The higher €35 million / 7% tier applies only to prohibited AI practices under Article 5.",
      },
    },
    {
      "@type": "Question",
      name: "What surfaces does the MCP cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The MCP covers UI banners, API responses, TTS openings, C2PA manifests, and capability descriptions across English, French, German, Spanish, and Italian.",
      },
    },
  ],
};

export default function Article50KitPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Article50KitClient />
    </>
  );
}
