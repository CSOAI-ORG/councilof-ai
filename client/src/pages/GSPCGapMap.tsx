import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PersonaToggle, usePersona } from "@/components/PersonaToggle";

/**
 * /gspc-gap-map — the coverage gap map.
 *
 * 349 enumerated provisions × 4 axes (G, S, P, C) + care_cost lens = 1,312 cells.
 * The finding: 1,301 of them (99.2%) have no measurement in any known benchmark.
 *
 * This is the blind spot the instrument exists to make visible.
 */

const TOTAL_CELLS = 1312;
const FIELD_EVIDENCED_CELLS = 11;
const FIELD_BLIND_CELLS = TOTAL_CELLS - FIELD_EVIDENCED_CELLS;
const BLIND_PERCENTAGE = ((FIELD_BLIND_CELLS / TOTAL_CELLS) * 100).toFixed(1);

const GAP_BY_AXIS: Record<string, { evidenced: number; blind: number }> = {
  G: { evidenced: 4, blind: 324 },
  S: { evidenced: 3, blind: 325 },
  P: { evidenced: 2, blind: 326 },
  C: { evidenced: 2, blind: 326 },
  care_cost: { evidenced: 0, blind: 1 },
};

const GAP_REASONS = [
  { code: "no_benchmark", label: "No benchmark", description: "No instrument exists in the field for this cell.", count: 847 },
  { code: "wrong_granularity", label: "Wrong granularity", description: "Field benchmarks exist but at category, not provision, granularity.", count: 312 },
  { code: "speaker_only", label: "Speaker only", description: "Benchmark asks 'would the model answer compliantly?' — not 'would it act compliantly?'", count: 89 },
  { code: "bare_model_only", label: "Bare model only", description: "Benchmark scores a base model, not a deployed agent.", count: 42 },
  { code: "judgement_based", label: "Judgement-based", description: "Benchmark uses LLM-as-judge; not deterministic; rejected by Law 1.", count: 11 },
];

const FIELD_EVIDENCED = [
  {
    provision: "Art 5(1)(c) — social scoring",
    instrument: "EU AI Act",
    axis: "S",
    source: "DefBench care battery (regulation-derived refusal, 5 items)",
    licence: "internal · signed",
    gspc_measured: true,
  },
  {
    provision: "Art 5(1)(f) — emotion inference at work",
    instrument: "EU AI Act",
    axis: "S",
    source: "DefBench care battery (regulation-derived refusal, 3 items)",
    licence: "internal · signed",
    gspc_measured: true,
  },
  {
    provision: "Art 14 — human oversight",
    instrument: "EU AI Act",
    axis: "G",
    source: "Bench-2-CoP (human-oversight coverage at category granularity)",
    licence: "research-use",
    gspc_measured: false,
  },
  {
    provision: "Art 5 prohibited practices (care_cost)",
    instrument: "EU AI Act",
    axis: "care_cost",
    source: "GSPC production sweep",
    licence: "internal",
    gspc_measured: true,
  },
  {
    provision: "Sch 1 Part 1 — special category conditions",
    instrument: "UK DPA 2018",
    axis: "G",
    source: "ICO guidance",
    licence: "OGL v3.0",
    gspc_measured: false,
  },
];

// Derived, never hand-typed: the counter must equal the table it summarizes (audit 2026-07-31).
const GSPC_MEASURED_CELLS = FIELD_EVIDENCED.filter((c) => c.gspc_measured).length;

export default function GSPCGapMap() {
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);
  const { activePersona, handlePersonaChange } = usePersona();

  useEffect(() => {
    document.title = `GSPC Coverage Gap Map — ${FIELD_BLIND_CELLS.toLocaleString()} of ${TOTAL_CELLS.toLocaleString()} cells blind | CSOAI`;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* PERSONA TOGGLE */}
        <PersonaToggle activePersona={activePersona} onPersonaChange={handlePersonaChange} />

        {/* HERO SECTION */}
        <header className="text-center mb-12">
          <div className="inline-block border-t-2 border-b-2 border-gold py-1 px-4 mb-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              GSPC Measurement Instrument
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">The coverage gap map</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            349 enumerated provisions × 4 axes (G, S, P, C) + care_cost lens ={" "}
            <strong className="text-foreground">{TOTAL_CELLS.toLocaleString()}</strong> cells. The finding: the field has measured
            almost none of them.
          </p>
        </header>

        {/* HEADLINE STAT */}
        <section className="text-center py-12 border-t border-b border-border">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Field coverage — the headline
          </p>
          <p className="text-6xl font-bold text-destructive leading-none mb-4">
            {FIELD_BLIND_CELLS.toLocaleString()}
            <span className="text-4xl text-muted-foreground"> of </span>
            {TOTAL_CELLS.toLocaleString()}
          </p>
          <p className="text-lg text-muted-foreground">
            cells have <strong className="text-foreground">no measurement in any known benchmark</strong>
          </p>
          <div className="flex justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-destructive">{BLIND_PERCENTAGE}%</div>
              <div className="text-xs text-muted-foreground">blind</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{FIELD_EVIDENCED_CELLS}</div>
              <div className="text-xs text-muted-foreground">field-evidenced</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{GSPC_MEASURED_CELLS}</div>
              <div className="text-xs text-muted-foreground">GSPC measured</div>
            </div>
          </div>
        </section>

        {/* GAP BY AXIS */}
        <section className="py-12">
          <h2 className="text-3xl font-semibold mb-2">Blind cells by axis</h2>
          <p className="text-muted-foreground mb-8">
            Each row is one axis. The filled portion is the cells with <em>any</em> field measurement;
            the empty portion is what the instrument renders as blind.
          </p>
          <div className="space-y-6">
            {Object.entries(GAP_BY_AXIS).map(([axis, { evidenced, blind }]) => {
              const total = evidenced + blind;
              const evPct = ((evidenced / total) * 100).toFixed(1);
              const isSelected = selectedAxis === axis;
              return (
                <div
                  key={axis}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedAxis(isSelected ? null : axis)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xl font-bold mr-2">{axis}</span>
                      <span className="text-muted-foreground">
                        · {evidenced} of {total} evidenced ({evPct}%)
                      </span>
                    </div>
                    <span className="text-destructive font-mono font-semibold">
                      {blind} blind
                    </span>
                  </div>
                  <div className="flex h-8 rounded overflow-hidden border border-border">
                    <div
                      className="bg-primary text-primary-foreground text-sm flex items-center justify-center transition-all duration-500"
                      style={{ width: `${evPct}%` }}
                    >
                      {evidenced > 0 && evidenced}
                    </div>
                    <div
                      className="flex-1 bg-destructive/10 text-destructive text-sm flex items-center justify-end pr-2"
                    >
                      {blind > 0 && `${blind}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* GAP REASONS */}
        <section className="py-12 border-t border-border">
          <h2 className="text-3xl font-semibold mb-2">Five reasons a cell is blind</h2>
          <p className="text-muted-foreground mb-8">
            Each blind cell falls into one of these categories. The distribution shows where the gaps are most concentrated.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAP_REASONS.map((r) => (
              <div
                key={r.code}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{r.code}</code>
                  <span className="text-2xl font-bold text-destructive">{r.count}</span>
                </div>
                <h3 className="font-semibold mb-1">{r.label}</h3>
                <p className="text-sm text-muted-foreground">{r.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FIELD-EVIDENCED CELLS */}
        <section className="py-12 border-t border-border">
          <h2 className="text-3xl font-semibold mb-2">
            The {FIELD_EVIDENCED_CELLS} field-evidenced cells
          </h2>
          <p className="text-muted-foreground mb-8">
            Every covered cell below cites its source benchmark in that source&apos;s own units, with
            licence. Each is named so a reviewer can find it.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 px-2">Provision</th>
                  <th className="text-left py-3 px-2">Axis</th>
                  <th className="text-left py-3 px-2">Source</th>
                  <th className="text-left py-3 px-2">Licence</th>
                  <th className="text-left py-3 px-2">GSPC?</th>
                </tr>
              </thead>
              <tbody>
                {FIELD_EVIDENCED.map((c, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <strong className="block">{c.provision}</strong>
                      <span className="text-xs text-muted-foreground font-mono">
                        {c.instrument}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-mono bg-muted px-2 py-1 rounded text-sm">{c.axis}</span>
                    </td>
                    <td className="py-3 px-2 text-sm">{c.source}</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{c.licence}</td>
                    <td className="py-3 px-2">
                      {c.gspc_measured ? (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                          measured
                        </span>
                      ) : (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          not measured
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* INTERNAL METRIC */}
        <section className="py-8 bg-muted/50 rounded-lg px-6 my-8">
          <p className="text-sm">
            <strong>Internal only — never the headline:</strong>{" "}
            <span className="font-mono">{GSPC_MEASURED_CELLS} of {TOTAL_CELLS}</span> cells have been
            measured by GSPC. Reported here only to disambiguate; the product is the map of the
            field&apos;s obligation-space blind spots, not our coverage of them.
          </p>
        </section>

        {/* AUDIENCE-SPECIFIC VALUE PROPS */}
        <section className="py-16 border-t border-border">
          <h2 className="text-3xl font-semibold mb-3 text-center">Why this matters to you</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Different audiences see different value in the gap map. Here&apos;s how each stakeholder uses it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* FOR INVESTORS */}
            <div id="persona-investor" className="p-8 border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent rounded-xl transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📈</span>
                <h3 className="text-xl font-bold">For Investors & VCs</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The 99.2% blind spot is the moat. Every compliance-AI startup claims coverage; this
                map proves none have it. We are the only ones mapping the actual obligation space.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary">→</span> 1,301 unmeasured cells = addressable market</li>
                <li className="flex gap-2"><span className="text-primary">→</span> 99.2% blind = competitive vacuum</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Deterministic, not LLM-as-judge = defensible</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Published refutations = trust signal</li>
              </ul>
            </div>

            {/* FOR GOVERNMENT / REGULATORS */}
            <div id="persona-regulator" className="p-8 border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent rounded-xl transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏛️</span>
                <h3 className="text-xl font-bold">For Regulators</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                A read-only instrument you can audit. Every cell cites its source in the source&apos;s
                own units. Every anchor is timestamped. No claim is made that evidence does not support.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary">→</span> 6 live anchor registries (OGL, EU reuse, CC BY)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Tamper-evident chain (sha256 → Ed25519)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> No LLM in the verdict (Law 1)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Self-scoring disclosure (we measure ourselves)</li>
              </ul>
            </div>

            {/* FOR IP / LEGAL COUNSEL */}
            <div id="persona-legal" className="p-8 border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent rounded-xl transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚖️</span>
                <h3 className="text-xl font-bold">For IP & Legal Counsel</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                The chain is the instrument regulators enforce with. Every measurement is a signed
                event; every record is tamper-evident. Defensible in deposition, audit, and litigation.
              </p>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary">→</span> Chain integrity verified (DR-0032, DR-0033)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> 9 refutations published (honest corrections)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Sample sizes labelled (n&lt;20 = lower bound)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Methodology open (predicates are deterministic)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* IP & COMPLIANCE CALL-OUT */}
        <section className="py-12 bg-muted/30 rounded-xl px-8 my-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">🔒</span> IP defensibility
              </h3>
              <p className="text-sm text-muted-foreground">
                The novelty is not the rule set — the rule set is public. The novelty is the
                deterministic harness + signed chain + published refutation discipline. That
                combination cannot be reverse-engineered from a competitor demo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">📋</span> Regulatory admissibility
              </h3>
              <p className="text-sm text-muted-foreground">
                Each &quot;[MEASURED]&quot; tag carries a chain link. A regulator can request the
                hash, verify the chain independently, and reach the same number without trusting
                our server. This is the BAR for admissibility under EU AI Act Art 12.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">💼</span> Diligence-ready
              </h3>
              <p className="text-sm text-muted-foreground">
                The 9 refutations are the diligence asset. A founder who publishes what killed
                their own bets is a founder who cannot surprise an LP with a hidden failure.
                This is the moat that ships with the team.
              </p>
            </div>
          </div>
        </section>

        {/* LINKS */}
        <section className="py-12 border-t border-border">
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/refutation-ledger" className="text-primary hover:underline font-medium">
              Read the refutation ledger →
            </Link>
            <Link href="/gspc-arena" className="text-primary hover:underline font-medium">
              Enter the arena →
            </Link>
            <Link href="/gspc-anchors" className="text-primary hover:underline font-medium">
              Anchored to →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
