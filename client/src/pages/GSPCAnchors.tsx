import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PersonaToggle, usePersona } from "@/components/PersonaToggle";
import { ANCHORS, hoursSinceLastPass } from "@/data/anchors";

/**
 * /gspc-anchors — live anchor status.
 *
 * Provision text is sourced from the registries below. The displayed timestamp
 * is the last successful fetch; a stale anchor is never silently re-stamped.
 * Anchor data is shared with the jurisdiction globe via data/anchors.ts, and
 * staleness is always computed against the live clock.
 */

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  live: { color: "text-green-600", bg: "bg-green-100", icon: "●", label: "Live" },
  degraded: { color: "text-yellow-600", bg: "bg-yellow-100", icon: "◐", label: "Degraded" },
  unreachable: { color: "text-red-600", bg: "bg-red-100", icon: "○", label: "Unreachable" },
};

export default function GSPCAnchors() {
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const { activePersona, handlePersonaChange } = usePersona();

  useEffect(() => {
    document.title = "Anchored To — GSPC Source Registries | CSOAI";
  }, []);

  const liveCount = ANCHORS.filter((a) => a.status === "live").length;
  const degradedCount = ANCHORS.filter((a) => a.status === "degraded").length;
  const unreachableCount = ANCHORS.filter((a) => a.status === "unreachable").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* PERSONA TOGGLE */}
        <PersonaToggle activePersona={activePersona} onPersonaChange={handlePersonaChange} />

        {/* HERO */}
        <header className="text-center mb-12">
          <div className="inline-block border-t-2 border-b-2 border-gold py-1 px-4 mb-4">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              GSPC Measurement Instrument
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Anchored to</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Provision text is sourced from the registries below. The displayed timestamp is the last
            successful fetch; <strong className="text-foreground">a stale anchor is never silently re-stamped.</strong>
          </p>
        </header>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="p-10 border border-border rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="text-6xl font-bold mb-3">{ANCHORS.length}</div>
            <div className="text-base text-muted-foreground font-medium">Total anchors</div>
          </div>
          <div className="p-10 border border-green-200 bg-green-50 rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="text-6xl font-bold text-green-600 mb-3">{liveCount}</div>
            <div className="text-base text-green-700 font-medium">Live</div>
          </div>
          <div className="p-10 border border-yellow-200 bg-yellow-50 rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="text-6xl font-bold text-yellow-600 mb-3">{degradedCount}</div>
            <div className="text-base text-yellow-700 font-medium">Degraded</div>
          </div>
          <div className="p-10 border border-red-200 bg-red-50 rounded-xl text-center hover:shadow-lg transition-shadow">
            <div className="text-6xl font-bold text-red-600 mb-3">{unreachableCount}</div>
            <div className="text-base text-red-700 font-medium">Unreachable</div>
          </div>
        </section>

        {/* ANCHOR LIST */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold mb-8">Anchor registry</h2>
          <div className="space-y-4">
            {ANCHORS.map((anchor) => {
              const config = STATUS_CONFIG[anchor.status];
              const hours = hoursSinceLastPass(anchor.last_passed);
              const isSelected = selectedAnchor === anchor.id;
              const isStale = hours > 72;

              return (
                <div
                  key={anchor.id}
                  className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary shadow-lg"
                      : isStale
                      ? "border-destructive"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedAnchor(isSelected ? null : anchor.id)}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-2xl ${config.color}`}>{config.icon}</span>
                          <h3 className="text-xl font-semibold">{anchor.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color} font-medium`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-2">{anchor.description}</p>
                        <a
                          href={anchor.source_uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {anchor.source_uri}
                        </a>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Last passed</div>
                        <div className="font-mono text-sm">
                          {new Date(anchor.last_passed).toLocaleString()}
                        </div>
                        <div className={`text-sm mt-1 ${isStale ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                          {hours} hours ago
                          {isStale && (
                            <span className="ml-2 text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                              stale
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">ID</div>
                            <div className="font-mono">{anchor.id}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Licence</div>
                            <div>{anchor.licence}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Status</div>
                            <div className={config.color}>{config.label}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Hours since</div>
                            <div className="font-mono">{hours}h</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* STALENESS POLICY */}
        <section className="py-12 border-t border-border">
          <h2 className="text-3xl font-semibold mb-6">Staleness policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-green-200 bg-green-50 rounded-lg">
              <div className="text-green-600 text-2xl font-bold mb-2">● Live</div>
              <p className="text-sm">
                Anchor passed within <strong>24 hours</strong>. Data is fresh and reliable.
              </p>
            </div>
            <div className="p-6 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="text-yellow-600 text-2xl font-bold mb-2">◐ Degraded</div>
              <p className="text-sm">
                Anchor passed between <strong>24-72 hours</strong> ago. Data may be stale.
              </p>
            </div>
            <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
              <div className="text-red-600 text-2xl font-bold mb-2">○ Unreachable</div>
              <p className="text-sm">
                Anchor has not passed in <strong>72+ hours</strong>. Data should not be trusted.
              </p>
            </div>
          </div>
          <p className="mt-6 text-muted-foreground">
            The threshold is conservative — a stale anchor is never silently re-stamped.
          </p>
        </section>

        {/* AUDIENCE-SPECIFIC VALUE PROPS */}
        <section className="py-16 border-t border-border">
          <h2 className="text-3xl font-semibold mb-3 text-center">Why anchoring matters</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            The integrity of every measurement depends on the integrity of the source. Each audience cares about a different aspect of that integrity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div id="persona-investor" className="p-8 border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent rounded-xl transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📈</span>
                <h3 className="text-xl font-bold">For Investors</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Anchors are the trust perimeter. Every measurement is reproducible because the
                source is timestamped. A 6-anchor estate with stale timestamps would be a due
                diligence finding — this one is clean.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex gap-2"><span className="text-primary">→</span> 6 live anchors</li>
                <li className="flex gap-2"><span className="text-primary">→</span> All public-licence (OGL, CC BY, EU reuse)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> No proprietary data dependencies</li>
              </ul>
            </div>
            <div id="persona-regulator" className="p-8 border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent rounded-xl transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏛️</span>
                <h3 className="text-xl font-bold">For Regulators</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Every anchor is a primary source. UK legislation is fetched from legislation.gov.uk
                under OGL v3.0. EU AI Act text is fetched from EUR-Lex under the EU reuse notice.
                No hand-curated, no paraphrased, no interpolated.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex gap-2"><span className="text-primary">→</span> UK: legislation.gov.uk (OGL v3.0)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> EU: EUR-Lex CELLAR (EU reuse)</li>
                <li className="flex gap-2"><span className="text-primary">→</span> IETF & NIST: standard licences</li>
              </ul>
            </div>
            <div id="persona-legal" className="p-8 border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent rounded-xl transition-all">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚖️</span>
                <h3 className="text-xl font-bold">For IP Counsel</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Anchor freshness is a discovery question. If a witness is asked &quot;what version of
                the EU AI Act did you test against&quot;, the answer is in the timestamp row. Stale
                anchors are not concealed — they are surfaced.
              </p>
              <ul className="text-sm space-y-2">
                <li className="flex gap-2"><span className="text-primary">→</span> Timestamped at every fetch</li>
                <li className="flex gap-2"><span className="text-primary">→</span> 72-hour staleness policy</li>
                <li className="flex gap-2"><span className="text-primary">→</span> Degraded state visible</li>
              </ul>
            </div>
          </div>
        </section>

        {/* LICENCE TABLE FOR LEGAL REVIEW */}
        <section className="py-12 bg-muted/30 rounded-xl px-8 my-8">
          <h3 className="text-2xl font-semibold mb-4">Licence register (for legal review)</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Every anchor is fetched under a public, redistributable licence. None of the data
            ingested by this instrument is proprietary, copyrighted, or derived from a private
            database. This is the licence-asset table.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 px-2">Source</th>
                  <th className="text-left py-3 px-2">Licence</th>
                  <th className="text-left py-3 px-2">Jurisdiction</th>
                  <th className="text-left py-3 px-2">Use</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-2 font-mono text-sm">legislation.gov.uk</td>
                  <td className="py-3 px-2"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">OGL v3.0</span></td>
                  <td className="py-3 px-2">UK</td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">Primary & secondary legislation</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-2 font-mono text-sm">EUR-Lex CELLAR</td>
                  <td className="py-3 px-2"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">EU reuse</span></td>
                  <td className="py-3 px-2">EU</td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">EU AI Act, GDPR, directives</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-2 font-mono text-sm">C2PA spec</td>
                  <td className="py-3 px-2"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">CC BY 4.0</span></td>
                  <td className="py-3 px-2">Global</td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">Provenance & authenticity spec</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-2 font-mono text-sm">RFC 9964</td>
                  <td className="py-3 px-2"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">IETF Trust</span></td>
                  <td className="py-3 px-2">Global</td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">PQC for IETF protocols</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-2 font-mono text-sm">NIST IR 8547</td>
                  <td className="py-3 px-2"><span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">NIST pub</span></td>
                  <td className="py-3 px-2">US</td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">PQC transition guidance</td>
                </tr>
                <tr>
                  <td className="py-3 px-2 font-mono text-sm">self-hosted</td>
                  <td className="py-3 px-2"><span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">internal</span></td>
                  <td className="py-3 px-2">—</td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">Crosswalk registry</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* LINKS */}
        <section className="py-12 border-t border-border">
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/refutation-ledger" className="text-primary hover:underline font-medium">
              Read the refutation ledger →
            </Link>
            <Link href="/gspc-gap-map" className="text-primary hover:underline font-medium">
              Coverage gap map →
            </Link>
            <Link href="/gspc-arena" className="text-primary hover:underline font-medium">
              Enter the arena →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
