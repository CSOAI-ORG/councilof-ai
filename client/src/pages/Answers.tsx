import { useEffect } from "react";
import { Link, useParams } from "wouter";
import answers from "@/data/answers.json";

type Answer = {
  slug: string;
  title: string;
  body: string;
  references: string[];
};

const ITEMS = answers as Answer[];

export default function AnswersIndex() {
  useEffect(() => {
    document.title = "Answers — measurement explainers | Council of AI";
  }, []);
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">AEO · measurement, not certification</p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">Explainers</h1>
      <p className="mt-3 text-slate-600">
        Short, sourced pages for regulators and procurement. Counts come from GET /api/gspc.
        Empty cells stay empty.
      </p>
      <ul className="mt-8 space-y-3">
        {ITEMS.map((a) => (
          <li key={a.slug}>
            <Link href={`/answers/${a.slug}`} className="font-semibold text-emerald-800 hover:underline">
              {a.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export function AnswerPage() {
  const params = useParams<{ slug: string }>();
  const a = ITEMS.find((x) => x.slug === params.slug);
  useEffect(() => {
    document.title = a ? `${a.title} | Council of AI` : "Answer not found | Council of AI";
  }, [a]);
  if (!a) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-14">
        <p>No explainer at this slug.</p>
        <Link href="/answers" className="text-emerald-800 underline">All explainers</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">
        <Link href="/answers" className="hover:underline">Answers</Link>
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight">{a.title}</h1>
      <p className="mt-6 text-[16px] leading-relaxed text-slate-800 whitespace-pre-wrap">{a.body}</p>
      {a.references.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">References</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {a.references.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-10 text-sm text-slate-500">
        Measurement, not certification. Verify a card at{" "}
        <Link href="/gspc-verify" className="text-emerald-800 underline">/gspc-verify</Link>.
      </p>
    </main>
  );
}
