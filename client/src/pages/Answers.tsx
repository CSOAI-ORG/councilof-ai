import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import answers from "@/data/answers.json";

type Answer = {
  slug: string;
  title: string;
  body: string;
  references: string[];
};

const ITEMS = answers as Answer[];

/** The explainer's own opening, cut at a sentence (else a word) boundary, at most 158 chars. */
export function answerSnippet(body: string, max = 158): string {
  const text = String(body || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = cut.lastIndexOf(". ");
  if (stop >= 80) return cut.slice(0, stop + 1);
  const at = cut.lastIndexOf(" ");
  return cut.slice(0, at > 0 ? at : max).replace(/[,;:\s—–-]+$/, "") + "…";
}

/** A tab/SERP title: the headline up to its first " — " or ": " when the whole would overrun. */
export function answerTitle(title: string, max = 60 - " | Council of AI".length): string {
  if (title.length <= max) return title;
  for (const sep of [" — ", ": ", " – ", " ("]) {
    const i = title.indexOf(sep);
    if (i >= 20 && i <= max) return title.slice(0, i);
  }
  return title;
}

export default function AnswersIndex() {
  useEffect(() => {
    document.title = "Answers — measurement explainers | Council of AI";
  }, []);
  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
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
    </section>
  );
}

export function AnswerPage() {
  const params = useParams<{ slug: string }>();
  const a = ITEMS.find((x) => x.slug === params.slug);
  useEffect(() => {
    document.title = a ? `${answerTitle(a.title)} | Council of AI` : "Answer not found | Council of AI";
    // Until 2026-09-28 every explainer shipped the route family's fallback description, built from
    // the URL slug ("Answer: Iso42001 vs Etsi304223. A short explainer…"). The answer's own opening
    // is the better search snippet and says nothing the page does not.
    if (a) setMetaDescription(answerSnippet(a.body));
  }, [a]);
  if (!a) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-14">
        <p>No explainer at this slug.</p>
        <Link href="/answers" className="text-emerald-800 underline">All explainers</Link>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-3xl px-6 py-14">
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
    </section>
  );
}
