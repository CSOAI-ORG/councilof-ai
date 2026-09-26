/**
 * /state — the stable address for "State of the Agent Internet". It always points at the latest
 * edition (EDITIONS[0]) and lists every earlier one. A new edition = a new dated page + one line
 * here; dated pages never change after publication except through a dated correction.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";
import SEP from "@/data/state/2026-09-numbers.json";

const EDITIONS = [
  {
    path: "/state/2026-09/",
    title: "September 2026",
    published: "26 September 2026",
    numbers: "/state/2026-09/numbers.json",
    signed: "/state/2026-09/numbers.signed.json",
    as_of: SEP.as_of,
  },
];

const TITLE = "State of the Agent Internet | Council of AI";
const DESCRIPTION =
  "The stable address for CSOAI's State of the Agent Internet: the latest edition, earlier ones and the signed numbers behind each. Measurement, not endorsement.";

export default function StateIndex() {
  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
  }, []);
  const latest = EDITIONS[0];

  return (
    <div data-testid="state-index" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <span>State of the Agent Internet</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">State of the Agent Internet</h1>
      <p className="mt-4 leading-relaxed text-slate-700">
        A periodic report by Council of AI (CSOAI Ltd) on what public agent catalogues, agent cards, payment doors and
        tokenised-asset ledgers let a third party check for itself. Aggregates only. Measurement, not endorsement: no company,
        service or operator is scored, ranked or approved.
      </p>

      <section aria-labelledby="latest" className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-5">
        <h2 id="latest" className="text-xl font-bold text-slate-900">
          Latest edition: {latest.title}
        </h2>
        <p className="mt-2 text-slate-700">
          Published {latest.published}; figures as of {latest.as_of.replace("T", " ").replace("Z", " UTC")}.
        </p>
        <p className="mt-3">
          <Link href={latest.path} className="font-semibold underline underline-offset-4">
            Read the {latest.title} report
          </Link>
        </p>
        <p className="mt-2 text-sm text-slate-700">
          Every number in it is in <a className="underline underline-offset-4" href={latest.numbers}>numbers.json</a>, board-signed in{" "}
          <a className="underline underline-offset-4" href={latest.signed}>numbers.signed.json</a>.
        </p>
      </section>

      <h2 className="mt-10 text-xl font-bold text-slate-900">All editions</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-700">
        {EDITIONS.map((e) => (
          <li key={e.path}>
            <Link href={e.path} className="underline underline-offset-4">
              {e.title}
            </Link>{" "}
            (published {e.published})
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Corrections and objections</h2>
      <p className="mt-3 leading-relaxed text-slate-700">
        Each edition carries its own corrections section, and every correction is dated in our{" "}
        <Link href="/corrections/" className="underline underline-offset-4">corrections ledger</Link>. To object to, dispute or
        ask for a re-check of anything in a report, email <PlainEmail className="underline underline-offset-4" subject="State report" />{" "}
        or use <Link href="/dispute/" className="underline underline-offset-4">/dispute</Link>.
      </p>
    </div>
  );
}
