import { Helmet } from "react-helmet-async";

/** JSON-LD for a Coliseum brief page — honest, machine-readable, no ranking claims. */
export default function BriefJsonLd({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    author: {
      "@type": "Organization",
      name: "Council of AI (CSOAI Ltd)",
      url: "https://councilof.ai",
    },
    publisher: {
      "@type": "Organization",
      name: "Council of AI (CSOAI Ltd)",
    },
  };
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}
