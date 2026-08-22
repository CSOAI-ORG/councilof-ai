import {useState, useEffect } from "react";
import { ExternalLink, Scale, Package, Landmark, FileCheck } from "lucide-react";

/**
 * BuiltOnFooter — the attribution strip: what we stand on, and under which licence.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * WHY THIS IS NOT A PARTNER LOGO WALL
 * ═══════════════════════════════════════════════════════════════════════════════
 * The ask was a slider of partner logos — Oracle, NVIDIA and so on — to strengthen social
 * authority. It is not built that way, deliberately, for three reasons:
 *
 *   1. **It would be a false association.** We have no partnership with Oracle or NVIDIA. We
 *      can reach an NVIDIA API endpoint (and today not even that — the key is a placeholder).
 *      Displaying a company's mark implies endorsement, and that is the same class of claim as
 *      the false accreditation line (never claim ISO 17065 certification) removed from the live site today.
 *   2. **Logos are trademarks.** Using them to borrow status is a trademark problem before it
 *      is a credibility problem, and most vendor brand guidelines forbid exactly this use.
 *   3. **It fails the one test that matters here.** A reader who checks a single logo, finds no
 *      partnership, and concludes we inflate — now discounts every measured number on the site.
 *      The estate's whole asset is that its numbers survive checking. A logo wall risks that
 *      asset to gain something it cannot honestly claim.
 *
 * What is here instead is stronger AND partly mandatory: open-source licences *require*
 * attribution, so crediting what we actually build on is compliance as well as credibility.
 * Every row is something this estate genuinely uses, anchors to, or publishes under — and
 * every row is checkable in about ten seconds, which is the point.
 *
 * ⚠️ RULE FOR ANYONE EDITING THIS FILE: a row may be added only if we actually depend on the
 * thing, anchor to it, or publish under it. "We could integrate this" is not a row. If a
 * relationship is ever real (a signed agreement, a named partnership), it goes in a separate
 * PARTNERS block with the nature of the relationship stated — never mixed in here.
 */

type Item = { name: string; what: string; licence: string; href: string };

const BUILT_ON: Item[] = [
  { name: "c2pa-rs / c2pa-python", what: "Article 50 manifest signing and verification", licence: "Apache-2.0 / MIT", href: "https://github.com/contentauth/c2pa-rs" },
  { name: "OpenSSL", what: "Ed25519 signing; ML-DSA (FIPS 204) for the continuity axis", licence: "Apache-2.0", href: "https://openssl.org" },
  { name: "Pillow", what: "the transform battery in the provenance survival matrix", licence: "MIT-CMU", href: "https://python-pillow.org" },
  { name: "SQLite / FTS5", what: "the frozen statute corpus", licence: "public domain", href: "https://sqlite.org" },
  { name: "MapLibre GL JS", what: "the keyless globe (planned render surface)", licence: "BSD-3-Clause", href: "https://maplibre.org" },
  { name: "deck.gl", what: "coverage-cell layers over the globe (planned)", licence: "MIT", href: "https://deck.gl" },
  { name: "DuckDB", what: "the spatial-temporal event store (planned)", licence: "MIT", href: "https://duckdb.org" },
  { name: "Natural Earth", what: "jurisdiction polygons (planned)", licence: "public domain", href: "https://www.naturalearthdata.com" },
];

const ANCHORED_TO: Item[] = [
  { name: "EU AI Act (Reg. 2024/1689)", what: "113 provisions incl. Art 5, 6, 43, 50, Annex III", licence: "EU free reuse", href: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj" },
  { name: "Digital Omnibus (Reg. 2026/1744)", what: "defers Annex III to 2 Dec 2027; Art 50 unchanged", licence: "EU free reuse", href: "https://eur-lex.europa.eu" },
  { name: "legislation.gov.uk", what: "UK statute — an unthrottled second authority", licence: "Open Government Licence v3", href: "https://www.legislation.gov.uk" },
  { name: "C2PA specification v2.4", what: "the provenance axis; manifest structure and bindings", licence: "open specification", href: "https://spec.c2pa.org" },
  { name: "NIST IR 8547", what: "PQC transition — EdDSA/ECDSA disallowed after 2035", licence: "US Gov (public domain)", href: "https://csrc.nist.gov" },
  { name: "RFC 9964", what: "ML-DSA COSE identifiers −48 / −49 / −50", licence: "IETF Trust", href: "https://www.rfc-editor.org/rfc/rfc9964" },
];

const CITED: Item[] = [
  { name: "Miller — Adding Error Bars to Evals", what: "clustered standard errors; our design-effect method", licence: "arXiv 2411.00640", href: "https://arxiv.org/abs/2411.00640" },
  { name: "Bench-2-CoP", what: "194,955 questions mapped, zero loss-of-control coverage", licence: "arXiv 2508.05464", href: "https://arxiv.org/abs/2508.05464" },
  { name: "COMPL-AI", what: "first EU AI Act technical interpretation — cited, not copied", licence: "arXiv 2410.07959", href: "https://arxiv.org/abs/2410.07959" },
  { name: "AIReg-Bench", what: "the inverse approach: LLM judge over text", licence: "arXiv 2510.01474", href: "https://arxiv.org/abs/2510.01474" },
  { name: "WAVES", what: "watermark-algorithm robustness — distinct from manifest survival", licence: "arXiv 2401.08573", href: "https://arxiv.org/abs/2401.08573" },
  { name: "Clopper & Pearson (1934)", what: "the exact interval used at zero events", licence: "Biometrika 26(4)", href: "https://doi.org/10.1093/biomet/26.4.404" },
];

const TABS = [
  { key: "built", label: "Built on", icon: Package, items: BUILT_ON,
    note: "Open-source software this estate actually runs. Attribution is a licence obligation, not a courtesy. Items marked (planned) are chosen and licence-checked but not yet wired." },
  { key: "anchored", label: "Anchored to", icon: Landmark, items: ANCHORED_TO,
    note: "Every score resolves against frozen text from these sources, hashed and pinned. When one changes, the evidence anchored to it expires." },
  { key: "cited", label: "Standing on", icon: FileCheck, items: CITED,
    note: "Prior work we cite and differentiate from. We never claim nothing exists — that claim already cost us one refuted axis." },
] as const;

export function BuiltOnFooter() {
  const [tab, setTab] = useState<"built" | "anchored" | "cited">("built");
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
      <div className="container max-w-6xl py-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
            What this is built on
          </h2>
          <p className="text-xs text-gray-400">
            Apache-2.0 · data CC-BY-4.0 · every figure recomputable from{" "}
            <a href="https://huggingface.co/datasets/Nicholastempleman/govbench"
               target="_blank" rel="noopener noreferrer"
               className="text-emerald-700 dark:text-emerald-400 hover:underline">
              the published artefacts
            </a>
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 my-4">
          {TABS.map((t) => {
            const I = t.icon; const on = t.key === tab;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  on ? "border-emerald-600 bg-emerald-600 text-white"
                     : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                <I className="h-3.5 w-3.5" />{t.label}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mb-4 max-w-3xl">{active.note}</p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {active.items.map((i) => (
            <a key={i.name} href={i.href} target="_blank" rel="noopener noreferrer"
               className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 transition hover:border-emerald-400">
              <p className="flex items-start justify-between gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                {i.name}
                <ExternalLink className="h-3 w-3 shrink-0 mt-1 text-gray-300 group-hover:text-emerald-600" />
              </p>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{i.what}</p>
              <p className="mt-1.5 font-mono text-[10px] text-gray-400">{i.licence}</p>
            </a>
          ))}
        </div>

        {/* The disclosure that makes the rest of the strip credible rather than decorative. */}
        <div className="mt-6 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4">
          <p className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
            <Scale className="h-3.5 w-3.5" /> What this strip is not
          </p>
          <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
            <strong>These are dependencies, anchors and citations — not partners, sponsors or
            endorsements.</strong> Nobody listed here has reviewed, approved or affiliated with
            CSOAI. We hold no accreditation, we are not a notified body, and we issue no
            certificates of conformity — as of April 2026 zero notified bodies had been
            designated and no harmonised standard yet grants presumption of conformity. If a
            genuine partnership ever exists, it will appear separately with the nature of the
            relationship stated.
          </p>
        </div>
      </div>
    </section>
  );
}
