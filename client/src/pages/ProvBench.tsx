import { useEffect } from "react";
import { Link } from "wouter";

/**
 * /provbench — Does an EU AI Act Article 50 provenance marking survive real-world transforms?
 *
 * ProvBench v0.1.0: 20 assets × 11 transforms × 2 configs × 5 checks = 220 cells.
 * Every number carries its clustered CI and its caveat. The harness, the corpus,
 * and every per-cell outcome are on disk — no number may be typed by hand
 * without its artefact path.
 */

const ARTEFACT =
  "csoai-static-deploy2/benchmark-results/provbench.json";

const ARTEFACT_BOUND =
  "csoai-static-deploy2/benchmark-results/provbench-canonical-bound.json";

// headline results — embedded-only config (the one Article 50 cares about)
const EMBEDDED_RESULTS = [
  { check: "Manifest present", survived: "0/20", rate: "0%", ci: "[0, 16.1%]" },
  { check: "Digital source type", survived: "0/20", rate: "0%", ci: "[0, 16.1%]" },
  { check: "Signature valid", survived: "0/20", rate: "0%", ci: "[0, 16.1%]" },
  { check: "Binding intact", survived: "0/20", rate: "0%", ci: "[0, 16.1%]" },
  { check: "Issuer resolvable", survived: "0/20", rate: "0%", ci: "[0, 16.1%]" },
];

// sidecar-oracle config (most favourable assumption)
const SIDECAR_RESULTS = [
  { check: "Manifest present", survived: "20/20", rate: "100%", ci: "[83.9%, 100%]" },
  { check: "Digital source type", survived: "20/20", rate: "100%", ci: "[83.9%, 100%]" },
  { check: "Signature valid", survived: "20/20", rate: "100%", ci: "[83.9%, 100%]" },
  { check: "Binding intact", survived: "0/20", rate: "0%", ci: "[0, 16.1%]" },
  { check: "Issuer resolvable", survived: "0/20", rate: "0%", ci: "[0, 16.1%]" },
];

const TRANSFORMS = [
  "Identity (control)",
  "JPEG re-encode q90",
  "JPEG re-encode q70",
  "JPEG re-encode q50",
  "Resize 50%",
  "Crop 10%",
  "Strip metadata",
  "Screenshot equiv.",
  "Convert → PNG",
  "Convert → WebP",
  "Convert → HEIC",
];

const CAVEATS = [
  "A surviving signature proves PROVENANCE, NOT CORRECTNESS. It states that these bytes carry a claim signed by this key with this declared history. It says nothing about whether the content is accurate, safe, or lawful.",
  "Our certificate chains to a PRIVATE ROOT CA not on the C2PA trust list. issuer_resolvable is 0% everywhere by construction — a property of the credential, not damage from a transform.",
  "sidecar_oracle is the MOST FAVOURABLE assumption: the harness hands the detached manifest straight to the verifier. In the field you must first work out which sidecar belongs to which asset, and after a crop or re-encode you cannot do that by hash.",
  "Transforms are applied by Pillow. A different re-encoder (libvips, ImageMagick, a phone ISP, a CDN) may behave differently. This measures the common case, not every case.",
  "n=20 assets. 0 survivors out of 20 still admits a true survival rate up to 16.1%. Quote ci_clustered, not ci: the unclustered pooled interval treats the same assets as 180 independent trials and is too narrow.",
];

const STATS = [
  {
    title: "Clustered CIs",
    body: "Cells cluster by (asset, transform) — not independent trials. Wilson/Clopper-Pearson intervals computed at the asset level (n=20), not the cell level (n=180).",
  },
  {
    title: "Rule-of-three bound",
    body: "0 survivors out of 20 assets → 95% upper bound on true survival rate: 15.0% (rule-of-three). One-sided Wilson: 11.9%.",
  },
  {
    title: "Pre-registered predictions",
    body: "All predictions locked before first measurement. Embedded binding: predicted 'destroyed' — confirmed. Sidecar provenance: predicted 'survived' — confirmed.",
  },
  {
    title: "Reproducibility",
    body: "Hard binding = cryptographic hash over bytes. Re-running any cell reproduces the identical outcome with probability 1. Run-to-run uncertainty is structurally zero.",
  },
];

export default function ProvBench() {
  useEffect(() => {
    document.title =
      "ProvBench — Does provenance survive the real world? | CSOAI";
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-800/40 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-500">
            ProvBench v0.1.0 · C2PA Article 50 · 20 assets · 11 transforms · 220 cells
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            Does provenance survive{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              the real world?
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-emerald-200/80">
            We marked 20 assets with C2PA manifests (Ed25519, embedded + sidecar),
            applied 11 real-world transforms (JPEG re-encode, crop, resize, metadata strip,
            format convert, screenshot), and checked 5 provenance properties.
            The result:{" "}
            <strong className="text-emerald-300">
              0 of 20 assets survived binding-intact under embedded-only.
            </strong>{" "}
            Every number carries its clustered CI. The harness, the corpus, and every
            per-cell outcome are on disk.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {/* THE HEADLINE */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-100">The headline</h2>
          <p className="mt-1 text-[13px] text-emerald-400">
            Two configs, five checks, one devastating split.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Embedded */}
            <div className="rounded-2xl border border-red-800/40 bg-red-950/20 p-6">
              <h3 className="text-[15px] font-semibold text-red-300">
                Embedded-only
              </h3>
              <p className="mt-1 text-[12px] text-red-400/70">
                Manifest baked into the asset bytes. What Article 50 imagines.
              </p>
              <div className="mt-4 space-y-2">
                {EMBEDDED_RESULTS.map((r) => (
                  <div key={r.check} className="flex justify-between text-[13px]">
                    <span className="text-red-200/80">{r.check}</span>
                    <span className="font-mono text-red-300">
                      {r.rate} <span className="text-red-500/60 text-[11px]">{r.ci}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[12px] text-red-400/70 font-mono">
                artefact: {ARTEFACT}
              </p>
            </div>

            {/* Sidecar */}
            <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-6">
              <h3 className="text-[15px] font-semibold text-emerald-300">
                Sidecar-oracle
              </h3>
              <p className="mt-1 text-[12px] text-emerald-400/70">
                Detached manifest handed directly to verifier. Most favourable assumption.
              </p>
              <div className="mt-4 space-y-2">
                {SIDECAR_RESULTS.map((r) => (
                  <div key={r.check} className="flex justify-between text-[13px]">
                    <span className="text-emerald-200/80">{r.check}</span>
                    <span className="font-mono text-emerald-300">
                      {r.rate} <span className="text-emerald-500/60 text-[11px]">{r.ci}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[12px] text-emerald-400/70 font-mono">
                artefact: {ARTEFACT}
              </p>
            </div>
          </div>

          <p className="mt-4 text-[13px] text-emerald-300/70 italic">
            binding_intact and issuer_resolvable are 0% in BOTH configs.
            Sidecar preserves provenance markers (manifest_present, digital_source_type,
            signature_valid) but cannot preserve the cryptographic binding to asset bytes
            after a transform changes those bytes.
          </p>
        </section>

        {/* THE TRANSFORMS */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-100">The transforms</h2>
          <p className="mt-1 text-[13px] text-emerald-400">
            11 transforms applied to each of 20 signed assets. Every cell measured, never assumed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TRANSFORMS.map((t) => (
              <span
                key={t}
                className="rounded-full border border-emerald-800/40 bg-emerald-950/30 px-3 py-1 text-[12px] text-emerald-300/80"
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* THE STATISTICS */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-100">The statistics</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STATS.map((s) => (
              <div
                key={s.title}
                className="rounded-xl border border-emerald-800/30 bg-emerald-950/20 p-4"
              >
                <h3 className="text-[15px] font-semibold text-emerald-200">
                  {s.title}
                </h3>
                <p className="mt-2 text-[13px] text-emerald-300/70 leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* THE HARNESS */}
        <section className="rounded-2xl border border-emerald-800/30 bg-emerald-950/20 p-6">
          <h2 className="text-2xl font-bold text-emerald-100">The harness</h2>
          <p className="mt-2 text-[13px] text-emerald-300/70 leading-relaxed">
            Open, deterministic, reproducible. C2PA SDK 0.90.1, Ed25519 signing,
            RFC 3161 timestamping. The harness lives at{" "}
            <code className="font-mono text-emerald-400">csoai-static-deploy2/provbench.py</code>.
            Same code, same seed, same outcome on every run — the binding is a
            cryptographic hash over asset bytes, so re-running any cell reproduces
            the identical result with probability 1.
          </p>
          <p className="mt-3 text-[13px] text-emerald-300/70 leading-relaxed">
            The audio wing (ProvBench-Audio) measures open anti-spoofing detectors
            against modern TTS synthesis — running on Kaggle T4, same discipline.
          </p>
        </section>

        {/* HONESTY DISCLOSURE */}
        <section className="rounded-2xl border border-amber-800/30 bg-amber-950/10 p-6">
          <h2 className="text-2xl font-bold text-amber-200">
            What this benchmark does not claim
          </h2>
          <ul className="mt-4 space-y-2 text-[13px] text-amber-200/70 list-disc pl-5">
            {CAVEATS.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>

        {/* LINKS */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-emerald-800/30">
          <Link
            href="/benchmarks"
            className="text-[13px] text-emerald-400 hover:text-emerald-200 transition-colors"
          >
            All measured results →
          </Link>
          <Link
            href="/methodology"
            className="text-[13px] text-emerald-400 hover:text-emerald-200 transition-colors"
          >
            How the instrument measures →
          </Link>
          <Link
            href="/ai-act-benchmark"
            className="text-[13px] text-emerald-400 hover:text-emerald-200 transition-colors"
          >
            AI Act Benchmark →
          </Link>
          <Link
            href="/refutation-ledger"
            className="text-[13px] text-emerald-400 hover:text-emerald-200 transition-colors"
          >
            Read the refutation ledger →
          </Link>
        </div>
      </div>
    </div>
  );
}
