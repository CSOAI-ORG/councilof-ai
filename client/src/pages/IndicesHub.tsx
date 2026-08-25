import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import CouncilOsPageShell from "@/components/os/CouncilOsPageShell";
import {
  INDICES_FIREWALL,
  LABOUR_ECONOMY_INDICES,
  getLabourEconomyIndex,
  type LabourEconomyIndex,
} from "@/data/labourIndices";

/**
 * /indices — hub for AI-economy · human-labour · humanoid-labour.
 * /indices/:slug — single UNMEASURED surface.
 * Measurement, not certification. Scores never sold.
 */

function StatusPill({ status }: { status: LabourEconomyIndex["status"] }) {
  const color =
    status === "MEASURED"
      ? "border-emerald-400/40 text-emerald-300"
      : status === "REPORTED"
        ? "border-amber-400/40 text-amber-200"
        : "border-rose-400/40 text-rose-200";
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[2px] rounded-full border px-2.5 py-0.5 ${color}`}>
      {status}
    </span>
  );
}

function IndexDetail({ index }: { index: LabourEconomyIndex }) {
  useEffect(() => {
    document.title = `${index.title} — ${index.status} | CSOAI`;
    setMetaDescription(`${index.oneLiner} ${index.status} first — contextual citations only.`);
    void fetch("/api/surface-hits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: index.path }),
    }).catch(() => {});
  }, [index]);

  return (
    <CouncilOsPageShell
      title={index.shortTitle}
      subtitle={`${index.status} · candidacy ${index.candidacy}`}
      className="min-h-screen bg-[#03110b] text-emerald-50"
    >
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
              Contextual index · not a GSPC cell
            </p>
            <StatusPill status={index.status} />
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">{index.title}</h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">{index.oneLiner}</p>
          <p className="mt-3 text-sm text-rose-200/90 border border-rose-500/25 bg-rose-950/30 rounded-xl px-4 py-3">
            <strong className="font-semibold">Why {index.status}:</strong> {index.whyUnmeasured}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-12">
        <section>
          <h2 className="text-xl font-bold">Firewall</h2>
          <p className="mt-2 text-sm text-emerald-100/75 leading-relaxed">{index.firewall}</p>
          <p className="mt-2 text-xs text-emerald-200/50 font-mono">{INDICES_FIREWALL}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">Adjacent live surfaces</h2>
          <ul className="mt-4 space-y-2">
            {index.adjacentLive.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="text-emerald-300 hover:underline">
                  {a.label}
                </Link>
                <span className="ml-2 font-mono text-[11px] text-emerald-100/45">{a.register}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">Contextual citations</h2>
          <p className="mt-1 text-sm text-emerald-100/60">Not MEASURED inputs. Labeled context only.</p>
          <ul className="mt-4 space-y-3">
            {index.citations.map((c) => (
              <li key={c.label} className="rounded-xl border border-emerald-500/15 bg-[#05140d] p-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  {c.href ? (
                    <Link href={c.href} className="font-semibold text-emerald-200 hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-emerald-200">{c.label}</span>
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-wider text-amber-200/70">{c.role}</span>
                </div>
                <p className="mt-1 text-sm text-emerald-100/65">{c.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold">Next gate</h2>
          <p className="mt-2 text-sm text-emerald-100/80">{index.nextGate}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/indices" className="text-emerald-300 hover:underline">
              ← All indices
            </Link>
            <Link href="/engine-axis" className="text-emerald-300 hover:underline">
              Engine Axis candidacy
            </Link>
            <Link href="/products" className="text-emerald-300 hover:underline">
              Products catalog
            </Link>
            <a href={index.apiPath} className="text-emerald-300 hover:underline font-mono text-xs">
              {index.apiPath}
            </a>
          </div>
        </section>
      </div>
    </CouncilOsPageShell>
  );
}

function Hub() {
  useEffect(() => {
    document.title = "Labour & AI-economy indices — UNMEASURED first | CSOAI";
    setMetaDescription(
      "AI-economy, human-labour, and humanoid-labour indices declared UNMEASURED. Contextual citations only — never fused into GSPC grades.",
    );
    void fetch("/api/surface-hits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "/indices" }),
    }).catch(() => {});
  }, []);

  return (
    <CouncilOsPageShell
      title="Indices"
      subtitle="UNMEASURED first · same honesty rail as GSPC"
      className="min-h-screen bg-[#03110b] text-emerald-50"
    >
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Net-new axes · aspirational · honest empty
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            Three indices.{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
              Declared UNMEASURED.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            AI-economy, human-labour, and humanoid-labour are candidates on the financial-extension
            rail — named publicly so we do not pretend they already ship as MEASURED products.
          </p>
          <p className="mt-3 text-xs text-emerald-200/55 font-mono leading-relaxed">{INDICES_FIREWALL}</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 grid gap-4">
        {LABOUR_ECONOMY_INDICES.map((index) => (
          <Link
            key={index.slug}
            href={index.path}
            className="block rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 hover:border-emerald-400/40 transition-colors"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-emerald-50">{index.title}</h2>
              <StatusPill status={index.status} />
            </div>
            <p className="mt-2 text-sm text-emerald-100/70">{index.oneLiner}</p>
            <p className="mt-3 font-mono text-[11px] text-emerald-300/50">{index.candidacy}</p>
          </Link>
        ))}
        <div className="pt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/engine-axis" className="text-emerald-300 hover:underline">
            Engine Axis (slots 18–25)
          </Link>
          <Link href="/products" className="text-emerald-300 hover:underline">
            Products catalog
          </Link>
          <Link href="/gspc-scoreboard" className="text-emerald-300 hover:underline">
            GSPC board
          </Link>
          <a href="/api/indices" className="text-emerald-300 hover:underline font-mono text-xs">
            GET /api/indices
          </a>
        </div>
      </div>
    </CouncilOsPageShell>
  );
}

export default function IndicesHub() {
  const [match, params] = useRoute("/indices/:slug");
  if (match && params?.slug) {
    const index = getLabourEconomyIndex(params.slug);
    if (!index) {
      return (
        <CouncilOsPageShell title="Index not found" className="min-h-screen bg-[#03110b] text-emerald-50">
          <div className="mx-auto max-w-4xl px-6 py-16">
            <p className="text-emerald-100/80">No index named “{params.slug}”.</p>
            <Link href="/indices" className="mt-4 inline-block text-emerald-300 hover:underline">
              ← Indices hub
            </Link>
          </div>
        </CouncilOsPageShell>
      );
    }
    return <IndexDetail index={index} />;
  }
  return <Hub />;
}
