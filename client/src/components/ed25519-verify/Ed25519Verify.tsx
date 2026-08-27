import { useEffect, useState } from "react";

/**
 * Offline Ed25519 verifier — ported from donor csoai-org-v2
 * (src/app/verify/VerifyClient.tsx) per CONSOLIDATION.md.
 *
 * Real Ed25519 verification of a CSOAI signed report ({alg, pub, sig, body}).
 * Uses WebCrypto: imports the SPKI-DER public key, verifies the signature over
 * the canonical JSON of the body. No backend call — verification is
 * client-side and independent, which is the whole point: anyone can verify
 * without trusting CSOAI's server.
 *
 * Changes from the donor:
 *  - Rethemed to the master wing (dark-emerald on #03110b).
 *  - The ?id=<report_id> auto-load fetched /api/reports/[id] — a Next API
 *    route that does not exist in the master. Removed; the ?report=<base64>
 *    hand-off (pure client-side) is kept.
 *  - Result glyphs (✓/✗) replaced with text badges (no emoji register).
 *  - This complements, not duplicates, the master's verify surfaces:
 *    /system-card verifies signed System Cards against the live backend,
 *    /gspc-verify recomputes the GSPC hash chain, /verify-certificate checks
 *    course attestation records via tRPC. This one verifies any pasted
 *    {alg,pub,sig,body} Ed25519 manifest with zero network involvement.
 */

type Manifest = { alg: string; pub: string; sig: string; body: unknown; report_id?: string };

function hexToBytes(hex: string): Uint8Array {
  const a = new Uint8Array(hex.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16);
  return a;
}
function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}
// WebCrypto wants a BufferSource whose backing buffer is a plain ArrayBuffer.
// TS can't prove our Uint8Arrays aren't SharedArrayBuffer-backed, so cast at use.
function buf(u: Uint8Array): ArrayBuffer {
  return u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
}

function canonical(o: unknown): string {
  if (o === null || typeof o !== "object") return JSON.stringify(o);
  if (Array.isArray(o)) return "[" + o.map(canonical).join(",") + "]";
  const rec = o as Record<string, unknown>;
  return (
    "{" +
    Object.keys(rec)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical(rec[k]))
      .join(",") +
    "}"
  );
}

async function verifyManifest(m: Manifest): Promise<boolean> {
  try {
    if (m.alg !== "ed25519") return false;
    const key = await crypto.subtle.importKey(
      "spki",
      buf(hexToBytes(m.pub)),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    const data = buf(new TextEncoder().encode(canonical(m.body)));
    return await crypto.subtle.verify("Ed25519", key, buf(b64ToBytes(m.sig)), data);
  } catch {
    return false;
  }
}

export default function Ed25519Verify() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<"idle" | "valid" | "invalid" | "error">("idle");
  const [parsed, setParsed] = useState<Manifest | null>(null);

  useEffect(() => {
    document.title = "Offline Ed25519 Verification — don't trust, verify | CSOAI";
  }, []);

  // Auto-load a report from ?report=<base64 JSON> (assessment hand-off).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qReport = params.get("report");
    if (qReport) {
      try {
        const decoded = JSON.parse(atob(qReport));
        setInput(JSON.stringify(decoded, null, 2));
      } catch {
        /* malformed hand-off — leave the textarea empty */
      }
    }
  }, []);

  const handleVerify = async () => {
    let m: Manifest;
    try {
      m = JSON.parse(input.trim());
    } catch {
      setResult("error");
      setParsed(null);
      return;
    }
    setParsed(m);
    setResult((await verifyManifest(m)) ? "valid" : "invalid");
  };

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-3xl px-6 pt-14 pb-16">
        <p className="text-center font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          Client-side · WebCrypto · no server involved
        </p>
        <h1 className="mt-3 mb-4 text-center text-4xl sm:text-4xl font-black tracking-tight">
          Offline{" "}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            Ed25519 Verification
          </span>
        </h1>
        <p className="mb-10 text-center text-lg text-emerald-100/75">
          Paste a CSOAI signed report (JSON). Verification runs in your browser via real Ed25519 —
          you do not have to trust our server.
        </p>

        <textarea
          className="h-56 w-full rounded-xl border border-emerald-500/25 bg-black/30 p-4 font-mono text-xs text-emerald-100/85 placeholder:text-emerald-100/30 focus:border-emerald-300 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Signed report JSON"
          placeholder='{"alg":"ed25519","pub":"...","sig":"...","body":{...}}'
        />
        <button
          onClick={handleVerify}
          className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-[#03110b] transition hover:bg-emerald-400"
        >
          Verify signature
        </button>

        {result === "valid" && (
          <div className="mt-6 rounded-xl border border-emerald-400/60 bg-emerald-500/10 p-4 text-emerald-200">
            <span className="mr-2 rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#03110b]">
              Valid
            </span>
            Chain intact — tamper-evidence verified. The signature matches the content.
            {parsed?.report_id && (
              <span className="mt-1 block text-xs text-emerald-100/60">
                report_id: {parsed.report_id}
              </span>
            )}
          </div>
        )}
        {result === "invalid" && (
          <div className="mt-6 rounded-xl border border-rose-400/60 bg-rose-500/10 p-4 text-rose-200">
            <span className="mr-2 rounded bg-rose-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
              Invalid
            </span>
            Signature does not verify. This report was altered or is not genuine.
          </div>
        )}
        {result === "error" && (
          <div className="mt-6 rounded-xl border border-amber-400/60 bg-amber-500/10 p-4 text-amber-200">
            Could not parse — paste the full signed report JSON.
          </div>
        )}

        <p className="mt-10 text-center text-sm text-emerald-100/50">
          CSOAI reports are signed with Ed25519 and carry the public key + signature. Any verifier
          can recompute the canonical form and check the signature against the key — independently,
          offline, forever.
        </p>
      </div>
    </div>
  );
}
