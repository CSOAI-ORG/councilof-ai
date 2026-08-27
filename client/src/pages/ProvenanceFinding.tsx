import { useEffect } from "react";
import { Link } from "wouter";
import CesiumPortalCard from "@/components/CesiumPortalCard";
import FaqBlock from "@/components/FaqBlock";
import SpotInfographic from "@/components/SpotInfographic";
import { LANE4 } from "@/data/lane4Content";

const L4 = LANE4["provenance-finding"];

/**
 * /provenance-finding — the measured ProvBench result, on the site people actually reach.
 *
 * This page previously existed only in the dashboard and in csoai-org-v2. Neither is this site.
 * A measurement nobody can read is not published, so it lives here now.
 *
 * Every figure below is recomputable from results/provbench.json in the published dataset.
 * Nothing on this page is inferred at render time — the numbers are static because the artefact
 * is static.
 */

const HF = "https://huggingface.co/datasets/Nicholastempleman/govbench";

type Outcome = "destroyed" | "survived" | "unmeasured" | "modelled";

const TRANSFORMS: [string, string, Outcome][] = [
  ["identity (control)", "no modification", "survived"],
  ["JPEG re-encode q90", "an ordinary re-save", "destroyed"],
  ["JPEG re-encode q70", "an ordinary re-save", "destroyed"],
  ["JPEG re-encode q50", "an ordinary re-save", "destroyed"],
  ["resize 50%", "downscale", "destroyed"],
  ["crop 10%", "5% off each edge", "destroyed"],
  ["strip metadata", "remove APPn/COM — pixels bit-identical", "destroyed"],
  ["format → PNG", "container change", "destroyed"],
  ["format → WebP", "container change", "destroyed"],
  ["screenshot-equivalent", "rasterise + rescale + PNG", "modelled"],
  ["format → HEIC", "no encoder available here", "unmeasured"],
];

const TONE: Record<Outcome, string> = {
  destroyed: "text-rose-300",
  survived: "text-emerald-300",
  unmeasured: "text-emerald-100/40",
  modelled: "text-amber-300",
};

const LABEL: Record<Outcome, string> = {
  destroyed: "destroyed",
  survived: "survived",
  unmeasured: "UNMEASURED",
  modelled: "modelled",
};

export default function ProvenanceFinding() {
  useEffect(() => {
    document.title = "An Article 50 marking does not survive one ordinary save | CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Measured finding · Apache-2.0 · 17.14% watermark durability
          </p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            The marking that proves content is AI-generated{" "}
            <span className="bg-gradient-to-r from-rose-300 to-amber-300 bg-clip-text text-transparent">
              does not survive one ordinary save.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            EU AI Act Article 50 requires generated content to be marked machine-readably —
            effective, interoperable, robust and reliable. It applies from{" "}
            <strong className="text-emerald-50">2 August 2026</strong>, with penalties up to{" "}
            <strong className="text-emerald-50">€15M or 3% of worldwide turnover</strong>. The
            regime assumes the marking persists. We measured whether it does.
          </p>

          <div className="mt-8 rounded-2xl border-2 border-rose-400/40 bg-rose-500/[0.07] p-6">
            <p className="text-[13px] text-emerald-100/60">
              Across the marking corpus and its real-world transforms
            </p>
            <p className="mt-1 text-3xl sm:text-4xl font-black tabular-nums text-rose-300">
              17.14% watermark durability
            </p>
            <p className="mt-1 text-[13px] text-emerald-100/50">(18 of 105 marking checks survived)</p>
            <p className="mt-3 text-[13px] text-emerald-100/80 leading-relaxed">
              A marking is scored <strong className="text-emerald-50">SURVIVED</strong> only when its
              binding still validates against the asset it is attached to. A marking present but whose
              binding no longer validates is scored{" "}
              <strong className="text-rose-300">DESTROYED, not SURVIVES</strong>. The identity control
              passes; an ordinary re-encode, resize, crop or format change does not.
            </p>
          </div>
        </div>
      </section>

      {/* 3D portal — where the marking duty binds, measured not marketed */}
      <section className="mx-auto max-w-4xl px-6 pt-12">
        <CesiumPortalCard lens="csoai" preset="eu" dark />
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 space-y-10">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Every transform, and what happened</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-emerald-500/20">
            <table className="w-full text-[13px]">
              <thead className="bg-[#05140d] text-left text-emerald-300/70">
                <tr>
                  <th className="p-3 font-semibold">Transform</th>
                  <th className="p-3 font-semibold">What it is</th>
                  <th className="p-3 font-semibold">Manifest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {TRANSFORMS.map(([name, what, res]) => (
                  <tr key={name}>
                    <td className="p-3 font-medium text-emerald-50">{name}</td>
                    <td className="p-3 text-emerald-100/50">{what}</td>
                    <td className={"p-3 font-semibold " + TONE[res]}>{LABEL[res]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-emerald-100/50 leading-relaxed">
            <strong className="text-emerald-100/80">JPEG quality is irrelevant</strong> — q90, q70
            and q50 identically destroy the binding, because the manifest is metadata, not pixels. Predicted
            before the run: had q90 survived where q50 did not, the harness would have been
            measuring pixel similarity and would have been wrong.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight">The limits, stated first</h2>
          <div className="mt-4 space-y-3 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 text-[13px] text-emerald-100/80 leading-relaxed">
            <p>
              <strong className="text-emerald-50">
                The 17.14% is clustered, not per-cell.
              </strong>{" "}
              The independent unit is the <strong className="text-emerald-50">asset</strong>, not the
              cell. Nine transforms of the <em>same</em> signed asset are not nine observations — they
              are one deterministic fact restated nine times. If a hard binding breaks at q90 it breaks
              at q50 for the identical reason. Survival is counted per marking check (18 of 105) but the
              intervals behind it are computed at the asset level.
            </p>
            <p>
              <strong className="text-emerald-50">
                The residual uncertainty is not sampling noise.
              </strong>{" "}
              A hard binding is a cryptographic hash over asset bytes, so re-running any cell
              reproduces the identical outcome with probability 1. The bound quantifies
              generalisation to unseen assets and transforms — external validity, nothing else.
            </p>
            <p>
              <strong className="text-emerald-50">One transform is modelled.</strong>{" "}
              Screenshot-equivalent simulates a screen capture rather than taking one. The
              modelling is conservative: a real screenshot discards the container entirely.
            </p>
            <p>
              <strong className="text-emerald-50">Our certificate is a private root</strong>, not on
              the C2PA trust list — so <code>issuer_resolvable</code> fails in every cell including
              the control. That is a property of our credential, not damage from a transform.
              Survival is about binding integrity, not trust-list membership.
            </p>
            <p>
              <strong className="text-emerald-50">Not tested:</strong> soft binding (watermarks) and
              cloud manifest recovery. Both exist precisely <em>because</em> embedded manifests do
              not survive. Named as missing rather than passed.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight">What this finding is not</h2>
          <div className="mt-4 space-y-2 rounded-2xl border border-emerald-500/20 border-l-4 border-l-rose-400/60 bg-[#05140d] p-6 text-[13px] text-emerald-100/80 leading-relaxed">
            <p>It is not &ldquo;C2PA is broken.&rdquo; C2PA does exactly what it specifies.</p>
            <p>
              It is not &ldquo;Article 50 doesn&rsquo;t work.&rdquo; The Article says &ldquo;as far
              as is technically feasible&rdquo; — this measures what that phrase costs in practice.
            </p>
            <p>
              It is not &ldquo;provenance is useless.&rdquo; A detached sidecar recovers the{" "}
              <em>disclosure</em>, which is what Article 50(2) asks for. It never recovers the{" "}
              <em>binding</em>.
            </p>
            <p className="pt-2 font-semibold text-emerald-50">
              We publish a measurement. Others draw conclusions.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight">The result that matters more</h2>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 text-[13px] text-emerald-100/80 leading-relaxed">
            <p>
              A manifest lifted from a{" "}
              <strong className="text-emerald-50">completely different asset</strong> still reports{" "}
              <code>signature_valid = survived</code>. Only <code>binding_intact</code> catches the
              transplant — measured, not assumed.
            </p>
            <p className="mt-3 font-semibold text-emerald-50">
              So a verifier that reports &ldquo;signature valid&rdquo; without reporting the binding
              is telling you almost nothing. If you are buying a provenance product, that is the
              question to ask it.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-[13px]">
          <a
            href={HF}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 hover:underline"
          >
            Data, harness and raw JSON →
          </a>
          <Link href="/refutation-ledger" className="text-emerald-300 hover:underline">
            The experiments that refuted us →
          </Link>
        </div>

        <p className="text-[11px] text-emerald-100/40">
          Reproduce it: <code>python3 provbench.py --selftest</code> then{" "}
          <code>python3 provbench.py</code>. Harness Apache-2.0; every figure — including the
          17.14% durability (18 of 105) — recomputable from <code>results/provbench.json</code>.
        </p>
      </section>

      <SpotInfographic title={L4.spotTitle} stats={L4.spotStats} source={L4.spotSource} />
      <FaqBlock title={L4.faqTitle} intro={L4.faqIntro} items={L4.faq} />
    </div>
  );
}
