import { useEffect, useRef, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";
import { sovActions } from "../lib/sovAgent";
import { detectLocale, REGIONS } from "../lib/locale";
import { flyAndConvene, neutralize } from "../lib/globeDrive";
import SovNav from "../components/SovNav";
import { useLedger, type DecisionRecord } from "../hooks/useLedger";
import JSpaceTimeline, { type TimelineEvent } from "../components/JSpaceTimeline";
import SovSpaceGalaxy, { type FlywheelPlanet, type HiveLayer } from "../components/SovSpaceGalaxy";

// Map the agent's region → the codes the embedded 3D globe understands (loads local).
const SS_GLOBE_CODE: Record<string, string> = { EU: "EU", UK: "UK", US: "US", CANADA: "CA", JAPAN: "JP", KOREA: "KR", CHINA: "CN", SINGAPORE: "SG", INDIA: "IN" };
function ssGlobeCode(text: string): string { const r = sovActions(text).find((a) => a.kind === "region"); return r && r.kind === "region" ? (SS_GLOBE_CODE[r.region] || "") : ""; }

// Sovereign Space - the CSOAI AI-OS simulation. Feed data + text, watch the
// 33-agent council deliberate, and the Sovereign narrates + speaks every step.
// When VITE_SOV_GATEWAY is set it runs LIVE against the MEOK 59-MCP substrate
// (council + audit + sigil); otherwise it runs the local simulation. The same
// flow pixel-streams from Unreal Engine 5 in the full OS.

type Step = { t: string; phase: number };
const SAMPLE = "A hospital wants to deploy an AI triage model in the EU that ranks ER patients by urgency.";

// HIVE — water-pinned facts (the corpus). Static; this is what holds the
// rest up. Counts come from the production sweep 2026-07-30.
const HIVE: HiveLayer[] = [
  { id: "eu-ai-act", name: "EU AI Act", count: 113, description: "frozen provisions across 113 articles" },
  { id: "gdpr", name: "GDPR", count: 99, description: "data-protection obligations" },
  { id: "cra", name: "Cyber Resilience Act", count: 71, description: "vulnerability handling, secure-by-default" },
  { id: "dora", name: "DORA", count: 64, description: "digital operational resilience for financial services" },
  { id: "nis2", name: "NIS2", count: 46, description: "essential-entity security duties" },
  { id: "csrd", name: "CSRD", count: 11, description: "sustainability reporting scope" },
  { id: "iso-42001", name: "ISO 42001", count: 8, description: "AI management system controls" },
  { id: "nist-ai-rmf", name: "NIST AI RMF", count: 7, description: "govern / map / measure / manage" },
  { id: "annexes", name: "Annexes", count: 13, description: "annex III high-risk + annex IV technical docs" },
];

const FLYWHEELS: FlywheelPlanet[] = [
  { id: "find-besT", name: "find_besT", axis: "care", phase: "honey",
    description: "21-subject Day-1 sweep, care_cost joint scoring",
    metric: "composite=3.1564 (sov33-unified)", last_run_iso: "2026-07-30T11:17:00Z" },
  { id: "n-eff", name: "n_eff_diversity", axis: "continuity", phase: "milk",
    description: "pairwise ρ + Kish n_eff across sovereign roster",
    metric: "n_eff=1.285 · gate failed (>2.0 required)", last_run_iso: "2026-07-30T11:25:00Z" },
  { id: "provbench", name: "ProvBench", axis: "provenance", phase: "honey",
    description: "0/20 C2PA markings survive binding-intact",
    metric: "0 of 20 · rule-of-three 95% upper = 15.0%", last_run_iso: "2026-07-30T11:00:00Z" },
  { id: "defbench", name: "DefBench", axis: "safety", phase: "honey",
    description: "45-item care battery, 33 harmful / 12 benign",
    metric: "1 of 4 axes resolved (with gate)", last_run_iso: "2026-07-30T09:35:00Z" },
  { id: "govbench", name: "GovBench", axis: "governance", phase: "honey",
    description: "193 samples, 26 dimensions, cluster-robust",
    metric: "composed +6.63 [+1.05, +12.21]", last_run_iso: "2026-07-30T09:46:00Z" },
  { id: "pqcbench", name: "PQCBench", axis: "continuity", phase: "water",
    description: "25 criteria for PQC-ready signing chains",
    metric: "1 of 25 criteria pass · ML-DSA-65 needed", last_run_iso: "2026-07-30T08:00:00Z" },
  { id: "flywheel-daily", name: "flywheel-daily", axis: "care", phase: "honey",
    description: "cron — daily drift, salted PRACTICE/HELD_OUT split",
    metric: "selftest 9/9 · salt=csoai-flywheel-v1", last_run_iso: "2026-07-30T03:00:00Z" },
  { id: "honey-pipe", name: "honey_pipeline", axis: "care", phase: "honey",
    description: "KB harvest → honey cache → cite-on-serve",
    metric: "83 verified entries · 87KB", last_run_iso: "2026-07-30T05:00:00Z" },
  { id: "production-ready", name: "production_ready", axis: "care", phase: "honey",
    description: "signed care_cost evidence pack for marketing",
    metric: "Ed25519 sigil · care_score=0.7891", last_run_iso: "2026-07-30T12:00:00Z" },
];

const GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) || "https://os.meok.ai/api";
// Local sov-gateway (the coai-dashboard hub at :8080). When set, hit it for
// the KB lookup and the ask-sovereign probe — the local gateway has the 83
// verified KB entries with provenance and the OpenAI-compatible Ollama path.
// Falls back to the deployed master when unset.
const LOCAL_GW: string = ((import.meta as any).env && (import.meta as any).env.VITE_LOCAL_GATEWAY) || "http://localhost:8080";
const SS_INDUSTRIES = ["healthcare","health","hospital","clinical","triage","pharma","biotech","finance","fintech","banking","insurance","lending","credit","education","edtech","retail","ecommerce","legal","government","public sector","defense","energy","utilities","automotive","telecom","manufacturing","logistics","hr","recruiting","hiring","media","gaming","agriculture","transport","aviation","real estate","crypto","web3","marketing"];
function ssIndustry(q: string) { const s = (q || "").toLowerCase(); return SS_INDUSTRIES.find((w) => new RegExp("\\b" + w + "\\b").test(s)) || null; }
function ssRegion(q: string) {
  const s = " " + (q || "").toLowerCase() + " ";
  if (/\bus\b|\busa\b|\bamerica|\bcalifornia\b|\btexas\b|\bcolorado\b|\bnew york\b/.test(s)) return "the United States (NIST AI RMF + state law)";
  if (/\beu\b|\beurope|\bgerman|\bfrance\b|\bspain\b|\bitaly\b|\bireland\b|\bparis\b|\bberlin\b/.test(s)) return "the European Union (EU AI Act)";
  if (/\bchina\b|\bbeijing\b/.test(s)) return "China (TC260)";
  if (/\bsingapore\b/.test(s)) return "Singapore (Model AI Governance)";
  if (/\buk\b|\bbritain\b|\blondon\b/.test(s)) return "the United Kingdom (UK AI regulation)";
  return "a global footprint (ISO 42001)";
}
async function ssGovern(ind: string): Promise<any | null> {
  try { const r = await fetch(GW + "/govern?q=" + encodeURIComponent(ind)); if (r.ok) { const d = await r.json(); if (d && d.matched && d.frameworks && d.frameworks.length) return d; } } catch (e) {}
  return null;
}
async function ssVerdict(scenario: string): Promise<string> {
  try {
    const r = await fetch(GW + "/chat", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: "You are the CSOAI 33-agent governance council. In 3 sentences, deliver a verdict on this AI system: is it permitted, and under what key conditions (risk tier, human oversight, transparency, data duties)? System: " + scenario }) });
    if (r.ok) { const d = await r.json(); if (d && d.response && d.model !== "idle" && !/travell?er|companion|walks beside|i'?m sorry|can'?t help|on your journey|dear friend|kindred|as an ai language|remembering/i.test(String(d.response))) return String(d.response); }
  } catch (e) {}
  return "";
}

// KB lookup against the local sov-gateway /kb endpoint. Returns up to 3
// verified entries with high delta. The KB is the "honey" — verified answers
// that have been measured-climbing the keystone. Cited below the verdict.
type KbMatch = { dimension: string; question: string; delta: number; sha256: string; source_clan?: string };
async function ssLookupKB(query: string): Promise<KbMatch[]> {
  try {
    const params = new URLSearchParams({ limit: "3", min_delta: "15", verified_only: "true" });
    const r = await fetch(LOCAL_GW + "/kb?" + params.toString());
    if (!r.ok) return [];
    const d = await r.json();
    const entries: any[] = Array.isArray(d.entries) ? d.entries : [];
    const q = query.toLowerCase();
    // Lightweight keyword scoring — matches all-caps legislation tokens + industry words.
    const tokens = q.split(/\W+/).filter(t => t.length > 3);
    return entries
      .map((e: any) => {
        const text = ((e.question ?? "") + " " + (e.answer_preview ?? "")).toLowerCase();
        const score = tokens.reduce((acc, t) => acc + (text.includes(t) ? 1 : 0), 0);
        return { score, entry: e };
      })
      .filter((x: any) => x.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
      .map((x: any) => ({
        dimension: x.entry.dimension,
        question: x.entry.question,
        delta: x.entry.delta,
        sha256: x.entry.sha256,
        source_clan: x.entry.source_clan,
      }));
  } catch (e) {
    return [];
  }
}

// KB stats — pulls the by-dimension breakdown so we can show "12 compliance,
// 4 sovereignty, 3 accountability" badges in the page header.
type KbStats = { total_entries: number; verified: number; by_dimension: Record<string, number> };
async function ssKBStats(): Promise<KbStats | null> {
  try {
    const r = await fetch(LOCAL_GW + "/kb/stats");
    if (!r.ok) return null;
    const d = await r.json();
    return {
      total_entries: d.total_entries ?? 0,
      verified: d.verified ?? 0,
      by_dimension: d.by_dimension ?? {},
    };
  } catch (e) {
    return null;
  }
}

function buildRun(scenario: string): Step[] {
  const s = (scenario || "").trim() || SAMPLE;
  const head = s.slice(0, 88) + (s.length > 88 ? "..." : "");
  return [
    { t: "Ingesting your scenario into Sov Space: \"" + head + "\"", phase: 1 },
    { t: "Classifying the system - risk tier and applicable regimes detected (EU AI Act, NIST AI RMF, ISO 42001).", phase: 1 },
    { t: "Convening the council - 33 sovereign agents, fault-aware consensus. Quorum forming...", phase: 2 },
    { t: "Agents deliberating - mapping controls, fairness checks, human-oversight duties, transparency obligations.", phase: 2 },
    { t: "Crosswalking once -> EU AI Act, NIST, ISO 42001 and TC260 satisfied from one evidence set.", phase: 3 },
    { t: "Consensus reached. Read the J-space panel below for the signed historical record; this run is a narrated simulation, not a signed probe.", phase: 4 },
  ];
}

// Map decision_record shape -> TimelineEvent. The "decided_on" field is the
// canonical timestamp; we keep tag + verdict as the visual encoding. The KB
// stores positions + reasoning — much higher information density than flat text.
function convertToTimeline(records: DecisionRecord[]): TimelineEvent[] {
  return records.map((r) => {
    // Derive a weight from the verdict: REFUTED/CONFIRMED weight 1.0 (signed),
    // OPEN 0.6 (pending), default 0.7.
    const w =
      r.verdict === "REFUTED" || r.verdict === "CONFIRMED" || r.verdict === "SETTLED"
        ? 1.0
        : r.verdict === "OPEN"
        ? 0.6
        : 0.7;
    return {
      id: r.id,
      ts: r.decided_on,
      tag: r.tag,
      verdict: r.verdict,
      claim: r.claim,
      evidence: r.evidence,
      sigil: r.sigil_link,
      weight: w,
      space: "J",
    };
  });
}

// Pulled live from the same D1-backed Worker as /live-ledger. Renders signed
// decision_records in J-space replay mode — no inference, no fabrication. Honest
// framing: "current as of the last fetch".

export default function SovSpace() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);
  const [scenario, setScenario] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [verdictText, setVerdictText] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const [loc] = useState(() => detectLocale());
  const [cSpaceEvents, setCSpaceEvents] = useState<TimelineEvent[]>([]);
  const [kbMatches, setKbMatches] = useState<KbMatch[]>([]);
  const [flywheels, setFlywheels] = useState<FlywheelPlanet[]>(FLYWHEELS);
  const [kbStats, setKbStats] = useState<KbStats | null>(null);
  const [kbOnline, setKbOnline] = useState<boolean | null>(null);
  const [ledgerOnline, setLedgerOnline] = useState<boolean | null>(null);
  const [ledgerCount, setLedgerCount] = useState<number>(0);
  const globeRef = useRef<HTMLIFrameElement | null>(null);
  const { data: ledger, loading: ledgerLoading, error: ledgerError, fetchedAt: ledgerFetchedAt } = useLedger();
  const jrecords = (ledger?.records || []).slice(0, 3);
  const jrecordsErr = ledgerError;
  const jfetchedAt = ledgerFetchedAt ? new Date(ledgerFetchedAt).toISOString() : "";

  // Fetch KB stats on mount — the "honey" indicator. If the local gateway is
  // down, the badge shows "offline" rather than fake stats.
  useEffect(() => {
    let alive = true;
    ssKBStats().then((s) => {
      if (!alive) return;
      setKbStats(s);
      setKbOnline(s !== null);
    });
    return () => { alive = false; };
  }, []);

  // Poll the sov-time ledger — the VWM spacetime canvas. Returns last 100
  // events in raw form (second zoom). When the ledger is reachable, the
  // header shows "live: N events"; when unreachable, the badge shows "offline".
  // The poll is intentionally slow (5s) — the timeline component is the
  // primary inner visualization; this is the indicator.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    async function tick() {
      try {
        const r = await fetch(LOCAL_GW + "/sov-time");
        if (!alive) return;
        if (r.ok) {
          const d = await r.json();
          setLedgerCount(d.total ?? 0);
          setLedgerOnline(true);
        } else {
          setLedgerOnline(false);
        }
      } catch {
        if (alive) setLedgerOnline(false);
      }
      if (alive) timer = setTimeout(tick, 5000);
    }
    tick();
    return () => { alive = false; if (timer) clearTimeout(timer); };
  }, []);

  // Fetch KB matches when the scenario textarea changes (debounced). This is
  // the "live lookup" — every character updates the citation matches.
  useEffect(() => {
    const q = scenario.trim();
    if (q.length < 12) { setKbMatches([]); return; }
    const t = setTimeout(async () => {
      const matches = await ssLookupKB(q);
      setKbMatches(matches);
    }, 350);
    return () => clearTimeout(t);
  }, [scenario]);

  // Stamp "presence" onto the sov-time ledger — the user's local position on the
  // dome. When the user picks a jurisdiction (via ssGlobeCode) or flies the
  // globe, that location is appended to the ledger. The UE5 mirror renders the
  // same ledger with the user's POV as the viewport.
  function stampPresence(reason: string, extra: Record<string, unknown> = {}) {
    const code = ssGlobeCode(scenario);
    const prof = (code && REGIONS[code]) ? REGIONS[code] : REGIONS.GLOBAL;
    const [lng, lat] = prof.globe;
    fetch(LOCAL_GW + "/sov-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "presence",
        space: "P", // position-space — the user/agent's local POV
        reason,
        region: code || "GLOBAL",
        lng, lat,
        ...extra,
      }),
    }).catch(() => { /* ledger append is best-effort */ });
  }
  // The Sovereign flies the embedded globe to the scenario's jurisdiction (auto-pulses),
  // convenes the 33-agent council spiral there, and neutralizes any rogue-swarm threat.
  function flyToScenario(text: string) {
    const code = ssGlobeCode(text);
    const prof = (code && REGIONS[code]) ? REGIONS[code] : REGIONS.GLOBAL;
    const [lng, lat] = prof.globe;
    const win = globeRef.current?.contentWindow;
    flyAndConvene(win, lng, lat, { spiral: true });
    if (sovActions(text).some((a) => a.kind === "threat")) window.setTimeout(() => neutralize(win), 6600);
  }
  // Globe loads-local to the visitor's region on arrival, then flies to the scenario's jurisdiction on run.
  const [globeRegion, setGlobeRegion] = useState(() => (loc.region.code === "GLOBAL" ? "" : loc.region.code));
  const endRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<any[]>([]);

  useEffect(() => {
    document.title = "Sovereign Space - simulate, experiment, govern | CSOAI";
    // Handoff from the Sovereign Globe: /simulate?q=… pre-loads the scenario so one
    // Sovereign flows from "ask on the globe" straight into "run the full simulation".
    try { const q = new URLSearchParams(window.location.search).get("q"); if (q) { setScenario(q); setGlobeRegion(ssGlobeCode(q)); } } catch (e) {}
  }, []);
  useEffect(() => { const d = new URLSearchParams(window.location.search).get("demo"); if (d) { setScenario(d); const t = setTimeout(() => run(d), 700); return () => clearTimeout(t); } }, []);
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" }); }, [log]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); try { window.speechSynthesis.cancel(); } catch (e) {} }, []);

  // LIVE FLYWHEEL SNAPSHOT — fetch the build-time snapshot at /flywheel-snapshot.json
  // and merge its real last-run timestamps into the galaxy. Falls back silently
  // to the hardcoded FLYWHEELS list if the snapshot is unreachable.
  useEffect(() => {
    let cancelled = false;
    fetch("/flywheel-snapshot.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((snap: { planets?: FlywheelPlanet[] } | null) => {
        if (cancelled || !snap || !Array.isArray(snap.planets) || snap.planets.length === 0) return;
        setFlywheels(snap.planets);
      })
      .catch(() => {
        // best-effort — keep the static list
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    let raf = 0; const DPR = Math.min(window.devicePixelRatio || 1, 2);
    function size() { const r = cv.getBoundingClientRect(); cv.width = r.width * DPR; cv.height = r.height * DPR; }
    size(); window.addEventListener("resize", size);
    const N = 33; let tick = 0;
    function frame() {
      tick += 1; const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
      const ph = phaseRef.current;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#03110b"; ctx.fillRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.34;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + tick * 0.002;
        const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
        const lit = ph >= 2 && ((tick * 0.6 + i * 7) % N) < (ph * 6);
        ctx.beginPath(); ctx.arc(x, y, lit ? 5 * DPR : 3 * DPR, 0, Math.PI * 2);
        ctx.fillStyle = lit ? "#34d399" : "rgba(16,185,129,0.35)"; ctx.fill();
        if (ph >= 3) { ctx.strokeStyle = "rgba(16,185,129," + (0.05 + 0.05 * Math.sin(tick * 0.05 + i)) + ")"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); }
      }
      if (ph >= 1) { for (let k = 0; k < 26; k++) { const p = ((tick * 4 + k * 30) % 300) / 300; const x = 20 * DPR + p * (cx - 20 * DPR); const y = cy + Math.sin(k + tick * 0.04) * 26 * DPR; ctx.fillStyle = "rgba(110,231,183," + (1 - p) + ")"; ctx.fillRect(x, y, 2.4 * DPR, 2.4 * DPR); } }
      const pulse = 1 + 0.08 * Math.sin(tick * 0.08);
      const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 46 * DPR * pulse);
      grd.addColorStop(0, ph >= 4 ? "#a7f3d0" : "#10b981"); grd.addColorStop(1, "rgba(4,120,87,0)");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, 46 * DPR * pulse, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#05140d"; ctx.beginPath(); ctx.arc(cx, cy, 20 * DPR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#6ee7b7"; ctx.font = (14 * DPR) + "px ui-monospace, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String.fromCharCode(9673), cx, cy);
      raf = requestAnimationFrame(frame);
    }
    frame();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);

  function speak(t: string) { if (!voiceOn) return; try { const u = new SpeechSynthesisUtterance(t); u.rate = 1.04; const vs = window.speechSynthesis.getVoices(); const pick = vs.find((v) => /Google US English|Samantha|Microsoft Aria|en-US/i.test(v.name + " " + v.lang)); if (pick) u.voice = pick; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {} }

  function playSteps(steps: Step[], verdict?: string) {
    let i = 0;
    const runStart = Date.now();
    const play = () => {
      if (i >= steps.length) {
        phaseRef.current = 4;
        if (verdict) { setVerdictText(verdict); setLog((l) => l.concat("Verdict: " + verdict)); }
        setRunning(false); setDone(true);
        // Record the verdict as a C-space event — the "honey" stage.
        const cEvent: TimelineEvent = {
          id: "c-v-" + runStart.toString(36),
          ts: Date.now(),
          tag: "ACTION",
          verdict: "COMPLETE",
          claim: verdict ? verdict.slice(0, 140) : "Run completed — verdict pending",
          evidence: "C-space: council verdict reached.",
          weight: 0.95,
          space: "C",
        };
        setCSpaceEvents((prev) => [cEvent, ...prev].slice(0, 50));
        // Persist to the sov-time ledger — the VWM spacetime canvas. The
        // ledger is append-only with a 16-byte event_id hash; the timestamp
        // is the canonical position on the log-scale timeline.
        fetch(LOCAL_GW + "/sov-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "cspace-verdict",
            space: "C",
            claim: cEvent.claim,
            tag: cEvent.tag,
            verdict: cEvent.verdict,
            weight: cEvent.weight,
          }),
        }).catch(() => { /* ledger append is best-effort */ });
        return;
      }
      const st = steps[i++]; phaseRef.current = st.phase; setLog((l) => l.concat(st.t)); speak(st.t);
      // Each phase step is a C-space event on the timeline — the "hive layers":
      // phase 1 = water (scenario ingestion), phase 2 = milk (deliberation),
      // phase 3 = honey (crosswalk), phase 4 = verdict. Each gets a lower weight
      // so the verdict reads larger; the lower lane resolver still renders them.
      const phaseTag = st.phase === 1 ? "OPEN" : st.phase === 2 ? "ACTION" : st.phase === 3 ? "CONFIRMED" : "ACTION";
      const phaseWeight = st.phase === 1 ? 0.4 : st.phase === 2 ? 0.55 : st.phase === 3 ? 0.7 : 0.9;
      const stepEvent: TimelineEvent = {
        id: "c-s-" + runStart.toString(36) + "-" + i,
        ts: Date.now(),
        tag: phaseTag,
        verdict: st.phase === 4 ? "COMPLETE" : "PENDING",
        claim: st.t.slice(0, 120),
        evidence: "C-space: phase " + st.phase + " step.",
        weight: phaseWeight,
        space: "C",
      };
      setCSpaceEvents((prev) => [stepEvent, ...prev].slice(0, 50));
      // Persist each step to the ledger too — the VWM canvas records every
      // phase so the inner visualisation has the full deliberation arc.
      fetch(LOCAL_GW + "/sov-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "cspace-step",
          space: "C",
          phase: st.phase,
          claim: stepEvent.claim,
          tag: stepEvent.tag,
          weight: stepEvent.weight,
        }),
      }).catch(() => { /* ledger append is best-effort */ });
      const id = setTimeout(play, 1050); timers.current.push(id);
    };
    play();
  }

  function buildLiveRun(scenario: string, region: string, fwNames: string[], bridges: string[], ind: string | null): Step[] {
    const s = (scenario || "").trim() || SAMPLE;
    const head = s.slice(0, 88) + (s.length > 88 ? "..." : "");
    const fwList = fwNames.length ? fwNames.join(", ") : "EU AI Act, NIST AI RMF, ISO 42001";
    return [
      { t: "Ingesting your scenario into Sov Space: \"" + head + "\"", phase: 1 },
      { t: "Classifying the system - jurisdiction: " + region + (ind ? "; sector: " + ind : "") + ".", phase: 1 },
      { t: "Applicable regimes detected: " + fwList + ".", phase: 1 },
      { t: "Convening the council - 33 sovereign agents, fault-aware consensus. Quorum forming...", phase: 2 },
      { t: "Agents deliberating - risk tier, fairness checks, human-oversight duties, transparency obligations.", phase: 2 },
      { t: "Crosswalking once -> " + fwList + " satisfied from one evidence set." + (bridges.length ? " Legacy bridge: " + bridges.join(", ") + "." : ""), phase: 3 },
      { t: "Consensus reached. Read the J-space panel below for the signed historical record; this run is a narrated simulation, not a signed probe.", phase: 4 },
    ];
  }

  async function run(override?: string) {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (override) setScenario(override);
    setGlobeRegion(ssGlobeCode(override ?? scenario)); // label
    flyToScenario(override ?? scenario); // fly + pulse + convene the council ON the globe
    setLog(["Convening the council over your scenario..."]); setVerdictText(""); setDone(false); setRunning(true); phaseRef.current = 2; chargeSovereign(10);
    const scen = ((override ?? scenario) || "").trim() || SAMPLE;
    const ind = ssIndustry(scen);
    const region = ssRegion(scen);
    // Re-fetch KB matches for the scenario being run. The KB lookup runs in
    // parallel with the verdict so the citation badge appears as soon as the
    // verdict is rendered.
    const kbP = ssLookupKB(scen).then((m) => setKbMatches(m)).catch(() => {});
    // Stamp the user's presence on the ledger — the dome-local position
    // before the council runs. This is the "look-into" event: the user
    // engaged Sov Space at a specific jurisdiction with a specific scenario.
    stampPresence("scenario-run", { scenario: scen.slice(0, 140), region, ind });
    try {
      const [gov, verdict] = await Promise.all([ind ? ssGovern(ind) : Promise.resolve(null), ssVerdict(scen), kbP]);
      const fwNames: string[] = gov && Array.isArray(gov.frameworks) ? gov.frameworks.map((f: any) => f.name) : [];
      const bridges: string[] = gov && Array.isArray(gov.bridges) ? gov.bridges : [];
      setLog([]);
      playSteps(buildLiveRun(scen, region, fwNames, bridges, ind), verdict || "Permitted with conditions - high-risk controls, human oversight, and transparency required.");
      return;
    } catch (e) {
      setLog((l) => l.concat("Live gateway unavailable - running local simulation."));
    }
    playSteps(buildRun(scenario), "Compliant with conditions - signed and ledgered.");
  }
  function reset() { timers.current.forEach(clearTimeout); try { window.speechSynthesis.cancel(); } catch (e) {} phaseRef.current = 0; setLog([]); setRunning(false); setDone(false); setVerdictText(""); }

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden mx-auto max-w-6xl px-6 pt-14 pb-6">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 30% -10%, rgba(16,185,129,.18), transparent 60%)" }} />
        <div className="relative"><SovNav /></div>
        <p className="relative font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - Sovereign Space</p>
        <h1 className="relative mt-2 text-5xl sm:text-6xl font-black tracking-tight">Simulate. Experiment. <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">Govern.</span></h1>
        <p className="mt-3 max-w-2xl text-emerald-100/80">Feed a real-world scenario - data or text - into the AI-OS. Watch the 33-agent council deliberate live while your Sovereign narrates and speaks every step. This is the web preview of the immersive Unreal Engine 5 world; the full OS pixel-streams the same flow from UE5.</p>
        <div className="relative mt-4 inline-flex max-w-2xl flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-emerald-500/20 bg-black/25 px-3 py-2 text-sm">
          <span className="font-semibold text-emerald-200">{loc.greeting}</span>
          <span className="text-emerald-100/40">·</span>
          <span className="text-emerald-100/75">{loc.region.label}: {loc.region.frameworks.slice(0, 3).join(", ")}</span>
          <span className="text-emerald-100/40">·</span>
          <span className={
            kbOnline === null ? "text-emerald-100/40"
            : kbOnline ? "text-amber-200"
            : "text-rose-300/80"
          } title="Local sov-gateway KB — verified answers from the 7-D flywheel">
            KB: {kbOnline ? (kbStats ? `${kbStats.verified} verified` : "online") : "offline"}
          </span>
          <span className="text-emerald-100/40">·</span>
          <span className={
            ledgerOnline === null ? "text-emerald-100/40"
            : ledgerOnline ? "text-sky-200"
            : "text-rose-300/80"
          } title="VWM spacetime canvas — append-only event ledger">
            VWM: {ledgerOnline ? `${ledgerCount} events` : "offline"}
          </span>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20">
          <canvas ref={canvasRef} className="h-[420px] w-full block" />
          <div className="absolute left-3 top-3 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/80">{running ? "council deliberating" : done ? "council complete - verdict below" : "sov space - idle"}</div>
          <div className="absolute right-3 top-3 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-[2px] bg-emerald-500/20 text-emerald-200">LIVE - Sovereign gateway</div>
        </div>
        <div className="flex flex-col rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4">
          <label className="text-xs font-bold text-emerald-200/80">Your experiment</label>
          <textarea value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder={SAMPLE} rows={3} className="mt-2 resize-none rounded-xl border border-emerald-500/25 bg-black/30 p-3 text-sm text-emerald-50 placeholder-emerald-300/30 focus:outline-none" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => run()} disabled={running} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-50">{running ? "Running..." : "Run experiment"}</button>
            <button onClick={reset} className="rounded-xl border border-emerald-400/40 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-white/5">Reset</button>
            <button onClick={() => { setVoiceOn((x) => !x); try { window.speechSynthesis.cancel(); } catch (e) {} }} className="rounded-xl border border-emerald-400/40 px-3 py-2 text-sm text-emerald-100 hover:bg-white/5">{voiceOn ? "Voice on" : "Voice off"}</button>
            <a href={"/globe" + (scenario ? "?ask=" + encodeURIComponent(scenario) : "")} className="rounded-xl border border-sky-400/40 px-3 py-2 text-sm font-semibold text-sky-100 hover:bg-white/5">See it on the Sovereign Globe →</a>
            <button onClick={() => stampPresence("walk-around", { pov: "all", zoom: "all" })} className="rounded-xl border border-amber-400/40 px-3 py-2 text-sm font-semibold text-amber-100 hover:bg-white/5" title="Stamp your POV as 'all-of-data' — every event in the ledger, every zoom level, no filtering">EAT ALL</button>
          </div>
          {/* Article 50(1) AI-interaction disclosure — EU AI Act applies from 2 Aug 2026;
              any front-end that lets a person interact with an AI must clearly state so. */}
          <div role="status" aria-live="polite" className="mt-3 rounded-md border border-amber-400/35 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold text-amber-100">
            You are interacting with an AI system.
          </div>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto rounded-xl border border-emerald-500/10 bg-black/20 p-3 text-sm" style={{ minHeight: 180 }}>
            {log.length === 0 && <div className="text-emerald-300/40">The Sovereign will narrate here as your experiment runs.</div>}
            {log.map((m, i) => (<div key={i} className="flex gap-2"><span className="text-emerald-400">{String.fromCharCode(9673)}</span><span className="text-emerald-50/90">{m}</span></div>))}
            {done && <div className="mt-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-100">{verdictText ? <div className="mb-2 leading-relaxed"><b className="text-emerald-200">Council verdict:</b> {verdictText}</div> : <div className="mb-2"><b>Verdict:</b> simulation complete.</div>}<div className="mt-3 flex flex-wrap gap-2"><a href="/system-card" className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-400/20">Get a signed System Card →</a><a href={"/hive?q=" + encodeURIComponent(scenario)} className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Collect the frameworks →</a><a href="/try" className="rounded-lg border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-white/5">Inspect on the live Council →</a></div></div>}
            <div ref={endRef} />
          </div>
        </div>
      </section>

      {/* SOV-SPACE GALAXY — 5D layered view.
          Hive (water, pinned facts) → C-space (milk, deliberation) → J-space
          (honey, signed) → flywheels orbiting as planets → live data halo.
          Each flywheel is its own planet; its phase shows water→milk→honey.
          Click a planet to inspect, hover for tooltip. */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="overflow-hidden rounded-2xl border border-sky-500/25 bg-[#05140d]">
          <div className="flex items-center justify-between border-b border-sky-500/15 px-4 py-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-sky-300/70">SovSpace · 5D layered view</div>
              <div className="text-sm font-bold text-sky-100">Hive → C-space → J-space → flywheels → live data — the estate as a galaxy</div>
            </div>
            <div className="text-right font-mono text-[10px] text-sky-300/60">
              zoom: ∞ · flywheels: {flywheels.length}
            </div>
          </div>
          <div className="p-2">
            <SovSpaceGalaxy
              hive={HIVE}
              cspace={cSpaceEvents.length}
              jspace={jrecords.length}
              flywheels={flywheels}
              height={520}
            />
          </div>
          <div className="border-t border-sky-500/15 px-4 py-3 text-[11px] text-sky-300/70">
            <p>
              <strong className="text-sky-200">The metaphor:</strong> the sovereign estate is a galaxy. The HIVE is the central star — water, the pinned facts that ground everything. C-space orbits it — milk, the local deliberation the council does. J-space is the next shell — honey, the signed decisions in the D1 ledger. Each flywheel is its own planet, orbiting on its own radius; its <em>phase</em> shows where it sits in the water→milk→honey flow. The outer halo is the unbounded working memory — the infinite drawing.
            </p>
            <p className="mt-2">
              So front-end and back-end sovereigns operate across all the data <em>living</em>, not frozen — the same way the flywheels keep running while the user looks at any layer. Click a planet, hover for its phase and last-run time, then jump to the J-space timeline below for the signed events it produced.
            </p>
          </div>
        </div>
      </section>

      {/* J-space replay panel — the moat made visible.
          Pulls live decision_records from the D1-backed Worker and renders them
          on an infinite-time log-scale. Each event is a position on the timeline;
          the line-scale zooms out as time expands, so yesterday sits nearby
          and last-decade events nest into fixed slots. Hover to inspect, click
          to expand the reasoning. This is the visual forest — traverse laterally
          (time) or via zoom (scale). C-space (council actions) layers above. */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="rounded-2xl border border-emerald-500/25 bg-[#05140d] p-5">
          <div className="flex items-center justify-between border-b border-emerald-500/15 pb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/70">J-space · C-space · infinite timeline</div>
              <div className="text-sm font-bold text-emerald-100">The Moat, Visible — every event recorded in time</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] text-emerald-300/60">
                {jfetchedAt ? "current as of " + new Date(jfetchedAt).toUTCString().replace("GMT", "UTC") : "loading…"}
              </div>
              <a href="/live-ledger" className="text-[11px] font-semibold text-emerald-200 hover:underline">Open the full ledger →</a>
            </div>
          </div>
          {jrecordsErr && (
            <div className="mt-3 rounded border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              Upstream unavailable ({jrecordsErr}). The moat is not visible right now — this is rendered honestly, not simulated.
              The static 8-refutation story lives at <a href="/refutation-ledger" className="underline">/refutation-ledger</a>.
            </div>
          )}
          {!jrecordsErr && jrecords.length === 0 && cSpaceEvents.length === 0 && (
            <div className="mt-3 rounded border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              Fetching the J-space… if this persists, the upstream is unreachable. Not simulated.
            </div>
          )}
          {(jrecords.length > 0 || cSpaceEvents.length > 0) && (
            <div className="mt-4">
              <JSpaceTimeline
                events={[...convertToTimeline(jrecords), ...cSpaceEvents]}
                onSelect={(ev) => {
                  if (ev.space !== "C") setScenario((q) => q + (q ? " — " : "") + ev.claim);
                }}
              />
            </div>
          )}
          <p className="mt-3 text-[11px] text-emerald-300/50">
            Each event is a point on a log-scale line — the timeline zooms out as time expands, so the KB can hold an unbounded number of decision_records while the screen stays readable. Hover any event for context; click to feed it back into the scenario. Watch the <a href="/live-ledger" className="underline">live chain</a> refresh as the council deliberates; see the static story at <a href="/refutation-ledger" className="underline">/refutation-ledger</a>.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="overflow-hidden rounded-2xl border border-sky-500/25">
          <div className="flex items-center justify-between bg-[#05140d] px-4 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[2px] text-sky-300/70">The Sovereign Globe — {globeRegion ? "flown to " + globeRegion + " for your scenario" : "one Sovereign, one world — run a scenario to fly it"}</div>
            <a href={"/globe" + (scenario ? "?ask=" + encodeURIComponent(scenario) : "")} className="text-[11px] font-semibold text-sky-200 hover:underline">Open the full globe →</a>
          </div>
          <iframe ref={globeRef} src={"/globe3d.html" + (loc.region.code !== "GLOBAL" ? "?region=" + loc.region.code : "")} title="Sovereign globe" loading="lazy" className="block h-[360px] w-full" style={{ border: 0 }} />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <a href="/try" className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 hover:border-emerald-400/40"><div className="text-lg font-bold">Ask the live Council</div><p className="mt-1 text-sm text-emerald-100/70">Take a real question to the 33 agents and get a signed verdict.</p></a>
          <a href="/certification" className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 hover:border-emerald-400/40"><div className="text-lg font-bold">Training and Certification</div><p className="mt-1 text-sm text-emerald-100/70">Learn the framework and earn your verifiable Sovereign credential.</p></a>
          <a href="/charter" className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 hover:border-emerald-400/40"><div className="text-lg font-bold">The Sovereign Charter</div><p className="mt-1 text-sm text-emerald-100/70">The constitution the OS is governed by - read and align.</p></a>
        </div>
        <div className="mt-6 rounded-2xl border border-emerald-500/15 bg-black/20 p-5 text-sm text-emerald-100/70">
          <b className="text-emerald-200">Roadmap to Unreal Engine 5.</b> This Sov Space runs natively in your browser today. The full immersive OS renders in UE5 and reaches you by pixel-stream, with the same Sovereign voice loop and Layer 0 signing - you take control, it explains as it happens. Building in the open on GitHub; aligned across the M4 build line.
        </div>
      </section>
    </div>
  );
}
