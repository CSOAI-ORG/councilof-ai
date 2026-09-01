import { useEffect, useState } from "react";

/**
 * useFindingsIndex — loads the materialised regulation-findings index once and hands it to the
 * per-model / per-regulator / search views. It fetches the static signed artifact
 * (/signed/findings_index.json) directly: the same bytes a stranger or an agent can verify, and
 * the reason model names never enter the prerendered HTML shell (they arrive at runtime).
 *
 * Honesty is carried IN the data (status DISCOVERED, relation 'relevant-to', statutory_maximum
 * cited, no_fine_asserted_owed). The views render it; they never soften it.
 */

export interface FindingPointer {
  regulator: string;
  regulator_name: string;
  relation: "relevant-to";
  obligation: string;
  statutory_maximum: string | null;
  fine_cited_to: string | null;
  fine_applies_to?: string;
  tier: string;
  no_fine_asserted_owed: true;
}
export interface Finding {
  model: string;
  axis: string;
  axis_label: string;
  axis_kind: string;
  measurement: {
    accuracy: number;
    status: "DISCOVERED";
    status_note: string;
    card: string;
    card_url: string;
    signed: boolean;
    alg?: string;
    pubkey?: string;
    measured_on?: string;
  };
  crosswalk: {
    pointers: FindingPointer[];
    highest_statutory_maximum?: { statutory_maximum: string | null; cited_to: string | null; note?: string } | null;
    no_obligation_reason?: string;
  };
  search_text: string;
}
export interface RegulatorRollup {
  id: string;
  name: string;
  long_name?: string;
  authority?: string;
  kind: string;
  fine_regime?: string | null;
  source?: string;
  non_claim?: string;
  controls?: Record<string, string>;
  axes_relevant: { axis: string; label: string; obligations: { obligation: string; statutory_maximum: string | null; fine_cited_to: string | null; tier: string }[] }[];
  n_findings_relevant: number;
  n_models_measured: number;
  fine_tiers: Record<string, { statutory_maximum: string; cited_to: string; applies_to: string }> | null;
}
export interface AxisRollup {
  axis: string; label: string; kind: string; bench?: string;
  n_findings: number; n_models: number; mean_accuracy: number | null;
  regulators: string[]; pointers: FindingPointer[];
  highest_statutory_maximum?: { statutory_maximum: string | null; cited_to: string | null } | null;
  no_obligation_reason?: string;
}
export interface ModelRollup {
  model: string; name_published: boolean; n_findings: number;
  axes: string[]; regulators: string[]; mean_accuracy: number | null;
}
export interface FindingsIndex {
  schema: string;
  honesty: Record<string, string>;
  as_of: string;
  counts: Record<string, number>;
  fine_tiers: Record<string, { statutory_maximum: string; cited_to: string; applies_to: string }>;
  regulators: RegulatorRollup[];
  axes: AxisRollup[];
  models: ModelRollup[];
  findings: Finding[];
}

let cache: FindingsIndex | null = null;

export function useFindingsIndex() {
  const [index, setIndex] = useState<FindingsIndex | null>(cache);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) return;
    let live = true;
    (async () => {
      try {
        const r = await fetch("/signed/findings_index.json", { headers: { accept: "application/json" } });
        if (!r.ok) throw new Error(`findings index ${r.status}`);
        const d = (await r.json()) as FindingsIndex;
        cache = d;
        if (live) { setIndex(d); setLoading(false); }
      } catch (e) {
        if (live) { setErr(String(e)); setLoading(false); }
      }
    })();
    return () => { live = false; };
  }, []);

  return { index, err, loading };
}

/** Deterministic keyword search over the findings rows — the portable client-side RAG. */
export function searchFindings(index: FindingsIndex, q: string): Finding[] {
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { f: Finding; score: number }[] = [];
  for (const f of index.findings) {
    const hay = f.search_text || "";
    let matched = 0, strong = 0;
    for (const t of terms) {
      if (hay.includes(t)) {
        matched += 1;
        if (f.axis_label.toLowerCase().includes(t) ||
            f.crosswalk.pointers.some((p) => p.obligation.toLowerCase().includes(t) || p.regulator_name.toLowerCase().includes(t))) strong += 1;
      }
    }
    if (matched === terms.length) scored.push({ f, score: matched * 10 + strong });
  }
  scored.sort((a, b) => b.score - a.score || b.f.measurement.accuracy - a.f.measurement.accuracy);
  return scored.map((s) => s.f);
}

export const pct = (x: number | null | undefined) => (typeof x === "number" ? `${Math.round(x * 100)}%` : "—");
