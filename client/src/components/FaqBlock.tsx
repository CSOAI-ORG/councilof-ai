import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * FaqBlock — Lane 4 house FAQ section (2026-08-01).
 * One honest, question-format FAQ block per key page. Questions are H3s (AEO:
 * answer engines lift question-shaped headings). Every answer must satisfy the
 * register: measurement not certification, numbers trace to signed artefacts,
 * UNMEASURED ≠ fail, no superlatives we cannot evidence.
 *
 * Emits FAQPage JSON-LD describing exactly what is rendered — never more.
 */

export type FaqItem = { q: string; a: string };

export default function FaqBlock({
  title = "Frequently asked questions",
  intro,
  items,
  className = "",
}: {
  title?: string;
  intro?: string;
  items: FaqItem[];
  className?: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
  return (
    <section className={`bg-slate-50 py-20 ${className}`}>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-slate-200 text-slate-700 border-slate-300">FAQs</Badge>
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          {intro ? <p className="text-xl text-gray-600">{intro}</p> : null}
        </div>
        <div className="space-y-6">
          {items.map((i) => (
            <Card
              key={i.q}
              className="p-6 bg-white border-l-4 border-emerald-500 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2">{i.q}</h3>
              <p className="text-gray-600 leading-relaxed">{i.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
