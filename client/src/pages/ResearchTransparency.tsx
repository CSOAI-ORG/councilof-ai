import { useEffect } from "react";

// Research & Transparency — a curated, public synthesis of CSOAI's internal
// research findings, including the ones that didn't pan out. This is edited
// prose, not a raw dump of internal files: nothing here reproduces internal
// filenames, informal notes, or file-path references. The point is to show a
// governance company's own audit trail, honestly, including corrections.

function Finding({ title, verdict, tone, children }: { title: string; verdict: string; tone: "confirmed" | "retracted" | "partial"; children: any }) {
  const cfg = {
    confirmed: { cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200", label: verdict },
    retracted: { cls: "border-rose-400/40 bg-rose-500/10 text-rose-200", label: verdict },
    partial: { cls: "border-amber-400/40 bg-amber-500/10 text-amber-200", label: verdict },
  }[tone];
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[15px] font-bold text-emerald-50">{title}</div>
        <span className={"rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " + cfg.cls}>{cfg.label}</span>
      </div>
      <div className="mt-2 text-[13px] text-emerald-100/80 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function ResearchTransparency() {
  useEffect(() => { document.title = "Research & Transparency | CSOAI"; }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Research & Transparency</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            We publish our <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">wrong turns</span>, not just our wins.
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            A governance company that only publishes flattering results is not credible. Below is a running,
            honest account of research findings behind our internal research lineage — including claims we made, then
            corrected or retracted after closer scrutiny. Confirmed findings link to the technical detail;
            retracted ones explain exactly what was wrong and why.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10 space-y-4">
        <Finding title="Lineage diversity beats topology shape" verdict="CONFIRMED" tone="confirmed">
          <p>Across three independent measurement passes, diverse model lineages (e.g. Qwen + Llama + DeepSeek + Gemma + Mistral) consistently outperformed identical-lineage configurations of the same size on a governance-quality battery. The gap between diverse and identical configurations was roughly 6× larger than the gap between different topology shapes (ring vs. pyramid vs. triangle). Practical upshot: which models you combine matters far more than how you arrange them.</p>
        </Finding>

        <Finding title="A one-size 'containment = 1.00 under attack' claim" verdict="RETRACTED & CORRECTED" tone="retracted">
          <p>An early adversarial test reported perfect containment (1.00) even under a simulated majority attack. On review, the test was tautological — it hard-gated on a condition that was true of every attack by construction, so it proved nothing about actual robustness. We retracted the claim and reran a corrected test that separates "obvious" breaches (which are gated to zero regardless of votes, by design) from "laundered" harm that looks confident but is actually harmful (where the real result is 58–79% containment under 2–3 compromised voting nodes — real, useful, and explicitly not perfect).</p>
        </Finding>

        <Finding title="A fabricated citation, caught and removed" verdict="RETRACTED" tone="retracted">
          <p>An internal research note once cited a named news publication in support of a claim. On review the citation did not exist — it was an invented reference. It has been struck from every downstream document. The underlying technical claim it was attached to stands on its own on running code and measured results, not on any citation, and is unaffected.</p>
        </Finding>

        <Finding title="An acceptance claim, downgraded" verdict="CORRECTED" tone="partial">
          <p>A research note referenced an academic conference acceptance. This was overstated — the correct framing is that submission to that venue is a target, not a confirmed acceptance. The claim has been downgraded to aspirational language throughout.</p>
        </Finding>

        <Finding title="Independent cross-verification of a research pass" verdict="PARTIALLY VERIFIED" tone="partial">
          <p>A separate research pass reported that diverse 5-model configurations won on both a clean-data metric and a containment metric, using a distinct code path from our own measurement. We could independently verify only one of the two measurement passes behind this finding on the tree at the time it was reported; the second is treated as a consistent but unverified secondary report until its source code is confirmed on disk. We flag this rather than quietly merging both into one number.</p>
        </Finding>

        <Finding title="A capability benchmark we do not yet have" verdict="OPEN — NOT DONE" tone="partial">
          <p>We have not run a head-to-head capability benchmark (e.g. GSM8K, MMLU) of our fine-tuned model against frontier models. The governance-topology results above measure decision-quality, safety, and cost under a stated error model — they are a real, useful, and different thing from a capability benchmark, and we do not present one as a substitute for the other. This is an open item, not a hidden one.</p>
        </Finding>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5">
          <div className="text-sm font-bold text-emerald-100">Why we do this</div>
          <p className="mt-2 text-[13px] text-emerald-100/75 leading-relaxed">
            If we cannot survive our own adversarial review, we have no business selling assurance to anyone
            else. Every finding above was caught and corrected before — or immediately after — it appeared in
            any customer-facing material. That correction loop, not a flawless research record, is the actual
            credibility signal.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/council-model-card" className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20">Model card →</a>
            <a href="/council-system-card" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">System & safety card →</a>
            <a href="/workbench-paper" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Architecture whitepaper →</a>
          </div>
          <p className="mt-4 text-[11px] text-emerald-300/50">Updated as findings are confirmed or corrected. Last reviewed 2026-07-12.</p>
        </div>
      </section>
    </div>
  );
}
