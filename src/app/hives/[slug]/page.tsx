import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HIVES, getHive, getHiveEntries } from "@/lib/hive-catalog";
import HiveStarterClient from "./HiveStarterClient";

export function generateStaticParams() {
  return HIVES.map((h) => ({ slug: h.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hive = getHive(slug);
  if (!hive) return {};
  return {
    title: `${hive.name} Starter Pack`,
    description: hive.description,
    openGraph: {
      title: `CSOAI ${hive.name} Starter Pack`,
      description: hive.description,
      images: [
        `/api/og?title=${encodeURIComponent(hive.name)}&desc=${encodeURIComponent(hive.tagline)}`,
      ],
    },
    alternates: { canonical: `/hives/${slug}` },
  };
}

export default async function HivePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const hive = getHive(slug);
  if (!hive) notFound();
  const entries = getHiveEntries(slug);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
      { "@type": "ListItem", position: 2, name: "Hives", item: "https://csoai.org/hives" },
      { "@type": "ListItem", position: 3, name: hive.name, item: `https://csoai.org/hives/${slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <HiveStarterClient hive={hive} entries={entries} />
    </>
  );
}
