import { Helmet } from "react-helmet";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
}

// Base URL for absolute URLs - update this when site is published
const BASE_URL = "https://tr8planthire.com";

const SEO = ({
  title,
  description,
  canonical,
  ogImage = "/og-image.jpg",
  ogType = "website",
  noIndex = false,
}: SEOProps) => {
  const siteName = "TR8 Plant Hire & Services";
  const phone = "07746 159 640";
  const fullTitle = title.includes("TR8") ? title : `${title} | ${siteName}`;
  
  // Construct absolute URL for OG image
  const absoluteOgImage = ogImage.startsWith("http") ? ogImage : `${BASE_URL}${ogImage}`;
  
  // Structured data for local business
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "TR8 Plant Hire & Services",
    "description": "Professional plant hire, demolition, and asbestos removal services",
    "telephone": "+447746159640",
    "url": canonical || "https://tr8planthire.com",
    "image": ogImage,
    "priceRange": "££",
    "areaServed": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 51.2,
        "longitude": -0.8
      },
      "geoRadius": "50000"
    },
    "serviceType": [
      "Plant Hire",
      "Demolition Services",
      "Asbestos Removal",
      "Groundworks",
      "Operated Hire"
    ],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "07:00",
        "closes": "18:00"
      }
    ]
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="author" content={siteName} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {!noIndex && <meta name="robots" content="index, follow" />}
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="TR8 Plant Hire - Excavators, Dumpers & Demolition Equipment" />
      {canonical && <meta property="og:url" content={canonical} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />
      <meta name="twitter:image:alt" content="TR8 Plant Hire - Excavators, Dumpers & Demolition Equipment" />
      
      {/* Additional SEO */}
      <meta name="theme-color" content="#f97316" />
      <meta name="format-detection" content="telephone=yes" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default SEO;
