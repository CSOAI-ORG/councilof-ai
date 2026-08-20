import { useEffect, useMemo, useState } from "react";
import { REGIMES, type Regime } from "../data/regulators";
import { setMetaDescription } from "@/lib/utils";
import { chargeSovereign } from "../lib/sovCharge";
import AISystemNotice from "../components/AISystemNotice";
import { Band, Caveat, PageHero } from "@/components/pagekit/PageKit";

// /regulators — the Regulator Atlas. Every major AI + cyber regime, its top-7
// tools, and its next-7 movements — with the live Council assistant giving a current
// read on any of them. The structured spine the Council assistant acts on.

const GW = "/api";
const STATUS: Record<string, { label: string; cls: string }> = {
  "in-force": { label: "In force", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "phasing-in": { label: "Phasing in", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  "voluntary": { label: "Voluntary", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  "proposed": { label: "Proposed", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  "shifting": { label: "Status shifting", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};
const KINDS = [{ id: "all", label: "All regimes" }, { id: "ai", label: "AI governance" }, { id: "cyber", label: "Cybersecurity" }, { id: "data", label: "Data protection" }] as const;

function RegCard({ r }: { r: Regime }) {
  const [ans, setAns] = useState(""); const [busy, setBusy] = useState(false);
  async function ask() {
    setBusy(true); setAns(""); chargeSovereign(6);
    try {
      const m = "You are the CSOAI Council assistant. In 3 sentences give a current, practical read on " + r.name + " (" + r.region + "): who must act now, the single most urgent obligation, and the smartest first move. Be specific and current.";
      const res = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: m }) });
      if (res.ok) { const d = await res.json(); if (d && d.response && d.model !== "idle" && !/travell?er|companion|walks beside|i'?m sorry|can'?t help|on your journey|dear friend|kindred|as an ai language|remembering/i.test(String(d.response))) setAns(String(d.response)); }
    } catch (e) {}
    if (!ans) setAns((a) => a || "Live read unavailable right now — the collected obligations and dates below have what you need.");
    setBusy(false);
  }
  const st = STATUS[r.status];
  return (
    <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(4,18,12,.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-black tracking-tight text-gray-900">{r.name}</div>
          <div className="mt-1 text-xs font-semibold text-emerald-700">{r.region} · {r.authority}</div>
        </div>
        <span className={"shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide " + st.cls}>{st.label}</span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{r.summary}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Top 7 tools needed</div>
          <ol className="mt-2 space-y-1 text-[14px] text-gray-700">
            {r.topTools.map((t, i) => (<li key={i} className="flex gap-2"><span className="font-mono text-emerald-600">{i + 1}.</span><span>{t}</span></li>))}
          </ol>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-300/70">Next 7 dates & movements</div>
          <ul className="mt-2 space-y-1 text-[14px] text-gray-700">
            {r.nextDates.map((d, i) => (<li key={i} className="flex gap-2"><span className="shrink-0 font-mono text-[11px] font-bold text-amber-700">{d.date}</span><span className="text-gray-600">{d.event}</span></li>))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-emerald-600/20 bg-emerald-50/70 p-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">How Council of AI covers it</div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-gray-700">{r.csoai}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={ask} disabled={busy} className="rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-extrabold text-white transition-colors hover:bg-emerald-400 disabled:opacity-60">{busy ? "Reading…" : "Ask the Council assistant for a live read"}</button>
        {r.hiveSlug && <a href={"/hive/" + r.hiveSlug} className="rounded-lg border border-emerald-600/30 px-3.5 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-50">Open in the Hive →</a>}
        <a href={"/graph?demo=" + encodeURIComponent("an organisation subject to " + r.name)} className="rounded-lg border border-emerald-600/30 px-3.5 py-2 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-50">Govern a case →</a>
      </div>
      {ans && <div className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-[14px] leading-relaxed text-gray-700">{ans}</div>}
    </div>
  );
}

export default function RegulatorAtlas() {
  const [kind, setKind] = useState<string>("all");
  useEffect(() => {
    document.title = "The Regulator Atlas — every AI + cyber regime, tools & dates | CSOAI";
    setMetaDescription("The Regulator Atlas: AI and cyber regulatory regimes — EU AI Act, NIS2, DORA, UK, US, TC260 and more — with the top tools and next enforcement dates for each, maintained by the Council of AI.");
  }, []);
  const list = useMemo(() => (kind === "all" ? REGIMES : REGIMES.filter((r) => r.kind === kind)), [kind]);

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        kicker="The Regulator Atlas · who supervises what"
        title={<>Every regulator. The tools, and the clock.</>}
        lede={
          <>
            The major AI and cybersecurity regimes worldwide, each with the seven tools you actually
            need and the seven dates that are coming for you. Ask the Council assistant for a live
            read on any of them, then take the work straight into the instrument.
          </>
        }
        image={{ src: "/images/public_watchdog_intake.jpg", alt: "The public watchdog intake desk, where reports about AI systems are received and logged" }}
        contentRight
        points={[
          { tag: "pain", text: "Obligations arrive from four regimes at once and nobody keeps one honest list of the dates." },
          { tag: "benefit", text: "One page per regime: who must act, the most urgent duty, and the next moves on the calendar." },
          { tag: "usp", text: "Volatile items are marked as shifting rather than presented as settled fact." },
        ]}
        actions={[
          { href: "/eu-ai-act", label: "Start with the EU AI Act" },
          { href: "/regulation-tracker", label: "Open the regulation tracker", tone: "ghost" },
        ]}
        footnote={
          <>
            Council of AI measures systems against these regimes. It does not supervise, enforce,
            certify or accredit anyone — the regulators listed here do that.
          </>
        }
      >
        <div className="mt-6">
          <AISystemNotice route="/regulator-atlas" />
        </div>
      </PageHero>

      <Band
        tone="tint"
        kicker="The regimes"
        title={<>Filter to the ones that bind you.</>}
        lede={<>AI governance, cybersecurity, data protection — or all of them at once.</>}
      >
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={
                "rounded-full border px-4 py-2 text-xs font-bold transition-colors " +
                (kind === k.id
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-emerald-600/25 bg-white text-emerald-800 hover:bg-emerald-50")
              }
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {list.map((r) => (
            <RegCard key={r.slug} r={r} />
          ))}
        </div>
      </Band>

      <Band width="prose">
        <div className="space-y-6">
          <Caveat title="Read the dates carefully">
            <p>
              Dates and obligations here are compiled from established framework knowledge and they
              move constantly. Always verify against the primary regulator before you rely on a
              specific date. The Council assistant&apos;s live read pulls the current picture, and the
              items we know are volatile carry a{" "}
              <strong>Status shifting</strong> marker rather than a false air of settlement.
            </p>
          </Caveat>
          <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(4,18,12,.45)]">
            <h3 className="text-2xl font-black tracking-tight text-gray-900">
              Comply once. Crosswalk everywhere.
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              One evidence set, mapped across every regime above and signed to Layer 0 — provable
              rather than promised. That is the difference between a governance programme and a pile
              of PDFs.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/hive"
                className="inline-flex items-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-emerald-400"
              >
                Open the Framework Hive
              </a>
              <a
                href="/crosswalk"
                className="inline-flex items-center rounded-xl border border-emerald-600/30 px-5 py-3 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                See the framework crosswalk
              </a>
              <a
                href="/scan"
                className="inline-flex items-center rounded-xl border border-emerald-600/30 px-5 py-3 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                Scan your own cyber posture
              </a>
            </div>
          </div>
        </div>
      </Band>
    </div>
  );
}
