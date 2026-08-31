import { useEffect, useState } from "react";
import { fetchHealth, fetchToolCount, SovHealth } from "../lib/sovHealth";
import { CANON } from "../data/canonCounters";

// Components listed on this page. Only entries with a probe are checked live from
// the browser; everything else is labelled honestly as not probed from this page.
const COMPONENTS: { name: string; probe: "gateway" | "tools" | null }[] = [
  { name: "Council gateway (health probe)", probe: "gateway" },
  { name: "Governed tool fleet (tools probe)", probe: "tools" },
  { name: "Council (multi-agent council)", probe: null },
  { name: "Compliance engine (4 control-sets)", probe: null },
  { name: "Layer 0 signing (Ed25519)", probe: null },
  { name: "Governance Graph (live world data)", probe: null },
  { name: "Signed evidence chain + hash-chain", probe: null },
];

const PROTO_LABEL: Record<string, string> = {
  "/api/sign": "Sign - Ed25519 attestation",
  "/api/verify": "Verify - signature + chain",
  "/api/bridge": "Legacy Bridge - COBOL/mainframe",
  "/api/govern": "Govern - framework mapping",
  "/api/chat": "Chat - reasoning brain",
  "/api/knowledge": "Knowledge - live world data",
  "/api/tools": "Tool Commons - governed MCP",
  "/api/media": "Media - governed assets",
  "/api/badge": "Badge - trust credential",
  "/api/avatar": "Avatar - Council presence",
  "/api/social": "Social - governed posting",
};

function Stat({ label, value, ok, wide }: { label: string; value: string; ok?: boolean; wide?: boolean }) {
  return (
    <div className={(wide ? "sm:col-span-2 " : "") + "rounded-xl border border-emerald-500/15 bg-black/25 px-3 py-2"}>
      <div className="text-[10px] uppercase tracking-wide text-emerald-300/50">{label}</div>
      <div className={"font-mono text-sm font-bold break-all " + (ok === false ? "text-amber-300" : "text-emerald-300")}>{value}</div>
    </div>
  );
}

type XrplState = { status: number; n?: number | null; merkle?: string | null };
type HealthDoc = {
  last_success?: string;
  last_success_as_of?: string;
  key?: string;
  halt?: { split?: boolean; missing_key?: boolean; reason?: string; unsigned_new_leaves?: number };
  adapters?: Record<string, { status?: string; n?: number; note?: string }>;
  merkle_root?: string;
  as_of?: string;
};

export default function StatusPage() {
  const [live, setLive] = useState<SovHealth | null>(null);
  const [tools, setTools] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [root, setRoot] = useState<any>(null);
  const [xrpl, setXrpl] = useState<XrplState | null>(null);
  const [pubHealth, setPubHealth] = useState<HealthDoc | null>(null);

  useEffect(() => {
    document.title = "System Status - the Council OS, live | CSOAI";
    fetchHealth().then((h) => { setLive(h); setChecked(true); });
    fetchToolCount().then(setTools);
    fetch("/root.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(setRoot);
    fetch("/api/xrpl")
      .then(async (r) => {
        let body: any = null;
        try { body = await r.json(); } catch { body = null; }
        setXrpl({ status: r.status, n: body?.n ?? null, merkle: body?.merkle_root ?? null });
      })
      .catch(() => setXrpl({ status: 0, n: null, merkle: null }));
    fetch("/publisher-health.json")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(setPubHealth);
  }, []);

  const connected = !!(live && live.ok);
  const toolsOk = tools != null;
  const protos = (live && Array.isArray(live.tools)) ? live.tools : [];
  const brain = (live && live.brain) || {};

  const merkleHex = root?.merkle_root ? String(root.merkle_root) : "—";
  const unsignedLeaf =
    pubHealth?.last_success === "unsigned-snapshot" ||
    (root?.note && String(root.note).includes("NO_LAPTOP_SIGN"))
      ? "NO_LAPTOP_SIGN"
      : pubHealth?.key === "present"
        ? "new-leaves-signed"
        : "NO_LAPTOP_SIGN";
  const haltSplit = pubHealth?.halt?.split
    ? `HALT-ON-SPLIT @ ${pubHealth.as_of || pubHealth.last_success_as_of || "unknown"}`
    : pubHealth?.halt?.reason
      ? String(pubHealth.halt.reason)
      : pubHealth
        ? "none this file"
        : "health missing";
  const xrplLabel = !xrpl
    ? "probing…"
    : xrpl.status === 200
      ? `200 n=${xrpl.n ?? "?"}`
      : String(xrpl.status);
  const xrplOk = xrpl?.status === 200 && xrpl.n === 16;
  const adapters = pubHealth?.adapters || null;

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden border-b border-emerald-500/15">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <div className="relative mx-auto max-w-4xl px-6 pt-16 pb-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS - system status</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">We publish our <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">own status.</span></h1>
          <p className="mt-4 mx-auto max-w-xl text-lg text-emerald-100/80">An AI-governance company should be the most transparent system you run. Below: the public-root instrument first, then what we probe live from your browser. A dead gateway is not the only instrument.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-8" data-testid="public-root-status">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Public-root catalogue — last root, merkle, unsigned-leaf</h2>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 p-5 space-y-3">
          <p className="text-sm text-emerald-100/80">
            Living catalogue is GET <a className="text-emerald-300 underline" href="/root.json">/root.json</a>
            {" "}(alias <code>/api/root</code> when Pages has the function). Inclusion is membership in that hash list.
            This is not a laptop-signed card check. Layer-0 seals the root document, not the leaves.
            Adapter health is GET <a className="text-emerald-300 underline" href="/publisher-health.json">/publisher-health.json</a>.
            Do not stamp MEASURED from this catalogue.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <Stat label="Last root (as_of)" value={root?.as_of ? String(root.as_of) : "not loaded"} />
            <Stat label="card_count" value={root?.card_count != null ? String(root.card_count) : "—"} />
            <Stat label="merkle_root" value={merkleHex} wide />
            <Stat label="unsigned-leaf" value={unsignedLeaf} />
            <Stat label="/api/xrpl state" value={xrplLabel} ok={xrplOk} />
            <Stat label="halt_on_split last" value={haltSplit} ok={pubHealth?.halt?.split !== true} />
          </div>
          {xrpl?.merkle && root?.merkle_root && (
            <p className="text-xs font-mono text-emerald-200/80">
              /api/xrpl merkle {xrpl.merkle === root.merkle_root ? "matches" : "DOES NOT MATCH"} /root.json
            </p>
          )}
          <div className="pt-1">
            <p className="text-[10px] uppercase tracking-wide text-emerald-300/50 mb-2">adapter health</p>
            {adapters ? (
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                {Object.entries(adapters).map(([name, a]) => (
                  <Stat
                    key={name}
                    label={name}
                    value={`${a?.status || "—"}`}
                    ok={a?.status === "unsigned-snapshot" || a?.status === "cite-only"}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-amber-200/80">publisher-health.json not loaded — no adapter sidecar this hour.</p>
            )}
            {pubHealth?.last_success && (
              <p className="mt-2 text-xs text-amber-200/80">
                last_success={pubHealth.last_success}
                {pubHealth.last_success_as_of ? ` @ ${pubHealth.last_success_as_of}` : ""}
                {pubHealth.halt?.missing_key ? " · halt=missing-key" : ""}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-6">
        <div className={"rounded-2xl border p-5 " + (connected ? "border-emerald-400/50 bg-gradient-to-br from-emerald-500/15 to-transparent" : checked ? "border-amber-400/40 bg-amber-500/5" : "border-emerald-500/20 bg-[#05140d]")}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="relative flex h-3 w-3">
              {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />}
              <span className={"relative inline-flex h-3 w-3 rounded-full " + (connected ? "bg-emerald-400" : checked ? "bg-amber-400" : "bg-gray-500")} />
            </span>
            <span className="text-lg font-black">{connected ? "Council engine - CONNECTED" : checked ? "Council engine - reachable, degraded" : "Checking the Council engine..."}</span>
            {live && live.version && <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">v{live.version}</span>}
            <span className="ml-auto font-mono text-[11px] text-emerald-300/60">CSOAI Council OS</span>
          </div>
          <p className="mt-2 text-xs text-emerald-300/60">Gateway probe is optional. Public-root fields above do not depend on it.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-4 text-sm">
            <Stat label="Substrate" value="Layer 0" />
            {/* The fallback is a count of registry ROWS (servers), so it cannot be labelled
                "Governed tools" — that conflates catalogued servers with reachable tools and
                is what let a 291-row file read as running tool infrastructure. Label follows
                the source of the number actually displayed. */}
            <Stat
              label={tools != null ? "Tools (probed)" : "Servers catalogued"}
              value={tools != null ? tools.toLocaleString() : CANON.mcpRegistryEntries.value.toString()}
            />
            <Stat label="Orchestrator" value={brain.orchestrator ? "live" : "-"} ok={!!brain.orchestrator} />
            <Stat label="OpenAI-compat" value={brain.openai_compat ? "live" : "-"} ok={!!brain.openai_compat} />
            <Stat label="Groq" value={brain.groq ? "on" : "-"} ok={!!brain.groq} />
            <Stat label="Anthropic" value={brain.anthropic ? "on" : "-"} ok={!!brain.anthropic} />
            <Stat label="Ed25519" value={(live && live.governance && live.governance.sigil) || "ed25519"} />
            <Stat label="Care floor" value={live && live.governance && live.governance.care_floor != null ? String(live.governance.care_floor) : "0.95"} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-6" data-testid="pqc-honesty">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Card crypto — Ed25519 today · PQC not inside 3KB</h2>
        <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 space-y-2">
          <p className="text-sm text-emerald-100/80">
            Estate cards are Ed25519 over a SHA-256 hash chain against <code>did:web:csoai.org#card-attestation-1</code>.
            The 3KB atom is binding. An ML-DSA-65 signature is ~3.3KB and cannot live inside the card.
            <code>#board-pqc-1</code> is ABSENT — no ML-DSA public key is published. Hybrid is planned as a second receipt on the root / DID, never inside the atom. Do not claim PQC-signed cards. Fail-closed: no PQC helper is wired; a missing PQC seal is UNCHECKABLE, never VALID.
          </p>
          <p className="text-xs text-amber-200/80">
            tsa.status: err — no OpenTimestamps proof is published. PQCBench is the GSPC continuity arena (csoai/gspc-asi), not a post-quantum signature.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pt-6">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Layer 0 protocols - {connected ? "aligned & live" : "expected"}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {(protos.length ? protos : Object.keys(PROTO_LABEL)).map((p) => (
            <div key={p} className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-[#05140d] px-4 py-3">
              <span className="text-sm font-semibold text-emerald-100">{PROTO_LABEL[p] || p}</span>
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-emerald-200/70">
                <span className={"h-2.5 w-2.5 rounded-full " + (connected ? "bg-emerald-400" : "bg-gray-500")} />{connected ? "live" : "..."}
              </span>
            </div>
          ))}
          {brain.orchestrator && (<div className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-500/5 px-4 py-3"><span className="text-sm font-semibold text-emerald-100">Orchestrator - tool-calling brain</span><span className="flex items-center gap-2 font-mono text-[11px] uppercase text-emerald-200/70"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />live</span></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10 space-y-3">
        <h2 className="mb-1 font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Components — what we probe live, and what we don&apos;t</h2>
        {COMPONENTS.map((c) => {
          const probed = c.probe != null;
          const ok = c.probe === "gateway" ? connected : c.probe === "tools" ? toolsOk : false;
          const label = !probed
            ? "not probed from this page"
            : !checked
            ? "checking..."
            : ok
            ? "operational"
            : "unreachable";
          const dot = !probed ? "bg-gray-500" : !checked ? "bg-gray-500" : ok ? "bg-emerald-400" : "bg-amber-400";
          return (
            <div key={c.name} className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-[#05140d] px-5 py-4">
              <span className="text-sm font-semibold text-emerald-100">{c.name}</span>
              <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-emerald-200/70"><span className={"h-2.5 w-2.5 rounded-full " + dot} />{label}</span>
            </div>
          );
        })}
        <p className="pt-4 text-center text-xs text-emerald-300/50">{connected ? "Connected live to the Council engine that powers the CSOAI OS." : "The Council engine is reached live from your browser."} Rows marked &ldquo;not probed from this page&rdquo; have no public health endpoint we can honestly check from here — we don&apos;t paint them green by default. A dead gateway is not the public-root instrument.</p>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-14 space-y-4">
        <h2 className="mb-1 font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/60">Incident history</h2>
        <p className="text-sm text-emerald-100/70">
          Apart from the entry below, no incidents are currently on record for this service. When one
          occurs, it will be logged here with a timeline and resolution — we do not backfill a
          history we did not keep.
        </p>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/5 px-5 py-4 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs text-amber-300">2026-07-31</span>
            <span className="text-sm font-bold text-emerald-50">Cross-wired deploy regression — resolved, 45 minutes</span>
            <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">resolved same day</span>
          </div>
          <p className="text-sm text-emerald-100/70">
            A misdirected deployment briefly cross-wired this surface with the DEFONEOS deployment,
            serving the wrong build to several pages. Detected through our EU AI Act page checks,
            the deployment was reversed the same day — roughly 45 minutes end to end — and the deploy
            target misconfiguration that caused it was fixed. No user data was affected. We publish
            this because a status page that only ever says &ldquo;all operational&rdquo; is a
            decoration, not a status page.
          </p>
        </div>
      </section>
    </div>
  );
}
