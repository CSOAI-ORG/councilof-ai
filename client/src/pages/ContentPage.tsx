import { useEffect } from "react";
import { Link } from "wouter";

interface ContentEntry {
  slug: string;
  title: string;
  description?: string;
  content: string;
  ldJson?: string[];
}

// Renders a data-driven content page (framework / sector / industry / blog).
// The branding (Header/Footer) is supplied by App.tsx; this just renders the body.
export default function ContentPage({
  dataset,
  slug,
}: {
  dataset: ContentEntry[];
  slug: string;
}) {
  const entry = dataset.find((e) => e.slug === slug);

  useEffect(() => {
    if (entry) document.title = `${entry.title} · CSOAI`;
  }, [entry]);

  if (!entry) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Not found</h1>
        <p className="mt-2 text-gray-600">No content found for &ldquo;{slug}&rdquo;.</p>
        <Link href="/" className="mt-6 text-emerald-700 underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {entry.ldJson?.map((j, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: j }} />
      ))}
      <div className="csoai-content" dangerouslySetInnerHTML={{ __html: entry.content }} />
    </div>
  );
}
