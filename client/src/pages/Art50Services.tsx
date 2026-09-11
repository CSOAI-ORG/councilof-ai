import { useEffect } from "react";
import { Link } from "wouter";
import { Gavel, ScanSearch, Grid3X3, BookOpen } from "lucide-react";
import { setMetaDescription } from "@/lib/utils";
import {
  Tile,
  urgency,
  useTimeLeft,
  URGENCY_LABEL,
  URGENCY_TILE,
} from "@/components/countdown/tiles";
import regulationFeed from "@/data/regulation.json";
import { FFW, FINES } from "@/data/enforcement";

/**
 * /art50 — the Article 50 verification SERVICES page (GAP 5).
 *
 * What this page is not: the explainer (that is /article-50) or the evidence
 * pack (/packs/eu-article-50). It is the service surface over both — what we
 * measure about marking, where the measurement lives, and what the doors cost
 * (nothing is typed: amounts live at the 402).
 *
 * Discipline: derived, never typed; root wins. The countdown date comes from
 * the regulation register (client/src/data/regulation.json, mirroring the
 * signed feed at GET /api/regulation). The fine record comes from the
 * enforcement register (client/src/data/enforcement.ts, signed feed at
 * /api/fines). No number on this page was written by hand.
 */

interface Deadline {
  date: string;
  instrument: string;
  what: string;
  basis: string;
  status: string;
  penalty_exposure: string;
  client_addition?: boolean;
}

const FEED = regulationFeed as unknown as {
  verified_as_of: string;
  scope_note: string;
  deadlines: Deadline[];
};

/** The Art 50(2) marking-grace deadline, located in the register — never re-typed. */
const GRACE = FEED.deadlines.find(
  (d) => d.date === "2026-12-02" && d.instrument.includes("Art 50(2)"),
);

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

const SERVICES = [
  {
    icon: ScanSearch,
    name: "Marking-presence census",
    body: "A signed evidence pack on whether a system's outputs carry the machine-readable marks Article 50(2) requires — detectable, effective, interoperable, robust. This is the paid door; the pack is the deliverable.",
    href: "/api/art50/marking-evidence",
    cta: "/api/art50/marking-evidence — amounts live at the 402, never typed here",
    external: true,
  },
  {
    icon: Grid3X3,
    name: "Detector-interop bench",
    body: "The cross-detector watermark interoperability matrix, measured on the live board: one provider's mark against another's detector. A score shows only where the axis is MEASURED — empty stays empty.",
    href: "/gspc/detector-interop",
    cta: "The live axis on the GSPC board →",
    external: false,
  },
  {
    icon: BookOpen,
    name: "Specimen ledger",
    body: "In build. The ledger opens with one published pre-commit specimen — unsigned, and stated as such. The full ledger is not yet a surface; we do not link what does not exist.",
    href: "/specimens/clarity",
    cta: "The first specimen, as published →",
    external: false,
  },
] as const;

function GraceCountdown({ d }: { d: Deadline }) {
  const t = useTimeLeft(d.date);
  const u = urgency(t.days);
  return (
    <section
      className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.06] p-6"
      data-testid="art50-grace-countdown"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-amber-300/80">
          {d.instrument} — marking grace ends
        </p>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${URGENCY_LABEL[u].cls}`}
        >
          {t.passed ? "in force" : URGENCY_LABEL[u].text}
        </span>
      </div>
      {t.passed ? (
        <p className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-center text-sm font-black text-amber-200">
          IN FORCE — the grace period has ended
        </p>
      ) : (
        <div className="mt-4 flex items-center gap-2 sm:gap-3">
          <Tile value={t.days} label="days" tone={URGENCY_TILE[u]} />
          <span className="text-xl text-amber-100/40">:</span>
          <Tile value={t.hours} label="hrs" tone={URGENCY_TILE[u]} />
          <span className="text-xl text-amber-100/40">:</span>
          <Tile value={t.minutes} label="min" tone={URGENCY_TILE[u]} />
          <span className="text-xl text-amber-100/40">:</span>
          <Tile value={t.seconds} label="sec" tone={URGENCY_TILE[u]} />
        </div>
      )}
      <p className="mt-3 text-sm text-amber-100/75">
        {d.what} — {fmtDate(d.date)}. <span className="font-mono text-[12px]">{d.basis}</span>
      </p>
      <p className="mt-1 text-[12px] text-amber-100/60">
        Penalty exposure: {d.penalty_exposure}
      </p>
    </section>
  );
}

export default function Art50Services() {
  useEffect(() => {
    document.title = "Article 50 verification services — census, bench, ledger | Council of AI";
    setMetaDescription(
      `Article 50 verification services: marking-presence census, the detector-interop bench, and the specimen ledger — with the live countdown to the marking-grace deadline and the AI Act enforcement record. Measurement, not certification.`,
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          Article 50 · verification services
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Is the output marked?{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            We measure that.
          </span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">
          Three services over one question — whether AI-generated content carries a
          machine-readable mark a stranger can check. Council of AI does{" "}
          <strong>measurement, not certification</strong>: we measure systems against the duty and
          sign what we find; we issue no conformity mark.
        </p>
        <p className="mt-2 max-w-3xl text-[13px] text-emerald-100/60">
          Derived, never typed — root wins. Every date on this page comes from the regulation
          register (signed feed:{" "}
          <a href="/api/regulation" className="underline">
            GET /api/regulation
          </a>
          , verified_as_of {FEED.verified_as_of}); every fine figure comes from the enforcement
          register (signed feed:{" "}
          <a href="/api/fines" className="underline">
            /api/fines
          </a>
          ). On any disagreement the signed feed is the authority.
        </p>

        {GRACE && (
          <div className="mt-8">
            <GraceCountdown d={GRACE} />
          </div>
        )}

        {/* The three services. */}
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {SERVICES.map((s) => (
            <section
              key={s.name}
              className="flex flex-col rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"
              data-testid={`service-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            >
              <s.icon className="h-5 w-5 text-emerald-300/80" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-black text-emerald-50">{s.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-emerald-100/75">{s.body}</p>
              {s.external ? (
                <a
                  href={s.href}
                  className="mt-4 text-[13px] font-semibold text-emerald-200 underline"
                >
                  {s.cta}
                </a>
              ) : (
                <Link
                  href={s.href}
                  className="mt-4 text-[13px] font-semibold text-emerald-200 underline"
                >
                  {s.cta}
                </Link>
              )}
            </section>
          ))}
        </div>

        {/* Enforcement tracker — derived from the enforcement register. */}
        <section className="mt-12" data-testid="art50-enforcement-tracker">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            <Gavel className="mr-1 inline h-3.5 w-3.5" /> Enforcement tracker
          </p>
          <h2 className="mt-2 text-2xl font-black text-emerald-50">
            The AI Act fine record — {FFW.counter}
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-emerald-100/70">{FFW.note}</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-emerald-500/20 bg-[#05140d]">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-emerald-500/20 text-left text-[11px] uppercase tracking-wide text-emerald-300/60">
                  <th scope="col" className="p-3">Actor</th>
                  <th scope="col" className="p-3">Regime</th>
                  <th scope="col" className="p-3">Amount</th>
                  <th scope="col" className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {FINES.map((f) => (
                  <tr key={f.actor} className="border-b border-emerald-500/10 last:border-0">
                    <td className="p-3 font-semibold text-emerald-100">{f.actor}</td>
                    <td className="p-3 text-emerald-100/60">{f.regime}</td>
                    <td className="p-3 font-mono tabular-nums text-emerald-200">{f.amount}</td>
                    <td className="p-3 text-emerald-100/60">{f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[12px] text-emerald-100/60">
            Source: the signed enforcement feed at{" "}
            <a href="/api/fines" className="underline">
              /api/fines
            </a>{" "}
            (signer {FFW.signer}) · register verified_as_of {FEED.verified_as_of} · the full watch:{" "}
            <Link href="/first-fine-watch" className="font-semibold text-emerald-200 underline">
              /first-fine-watch →
            </Link>
          </p>
        </section>

        {/* Free vs paid, and the rest of the family. */}
        <section className="mt-10 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-lg font-black text-emerald-50">Free proof, paid bundles</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-emerald-100/75">
            Checking a signed record is{" "}
            <Link href="/gspc-verify" className="font-semibold text-emerald-200 underline">
              free, forever — it runs in your browser →
            </Link>
            . Producing new signed evidence about a specific system is a paid door. Data free,
            proofs paid — amounts live at the 402, never typed here.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link href="/article-50" className="font-semibold text-emerald-200 underline">
              The Article 50 explainer →
            </Link>
            <Link href="/packs/eu-article-50" className="font-semibold text-emerald-200 underline">
              The EU Article 50 evidence pack →
            </Link>
            <Link href="/countdown" className="font-semibold text-emerald-200 underline">
              The deadline machine →
            </Link>
          </p>
        </section>

        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-emerald-100/50">
          {FEED.scope_note} This page describes measurement services; it is not legal advice and
          not a conformity assessment — confirm scope with counsel.
        </p>
      </div>
    </div>
  );
}
