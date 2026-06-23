import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { frameworksdata, getFrameworksDataEntry, type FrameworksDataEntry } from "@/lib/frameworks-content";

export function generateStaticParams() {
  return frameworksdata.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getFrameworksDataEntry(slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical: `/frameworks/${slug}` },
    openGraph: {
      title: entry.ogTitle,
      description: entry.ogDescription,
      type: "article",
      ...(entry.ogImage ? { images: [entry.ogImage] } : {}),
    },
  };
}

function BreadcrumbSchema({ entry }: { entry: FrameworksDataEntry }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
      { "@type": "ListItem", position: 2, name: "Frameworks", item: `https://csoai.org/frameworks` },
      { "@type": "ListItem", position: 3, name: entry.ogTitle, item: entry.canonical },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function FrameworksSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getFrameworksDataEntry(slug);
  if (!entry) notFound();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BreadcrumbSchema entry={entry} />
      {entry.ldJson.map((json, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      ))}
      {entry.css ? (
        <style>{`
${entry.css}
      `}</style>
      ) : null}
      <div
        className="legacy-content"
        dangerouslySetInnerHTML={{ __html: entry.content }}
      />
    </div>
  );
}
