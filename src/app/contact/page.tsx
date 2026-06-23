import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact CSOAI",
  description:
    "Get in touch with CSOAI for AI certification, governance consultation, and support. We respond to all inquiries within 24 hours.",
  openGraph: {
    title: "Contact CSOAI",
    description: "AI certification, governance consultation, and support.",
    images: ["/api/og?title=Contact%20CSOAI&desc=AI%20certification%20and%20governance%20support"],
  },
  alternates: { canonical: "/contact" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact CSOAI",
  description: "Get in touch with CSOAI for AI certification and governance support.",
  mainEntity: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    email: "nicholas@csoai.org",
    areaServed: "Worldwide",
  },
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <ContactClient />
    </>
  );
}
