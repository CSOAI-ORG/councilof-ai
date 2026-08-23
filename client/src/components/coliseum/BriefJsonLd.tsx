import { useEffect } from "react";
import type { Account } from "@/data/ecosystem";

/** Injects Organization JSON-LD for /brief?id= — machine-readable org index for agents. */
export default function BriefJsonLd({ account }: { account: Account }) {
  useEffect(() => {
    const [lng, lat] = account.hq;
    const jsonld = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `https://councilof.ai/brief?id=${account.id}`,
      name: account.name,
      description:
        `Public org-level AI governance measurement intel for ${account.name}. ` +
        `Frameworks: ${account.frameworks.join(", ")}. Council measures — does not certify.`,
      areaServed: account.jurisdictions.join(", "),
      geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lng },
      url: account.source.startsWith("http") ? account.source : `https://councilof.ai/brief?id=${account.id}`,
      additionalProperty: [
        { "@type": "PropertyValue", name: "account_type", value: account.type },
        { "@type": "PropertyValue", name: "posture", value: account.posture },
        { "@type": "PropertyValue", name: "measurement_api", value: "https://councilof.ai/api/ecosystem?id=" + account.id },
      ],
    };

    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "brief-org-jsonld";
    el.textContent = JSON.stringify(jsonld);
    document.head.appendChild(el);
    return () => {
      document.getElementById("brief-org-jsonld")?.remove();
    };
  }, [account]);

  return null;
}
