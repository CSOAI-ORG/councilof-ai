import { useEffect } from "react";
import { LAYER0_DISAMBIGUATION } from "../data/anchoringClaim";
import { Link } from "wouter";
import { LAYER0_NODES, COUNTS, type Layer0Node, type NodeStatus } from "@/data/layer0Nodes";

/**
 * /layer0 — the trust floor, benched.
 *
 * Two halves, one discipline:
 *   1. The bench — measured results, each with its n and its honest caveat
 *      beside it (the flattery and the embarrassment side by side).
 *   2. The audited node registry — every anchor source with the status it has
 *      actually earned: LIVE (proven by a real HTTP 200 fetch, dated), UNKNOWN
 *      (polled and unreadable, said out loud), CANDIDATE (named, no fetch).
 *
 * Counts on this page are computed from data/layer0Nodes.ts at render time —
 * never written from recall.
 */

const BENCH: { figure: string; title: string; caveat: string }[] = [
  {
    figure: "1.000",
    title: "GovComp-Bench gate — 32/32 scenarios",
    caveat:
      "32 scenarios mapped to EU AI Act Art 5/9/12/14, run against the real governed gate. Honest framing: the benchmark first FOUND a real miss (a code-framed audit-log delete), we published it, then closed it. 1.0 is on our scenario set — not a claim of perfection.",
  },
  {
    figure: "0.489",
    title: "Frontier comparison — same grid, frontier API model",
    caveat:
      "3 testable dimensions, n=13. Low attestation/oversight scores are structural — no signing, no escalate action. A measurement, not an accusation.",
  },
  {
    figure: "3",
    title: "Framework gap matrix — real primaries",
    caveat:
      "Sub-agent delegation — who is accountable when an agent spawns agents — is SILENT in NIST AI RMF, the EU AI Act, and the UK framework, checked against fetched primary text of all three. The UK response even asks the question verbatim and answers none of it.",
  },
  {
    figure: "0.0%",
    title: "Refusal quality — false positives",
    caveat:
      "The care gate refused 0 of 50 hard benign prompts while holding its harm-refusal battery, and an academic-frame guard passes 17/17. Asking WHY something is banned is answered; asking HOW to do it is refused.",
  },
  {
    figure: "15/15",
    title: "SOVBENCH citations — primary-verified",
    caveat:
      "Every regulatory citation checked for existence AND content against primary sources (EUR-Lex et al.), each carrying its verified source and scope.",
  },
  {
    figure: "∅",
    title: "What we do NOT claim",
    caveat:
      "Our efficiency dimension is a prototype and is not published as validated. A signature proves integrity and authorship — never that a claim is true. Provenance is not truth.",
  },
];

const CLASS_ORDER: Layer0Node["cls"][] = [
  "LAW", "REGULATOR", "STANDARD", "GOV", "COMPANY", "SAFETY", "HEALTH", "SCHOLARLY", "INTL",
];

const STATUS_BADGE: Record<NodeStatus, string> = {
  LIVE: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  UNKNOWN: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  CANDIDATE: "border-slate-500/40 bg-slate-500/5 text-slate-300/80",
};

const STATUS_NOTE: Record<NodeStatus, string> = {
  LIVE: "proven by a real HTTP 200 fetch",
  UNKNOWN: "polled — unreadable, said out loud",
  CANDIDATE: "named — no fetch yet",
};

const L0_LEVELS = [
  { id: "L0-1", name: "Identity", body: "Every tool call carries a checked identity — no anonymous calls through the gate." },
  { id: "L0-2", name: "Policy-gated", body: "Every call passes the Council Gate policy check before it reaches the tool." },
  { id: "L0-3", name: "Signed", body: "Every call is Ed25519-attestable — a record another governed agent can verify offline." },
];

export default function Layer0() {
  useEffect(() => {
    document.title = "Layer 0 — the trust floor, benched | CSOAI";
  }, []);

  const groups = CLASS_ORDER.map((cls) => ({
    cls,
    nodes: LAYER0_NODES.filter((n) => n.cls === cls),
  })).filter((g) => g.nodes.length > 0);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Layer 0 · measured, dated, counted from artifacts
          </p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            The trust floor,{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
              benched.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            Layer 0 is the floor every other claim stands on:{" "}
            <strong className="text-emerald-50">
              Ed25519 signing, the care-floor gate, and offline verification
            </strong>{" "}
            — plus a <strong className="text-emerald-50">designed</strong> 33-seat council, which is
            a design figure only: when we measured how independent those seats actually were, the
            effective number came out at n_eff 1.21 of 3, so we retracted the guarantee (DR-0007)
            rather than reword it. Every claim made on this floor carries either a measurement or an
            honest status. Nothing here asks to be believed; everything here asks to be checked.
          </p>
          <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-emerald-100/60">
            {LAYER0_DISAMBIGUATION}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {/* THE BENCH */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">The bench</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            Measured results, updated 22 Jul 2026. We publish what we measured, with the number
            that could embarrass us next to the number that flatters us — a recall figure without
            a false-positive figure is half a claim.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {BENCH.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"
              >
                <div className="font-mono text-3xl font-black text-emerald-300">{b.figure}</div>
                <div className="mt-1 text-[14px] font-bold text-emerald-50">{b.title}</div>
                <p className="mt-2 text-[12px] text-emerald-100/60 leading-relaxed">{b.caveat}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AUDITED NODE REGISTRY */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">The audited node registry</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            Every anchor source Layer 0 reads, with the status it has actually earned.{" "}
            <strong className="text-emerald-50">
              {COUNTS.live} of {LAYER0_NODES.length} nodes LIVE
            </strong>{" "}
            — counted from the registry file itself, never from recall.
          </p>
          <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-400/5 px-3 py-2 text-[12px] text-amber-200/80 leading-relaxed">
            Audit note: the headline count once said 18; the probe records supported 15, and one
            node had been written from memory with no probe behind it. The number above is
            computed from <span className="font-mono">data/layer0Nodes.ts</span> at render time —
            if any sentence anywhere disagrees with it, the file wins.
          </p>

          <div className="mt-4 flex flex-wrap gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              {COUNTS.live} LIVE
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              {COUNTS.unknown} UNKNOWN
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="inline-block h-2 w-2 rounded-full border border-slate-500" />
              {COUNTS.candidate} CANDIDATE
            </span>
          </div>

          <div className="mt-6 space-y-8">
            {groups.map((g) => (
              <div key={g.cls}>
                <h3 className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-100/40">
                  {g.cls}
                </h3>
                <div className="mt-2 grid gap-2">
                  {g.nodes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-emerald-500/15 bg-[#05140d] px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="font-mono text-[13px] font-semibold text-emerald-50">
                          {n.name}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide ${STATUS_BADGE[n.status]}`}
                        >
                          {n.status}
                          {n.verified ? ` · ${n.verified}` : ""}
                        </span>
                        <span className="text-[11px] text-emerald-100/40">{n.org}</span>
                        {n.href !== "/layer0" && (
                          <Link
                            href={n.href}
                            className="ml-auto font-mono text-[11px] text-emerald-300 hover:underline"
                          >
                            see it →
                          </Link>
                        )}
                      </div>
                      <p className="mt-1.5 text-[12px] text-emerald-100/60 leading-relaxed">
                        {n.does}
                      </p>
                      <p className="mt-1 text-[10px] font-mono text-emerald-100/30">
                        {STATUS_NOTE[n.status]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MCP CONFORMANCE STRIP */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">MCP conformance</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            The same floor wraps the Model Context Protocol fleet:{" "}
            <strong className="text-emerald-50">216 servers deployed, 94% at L0-1 or above.</strong>
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {L0_LEVELS.map((l) => (
              <div
                key={l.id}
                className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-200">
                    {l.id}
                  </span>
                  <span className="text-[14px] font-bold text-emerald-50">{l.name}</span>
                </div>
                <p className="mt-2 text-[12px] text-emerald-100/60 leading-relaxed">{l.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px]">
            <Link href="/mcp-fleet" className="text-emerald-300 hover:underline">
              Browse the governed MCP fleet →
            </Link>
          </p>
        </section>

        {/* CROSS-LINKS */}
        <section className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-lg font-bold text-emerald-50">Check the floor yourself</h2>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <Link href="/gspc-verify" className="text-emerald-300 hover:underline">
              Recompute the chain client-side →
            </Link>
            <Link href="/live-ledger" className="text-emerald-300 hover:underline">
              Signed records, live →
            </Link>
            <Link href="/provenance-finding" className="text-emerald-300 hover:underline">
              ProvBench: 0 of 20 assets survived →
            </Link>
            <Link href="/mcp-fleet" className="text-emerald-300 hover:underline">
              The MCP fleet →
            </Link>
            <Link href="/refutation-ledger" className="text-emerald-300 hover:underline">
              The refutation ledger →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
