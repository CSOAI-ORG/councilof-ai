import { useEffect, useState } from "react";

interface CityState {
  tick: number;
  city: string;
  time?: number;
  width?: number;
  height?: number;
  city_tax?: number;
  tax_rate?: number;
  budget?: number;
  water_ok?: boolean;
  crime_rate?: number;
  city_time?: number;
  population: number;
  residential: number;
  commercial: number;
  industrial: number;
  powered: boolean;
  govbench_score?: number;
  n_modules_trained?: number;
  certifications_active?: number;
  label?: string;
}

export default function SovTownLab() {
  const [latest, setLatest] = useState<CityState | null>(null);
  const [history, setHistory] = useState<CityState[]>([]);

  useEffect(() => {
    document.title = "SOV Town Lab -- DESIGN | CSOAI";
    const fetchState = async () => {
      try {
        const res = await fetch("/api/sov-town/state.jsonl");
        if (!res.ok) return; // 503 = no live state yet — the honest empty slot stays
        const text = await res.text();
        const lines = text.trim().split("\n").filter(Boolean);
        const parsed = lines.map((l) => JSON.parse(l) as CityState);
        setLatest(parsed[parsed.length - 1] || null);
        setHistory(parsed.slice(-20));
      } catch (e) {
        console.error("SOV Town state fetch failed:", e);
      }
    };
    fetchState();
    const interval = setInterval(fetchState, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-5xl px-6 pt-14 pb-10">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-amber-400/60">
            DESIGN LAB · NOT PUBLIC · GPL-3.0
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">
            SOV Town <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">Lab</span>
          </h1>
          <p className="mt-4 text-[14px] text-emerald-100/70 max-w-3xl">
            Headless MicropolisJ engine running on oracle-micro-2. Every tick emits
            JSON state streamed to this page. This is the governance simulation
            sandbox -- not a product surface. GPL-3.0 applies to the engine.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <section className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-xl font-bold text-emerald-50">Live state</h2>
          {latest ? (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Population" value={latest.population.toLocaleString()} />
              <Stat label="Residential" value={latest.residential.toString()} />
              <Stat label="Commercial" value={latest.commercial.toString()} />
              <Stat label="Industrial" value={latest.industrial.toString()} />
              <Stat label="City Tax" value={`${latest.city_tax ?? latest.tax_rate ?? "—"}%`} />
              <Stat label="Powered" value={latest.powered ? "Yes" : "No"} />
              <Stat label="Grid" value={latest.width ? `${latest.width}x${latest.height}` : "—"} />
              <Stat label="Tick" value={latest.tick.toString()} />
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-emerald-100/50">
              Awaiting engine tick from oracle-micro-2...
            </p>
          )}
        </section>

        <section className="rounded-xl border border-amber-500/20 bg-[#05140d] p-6">
          <h2 className="text-xl font-bold text-amber-300">SOV metrics overlay</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="GovBench Score" value={latest?.govbench_score != null ? `${latest.govbench_score}%` : "—"} accent="amber" />
            <Stat label="Modules Trained" value={latest?.n_modules_trained != null ? latest.n_modules_trained.toString() : "—"} accent="amber" />
            <Stat label="Active Certs" value={latest?.certifications_active != null ? latest.certifications_active.toString() : "—"} accent="amber" />
          </div>
          <p className="mt-4 text-[11px] text-emerald-100/40">
            Derived from the SOV compliance instrument, not the city sim. The city
            sim is the substrate; the governance score is the overlay.
          </p>
        </section>

        {history.length > 1 && (
          <section className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-6">
            <h2 className="text-xl font-bold text-emerald-50">
              Population history (last {history.length} ticks)
            </h2>
            <div className="mt-4 h-32 flex items-end gap-1">
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-emerald-500/60 rounded-t"
                  style={{ height: `${Math.min(100, (h.population / 2000) * 100)}%` }}
                  title={`Tick ${h.tick}: ${h.population}`}
                />
              ))}
            </div>
          </section>
        )}

        <section className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-6">
          <h2 className="text-lg font-bold text-red-300">GPL-3.0 Notice</h2>
          <p className="mt-2 text-[12px] text-red-200/70 leading-relaxed">
            This lab uses MicropolisJ engine code (GPL-3.0). The GPL-3.0 license
            was preserved in the fork. Modifications are marked. This is a DESIGN
            sandbox -- not a public product surface. The "sov-town" branding is
            distinct from the original SimCity trademark.
          </p>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "amber" }) {
  return (
    <div className="rounded-lg border border-emerald-500/10 bg-[#03110b] p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-100/40">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${accent === "amber" ? "text-amber-300" : "text-emerald-50"}`}>
        {value}
      </p>
    </div>
  );
}
