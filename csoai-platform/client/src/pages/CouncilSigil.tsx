/**
 * Council · Sigil — Sovereign Inter-aGent Interchange Language.
 *
 * In-browser encoder/parser/hasher demo. Mirrors the canonical
 * meok-sigil Python package so visitors can experience the protocol
 * without installing anything. The full grammar lives in
 * meok-ai/meok-sigil and on PyPI.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import CouncilNav from "@/components/CouncilNav";

const EXAMPLES = [
  {
    label: "Council vote",
    input: { agent: "sovereign-7", vote: "APPROVE", weight: 0.85, domain: "ethics" },
  },
  {
    label: "Watchdog sign",
    input: {
      cert: "MEOK-EUAIA-ABC123",
      signer: "did:web:csoai.org",
      ts: "2026-06-12T02:00:00Z",
    },
  },
  {
    label: "BFT round",
    input: { round: 17, approve: 23, reject: 9, abstain: 4, outcome: "APPROVE" },
  },
];

const encode = (obj: Record<string, any>): string => {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "boolean") {
      parts.push(`${k}=${v ? "+" : "-"}`);
    } else if (typeof v === "string") {
      parts.push(`${k}="${v.replace(/"/g, '\\"')}"`);
    } else if (typeof v === "number") {
      parts.push(`${k}=${v}`);
    } else {
      parts.push(`${k}="${JSON.stringify(v).replace(/"/g, '\\"')}"`);
    }
  }
  return parts.join(" ");
};

const parse = (line: string): Record<string, any> => {
  const result: Record<string, any> = {};
  const re = /(\w+)=("(?:[^"\\]|\\.)*"|\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const [, key, raw] = m;
    let val: any = raw;
    if (raw.startsWith('"') && raw.endsWith('"')) {
      val = raw.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    } else if (raw === "+" || raw === "-") {
      val = raw === "+";
    } else if (!isNaN(Number(raw))) {
      val = Number(raw);
    }
    result[key] = val;
  }
  return result;
};

const digest = async (line: string): Promise<string> => {
  const buf = new TextEncoder().encode(line);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 12);
};

export default function CouncilSigil() {
  const [input, setInput] = useState(JSON.stringify(EXAMPLES[0].input, null, 2));
  const [encoded, setEncoded] = useState("");
  const [decoded, setDecoded] = useState("");
  const [hash, setHash] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleEncode = async () => {
    setError(null);
    try {
      const obj = JSON.parse(input);
      const line = encode(obj);
      setEncoded(line);
      setHash(await digest(line));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleParse = () => {
    setError(null);
    try {
      const obj = parse(encoded);
      setDecoded(JSON.stringify(obj, null, 2));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const loadExample = (idx: number) => {
    setInput(JSON.stringify(EXAMPLES[idx].input, null, 2));
    setEncoded("");
    setDecoded("");
    setHash("");
  };

  return (
    <>
      <CouncilNav />
      <main className="max-w-6xl mx-auto px-4 py-16">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-3">
            Council · Sigil
          </p>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-4">
            SIGIL — the agent language
          </h1>
          <p className="text-slate-400 max-w-3xl">
            Sovereign Inter-aGent Interchange Language. A compact, deterministic,
            token-efficient protocol for AI agents to talk to each other — with
            a lossless human-readable translator.
          </p>
        </motion.header>

        <div className="mb-8 p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
          <h2 className="text-lg font-bold mb-2">Why SIGIL exists</h2>
          <p className="text-sm text-slate-300">
            When 36 council agents need to agree on a cert decision, you can&apos;t
            ship JSON (verbose, ambiguous, no audit trail). SIGIL is one line,
            deterministic, and every line is auditable. The canonical Python
            package is{" "}
            <code className="font-mono text-xs text-cyan-400">meok-sigil</code>{" "}
            on PyPI; this page is an in-browser demo.
          </p>
        </div>

        {/* Quick examples */}
        <div className="mb-8 flex flex-wrap gap-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => loadExample(i)}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Encode */}
        <section className="mb-8">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-3">
            1 · Encode
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest">
                Input (JSON)
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-48 p-3 mt-2 font-mono text-xs bg-slate-900 border border-white/10 rounded-lg text-slate-200 focus:border-emerald-500 outline-none"
                spellCheck={false}
              />
              <button
                onClick={handleEncode}
                className="mt-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition"
              >
                Encode →
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest">
                SIGIL line
              </label>
              <pre className="w-full h-48 p-3 mt-2 font-mono text-xs bg-slate-900 border border-emerald-500/30 rounded-lg text-emerald-300 overflow-auto">
                {encoded || "// (click Encode)"}
              </pre>
              {hash && (
                <p className="mt-2 text-xs font-mono text-amber-400">
                  sigil:sha256:{hash}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Decode */}
        <section className="mb-8">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3">
            2 · Parse + verify
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest">
                SIGIL line (input above)
              </label>
              <pre className="w-full h-32 p-3 mt-2 font-mono text-xs bg-slate-900 border border-white/10 rounded-lg text-slate-200 overflow-auto">
                {encoded || "// (encode first)"}
              </pre>
              <button
                onClick={handleParse}
                className="mt-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm transition"
              >
                Parse ←
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-widest">
                Decoded (JSON)
              </label>
              <pre className="w-full h-32 p-3 mt-2 font-mono text-xs bg-slate-900 border border-cyan-500/30 rounded-lg text-cyan-300 overflow-auto">
                {decoded || "// (click Parse)"}
              </pre>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            Error: {error}
          </div>
        )}

        {/* Reference */}
        <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
            SIGIL reference
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500">boolean true:</span>{" "}
              <code className="text-emerald-400">+</code>
            </div>
            <div>
              <span className="text-slate-500">boolean false:</span>{" "}
              <code className="text-rose-400">-</code>
            </div>
            <div>
              <span className="text-slate-500">abstain:</span>{" "}
              <code className="text-amber-400">~</code>
            </div>
            <div>
              <span className="text-slate-500">string:</span>{" "}
              <code>key=&quot;value&quot;</code>
            </div>
            <div>
              <span className="text-slate-500">number:</span> <code>key=42</code>
            </div>
            <div>
              <span className="text-slate-500">escape:</span> <code>\\&quot;</code>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            The full SIGIL grammar lives in{" "}
            <a
              className="text-cyan-400 hover:underline"
              href="https://github.com/meok-ai/meok-sigil"
            >
              meok-ai/meok-sigil
            </a>{" "}
            and on PyPI as <code className="font-mono">meok-sigil</code>.
          </p>
        </section>
      </main>
    </>
  );
}
