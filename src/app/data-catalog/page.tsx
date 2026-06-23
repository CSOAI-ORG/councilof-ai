import type { Metadata } from "next";
import DataCatalogClient from "./DataCatalogClient";
import catalog from "@/data/data-catalog.json";

export const metadata: Metadata = {
  title: "Free Data Catalog",
  description:
    "127 open data sources CSOAI uses for AI training, compliance, finance, threat intelligence, and world modelling. Search, filter, and export.",
  openGraph: {
    title: "CSOAI Free Data Catalog",
    description: "127 open datasets for compliance, security, finance, and agent training.",
    images: [
      "/api/og?title=Free%20Data%20Catalog&desc=127%20open%20datasets%20for%20compliance%2C%20security%2C%20finance%2C%20and%20agent%20training.",
    ],
  },
  alternates: { canonical: "/data-catalog" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Free Data Catalog", item: "https://csoai.org/data-catalog" },
  ],
};

const dataCatalogSchema = {
  "@context": "https://schema.org",
  "@type": "DataCatalog",
  name: "CSOAI Free Data Catalog",
  description:
    "127 open data sources for AI compliance, security, finance, trade, and world modelling.",
  url: "https://csoai.org/data-catalog",
  dataset: catalog.entries.map((entry) => ({
    "@type": "Dataset",
    name: entry.name,
    url: entry.url,
    license: entry.license,
    distribution: entry.format
      ? { "@type": "DataDownload", encodingFormat: entry.format }
      : undefined,
    includedInDataCatalog: "https://csoai.org/data-catalog",
  })),
};

export default function DataCatalogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dataCatalogSchema) }}
      />
      <DataCatalogClient entries={catalog.entries} />
    </>
  );
}
