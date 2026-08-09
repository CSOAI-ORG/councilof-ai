import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useCivic } from "../hooks/useCivic";
import { sealArtifact } from "../lib/sovTools";
import { cn } from "../lib/utils";

// SOV City — the gamified simulation surface on csoai.
// Binds training -> attestation -> simulation into one continuous loop. The
// city is a visualised compliance instrument: each district is a framework, its
// level mirrors what the learner has trained and attested.
//
// Independence line (see DESIGN.md): the in-city credential is a SOV training
// ATTESTATION — a signed record of demonstrated module competence, offline-
// verifiable like every other csoai record. It is NOT a regulatory conformity
// mark or CE. CSOAI measures and signs; it does not act as an accredited body.

type LiveSim = {
  tick: number;
  population: number;
  govbench_score?: number;
  certifications_active?: number;
} | null;

export default function SovCity() {
  const { state, civicScore, resilience, completeModule, issueCredential, reset } = useCivic();
  const [sealing, setSealing] = useState<string | null>(null);
  const [live, setLive] = useState<LiveSim>(null);
  const [liveOk, setLiveOk] = useState<boolean | null>(null);

  // optional overlay from the live Micropolis sim when the substrate answers
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/sov-town/state.jsonl");
        if (!res.ok) return;
        const text = await res.text();
        const lines = text.trim().split("\n").filter(Boolean);
        const last = lines.length ? JSON.parse(lines[lines.length - 1]) : null;
        if (cancelled) return;
        setLive(last);
        setLiveOk(true);
      } catch {
        if (!cancelled) setLiveOk(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const onAttest = async (districtId: string) => {
    const d = state.districts.find((x) => x.id === districtId);
    if (!d) return;
    setSealing(districtId);
    const payload = JSON.stringify({
      kind: "sov-training-attestation",
      framework: d.framework,
      level: d.certified ? "renewed" : "initial",
      modulesDone: d.modulesDone,
      modules: d.modules,
      issuedAt: Date.now(),
    });
    const sealed = await sealArtifact(payload);
    issueCredential(districtId, sealed.text, sealed.raw?.signature || sealed.raw?.sig);
    setSealing(null);
  };

  const trainedCount = state.districts.filter((d) => d.trained).length;
  const attCount = state.districts.filter((d) => d.certified).length;

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-6xl px-6 pt-14 pb-10">
          <p className="font-mono text-[10px] uppercase tracking-[4px] text-amber-400/60">
            SOV CITY · csoai · training → attestation → simulation
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
            SOV <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">City</span>
          </h1>
          <p className="mt-4 max-w-3xl text-[14px] leading-relaxed text-emerald-100/70">
            Every district is a governance framework. Train in it to raise its level;
            pass the attestation to sign it. The civic score below is derived from what
            you have actually done — not a scoreboard, a record.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <CivicCard label="Civic Score" value={`${civicScore}`} unit="%" tone={toneFor(civicScore)} note={`${trainedCount}/${state.districts.length} districts engaged`} />
            <CivicCard label="Resilience" value={`${resilience}`} unit="%" tone={toneFor(resilience)} note={`${attCount} signed attestation${attCount === 1 ? "" : "s"}`} />
            <CivicCard label="Live Sim" value={liveOk === true && live ? live.population.toLocaleString() : "—"} unit={liveOk === true ? "pop" : "offline"} tone="emerald" note={liveOk === true ? `govbench ${live.govbench_score ?? "—"}` : "local ticker (deterministic)"} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* CITY CANVAS */}
        <section>
          <SectionLabel>City grid · {state.districts.length} districts</SectionLabel>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {state.districts.map((d) => {
              const pct = d.modules ? Math.round((d.modulesDone / d.modules) * 100) : 0;
              return (
                <div
                  key={d.id}
                  className={cn(
                    "rounded-xl border bg-[#05140d] p-4 transition-colors",
                    d.certified
                      ? "border-emerald-500/40"
                      : d.trained
                      ? "border-amber-500/30"
                      : "border-emerald-500/15"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <DistrictGlyph state={d.certified ? "certified" : d.trained ? "trained" : "empty"} />
                        <h3 className="text-lg font-bold">{d.framework}</h3>
                      </div>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-emerald-100/40">
                        {d.modulesDone}/{d.modules} modules · {d.attestations} attestation{d.attestations === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className={cn("font-mono text-xl font-bold", toneFor(pct).cls)}>{pct}%</span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-950">
                    <div
                      className={cn("h-full rounded-full transition-all", toneFor(pct).bar)}
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/training-v2" className="flex-1 rounded-md border border-emerald-500/30 px-3 py-1.5 text-center text-[12px] font-semibold text-emerald-200 transition hover:bg-emerald-500/10">
                      Continue training
                    </Link>
                    <button
                      onClick={() => onAttest(d.id)}
                      disabled={!d.trained || sealing === d.id}
                      title={d.trained ? "Sign this district's training attestation" : "Train one module first"}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-[12px] font-semibold transition",
                        d.trained
                          ? "border border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
                          : "cursor-not-allowed border border-emerald-500/10 text-emerald-100/30"
                      )}
                    >
                      {sealing === d.id ? "Sealing…" : d.certified ? "Re-attest" : "Attest"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TRAINING RAIL — entry points */}
        <section>
          <SectionLabel>Training & attestation</SectionLabel>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <RailCard href="/training-v2" glyph="◧" title="Take a course" body="Work through framework modules — EU AI Act, NIST AI RMF, ISO 42001, JSP 936." />
            <RailCard href="/certification-v2" glyph="✎" title="Sit the attestation" body="Pass the measured assessment to earn a signed SOV training attestation." />
            <RailCard href="/my-certificates" glyph="▤" title="Your wallet" body="Review issued credentials and verify their signatures." />
          </div>
        </section>

        {/* CREDENTIAL WALLET */}
        <section>
          <SectionLabel>Credential wallet · {state.credentials.length}</SectionLabel>
          {state.credentials.length === 0 ? (
            <p className="mt-3 text-[13px] text-emerald-100/50">
              No attestations yet. Finish a district and press <span className="text-amber-200">Attest</span> to seal one.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {state.credentials.map((c) => (
                <div key={c.id} className="rounded-xl border border-emerald-500/25 bg-[#05140d] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-amber-300/80">sov-training-attestation</span>
                    <span className="font-mono text-[10px] text-emerald-100/40">{new Date(c.issuedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 text-lg font-bold text-emerald-50">{c.framework} · {c.level}</div>
                  <div className="mt-2 font-mono text-[11px] break-all text-emerald-100/60">{c.id}</div>
                  <div className="mt-2 font-mono text-[10px] break-all text-emerald-300/60">{c.seal}</div>
                  {c.signature && <div className="mt-1 font-mono text-[10px] break-all text-emerald-300/40">sig {c.signature.slice(0, 56)}…</div>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EVIDENCE SPINE — honesty block */}
        <section className="rounded-xl border border-emerald-500/15 bg-[#05140d] p-6">
          <SectionLabel>What this number is</SectionLabel>
          <p className="mt-3 text-[12px] leading-relaxed text-emerald-100/60">
            This in-city credential is a <span className="text-amber-200">SOV training attestation</span> — a signed record
            of demonstrated competence on published modules, editable-style shown as the fingerprint above. It is not a
            regulatory conformity mark: CSOAI measures and signs, it does not act as an accredited certification body
            (no ISO/IEC 17065 / 42006 claim). The seal is offline-verifiable — check it the same way you verify any
            csoai sign record.
          </p>
          <button onClick={reset} className="mt-4 rounded-md border border-red-500/30 px-3 py-1.5 text-[12px] font-semibold text-red-200/80 transition hover:bg-red-500/10">
            Reset city
          </button>
        </section>
      </div>
    </div>
  );
}

function toneFor(v: number) {
  if (v >= 70) return { cls: "text-emerald-300", bar: "bg-emerald-500" };
  if (v >= 35) return { cls: "text-amber-300", bar: "bg-amber-500" };
  return { cls: "text-red-300", bar: "bg-red-500" };
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-[4px] text-emerald-300/50">{children}</div>;
}

function CivicCard({ label, value, unit, tone, note }: { label: string; value: string; unit: string; tone: string; note: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-[#05140d] p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-100/40">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={cn("text-3xl font-bold", toneForClass(tone))}>{value}</span>
        <span className="text-[11px] text-emerald-100/50">{unit}</span>
      </div>
      <div className="mt-1 text-[11px] text-emerald-100/50">{note}</div>
    </div>
  );
}

function toneForClass(tone: string) {
  if (tone === "amber") return "text-amber-300";
  return "text-emerald-300";
}

function DistrictGlyph({ state }: { state: "certified" | "trained" | "empty" }) {
  if (state === "certified") return <span className="text-emerald-300">⬡</span>;
  if (state === "trained") return <span className="text-amber-300">◪</span>;
  return <span className="text-emerald-100/30">□</span>;
}

function RailCard({ href, glyph, title, body }: { href: string; glyph: string; title: string; body: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-emerald-500/20 bg-[#05140d] p-4 transition hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]">
      <div className="text-amber-300">{glyph}</div>
      <h3 className="mt-2 font-bold">{title}</h3>
      <p className="mt-1 text-[12px] text-emerald-100/60">{body}</p>
    </Link>
  );
}
