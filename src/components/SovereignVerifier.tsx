'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldX, ShieldAlert } from 'lucide-react';
import { SOV_ISSUER_PUBKEY } from '@/lib/sovereign';

/**
 * Client-side Ed25519 verifier for the CSOAI Sovereign Town flywheel ledger.
 *
 * The signing scheme (clawd/sovereign-town/p0_aqua/flywheel_forever.py) is:
 *     body    = json.dumps(entry_without_prev_and_sig, sort_keys=True)   # Python DEFAULT separators ", " / ": "
 *     message = entry.prev + body
 *     sig     = Ed25519(priv, message)
 *
 * pyDumps below was verified byte-for-byte (sha256) against Python's
 * json.dumps(sort_keys=True) across the real chained ledger, so this verifier
 * accepts genuine entries and rejects tampered ones. No server, no account —
 * this is the trust-minimized half of the moat. See [[sov-ledger-signing-scheme]].
 */

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Match Python's json.dumps(obj, sort_keys=True) — spaced separators, ensure_ascii. */
function pyStr(s: string): string {
  let out = '"';
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (ch === '"') out += '\\"';
    else if (ch === '\\') out += '\\\\';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (c < 0x20) out += '\\u' + c.toString(16).padStart(4, '0');
    else if (c < 0x7f) out += ch;
    else if (c <= 0xffff) out += '\\u' + c.toString(16).padStart(4, '0');
    else {
      const h = c - 0x10000;
      out +=
        '\\u' +
        (0xd800 + (h >> 10)).toString(16).padStart(4, '0') +
        '\\u' +
        (0xdc00 + (h & 0x3ff)).toString(16).padStart(4, '0');
    }
  }
  return out + '"';
}
function pyDumps(o: any): string {
  if (o === null) return 'null';
  if (typeof o === 'boolean') return o ? 'true' : 'false';
  if (typeof o === 'number') return String(o);
  if (typeof o === 'string') return pyStr(o);
  if (Array.isArray(o)) return '[' + o.map(pyDumps).join(', ') + ']';
  return (
    '{' +
    Object.keys(o)
      .sort()
      .map((k) => pyStr(k) + ': ' + pyDumps(o[k]))
      .join(', ') +
    '}'
  );
}

async function ed25519Verify(pubB64: string, message: string, sigB64: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    b64ToBytes(pubB64) as BufferSource,
    { name: 'Ed25519' },
    false,
    ['verify'],
  );
  const msg = new TextEncoder().encode(message);
  return crypto.subtle.verify(
    { name: 'Ed25519' },
    key,
    b64ToBytes(sigB64) as BufferSource,
    msg as BufferSource,
  );
}

/** Verify one entry, using `prev`-prefixed message for ledger entries. */
async function verifyEntry(p: Record<string, any>, usePrev: boolean): Promise<boolean> {
  if (!p?.sig) return false;
  const pub = p?.attestation?.pubkey || p.pubkey || p.chain_pubkey || SOV_ISSUER_PUBKEY;
  const body = { ...p };
  delete body.sig;
  delete body.prev;
  delete body.prev_sig;
  delete body.alg;
  const message = (usePrev ? p.prev ?? '' : '') + pyDumps(body);
  try {
    return await ed25519Verify(pub, message, p.sig);
  } catch {
    return false;
  }
}

type Step = { idx: number; prevOk: boolean; sigOk: boolean; host?: string; cycle?: number };
type View =
  | { kind: 'idle' }
  | { kind: 'error'; msg: string }
  | { kind: 'nocrypto' }
  | { kind: 'passport'; ok: boolean }
  | { kind: 'chain'; steps: Step[]; allOk: boolean };

export default function SovereignVerifier({ entries }: { entries?: Record<string, any>[] }) {
  const [input, setInput] = useState('');
  const [view, setView] = useState<View>({ kind: 'idle' });
  const [busy, setBusy] = useState(false);

  const hasEd25519 = typeof crypto !== 'undefined' && !!crypto.subtle;

  // When the server passes the public signed ledger head, auto-verify it on
  // mount so the page shows the REAL public chain verifying live — no paste,
  // no trust in the snapshot numbers elsewhere on the page.
  useEffect(() => {
    if (!entries || !Array.isArray(entries) || entries.length === 0) return;
    const json = JSON.stringify(entries, null, 2);
    setInput(json);
    setBusy(true);
    (async () => {
      const parsed = entries as Record<string, any>[];
      const steps: Step[] = [];
      let prevSig = '';
      let allOk = true;
      for (let i = 0; i < parsed.length; i++) {
        const e = parsed[i];
        const expectedPrev = i === 0 ? `genesis-${e.host ?? ''}` : prevSig;
        const prevOk = (e.prev ?? e.prev_sig) === expectedPrev;
        const sigOk = await verifyEntry(e, true);
        steps.push({ idx: i, prevOk, sigOk, host: e.host, cycle: e.cycle });
        if (!prevOk || !sigOk) allOk = false;
        if (!sigOk) break;
        prevSig = e.sig;
      }
      setView({ kind: 'chain', steps, allOk });
      setBusy(false);
    })();
    // run once on mount per entries set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries?.length]);

  async function run() {
    setBusy(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(input);
      } catch {
        setView({ kind: 'error', msg: 'Input is not valid JSON.' });
        return;
      }
      if (!hasEd25519) {
        setView({ kind: 'nocrypto' });
        return;
      }

      if (Array.isArray(parsed)) {
        const entries = parsed as Record<string, any>[];
        const steps: Step[] = [];
        let prevSig = '';
        let allOk = true;
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i];
          const expectedPrev = i === 0 ? `genesis-${e.host ?? ''}` : prevSig;
          const prevOk = (e.prev ?? e.prev_sig) === expectedPrev;
          const sigOk = await verifyEntry(e, true);
          steps.push({ idx: i, prevOk, sigOk, host: e.host, cycle: e.cycle });
          if (!prevOk || !sigOk) allOk = false;
          if (!sigOk) break;
          prevSig = e.sig;
        }
        setView({ kind: 'chain', steps, allOk });
      } else {
        // Single passport/attestation — self-contained, no prev prefix.
        const ok = await verifyEntry(parsed as Record<string, any>, false);
        setView({ kind: 'passport', ok });
      }
    } finally {
      setBusy(false);
    }
  }

  async function loadSample() {
    try {
      const res = await fetch('/sov-export/ledger_head.json');
      const json = await res.json();
      setInput(JSON.stringify(json.entries ?? json, null, 2));
      setView({ kind: 'idle' });
    } catch {
      setView({ kind: 'error', msg: 'Could not load the bundled signed ledger.' });
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        Verify it yourself
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        Client-side Ed25519 over the canonical payload, checked against issuer key{' '}
        <code className="text-xs text-slate-300">{SOV_ISSUER_PUBKEY.slice(0, 12)}…</code>. No server,
        no account. Paste a flywheel ledger (JSON array) — or load the bundled signed ledger head.
      </p>

      {!hasEd25519 && (
        <div className="text-xs text-amber-400 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          This browser lacks WebCrypto Ed25519 — use a recent Chrome/Edge.
        </div>
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste signed JSON here…"
        className="w-full h-40 bg-slate-950 border border-white/10 rounded-lg p-3 font-mono text-xs text-slate-200 mb-3"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={run}
          disabled={busy || !input.trim()}
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold text-sm transition"
        >
          {busy ? 'Verifying…' : 'Verify'}
        </button>
        <button
          onClick={loadSample}
          className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 font-semibold text-sm transition"
        >
          Load signed ledger
        </button>
      </div>

      <div className="mt-4">
        {view.kind === 'error' && (
          <div className="text-sm text-red-400 flex items-center gap-2">
            <ShieldX className="w-4 h-4" /> {view.msg}
          </div>
        )}
        {view.kind === 'nocrypto' && (
          <div className="text-sm text-amber-400">
            Cannot verify — WebCrypto Ed25519 unavailable in this browser.
          </div>
        )}
        {view.kind === 'passport' &&
          (view.ok ? (
            <div className="text-sm text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Valid signature.
            </div>
          ) : (
            <div className="text-sm text-red-400 flex items-center gap-2">
              <ShieldX className="w-4 h-4" /> Signature did not verify.
            </div>
          ))}
        {view.kind === 'chain' && (
          <div className="space-y-1">
            <div
              className={`text-sm mb-2 flex items-center gap-2 ${
                view.allOk ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {view.allOk ? <ShieldCheck className="w-4 h-4" /> : <ShieldX className="w-4 h-4" />}
              {view.allOk
                ? `Verified ${view.steps.length} chained entries — signatures and links intact.`
                : 'Chain broke — see below.'}
            </div>
            {view.steps.map((s) => (
              <div
                key={s.idx}
                className={`text-xs px-3 py-2 rounded border ${
                  s.prevOk && s.sigOk
                    ? 'border-emerald-500/40 text-emerald-300'
                    : 'border-red-500/40 text-red-300'
                }`}
              >
                #{s.idx} {s.host ? `[${s.host}] ` : ''}
                {s.cycle != null ? `cycle ${s.cycle} ` : ''}· link: {s.prevOk ? '✓' : '✗'} ·
                signature: {s.sigOk ? '✓' : '✗'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}