import type { Metadata } from "next";
import Article50CalculatorClient from "./Article50CalculatorClient";

export const metadata: Metadata = {
  title: "Article 50 Calculator",
  description:
    "Calculate your EU AI Act Article 50 deadline countdown and penalty exposure. Article 50 transparency infringements can be fined up to €15M or 3% of worldwide turnover.",
  openGraph: {
    title: "EU AI Act Article 50 Calculator",
    description: "Countdown and penalty exposure calculator for EU AI Act Article 50.",
    images: ["/api/og?title=Article%2050%20Calculator&desc=Countdown%20and%20penalty%20exposure%20calculator%20for%20EU%20AI%20Act%20Article%2050."],
  },
  alternates: { canonical: "/article-50-calculator" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Article 50 Calculator", item: "https://csoai.org/article-50-calculator" },
  ],
};

export default function Article50CalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Article50CalculatorClient />
    </>
  );
}
