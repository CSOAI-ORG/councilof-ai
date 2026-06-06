import { Helmet } from "react-helmet-async";

interface InternationalSEOProps {
  path: string;
  defaultLocale?: string;
}

const SUPPORTED_REGIONS = [
  { hreflang: "en-GB", locale: "en_GB", urlPrefix: "" },
  { hreflang: "en-US", locale: "en_US", urlPrefix: "" },
  { hreflang: "en-AU", locale: "en_AU", urlPrefix: "" },
  { hreflang: "en-CA", locale: "en_CA", urlPrefix: "" },
  { hreflang: "en-NZ", locale: "en_NZ", urlPrefix: "" },
  { hreflang: "en-IE", locale: "en_IE", urlPrefix: "" },
  { hreflang: "de-DE", locale: "de_DE", urlPrefix: "" },
  { hreflang: "fr-FR", locale: "fr_FR", urlPrefix: "" },
  { hreflang: "nl-NL", locale: "nl_NL", urlPrefix: "" },
  { hreflang: "x-default", locale: "en_GB", urlPrefix: "" },
];

const BASE_URL = "https://muckaway.ai";

export const InternationalSEO = ({ path, defaultLocale = "en_GB" }: InternationalSEOProps) => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return (
    <Helmet>
      {SUPPORTED_REGIONS.map((region) => (
        <link
          key={region.hreflang}
          rel="alternate"
          hrefLang={region.hreflang}
          href={`${BASE_URL}${region.urlPrefix}${cleanPath}`}
        />
      ))}
    </Helmet>
  );
};

export default InternationalSEO;
