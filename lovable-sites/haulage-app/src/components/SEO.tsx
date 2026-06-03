import { Helmet } from "react-helmet-async";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

const BASE_URL = "https://haulage.app";

const SEO = ({
  title,
  description,
  canonical,
  ogImage = "/og-image.jpg",
  ogType = "website",
  noIndex = false,
}: SEOProps) => {
  const siteName = "Haulage.app";
  const fullTitle = title.includes("Haulage") ? title : `${title} | ${siteName}`;

  const absoluteOgImage = ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Haulage.app — MEOK AI Labs",
    description: "UK trade logistics & compliance umbrella platform — plant hire, grab hire, muckaway, plus 9 MCP servers.",
    url: canonical || BASE_URL,
    logo: `${BASE_URL}/og-image.jpg`,
    sameAs: [
      "https://meok.ai",
      "https://councilof.ai",
      "https://muckaway.ai",
      "https://planthire.ai",
      "https://grabhire.ai",
    ],
    serviceType: [
      "Plant Hire SaaS",
      "Grab Hire SaaS",
      "Muckaway SaaS",
      "Skip Hire Compliance",
      "DVSA Compliance Tools",
      "NRSWA Compliance Tools",
      "CHAS / CPCS / LOLER Tools",
      "ISO 19650 BIM Tools",
      "MCP Server Catalogue",
    ],
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="author" content={siteName} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {!noIndex && <meta name="robots" content="index, follow" />}

      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Haulage.app — UK Trade Logistics & Compliance Hub" />
      {canonical && <meta property="og:url" content={canonical} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />
      <meta name="twitter:image:alt" content="Haulage.app — UK Trade Logistics & Compliance Hub" />

      <meta name="theme-color" content="#0EA5E9" />
      <meta name="format-detection" content="telephone=yes" />

      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;
