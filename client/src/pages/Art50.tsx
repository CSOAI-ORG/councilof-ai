import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { FFW, FINES } from "@/data/enforcement";

/**
 * /art50 — verification services for EU AI Act Article 50 marking.
 *
 * ONE AUTHORITY. Every date on this page is fetched at runtime from
 * /api/regulation (schema csoai.regulation-deadlines/0.1) — the server-side
 * register is the only place dates live. This page derives; it never types.
 * If the feed cannot be read, the page says UNCHECKABLE, not a number.
 *
 * The enforcement tracker reuses the existing register at
 * client/src/data/enforcement.ts (the same First-Fine Watch the signed
 * /api/fines feed serves). No second register is created here.
 */

type Deadline = {
  date: string;
  instrument: string;
  what: string;
  basis?: string;
  status?: string;
};

type RegulationFeed = {
  verified_as_of?: string;
  scope_note?: string;
  deadlines?: Deadline[];
};

function daysUntil(iso: string, now: Date): number {
  const t = Date.parse(iso + "T00:00:00Z");
  if (!Number.isFinite(t)) return NaN;
  return Math.ceil((t - now.getTime()) / 86400000);
}

const SERVICES: { title: string; href: string; body: string; note: string }[] = [
  {
    title: "Marking-presence census",
    href: "/api/art50/marking-evidence",
    body: "One output, one point in time: is a machine-readable mark detected by named methods? The Function recomputes a C2PA manifest by bytes, reads the IPTC DigitalSourceType, and names every watermark it cannot check, with the reason.",
    note: "Detection preview is free. The signed evidence pack is paid via x402 — the amount lives at the 402 challenge, never here.",
  },
  {
    title: "Detector-interop bench",
    href: "/gspc/detector-interop",
    body: "The detector-interoperability axis of the measurement board: what marking and detection methods actually agree on, measured rather than claimed.",
    note: "Open data. Data free, proofs paid.",
  },
  {
    title: "Specimen ledger",
    href: "/specimens/clarity",
    body: "The CLARITY pre-commit specimen: a worked, inspectable example of what a signed marking record looks like before any money moves.",
    note: "Unsigned specimen. Verify stays free and loginless.",
  },
];

export default function Art50() {
  const [feed, setFeed] = useState<RegulationFeed | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    fetch("/api/regulation")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!cancelled) setFeed(d);
      })
      .catch((e: Error) => {
        if (!cancelled) setErr(e.message || "UNCHECKABLE");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Derived, never typed: the Art 50(2) marking-grace entry is located in the
  // register by what it IS, and its date is read off the row.
  const grace = (feed?.deadlines || []).find(
    (d) => /Art 50\(2\)/.test(d.instrument) && /grace/i.test(d.what),
  );
  const graceDays = grace ? daysUntil(grace.date, now) : NaN;

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-16 text-stone-800">
      <Helmet>
        <title>Article 50 verification services | Council of AI</title>
        <meta
          name="description"
          content="Marking-presence census, detector-interop bench and specimen ledger for EU AI Act Article 50 transparency. Dates derived live from /api/regulation. Measurement, not certification."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-700">
          Derived from GET /api/regulation · verified_as_of{" "}
          {feed?.verified_as_of || (err ? "UNCHECKABLE" : "loading…")}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-900">
          Article 50 verification services
        </h1>
        <p className="mt-4 leading-7 text-stone-600">
          Article 50 asks whether generative outputs carry machine-readable marking. We
          measure whether named methods can detect a mark — we do not certify compliance,
          and a cited deadline here is regulatory context, not a determination about any
          system. Measurement, not certification. Derived, never typed — root wins.
        </p>

        {/* Live countdown — derived from the register, never typed. */}
        {err ? (
          <p className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 font-mono text-sm text-rose-700">
            Register UNCHECKABLE: {err}. No countdown is shown rather than a guessed one.
          </p>
        ) : !feed ? (
          <p className="mt-8 font-mono text-sm text-stone-500">Loading register…</p>
        ) : !grace || !Number.isFinite(graceDays) ? (
          <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 font-mono text-sm text-amber-800">
            The Art 50(2) marking-grace entry is UNCHECKABLE in the current register —
            shown as missing, never replaced with a typed date.
          </p>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="font-mono text-3xl font-bold text-amber-700">
              {graceDays >= 0
                ? `${graceDays} day${graceDays === 1 ? "" : "s"}`
                : `${Math.abs(graceDays)} days ago`}
            </div>
            <div className="mt-2 text-sm text-stone-700">
              to {grace.date} — {grace.instrument}: {grace.what}
            </div>
            {grace.basis ? (
              <div className="mt-1 font-mono text-xs text-stone-500">{grace.basis}</div>
            ) : null}
          </div>
        )}

        <h2 className="mt-12 text-xl font-bold text-stone-900">Services</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-1">
          {SERVICES.map((s) => (
            <div
              key={s.href}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="text-lg font-bold text-stone-900">{s.title}</div>
              <p className="mt-2 text-sm leading-6 text-stone-600">{s.body}</p>
              <p className="mt-2 font-mono text-xs text-stone-500">{s.note}</p>
              <Link
                href={s.href}
                className="mt-3 inline-block text-sm font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-600"
              >
                Open →
              </Link>
            </div>
          ))}
        </div>

        {/* Enforcement tracker — reuses the existing register, never a new one. */}
        <section className="mt-12 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-stone-900">Enforcement tracker</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            From the site's existing First-Fine Watch register (the same data the signed{" "}
            <code className="font-mono text-xs">/api/fines</code> feed serves, signed by{" "}
            <code className="font-mono text-xs">{FFW.signer}</code>). Counter as recorded
            there: <strong>{FFW.counter}</strong> — no AI Act fine has been recorded in
            this register since the fining powers of {FFW.powersOn}.{" "}
            {FINES.find((f) => f.regime === "EU AI Act")?.status === "FIRST-FINE WATCH"
              ? "Status: FIRST-FINE WATCH — watching, not concluding."
              : null}{" "}
            Not a legal conclusion.
          </p>
        </section>

        {/* C2PA marking-census panel slot — empty stays empty, never zero-filled. */}
        <section className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-stone-100 p-6">
          <h2 className="text-xl font-bold text-stone-900">C2PA marking census</h2>
          <p className="mt-3 font-mono text-sm text-stone-600">UNMEASURED</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Reason: census endpoint from the measurement lane not yet published. This
            panel stays empty until the census exists — it is never zero-filled.
          </p>
        </section>

        <p className="mt-10 text-sm text-stone-500">
          Data free, proofs paid. Verify a signed card at{" "}
          <Link href="/gspc-verify" className="text-amber-700 underline">
            /gspc-verify
          </Link>
          ; the full deadline register renders at{" "}
          <Link href="/countdown" className="text-amber-700 underline">
            /countdown
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
