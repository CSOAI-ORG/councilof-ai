import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { isEmbedded } from "@/lib/embed";

/**
 * CouncilConsole — retired from site chrome (2026-08-21).
 * The Council OS overlay (CouncilLobby) is the one workspace. This file
 * stays as the deterministic SUMMON/escort implementation if a page wants
 * an inline console; App.tsx no longer mounts the floating bubble.
 *
 * The estate, operable from one box: SUMMON pulls live surfaces inline
 * (board, arena, REPORTED, verify); ESCORT navigates — only after an
 * explicit click (surfaces never open uninvited: the consent lock).
 *
 * HONESTY CONTRACT: this console is deterministic. There is no model
 * behind the box — every answer is a fetch of the same public, signed
 * APIs anyone can curl, or a client-side recompute (verify). It says so
 * on its face. When a model-backed concierge ships, it will be labelled
 * in the same commit that ships it — never ahead of it.
 */

type Msg =
  | { role: "user"; text: string }
  | { role: "console"; kind: "text"; text: string }
  | { role: "console"; kind: "board"; axes: any[]; totals: any }
  | { role: "console"; kind: "arena"; rounds: any[] }
  | { role: "console"; kind: "reported"; entries: any[] }
  | { role: "console"; kind: "verify" }
  | { role: "console"; kind: "escort"; label: string; path: string };

const CHIPS: [string, string][] = [
  ["Live board", "board"],
  ["Verify a record", "verify"],
  ["Arena feed", "arena"],
  ["REPORTED", "reported"],
  ["The charter", "go /firewall-charter"],
];

// ---- verify helpers (same envelope contract as /gspc-verify) ----
function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return "{" + Object.keys(v as any).sort().map((k) => JSON.stringify(k) + ":" + canonical((v as any)[k])).join(",") + "}";
  return JSON.stringify(v);
}
async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function VerifyInline() {
  const [raw, setRaw] = useState("");
  const [out, setOut] = useState<string[]>([]);
  const run = async () => {
    const lines: string[] = [];
    let rec: any;
    try { rec = JSON.parse(raw); } catch { setOut(["✗ Not valid JSON — nothing was checked."]); return; }
    const { signature, content_id, ...body } = rec;
    if (typeof content_id === "string") {
      const a = await sha256hex(canonical(signature !== undefined ? { ...body, signature } : body));
      const b = await sha256hex(canonical(body));
      lines.push(a === content_id || b === content_id
        ? `✓ content_id matches (${content_id.slice(0, 12)}…)`
        : `✗ content_id MISMATCH — record altered after its id was computed`);
    } else lines.push("○ no content_id — hash check not applicable");
    if (typeof signature === "string" && signature) {
      try {
        const did = await (await fetch("/.well-known/did.json")).json();
        const signed = new TextEncoder().encode(canonical({ ...body, ...(content_id !== undefined ? { content_id } : {}) }));
        const sig = /^[0-9a-f]+$/i.test(signature)
          ? Uint8Array.from(signature.match(/.{2}/g)!.map((h: string) => parseInt(h, 16)))
          : Uint8Array.from(atob(signature.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
        let ok = false, who = "";
        for (const m of did.verificationMethod ?? []) {
          try {
            const key = m.publicKeyJwk
              ? await crypto.subtle.importKey("jwk", m.publicKeyJwk, { name: "Ed25519" }, false, ["verify"])
              : null;
            if (key && (await crypto.subtle.verify({ name: "Ed25519" }, key, sig as unknown as BufferSource, signed))) { ok = true; who = m.id; break; }
          } catch { /* next key */ }
        }
        lines.push(ok ? `✓ Ed25519 VALID against ${who}` : "✗ signature verifies against no published key");
      } catch { lines.push("✗ could not fetch did.json keys — incomplete, not passed"); }
    } else lines.push("○ UNSIGNED record — hash checked only; authorship not attested");
    setOut(lines);
  };
  return (
    <div>
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)}
        placeholder="Paste one estate record (card / receipt JSON) — it never leaves this browser."
        className="h-24 w-full rounded-lg border border-emerald-600/30 bg-white/70 p-2 font-mono text-[11px] text-gray-800" />
      <button onClick={run} disabled={!raw.trim()}
        className="mt-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40">
        Verify
      </button>
      {out.map((l, i) => (
        <div key={i} className={"mt-1 text-[12px] " + (l.startsWith("✓") ? "text-emerald-700" : l.startsWith("✗") ? "text-red-600" : "text-gray-500")}>{l}</div>
      ))}
      <p className="mt-2 text-[10px] text-gray-400">Full verifier with permalinks: /gspc-verify</p>
    </div>
  );
}

export default function CouncilConsole() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [, navigate] = useLocation();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  if (isEmbedded()) return null;

  const say = (m: Msg) => setMsgs((p) => [...p, m]);

  const act = async (intent: string) => {
    const q = intent.trim();
    say({ role: "user", text: q });
    const lower = q.toLowerCase();
    const go = lower.match(/^(?:go|open|take me to)\s+(\/?[a-z0-9-]+)/);
    try {
      if (lower.includes("board") || lower.includes("score") || lower.includes("gspc")) {
        const d = await (await fetch("/api/gspc")).json();
        say({ role: "console", kind: "board", axes: d.axes.slice(0, 6), totals: d.totals });
      } else if (lower.includes("verify")) {
        say({ role: "console", kind: "verify" });
      } else if (lower.includes("arena") || lower.includes("round")) {
        const t = await (await fetch("/api/arena/rounds.jsonl")).text();
        const rounds = t.trim().split("\n").slice(-4).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        say({ role: "console", kind: "arena", rounds });
      } else if (lower.includes("report")) {
        const d = await (await fetch("/api/reported")).json();
        say({ role: "console", kind: "reported", entries: (d.entries || d.reported || []).slice(0, 3) });
      } else if (go) {
        const path = go[1].startsWith("/") ? go[1] : "/" + go[1];
        say({ role: "console", kind: "escort", label: `Open ${path}`, path });
      } else if (lower.includes("charter")) {
        say({ role: "console", kind: "escort", label: "Open the Firewall Charter", path: "/firewall-charter" });
      } else if (lower.includes("honest")) {
        say({ role: "console", kind: "escort", label: "Open the honesty gate", path: "/honesty" });
      } else if (lower.includes("insur")) {
        say({ role: "console", kind: "escort", label: "Open the insurer evidence pack", path: "/insurers" });
      } else {
        say({ role: "console", kind: "text",
          text: "I'm the deterministic console — no model, just the estate's signed APIs. I can: show the live board · verify a record · stream the arena · list REPORTED figures · or take you to any page (“go /library”). Everything I show, you can also curl." });
      }
    } catch (e) {
      say({ role: "console", kind: "text", text: "That fetch failed honestly: " + String(e) + " — the API is the source of truth; try it directly." });
    }
  };

  const CHIP_CLS = "rounded-full border border-emerald-600/30 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50";

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Open the Council Console" title="Ask the Council"
          className="fixed bottom-5 right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg transition hover:bg-emerald-600 hover:scale-105">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-[70] flex h-[min(560px,75vh)] w-[min(400px,92vw)] flex-col overflow-hidden rounded-2xl border border-emerald-700/25 bg-[#fafdfb] shadow-2xl">
          <div className="flex items-center justify-between bg-emerald-700 px-4 py-2.5 text-white">
            <div>
              <div className="text-sm font-bold">Council Console</div>
              <div className="text-[10px] opacity-80">the estate, in one box — deterministic, no model</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-lg leading-none opacity-80 hover:opacity-100">×</button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.length === 0 && (
              <p className="text-[12px] text-gray-500">
                Everything here comes from the same public, signed APIs anyone can curl — shown inline, or I can walk you to the page. Surfaces never open without your click.
              </p>
            )}
            {msgs.map((m, i) => {
              if (m.role === "user") return <div key={i} className="ml-8 rounded-lg bg-emerald-100 px-3 py-1.5 text-[12px] text-emerald-900">{m.text}</div>;
              if (m.kind === "text") return <div key={i} className="mr-4 rounded-lg bg-white px-3 py-2 text-[12px] leading-relaxed text-gray-700 shadow-sm">{m.text}</div>;
              if (m.kind === "board") return (
                <div key={i} className="mr-2 rounded-lg bg-white p-2 shadow-sm">
                  <div className="mb-1 text-[11px] font-bold text-gray-700">{m.totals?.public_count}</div>
                  {m.axes.map((a: any) => (
                    <div key={a.axis} className="flex items-center justify-between border-t border-gray-100 py-1 text-[11px]">
                      <span className="font-semibold text-gray-800">{a.axis}</span>
                      {/* An axis with no accuracy prints the published status word, never
                          `undefined * 100` (NaN%) and never a 0 that would assert a
                          measurement of zero. Same rule as the board surfaces. */}
                      <span className="font-mono text-gray-600">
                        {typeof a.accuracy === "number" && Number.isFinite(a.accuracy)
                          ? `${a.accuracy_is ? "≥" : ""}${(a.accuracy * 100).toFixed(0)}%`
                          : a.kind === "deterministic-facts"
                            ? "facts — no leader"
                            : "unmeasured"}
                      </span>
                      <span className={"rounded-full px-1.5 text-[9px] font-bold " + (a.separation === "SEPARATED" ? "bg-emerald-100 text-emerald-700" : a.separation === "TIE" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")}>{a.separation ?? (a.kind === "deterministic-facts" ? "N/A — no fleet" : "UNMEASURED")}</span>
                    </div>
                  ))}
                  <button onClick={() => navigate("/dashboard?tab=board")} className={CHIP_CLS + " mt-2"}>Open the full board →</button>
                </div>
              );
              if (m.kind === "arena") return (
                <div key={i} className="mr-2 rounded-lg bg-white p-2 shadow-sm">
                  <div className="mb-1 text-[11px] font-bold text-gray-700">Latest arena rounds (live feed)</div>
                  {m.rounds.map((r: any, j: number) => (
                    <div key={j} className="border-t border-gray-100 py-1 font-mono text-[10px] text-gray-600">
                      #{r.round ?? r.id ?? j} {r.winner ? `winner: ${r.winner}` : ""} {r.models ? `(${(r.models || []).join(" vs ")})` : ""}
                    </div>
                  ))}
                  <a href="/api/arena/rounds.jsonl" className={CHIP_CLS + " mt-2 inline-block"}>Raw NDJSON →</a>
                </div>
              );
              if (m.kind === "reported") return (
                <div key={i} className="mr-2 rounded-lg bg-white p-2 shadow-sm">
                  <div className="mb-1 text-[11px] font-bold text-gray-700">REPORTED — by others, cited, never mixed with MEASURED</div>
                  {m.entries.map((e: any, j: number) => (
                    <div key={j} className="border-t border-gray-100 py-1 text-[11px] text-gray-600">{e.claim || e.title || JSON.stringify(e).slice(0, 80)} <span className="text-gray-400">— {e.source || "cited"}</span></div>
                  ))}
                </div>
              );
              if (m.kind === "verify") return <div key={i} className="mr-2 rounded-lg bg-white p-2 shadow-sm"><VerifyInline /></div>;
              if (m.kind === "escort") return (
                <div key={i} className="mr-2 rounded-lg bg-white p-2 shadow-sm">
                  <button onClick={() => { navigate(m.path); }} className={CHIP_CLS}>{m.label} →</button>
                  <span className="ml-2 text-[10px] text-gray-400">(your click, never mine)</span>
                </div>
              );
              return null;
            })}
            <div ref={endRef} />
          </div>
          <div className="border-t border-emerald-700/15 bg-white p-2">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {CHIPS.map(([label, intent]) => (
                <button key={label} onClick={() => act(intent)} className={CHIP_CLS}>{label}</button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { act(input); setInput(""); } }} className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder='Try "board", "verify", "arena", or "go /library"'
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-[12px]" />
              <button type="submit" className="rounded-lg bg-emerald-700 px-3 py-1.5 text-[12px] font-bold text-white">Ask</button>
            </form>
            <p className="mt-1.5 text-[9px] leading-tight text-gray-400">
              Deterministic console · same signed public APIs (GET /api/gspc et al.) · nothing you type leaves this browser · no account, no fee, forever.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
