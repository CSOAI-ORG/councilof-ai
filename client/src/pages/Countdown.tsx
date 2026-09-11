import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlarmClock, CalendarClock, FileText, ShieldAlert } from "lucide-react";
import { setMetaDescription } from "@/lib/utils";
import { useGspcBoard } from "@/components/board/useGspcBoard";
import Art50ReadinessPanel from "@/components/board/Art50ReadinessPanel";
import regulationFeed from "@/data/regulation.json";

/**
 * /countdown — the public regulatory-deadline machine.
 *
 * Every date on this page comes from client/src/data/regulation.json, the
 * client-side mirror of the signed server register at GET /api/regulation
 * (schema csoai.regulation-deadlines/0.1). Overlapping entries are
 * byte-identical; the register wins on any disagreement. Static content is
 * build-time (JSON import), so the prerender is fat without any runtime fetch;
 * the Art 50 readiness panel hydrates live from GET /api/gspc like every other
 * board surface.
 *
 * Status is computed against the clock at render time: a deadline the register
 * published as UPCOMING flips to its in-force treatment the moment the date
 * passes — the page never claims "live" early and never counts down to the past.
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
  corrections_policy: string;
  headline_correction: string;
  deadlines: Deadline[];
};

const DEADLINES: Deadline[] = FEED.deadlines;
const UPCOMING = DEADLINES.filter((d) => d.status === "UPCOMING").sort((a, b) =>
  a.date.localeCompare(b.date),
);
const IN_FORCE = DEADLINES.filter((d) => d.status === "IN_FORCE").sort((a, b) =>
  b.date.localeCompare(a.date),
);

const find = (date: string, instrumentIncludes: string): Deadline | undefined =>
  DEADLINES.find((d) => d.date === date && d.instrument.includes(instrumentIncludes));

/** The five deadlines this page is built around, located in the register — never re-typed. */
const FEATURED = {
  cra: find("2026-09-11", "Cyber Resilience Act"),
  art50: find("2026-12-02", "Art 50(2)"),
  interop: find("2027-02-02", "Code of Practice"),
  annex3: find("2027-12-02", "EU AI Act"),
  annex1: find("2028-08-02", "EU AI Act"),
};

const FEATURED_KEYS = new Set(
  Object.values(FEATURED)
    .filter((d): d is Deadline => !!d)
    .map((d) => `${d.date}|${d.instrument}`),
);
const REST_UPCOMING = UPCOMING.filter((d) => !FEATURED_KEYS.has(`${d.date}|${d.instrument}`));

/** Plain-language one-liners for the featured five. Copy, not data. */
const PLAIN: Record<string, string> = {
  "2026-09-11": "If your product has digital elements and an actively exploited vulnerability or severe incident, the reporting clock is already running — 24 hours for the early warning.",
  "2026-12-02": "If your generative system was on the market before 2 Aug 2026, this is the last day its output can go unmarked — after this, machine-readable marking is mandatory.",
  "2027-02-02": "The Code-of-Practice target for marking that survives across vendors: one provider's watermark should be readable by another's detector.",
  "2027-12-02": "Stand-alone high-risk systems (Annex III) enter the full obligation regime — deferred from 2 Aug 2026 by the Digital Omnibus.",
  "2028-08-02": "AI embedded in regulated products (Annex I) enters the full obligation regime.",
};

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  passed: boolean;
}

function computeTimeLeft(iso: string): TimeLeft {
  const diff = new Date(`${iso}T00:00:00Z`).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, passed: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    passed: false,
  };
}

/** Ticks every second; initial state is computed synchronously so the prerender is fat. */
function useTimeLeft(iso: string): TimeLeft {
  const [t, setT] = useState<TimeLeft>(() => computeTimeLeft(iso));
  useEffect(() => {
    const id = setInterval(() => setT(computeTimeLeft(iso)), 1000);
    return () => clearInterval(id);
  }, [iso]);
  return t;
}

function Tile({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`min-w-[58px] rounded-lg border px-3 py-2 text-center sm:min-w-[70px] ${tone}`}
      >
        <span className="text-2xl font-black tabular-nums sm:text-3xl">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-100/60">
        {label}
      </span>
    </div>
  );
}

function urgency(days: number): "critical" | "soon" | "calm" {
  if (days < 30) return "critical";
  if (days < 180) return "soon";
  return "calm";
}

const URGENCY_TILE: Record<string, string> = {
  critical: "border-red-400/50 bg-red-500/15 text-red-200",
  soon: "border-amber-400/50 bg-amber-500/10 text-amber-200",
  calm: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
};
const URGENCY_LABEL: Record<string, { text: string; cls: string }> = {
  critical: { text: "under 30 days", cls: "border-red-400/50 bg-red-500/15 text-red-200" },
  soon: { text: "under 6 months", cls: "border-amber-400/50 bg-amber-500/10 text-amber-200" },
  calm: { text: "on the horizon", cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" },
};

function DeadlineCard({ d }: { d: Deadline }) {
  const t = useTimeLeft(d.date);
  const u = urgency(t.days);
  const tone = URGENCY_TILE[u];
  const plain = PLAIN[d.date];
  return (
    <details
      className="group rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 open:border-emerald-400/40"
      data-testid={`deadline-${d.date}`}
    >
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/70">
              {d.instrument}
            </p>
            <h3 className="mt-1 text-lg font-black text-emerald-50">{fmtDate(d.date)}</h3>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${URGENCY_LABEL[u].cls}`}
          >
            {t.passed ? "in force" : URGENCY_LABEL[u].text}
          </span>
        </div>
        {t.passed ? (
          <p className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-center text-sm font-black text-emerald-200">
            IN FORCE — the clock has run out
          </p>
        ) : (
          <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
            <Tile value={t.days} label="days" tone={tone} />
            <span className="text-xl text-emerald-100/40">:</span>
            <Tile value={t.hours} label="hrs" tone={tone} />
            <span className="text-xl text-emerald-100/40">:</span>
            <Tile value={t.minutes} label="min" tone={tone} />
            <span className="text-xl text-emerald-100/40">:</span>
            <Tile value={t.seconds} label="sec" tone={tone} />
          </div>
        )}
        <p className="mt-3 text-center text-[11px] text-emerald-300/50 group-open:hidden">
          tap for the official text, the penalty exposure, and what it means in one sentence
        </p>
      </summary>
      <div className="mt-4 space-y-2 border-t border-emerald-500/15 pt-4 text-sm">
        {plain && (
          <p className="text-emerald-100/90">
            <strong className="text-emerald-200">In one sentence:</strong> {plain}
          </p>
        )}
        <p className="text-emerald-100/75">
          <strong className="text-emerald-200">What changes:</strong> {d.what}
        </p>
        <p className="text-emerald-100/75">
          <strong className="text-emerald-200">Official basis:</strong>{" "}
          <span className="font-mono text-[12px]">{d.basis}</span>
        </p>
        <p className="text-emerald-100/75">
          <strong className="text-emerald-200">Penalty exposure:</strong> {d.penalty_exposure}
        </p>
      </div>
    </details>
  );
}

/** CRA Art 14 — not a countdown: the reporting obligation is here. */
function CraLivePanel({ d }: { d: Deadline }) {
  const t = useTimeLeft(d.date);
  return (
    <section
      className="rounded-2xl border border-red-400/40 bg-red-500/[0.07] p-6"
      data-testid="cra-art14-panel"
    >
      <p className="font-mono text-[11px] uppercase tracking-[3px] text-red-300/80">
        EU Cyber Resilience Act · Article 14
      </p>
      {t.passed ? (
        <h2 className="mt-2 text-2xl font-black text-red-100 sm:text-3xl">
          LIVE SINCE {fmtDate(d.date).toUpperCase()} — reporting obligations in force NOW
        </h2>
      ) : (
        <>
          <h2 className="mt-2 text-2xl font-black text-red-100 sm:text-3xl">
            In force {fmtDate(d.date)} — the reporting clocks start
          </h2>
          <div className="mt-4 flex items-center gap-2 sm:gap-3">
            <Tile value={t.days} label="days" tone={URGENCY_TILE.critical} />
            <span className="text-xl text-red-100/40">:</span>
            <Tile value={t.hours} label="hrs" tone={URGENCY_TILE.critical} />
            <span className="text-xl text-red-100/40">:</span>
            <Tile value={t.minutes} label="min" tone={URGENCY_TILE.critical} />
            <span className="text-xl text-red-100/40">:</span>
            <Tile value={t.seconds} label="sec" tone={URGENCY_TILE.critical} />
          </div>
        </>
      )}
      <p className="mt-3 max-w-3xl text-sm text-red-100/80">{d.what}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-red-400/25 bg-[#160a0a] p-4">
          <div className="text-lg font-black text-red-200">24 hours</div>
          <p className="mt-1 text-xs text-red-100/70">
            Early warning — an actively exploited vulnerability or severe incident exists. Minimal
            facts, sent fast.
          </p>
        </div>
        <div className="rounded-xl border border-red-400/25 bg-[#160a0a] p-4">
          <div className="text-lg font-black text-red-200">72 hours</div>
          <p className="mt-1 text-xs text-red-100/70">
            Notification — severity and impact assessment, indicators of compromise where
            available.
          </p>
        </div>
        <div className="rounded-xl border border-red-400/25 bg-[#160a0a] p-4">
          <div className="text-lg font-black text-red-200">14 days</div>
          <p className="mt-1 text-xs text-red-100/70">
            Final report — root cause and the mitigation applied, via the ENISA Single Reporting
            Platform.
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-xl border border-red-400/25 bg-[#160a0a] p-4">
        <h3 className="text-sm font-bold text-red-100">
          The receipt a report should carry
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-red-100/70">
          A filing you cannot prove is a filing you may have to re-prove. The estate pattern: every
          artifact — the awareness timestamp that starts the clock, the SBOM, the runbook entry, the
          filing itself — is an <strong>Ed25519-signed statement</strong> a supervisor or operator
          can verify offline. The standards track this maps to is IETF SCITT (RFC 9943 transparent
          statements: a COSE_Sign1 signed statement plus a transparency-service receipt). Stated
          honestly, per our published SCITT position: Council of AI publishes Ed25519-signed JSON
          evidence today and does <strong>not</strong> yet publish a receipt from an identified
          SCITT transparency service — integration stays planned until a maintained COSE library, an
          independent verification round-trip, and a real service receipt are in place.
        </p>
      </div>
      <p className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/cra-readiness" className="font-semibold text-red-200 underline">
          The CRA Readiness Kit — the 24h/72h/14-day runbook →
        </Link>
        <Link href="/cra" className="font-semibold text-red-200 underline">
          The CRA guide →
        </Link>
      </p>
    </section>
  );
}

/** Live Art 50 readiness, derived from the art5-safeguard axis on GET /api/gspc. */
function Art50ReadinessLive() {
  const { data, error, loading } = useGspcBoard();
  const axis = data?.axes?.find((a) => a.axis === "art5-safeguard") ?? null;
  return (
    <div>
      {loading && (
        <p className="mb-3 text-[13px] text-emerald-100/60">Reading GET /api/gspc…</p>
      )}
      {error && (
        <p className="mb-3 text-[13px] text-amber-200/90">
          The board could not be read live ({error}). The rows below stay empty — UNMEASURED is
          reported, never back-filled. The endpoint at /api/gspc is the authority.
        </p>
      )}
      {data && !axis && (
        <p className="mb-3 text-[13px] text-amber-200/90">
          No art5-safeguard axis on the live board — nothing to derive, nothing shown.
        </p>
      )}
      <Art50ReadinessPanel
        axis={axis}
        heading="Article 50 readiness — from the art5-safeguard axis"
      />
      <p className="mt-3 text-[12px] text-emerald-100/60">
        The full axis, with its real measured figures:{" "}
        <Link href="/gspc/art5-safeguard" className="font-semibold text-emerald-200 underline">
          /gspc/art5-safeguard →
        </Link>
      </p>
    </div>
  );
}

export default function Countdown() {
  useEffect(() => {
    document.title = "The deadline machine — every verified AI-regulation date, counting down | Council of AI";
    const next = UPCOMING[0];
    setMetaDescription(
      `Live countdowns to every verified AI-regulation deadline${
        next ? ` — next up: ${next.instrument}, ${fmtDate(next.date)}` : ""
      }. EU AI Act Art 50(2) marking, CRA Art 14 reporting, Annex III and Annex I, with official sources and penalty exposure. Measurement, not certification.`,
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          Regulation · the deadline machine
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Every verified AI deadline,{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            counting down.
          </span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">
          One register, every date cited to its official text, corrections appended — never silently
          edited. A cited deadline is regulatory context, not a determination that you are
          compliant. Council of AI does <strong>measurement, not certification</strong>: we measure
          systems against the duties; we issue no conformity mark.
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-emerald-100/60">
          <span className="rounded-full border border-emerald-500/30 px-3 py-1 font-mono">
            register verified_as_of {FEED.verified_as_of}
          </span>
          <a href="/api/regulation" className="font-semibold text-emerald-200 underline">
            The signed server feed (GET /api/regulation) →
          </a>
        </p>

        {/* CRA Art 14 — the obligation that is already here. */}
        {FEATURED.cra && (
          <div className="mt-10">
            <CraLivePanel d={FEATURED.cra} />
          </div>
        )}

        {/* The featured countdowns. */}
        <div className="mt-12">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            <AlarmClock className="mr-1 inline h-3.5 w-3.5" /> The countdowns that matter most
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[FEATURED.art50, FEATURED.interop, FEATURED.annex3, FEATURED.annex1]
              .filter((d): d is Deadline => !!d)
              .map((d) => (
                <DeadlineCard key={`${d.date}|${d.instrument}`} d={d} />
              ))}
          </div>
        </div>

        {/* Is it marked? */}
        <section className="mt-14 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            <ShieldAlert className="mr-1 inline h-3.5 w-3.5" /> Article 50(2), in plain language
          </p>
          <h2 className="mt-2 text-2xl font-black text-emerald-50">“Is it marked?”</h2>
          <div className="mt-3 max-w-3xl space-y-3 text-sm leading-relaxed text-emerald-100/80">
            <p>
              When a convincing fake of a real person goes viral, the first question everyone asks
              is the same: <strong>is this marked as AI?</strong> Article 50(2) of the EU AI Act is
              the rule behind that question. Providers of generative AI must mark synthetic output —
              audio, image, video, text — in a <strong>machine-readable</strong> way, so a detector
              (not just a human eyeball) can tell it is artificially generated. The mark must be
              effective, interoperable, and robust.
            </p>
            <p>
              It matters because the label a platform shows you is only as good as the mark
              underneath it. A visible “AI” badge can be cropped away; a machine-readable mark is
              what lets a newsroom, a regulator, or your own feed check the claim for itself. That
              is also why the ecosystem is converging on interoperable formats — a mark only one
              vendor can read is a mark that fails the moment content leaves that vendor.
            </p>
            <p>
              How to check content yourself: our verifier is{" "}
              <Link href="/gspc-verify" className="font-semibold text-emerald-200 underline">
                free, forever — it runs in your browser →
              </Link>{" "}
              and we measured whether the ecosystem&apos;s existing marks survive contact with the
              real world:{" "}
              <Link href="/provenance-finding" className="font-semibold text-emerald-200 underline">
                the provenance finding →
              </Link>
              . If you need evidence about a specific system&apos;s marking rather than a one-off
              check, that is a signed evidence pack:{" "}
              <a
                href="/api/art50/marking-evidence"
                className="font-semibold text-emerald-200 underline"
              >
                /api/art50/marking-evidence
              </a>{" "}
              — amounts live at the 402, never typed here. Data free, proofs paid.
            </p>
          </div>
        </section>

        {/* Art 50 readiness — live from the board. */}
        <section className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Measured, never claimed
          </p>
          <h2 className="mt-2 text-2xl font-black text-emerald-50">
            Article 50 readiness on the board
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-emerald-100/70">
            Three questions per axis — marking detected, machine-readable, interop format — with
            their state derived live from GET /api/gspc. A row earns MEASURED only when the board
            publishes the reading; until then it stays UNMEASURED and says so.
          </p>
          <div className="mt-4 max-w-2xl">
            <Art50ReadinessLive />
          </div>
        </section>

        {/* Monitor these deadlines — x402 doors, display only. */}
        <section className="mt-10 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            <CalendarClock className="mr-1 inline h-3.5 w-3.5" /> Monitoring hooks
          </p>
          <h2 className="mt-2 text-2xl font-black text-emerald-50">
            Monitor these deadlines for your models
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-emerald-100/70">
            Point your own pipeline at the same evidence doors we publish. Display only — the
            payment flow lives behind the doors themselves. Amounts live at the 402, never typed
            here. Data free, proofs paid. Free verify stays free.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-emerald-100/85">
            <li>
              <a
                className="font-semibold text-emerald-200 underline"
                href="/api/art50/marking-evidence"
              >
                /api/art50/marking-evidence
              </a>{" "}
              — the Art 50 marking-evidence pack · amount at the 402
            </li>
            <li>
              <a
                className="font-semibold text-emerald-200 underline"
                href="/api/evidence-bundle?obligation=article-50&subject=your-model&bundle=1"
              >
                /api/evidence-bundle?obligation=article-50&bundle=1
              </a>{" "}
              — an evidence bundle scoped to your subject · amount at the 402
            </li>
            <li>
              <a className="font-semibold text-emerald-200 underline" href="/api/proof?bundle=1">
                /api/proof?bundle=1
              </a>{" "}
              — proof assembly over the same rail · amount at the 402
            </li>
            <li>
              <a className="font-semibold text-emerald-200 underline" href="/.well-known/x402.json">
                /.well-known/x402.json
              </a>{" "}
              — the machine-readable discovery document for every door
            </li>
          </ol>
        </section>

        {/* The full register. */}
        <section className="mt-14">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            <FileText className="mr-1 inline h-3.5 w-3.5" /> The full register
          </p>
          <h2 className="mt-2 text-2xl font-black text-emerald-50">Everything still ahead</h2>
          <div className="mt-4 space-y-3">
            {REST_UPCOMING.map((d) => (
              <details
                key={`${d.date}|${d.instrument}`}
                className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-4"
                data-testid={`register-${d.date}`}
              >
                <summary className="cursor-pointer">
                  <span className="font-mono text-[12px] text-emerald-300/80">{d.date}</span>
                  <span className="ml-3 font-semibold text-emerald-100">{d.instrument}</span>
                  <span className="ml-2 text-[13px] text-emerald-100/60">— {d.what}</span>
                </summary>
                <div className="mt-3 space-y-1.5 border-t border-emerald-500/15 pt-3 text-sm text-emerald-100/75">
                  <p>
                    <strong className="text-emerald-200">Official basis:</strong>{" "}
                    <span className="font-mono text-[12px]">{d.basis}</span>
                  </p>
                  <p>
                    <strong className="text-emerald-200">Penalty exposure:</strong>{" "}
                    {d.penalty_exposure}
                  </p>
                  {d.client_addition && (
                    <p className="text-[12px] italic text-emerald-100/60">
                      Carried client-side pending inclusion in the server register (see the mirror
                      note in the feed).
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-black text-emerald-50">Already in force</h2>
          <p className="mt-1 text-sm text-emerald-100/60">
            No countdown — these duties bind today.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {IN_FORCE.map((d) => (
              <li
                key={`${d.date}|${d.instrument}`}
                className="rounded-xl border border-emerald-500/15 bg-[#04120c] p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-emerald-100">{d.instrument}</span>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-emerald-300">
                    in force
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-emerald-300/60">
                  since {fmtDate(d.date)}
                </p>
                <p className="mt-1 text-[13px] text-emerald-100/70">{d.what}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-emerald-100/50">
          {FEED.scope_note} Corrections policy: {FEED.corrections_policy}.{" "}
          {FEED.headline_correction} Dates verified as of {FEED.verified_as_of}; the signed feed at{" "}
          <a href="/api/regulation" className="underline">
            GET /api/regulation
          </a>{" "}
          is the authority. This page is regulatory context, not legal advice — confirm scope with
          counsel.
        </p>
      </div>
    </div>
  );
}
