import { useEffect } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BOND_OPENINGS,
  BFT_HANDOFF_PHASES,
  COBOL_A2A_ROSETTA,
} from "@/data/bond-venturi";
import {
  BOND_CRYPTO_BRIDGE,
  CRYPTO_MICRO_FLOW,
  CRYPTO_OPENINGS,
  SIGNING_LAYER,
} from "@/data/crypto-arteries";
import { StackHonestyBanner } from "@/components/StackHonestyBanner";
import { STACK_STATS, BOND_MARKET_REPORTED_T } from "@/lib/stackHonesty";
import { openLobby } from "@/lib/lobbyLink";

function RevenueLine({ revenue }: { revenue: string }) {
  return (
    <p className="mt-3 text-xs text-emerald-400/90">
      <span className="mr-2 rounded bg-amber-950/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400/90">
        DESIGN
      </span>
      {revenue}
    </p>
  );
}

export default function BondVenturi() {
  useEffect(() => {
    document.title = "Bond Venturi — COBOL to A2A | Eunomia | Council of AI";
  }, []);

  return (
    <div className="min-h-screen bg-[#04070d] text-slate-200">
      <header className="border-b border-white/8 bg-[#080c14]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-400/90 mb-3">Eunomia Finance</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            The bond market venturi
          </h1>
          <p className="mt-4 max-w-3xl text-slate-400 leading-relaxed">
            ${BOND_MARKET_REPORTED_T} trillion of fixed income (REPORTED industry context). COBOL is the fed state —
            bloated, batch-processed, high entropy. A2A is the fasted state — lean, real-time, low entropy. Eunomia is
            the metabolic boundary that converts one to the other without killing the host. Most finance wiring here is
            SPEC or DESIGN until frozen banks publish.
          </p>
          <div className="mt-8">
            <StackHonestyBanner note="Bond venturi openings are architecture thesis. GSPC core axes are the only MEASURED evidence on this surface today." />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/legacy">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Legacy Bridge →</Button>
            </Link>
            <Link href="/engine-axis">
              <Button variant="outline" className="border-white/15">Engine Axis →</Button>
            </Link>
            <Link href="/instruments">
              <Button variant="outline" className="border-white/15 text-slate-300">
                Eunomia Router
              </Button>
            </Link>
            <Button
              variant="outline"
              className="border-amber-500/30 text-amber-300"
              onClick={() =>
                openLobby({
                  prompt:
                    "Walk me through atomic DvP bond settlement on Eunomia — COBOL batch to A2A T+0 with USDC on Base and C2PA attestation.",
                })
              }
            >
              Ask in Council Lobby
            </Button>
          </div>
        </div>
      </header>

      {/* Engine axis */}
      <section className="border-b border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-6">
            Opening 7 — Engine axis (Y = trust, X = time)
          </h2>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-6 text-xs text-emerald-100 font-mono leading-relaxed">
{`                    Y-AXIS: EUNOMIA ENGINE
                    (Trust · Verification · Compliance)
                           ↑
                           │
    HUMAN (left) ◄─────────┼─────────► AGENT (right)
    COBOL era              │         A2A era
    Batch · T+2            │         Real-time · T+0
    Trust via relationship │         Trust via cryptography
    5 intermediaries       │         0 intermediaries (DESIGN)
                           │
                           ▼
                    X-AXIS: TIME / VELOCITY

${STACK_STATS.mcpServers} MCP servers catalogued = trust density on Y.
Governance safety on every crossing — when wired (mostly SPEC today).`}
          </pre>
        </div>
      </section>

      {/* Rosetta */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-white mb-2">Opening 1 — COBOL-to-A2A Rosetta Stone</h2>
        <p className="text-sm text-slate-500 mb-6">
          You don&apos;t replace COBOL. You wrap it. The overnight report becomes a real-time C2PA attestation.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="p-3">COBOL legacy</th>
                <th className="p-3">A2A agent</th>
                <th className="p-3">MCP bridge</th>
                <th className="p-3">Eunomia URI</th>
              </tr>
            </thead>
            <tbody>
              {COBOL_A2A_ROSETTA.map((row) => (
                <tr key={row.mcp} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 text-slate-300">{row.cobol}</td>
                  <td className="p-3 text-slate-400">{row.a2a}</td>
                  <td className="p-3">
                    <Link href={`/mcp/${row.mcp}`}>
                      <a className="text-emerald-400 hover:underline font-mono text-xs">{row.mcp}</a>
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-amber-400/90">{row.eunomiaUri}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Settlement diagram */}
      <section className="border-t border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-bold text-white mb-2">Opening 2 — T+2 → T+0 atomic DvP</h2>
          <p className="text-sm text-slate-500 mb-6">
            Tokenized bond + USDC cash leg on Base. Both settle or neither. MiCA + EU AI Act verified at the boundary.
          </p>
          <pre className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-6 text-xs text-emerald-100 font-mono leading-relaxed">
{`BUYER (Bank A)                         SELLER (Bank B)
     │                                        │
     ▼                                        ▼
┌─────────┐                            ┌─────────┐
│ COBOL   │──► EUNOMIA Wrapper ────────►│ A2A     │
│ Core    │    (reads legacy)           │ Agent   │
│ Banking │◄─── (writes back) ◄────────│ Card    │
└────┬────┘                            └────┬────┘
     │                                      │
     └──────────────────┬───────────────────┘
                    ▼
           ┌───────────────┐
           │ SMART CONTRACT  │
           │ · Tokenized bond│  USDC / JPM Coin on Base
           │ · Cash leg      │  Atomic DvP
           │ · Compliance    │  Ed25519 + x402 receipt
           └───────────────┘`}
          </pre>
          <p className="mt-4 text-xs text-slate-500">
            Settlement rails:{" "}
            <Link href="/payg"><a className="text-emerald-400 hover:underline">PAYG / USDC on Base</a></Link>
            {" · "}
            <code className="text-amber-400/80">meok-coinbase-x402-receipt-mcp</code>
          </p>
        </div>
      </section>

      {/* BFT handoff */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-white mb-6">Opening 3 — BFT human-to-agent handoff</h2>
        <ol className="space-y-4">
          {BFT_HANDOFF_PHASES.map((p) => (
            <li key={p.phase} className="flex gap-4 rounded-lg border border-white/10 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">
                {p.phase}
              </span>
              <div>
                <span className="text-xs uppercase tracking-wide text-slate-500">{p.actor}</span>
                <p className="mt-1 text-slate-300">{p.action}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* EAT framework */}
      <section className="border-t border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-bold text-white mb-2">Opening 6 — The COBOL EAT framework</h2>
          <p className="text-sm text-slate-500 mb-6">Batch-to-stream metabolic architecture</p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="rounded-xl border border-white/10 p-5">
              <Badge className="mb-2 bg-slate-700/50 text-slate-300">Fed (EAT)</Badge>
              <p className="text-slate-400">COBOL batch processing · T+2 · overnight reconciliation · the meal</p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
              <Badge className="mb-2 bg-emerald-600/30 text-emerald-300">Venturi (Eunomia)</Badge>
              <p className="text-slate-300">Metabolic boundary · absorb batch · emit verifiable streams · the stomach lining</p>
            </div>
            <div className="rounded-xl border border-white/10 p-5">
              <Badge className="mb-2 bg-amber-600/30 text-amber-300">Fasted (A2A)</Badge>
              <p className="text-slate-400">Real-time streaming · T+0 atomic · ketone cognition · no reconciliation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Crypto arteries — Stake Slash Bond Pay DAO */}
      <section className="border-t border-white/8 bg-[#0a0f18]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-400/90 mb-2">EAT · Crypto as blood</p>
          <h2 className="text-xl font-bold text-white mb-2">Crypto is the blood, not the skin</h2>
          <p className="text-sm text-slate-500 mb-2 max-w-3xl">{BOND_CRYPTO_BRIDGE.thesis}</p>
          <p className="text-xs text-slate-600 mb-8">
            USDC on Base already on{" "}
            <Link href="/payg"><a className="text-emerald-400 hover:underline">/payg</a></Link>
            {" · "}End users top up once — router signs micro-transactions automatically (x402 underneath, frictionless UX on top).
          </p>

          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            When we sign — four cryptographic layers
          </h3>
          <div className="overflow-x-auto rounded-xl border border-white/10 mb-10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="p-3">Sign type</th>
                  <th className="p-3">Mechanic</th>
                  <th className="p-3">Repo</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {SIGNING_LAYER.map((s) => (
                  <tr key={s.type} className="border-b border-white/5">
                    <td className="p-3 text-white font-medium">{s.type}</td>
                    <td className="p-3 text-slate-400">{s.mechanic}</td>
                    <td className="p-3">
                      <Link href={`/mcp/${s.repo}`}>
                        <a className="font-mono text-xs text-emerald-400 hover:underline">{s.repo}</a>
                      </Link>
                    </td>
                    <td className="p-3">
                      <span
                        className={
                          s.status === "shipped"
                            ? "text-emerald-400 text-xs"
                            : "text-amber-400 text-xs"
                        }
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            Invisible micro-payments (wallet top-up once)
          </h3>
          <ul className="grid sm:grid-cols-2 gap-2 mb-10 text-xs">
            {CRYPTO_MICRO_FLOW.map((m) => (
              <li key={m.event} className="rounded-lg border border-white/10 p-3 text-slate-400">
                <span className="text-violet-300 font-mono">{m.amount}</span> — {m.event}
                <span className="block text-slate-600 mt-0.5">→ {m.to}</span>
              </li>
            ))}
          </ul>

          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
            10 crypto openings — {STACK_STATS.mcpServers} MCP fleet
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {CRYPTO_OPENINGS.map((c) => (
              <li key={c.id} className="rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] text-violet-400/80">{c.eunomiaUri}</p>
                  <span
                    className={
                      "text-[10px] uppercase shrink-0 " +
                      (c.status === "shipped"
                        ? "text-emerald-400"
                        : c.status === "partial"
                          ? "text-amber-400"
                          : "text-slate-600")
                    }
                  >
                    {c.status}
                  </span>
                </div>
                <h4 className="mt-1 font-semibold text-white text-sm">{c.title}</h4>
                <p className="mt-2 text-xs text-slate-500">{c.mechanic}</p>
                <p className="mt-2 text-[11px] text-violet-300/80 italic">EAT: {c.eatLens}</p>
                <RevenueLine revenue={c.revenue} />
              </li>
            ))}
          </ul>

          <div className="mt-8 grid sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-slate-500 uppercase tracking-wide mb-1">COBOL (fed)</p>
              <p className="text-slate-400">{BOND_CRYPTO_BRIDGE.cobolRole}</p>
            </div>
            <div className="rounded-lg border border-violet-500/30 bg-violet-950/20 p-4">
              <p className="text-violet-300 uppercase tracking-wide mb-1">Venturi</p>
              <p className="text-slate-300">{BOND_CRYPTO_BRIDGE.venturiRole}</p>
            </div>
            <div className="rounded-lg border border-white/10 p-4">
              <p className="text-slate-500 uppercase tracking-wide mb-1">A2A + crypto (fasted)</p>
              <p className="text-slate-400">{BOND_CRYPTO_BRIDGE.a2aRole} · {BOND_CRYPTO_BRIDGE.cryptoRole}</p>
            </div>
          </div>
        </div>
      </section>

      {/* All bond openings */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 pb-20">
        <h2 className="text-xl font-bold text-white mb-6">All seven openings</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {BOND_OPENINGS.map((o) => (
            <li key={o.id} className="rounded-xl border border-white/10 p-5 hover:border-emerald-500/30 transition">
              <p className="font-mono text-[10px] text-amber-400/80">{o.eunomiaUri}</p>
              <h3 className="mt-1 font-semibold text-white">{o.title}</h3>
              <p className="mt-2 text-xs text-slate-500">{o.problem}</p>
              <p className="mt-2 text-sm text-slate-400">{o.solution}</p>
              <RevenueLine revenue={o.revenue} />
              <div className="mt-3 flex flex-wrap gap-1">
                {o.mcpSlugs.map((s) => (
                  <Link key={s} href={`/mcp/${s}`}>
                    <a className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400 hover:text-emerald-400">
                      {s}
                    </a>
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-xl border border-amber-500/20 bg-amber-950/20 p-6 text-center">
          <p className="text-sm text-amber-100/90 max-w-2xl mx-auto">
            You don&apos;t compete with OpenRouter, JPMorgan, or DTCC. You are the protocol they route through when they
            need to trust each other. Deep product:{" "}
            <a href="https://cobolbridge.ai" target="_blank" rel="noreferrer" className="underline text-amber-300">
              cobolbridge.ai
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
