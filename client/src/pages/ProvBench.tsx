import { useEffect } from "react";
import { Link } from "wouter";

/**
 * /provbench — Does an EU AI Act Article 50 provenance marking survive real-world transforms?
 *
 * ProvBench canonical finding: 17.14% watermark durability — 18 of 105 marking
 * checks survived across the corpus. A marking that is present but whose binding
 * no longer validates is scored DESTROYED, not SURVIVES. The harness, the corpus,
 * and every per-cell outcome are on disk — no number may be typed by hand without
 * its artefact path.
 */

const ARTEFACT =
  "csoai-static-deploy2/benchmark-results/provbench.json";

// canonical headline — a marking is DESTROYED unless its binding still validates
const DURABILITY = {
  survived: 18,
  total: 105,
  rate: "17.14%",
};

const FINDINGS = [
  {
    title: "Embedded binding does not survive an ordinary save",
    tone: "rose",
    body:
      "A C2PA manifest baked into the asset bytes — what Article 50 imagines — does " +
      "not survive JPEG re-encode, resize, crop, metadata strip or a format change. " +
      "The binding is a cryptographic hash over the bytes; change the bytes and the " +
      "binding no longer validates. Scored DESTROYED, not SURVIVES.",
  },
  {
    title: "A sidecar recovers the disclosure, never the binding",
    tone: "amber",
    body:
      "A detached manifest handed straight to the verifier preserves the disclosure " +
      "markers (manifest present, signature valid) but cannot re-bind to bytes a " +
      "transform has already changed. A manifest lifted from a completely different " +
      "asset still reports signature_valid — only binding_intact catches the transplant.",
  },
  {
    title: "Present-but-invalid is not survival",
    tone: "emerald",
    body:
      "The scoring rule that produces the 17.14% figure: a marking counts as SURVIVED " +
      "only if its binding still validates against the asset it is attached to. Present " +
      "markers with a broken binding are scored DESTROYED. Under that rule, 18 of 105 " +
      "checks survive.",
  },
];

const TONE_CARD: Record<string, string> = {
  rose: "border-rose-800/40 bg-rose-950/20",
  amber: "border-amber-800/40 bg-amber-950/20",
  emerald: "border-emerald-800/40 bg-emerald-950/20",
};

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
  "A surviving marking proves PROVENANCE, NOT CORRECTNESS. It states that these bytes carry a claim signed by this key with this declared history. It says nothing about whether the content is accurate, safe, or lawful.",
  "Our certificate chains to a PRIVATE ROOT CA not on the C2PA trust list. issuer_resolvable therefore fails by construction everywhere — a property of the credential, not damage from a transform. The 17.14% figure measures binding survival, not trust-list membership.",
  "A verifier reporting 'signature valid' without reporting the binding is telling you almost nothing: a manifest transplanted from another asset still reports its signature as valid. Only binding_intact catches it.",
  "Transforms are applied by Pillow. A different re-encoder (libvips, ImageMagick, a phone ISP, a CDN) may behave differently. This measures the common case, not every case.",
  "Every figure here is recomputable from the published artefact. Where an encoder is unavailable in the harness (HEIC) the cell is reported UNMEASURED, never scored as a pass or a fail.",
];

const STATS = [
  {
    title: "The scoring rule",
    body: "A marking is SURVIVED only if its binding still validates against the asset it is attached to. Present-but-invalid markings are scored DESTROYED. Under that rule the measured durability is 18 of 105 checks — 17.14%.",
  },
  {
    title: "Clustered, not per-cell",
    body: "Cells cluster by asset and transform — they are not independent trials. Nine transforms of the same signed asset are one deterministic fact restated nine times, not nine observations. Intervals are computed at the asset level.",
  },
  {
    title: "Pre-registered predictions",
    body: "Predictions were locked before first measurement. Embedded binding: predicted 'destroyed' — confirmed. Sidecar disclosure: predicted to recover the marker but not the binding — confirmed.",
  },
  {
    title: "Reproducibility",
    body: "A hard binding is a cryptographic hash over asset bytes. Re-running any cell reproduces the identical outcome with probability 1 — run-to-run uncertainty is structurally zero. The residual is generalisation to unseen assets, not sampling noise.",
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
            ProvBench · EU AI Act Article 50 / C2PA marking survival · 17.14% durability
          </p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-bold leading-tight tracking-tight">
            Does provenance survive{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              the real world?
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-emerald-200/80">
            We marked assets with C2PA manifests (Ed25519, embedded + sidecar),
            applied real-world transforms (JPEG re-encode, crop, resize, metadata strip,
            format convert, screenshot), and checked whether the marking still validated.
            The measured result:{" "}
            <strong className="text-emerald-300">
              17.14% watermark durability — 18 of 105 marking checks survived.
            </strong>{" "}
            A marking present but whose binding no longer validates is scored{" "}
            <strong className="text-rose-300">DESTROYED, not SURVIVES</strong>.
            The harness, the corpus, and every per-cell outcome are on disk.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {/* THE HEADLINE */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-100">The headline</h2>
          <p className="mt-1 text-[13px] text-emerald-400">
            One number, one scoring rule: present-but-invalid does not count as survival.
          </p>

          <div className="mt-6 rounded-2xl border-2 border-rose-400/40 bg-rose-500/[0.07] p-6">
            <p className="text-[13px] text-emerald-100/60">
              Across the marking corpus and its transforms
            </p>
            <p className="mt-1 text-3xl sm:text-4xl font-black tabular-nums text-rose-300">
              {DURABILITY.rate} watermark durability
            </p>
            <p className="mt-1 text-[13px] text-emerald-100/60">
              {DURABILITY.survived} of {DURABILITY.total} marking checks survived
            </p>
            <p className="mt-3 text-[13px] text-emerald-100/80 leading-relaxed">
              A marking is scored SURVIVED only when its binding still validates against
              the asset it is attached to. Present markers with a broken binding are
              scored DESTROYED. The identity control passes; ordinary saves do not.
            </p>
            <p className="mt-4 text-[12px] text-emerald-400/70 font-mono">
              artefact: {ARTEFACT}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4">
            {FINDINGS.map((f) => (
              <div
                key={f.title}
                className={"rounded-2xl border p-6 " + TONE_CARD[f.tone]}
              >
                <h3 className="text-[15px] font-semibold text-emerald-100">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13px] text-emerald-200/80 leading-relaxed">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* THE TRANSFORMS */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-100">The transforms</h2>
          <p className="mt-1 text-[13px] text-emerald-400">
            Real-world transforms applied to each signed asset. Every cell measured, never assumed.
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
            Open, deterministic, reproducible. C2PA marking, Ed25519 signing,
            SHA-256 hash-chained (OpenTimestamps anchoring is roadmap, not yet wired).
            The harness lives at{" "}
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
            href="/provenance-finding"
            className="text-[13px] text-emerald-400 hover:text-emerald-200 transition-colors"
          >
            The buyer's-eye reading of this finding →
          </Link>
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
