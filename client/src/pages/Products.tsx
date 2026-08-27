import { useEffect } from "react";
import { Link } from "wouter";
import { setMetaDescription, setOgMeta } from "@/lib/utils";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";
import { NrsroDisclaimer } from "@/components/NrsroDisclaimer";

/**
 * /products — living catalog of Council OS surfaces (HO.2).
 * Free forever for regulators / verify. Scores never sold.
 * No invented list prices as MEASURED — rates only after published ruling.
 */

type ProductRow = {
  name: string;
  path: string;
  register: "LIVE" | "MEASURED" | "UNMEASURED" | "PARTIAL" | "PLANNED" | "DESIGN";
  blurb: string;
  monetize?: string;
};

const PRODUCTS: { group: string; rows: ProductRow[] }[] = [
  {
    group: "RAS — run/access SKUs (HO.2)",
    rows: [
      {
        name: "RAS · pay-per-call (PAYG)",
        path: "/payg",
        register: "LIVE",
        blurb: "Metered machine-access — one key, signed cards per call",
        monetize: "Access / runs only — no grade SKUs · pricing pending ruling",
      },
      {
        name: "East-West evidence packs",
        path: "/east-west/pricing",
        register: "LIVE",
        blurb: "Crosswalk packs as data — bridge tooling as license",
        monetize: "Scores and rankings £0 forever · no grade SKUs",
      },
    ],
  },
  {
    group: "Measurement board",
    rows: [
      {
        name: "GSPC scoreboard",
        path: "/gspc-scoreboard",
        register: "MEASURED",
        blurb: "14-slot board · GET /api/gspc · Ed25519",
        monetize: "Verify free forever · grades never sold",
      },
      {
        name: "GSPC verify",
        path: "/gspc-verify",
        register: "LIVE",
        blurb: "Client-side recompute — no account",
        monetize: "Free forever",
      },
      {
        name: "East-West",
        path: "/east-west",
        register: "LIVE",
        blurb: "One signed measurement mapped across regimes — mapping ≠ determination",
      },
      {
        name: "SOV Signal",
        path: "/api/signal",
        register: "PARTIAL",
        blurb: "Regulation × crosswalk × GSPC × arena — no fused score yet",
      },
    ],
  },
  {
    group: "Labour & economy indices (net-new)",
    rows: [
      {
        name: "AI Economy Index",
        path: "/indices/ai-economy",
        register: "UNMEASURED",
        blurb: "Declared empty — contextual citations only",
      },
      {
        name: "Human Labour Index",
        path: "/indices/human-labour",
        register: "UNMEASURED",
        blurb: "Declared empty — not a wage/displacement score yet",
      },
      {
        name: "Humanoid Labour Index",
        path: "/indices/humanoid-labour",
        register: "UNMEASURED",
        blurb: "Declared empty — POC/machinery adjacency only",
      },
      {
        name: "Indices hub",
        path: "/indices",
        register: "UNMEASURED",
        blurb: "All three on one rail",
      },
    ],
  },
  {
    group: "RWA / attestation / Option A",
    rows: [
      {
        name: "Competitors · RWA EAT corpus",
        path: "/competitors",
        register: "PARTIAL",
        blurb: "Public-artifact targets · clean vs demo plays",
      },
      {
        name: "Powered by Council OS",
        path: "/powered-by",
        register: "DESIGN",
        blurb: "White-label attestation licensing — not tokenization",
        monetize: "Quote-based · no grade prices on this page",
      },
      {
        name: "Engine Axis",
        path: "/engine-axis",
        register: "PARTIAL",
        blurb: "Financial extension slots 18–25 + labour candidacy",
      },
    ],
  },
  {
    group: "Workspace & agents",
    rows: [
      {
        name: "Council OS",
        path: "/os",
        register: "LIVE",
        blurb: "Lobby · board · MCP · AG-UI",
      },
      {
        name: "Eunomia instruments",
        path: "/instruments",
        register: "LIVE",
        blurb: "OpenRouter-shaped governance catalog",
      },
      {
        name: "Distribution Hive",
        path: "/intel",
        register: "LIVE",
        blurb: "Org index — regulators, enterprises, SMBs",
      },
      {
        name: "Agent runbook",
        path: "/agent-runbook",
        register: "LIVE",
        blurb: "curl-first machine surfaces",
      },
    ],
  },
];

export default function Products() {
  useEffect(() => {
    document.title = "Products catalog — measurement access, not grade sales | CSOAI";
    const desc =
      "Council OS product catalog: GSPC, East-West, UNMEASURED labour/economy indices, Option A, instruments. Scores never sold. Regulators and verify free forever.";
    setMetaDescription(desc);
    setOgMeta({
      title: "Products catalog | CSOAI",
      description: desc,
      path: "/products",
    });
    void fetch("/api/surface-hits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "/products" }),
    }).catch(() => {});
  }, []);

  return (
    <CouncilOsPageShell
      title="Products"
      subtitle="Catalog · HO.2 — scores never sold"
      className="min-h-screen bg-[#03110b] text-emerald-50"
    >
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Living catalog · registers honest
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            What ships.{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              What doesn&apos;t pretend to.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            Access to cards, runs, tooling, and training may be metered via <strong className="text-emerald-100">RAS</strong>{" "}
            (run/access SKUs). Grades and placements are never sold. Regulators and offline verify stay free forever. No
            invented list prices on this page.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-12">
        {PRODUCTS.map((g) => (
          <section key={g.group}>
            <h2 className="text-lg font-bold text-emerald-100/90">{g.group}</h2>
            <ul className="mt-4 divide-y divide-emerald-500/10 rounded-2xl border border-emerald-500/15 overflow-hidden">
              {g.rows.map((r) => (
                <li key={r.path} className="bg-[#05140d] px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <Link
                      href={r.path}
                      aria-label={`${r.name} — ${r.register}`}
                      className="font-semibold text-emerald-50 hover:text-emerald-300"
                    >
                      {r.name}
                    </Link>
                    <p className="mt-1 text-sm text-emerald-100/65">{r.blurb}</p>
                    {r.monetize ? (
                      <p className="mt-1 text-xs text-amber-200/70">{r.monetize}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-emerald-300/60 border border-emerald-500/20 rounded-full px-2 py-0.5 h-fit">
                    {r.register}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="text-xs text-emerald-200/50">
          Legal templates:{" "}
          <code className="font-mono">compliance/attestation-language-template.md</code> · custody:{" "}
          <code className="font-mono">compliance/key-custody-decision.md</code> · playbook:{" "}
          <code className="font-mono">docs/EAT_PLAYBOOK.md</code> · moves:{" "}
          <code className="font-mono">docs/NEXT_300_MOVES.md</code>
        </p>

        <NrsroDisclaimer />

        <footer className="pt-2 pb-8 text-center text-[11px] text-emerald-300/45 font-mono">
          Council of AI · CSOAI Ltd · UK Companies House 16939677 · Measurement, not certification ·
          scores never sold
        </footer>
      </div>
    </CouncilOsPageShell>
  );
}
