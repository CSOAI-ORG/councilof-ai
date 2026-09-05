import { useEffect } from "react";

// Council Workbench Whitepaper — a public, citable formatting of the internal
// GROWTH_BY_ACCRETION_PARADIGM research note. Every claim here is scoped to
// what has actually been measured; nothing is asserted beyond the internal
// record it's drawn from.

function Section({ n, title, children }: { n: string; title: string; children: any }) {
  return (
    <div className="border-t border-emerald-500/10 pt-6 mt-6 first:border-t-0 first:mt-0 first:pt-0">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] text-emerald-400/50">{n}</span>
        <h2 className="text-xl font-black text-emerald-50">{title}</h2>
      </div>
      <div className="mt-3 text-[14px] text-emerald-100/85 leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

export default function CouncilWhitepaper() {
  useEffect(() => { document.title = "Growth by Accretion — the Council Workbench architecture paper | CSOAI"; }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-3xl px-6 pt-14 pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Whitepaper · v1 · 2026-07-12</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            Growth by Accretion: <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">a measurement engine that grows without forgetting</span>
          </h1>
          <p className="mt-4 text-emerald-100/70 text-[14px]">The Council Workbench architecture — one paper, every claim independently assayable.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <Section n="01" title="The claim (narrow, defensible, novel)">
          <p>
            A governed AI substrate that grows by accretion on frozen open weights — so it (1) provably cannot
            catastrophically forget, (2) stays owner-bound (data never leaves the owner), and (3) holds its safety
            invariants constant as it grows. This is <b className="text-emerald-200">not</b> a foundation model,
            <b className="text-emerald-200"> not</b> AGI, and <b className="text-emerald-200">not</b> a capability
            claim over frontier models. It is a governance + growth architecture, and every part of it is
            measurable.
          </p>
        </Section>

        <Section n="02" title="Why it does not forget">
          <p>
            Learning is written to memory and replay-trained light adapters over a <b className="text-emerald-200">frozen
            base model</b>, never into the base weights. A frozen base cannot suffer catastrophic forgetting, by
            construction — there are no weights to overwrite. New capability arrives as: new memory episodes
            (append-only), new low-rank adapters (replay-regularized, EWC-style Fisher-information penalty), and
            new lineages/nodes added to the governed ensemble. Old capability is preserved because the substrate
            it lived in is never mutated, only extended.
          </p>
        </Section>

        <Section n="03" title="Why it stays owner-bound">
          <p>
            The substrate is bound to a person, not a platform. It runs on permissively-licensed open weights
            (MIT / Apache-2.0 / CC0), so it is portable across any host — the owner can switch clouds and the
            substrate follows. Copyleft components (AGPL/GPL) are quarantined to the free/open tier only; the
            paid tier is built on permissive-only dependencies plus the owner's own IP.
          </p>
        </Section>

        <Section n="04" title="Why growth stays safe">
          <p>
            Six invariants never change as the substrate grows: the care-floor, Article 0 (no equity, board seats,
            revenue-share or success fees from certified institutions), the 12 governance pillars, the designed
            33-seat council quorum, signed measurement-card attestation, and owner-binding. Growth that would violate an invariant is rejected outright —
            this is what separates accretive growth from unconstrained drift.
          </p>
        </Section>

        <Section n="05" title="What is measured — RUNNING, verified">
          <ul className="space-y-2 list-disc pl-5">
            <li><b className="text-emerald-200">Monotonic growth</b>: an overnight run recorded signed measurement-card count 17,049→17,197, NN-training labels 1,327→1,589, and world-model cards 0→87.</li>
            <li><b className="text-emerald-200">Invariants hold</b>: all 6 invariants checked clean on every 10-minute cron tick across two logged ticks, with weights persisted between checks.</li>
            <li><b className="text-emerald-200">Lineage diversity</b>: 10 distinct model families (Qwen / Llama / Gemma / DeepSeek / Mistral / Kimi / Phi / MiMo / OpenAI-OSS and others) across a 70-entry model registry, measured live by the growth controller.</li>
            <li><b className="text-emerald-200">Diversity dominates topology</b>: across 4 measured configurations (diverse-lineage ring, identical-lineage ring, diverse-lineage pyramid, identical-lineage pyramid), the diverse-vs-identical score gap (≈0.15) dwarfs the ring-vs-pyramid shape gap (≈0.024). Lineage mix is the lever that matters; geometry is secondary.</li>
            <li><b className="text-emerald-200">Containment is topology-independent</b>: the care-floor pre-gate scores 1.00 across every topology tested — safety is not a function of which voting shape is chosen.</li>
            <li><b className="text-emerald-200">Vote-signing is necessary under attack</b>: with forged-vote rejection enabled, laundered-harm containment measures 0.58–0.79 under 2–3 compromised nodes — real, and not perfect; central escalation backstops the remainder.</li>
          </ul>
        </Section>

        <Section n="06" title="What is designed, not yet running">
          <p>
            Stated plainly so no reader is misled: traffic-driven automatic brain addition, memory tiering, and
            GPU auto-provisioning are designed but not live; any GPU or spend action is owner-gated and does not
            run unsupervised. Capability vs. frontier models (a GSM8K/MMLU head-to-head) is unmeasured in this
            record — it requires a dedicated benchmark run and the governance metrics above are explicitly not a
            substitute for one.
          </p>
        </Section>

        <Section n="07" title="Two tiers: the open frame and the growing tier">
          <p>
            Council Workbench ships as <b className="text-emerald-200">two tiers</b> from one substrate. <b
            className="text-emerald-200">The open frame</b>: the published, forkable base — the governed-node
            shape, the six invariants, the open base weights, the capability contract. It does not grow; it is
            the fixed common ancestor anyone can run or audit. <b className="text-emerald-200">The growing
            tier</b>: your own running instance, owner-bound, that accretes experts, memory, and lineages from your
            own use. Two people starting from the identical open frame end up with instances that behave
            differently, because what diverges is not the frame but each instance's accreted usage pattern.
          </p>
          <p>
            This divergence has been modelled, not just asserted: a simulation of the growth mechanism (two
            instances from the same open frame, given different interaction streams over 200 steps) produces a
            divergence score that rises to <b className="text-emerald-200">0.78</b> and holds there — it does not
            collapse back toward zero. We re-ran this simulation ourselves and got the same figure. Read this
            precisely: it is a <b className="text-emerald-200">simulation of the state-accretion mechanism</b>
            (which experts, memory, and usage-weighting a given interaction history would produce) — not a
            measurement of two real trained models diverging. The real number, once instances accrue real
            experts and memory on real hardware, still needs to be measured on the live substrate; this
            simulation demonstrates the shape of the claim (grows, then holds a high plateau, never converges
            back), not a verified production result.
          </p>
        </Section>

        <Section n="08" title="Why this is worth publishing">
          <p>
            Most labs claim "it scales." Few can say — and back with a re-runnable number — that a system grows
            without forgetting, stays with its owner across platforms, and holds a fixed, auditable safety floor
            while it grows. That auditability, not a larger parameter count, is the differentiator this paper is
            making the case for.
          </p>
        </Section>

        <div className="mt-10 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5">
          <div className="text-sm font-bold text-emerald-100">Related pages</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/council-model-card" className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20">Model card →</a>
            <a href="/council-system-card" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">System & safety card →</a>
            <a href="/research-transparency" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Research & transparency →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
