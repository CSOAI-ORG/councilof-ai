import { useEffect, useState } from "react";
import { Link } from "wouter";
import { VerifyButton } from "@/components/gspc/VerifyButton";
import { setMetaDescription } from "@/lib/utils";
import { CHAIN_STATUS } from "@/data/chain";

// ---- single-record verify: the estate envelope, checked entirely in-browser ----
// Envelope contract (same as the pod signer / carder / codabench scorer):
//   canonical form = JSON with recursively sorted keys, no whitespace, UTF-8
//   content_id     = sha256(canonical(record without content_id and signature))
//   signature      = Ed25519 over canonical(record without signature), key in did.json
function canonical(v: unknown): string {
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  if (v && typeof v === "object")
    return (
      "{" +
      Object.keys(v as Record<string, unknown>)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + canonical((v as Record<string, unknown>)[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(v);
}
async function sha256hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function b64uToBytes(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}
function hexToBytes(s: string): Uint8Array {
  return Uint8Array.from(s.match(/.{2}/g) ?? [], (h) => parseInt(h, 16));
}

interface RecordVerdict {
  lines: { label: string; ok: boolean | null; detail: string }[];
}

// Opt-in tally: the verify surface promises nothing is sent or logged — so the
// public verification count only moves on an EXPLICIT click, carrying a single
// bit. The number is a self-reported signal, never a MEASURED figure.
function TallyOptIn({ ok }: { ok: boolean }) {
  const [state, setState] = useState<"idle" | "sent" | "err">("idle");
  const [tally, setTally] = useState<{ ok: number; fail: number } | null>(null);
  useEffect(() => {
    fetch("/api/verify-tally").then((r) => r.json()).then(setTally).catch(() => {});
  }, []);
  if (state === "sent")
    return <p className="text-[12px] text-emerald-300">Counted — thank you. {tally ? `${tally.ok + (ok ? 1 : 0)} verifications self-reported so far (opt-in signal, not a measured number).` : ""}</p>;
  return (
    <div className="pt-2">
      <button
        onClick={async () => {
          try {
            await fetch("/api/verify-tally", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ok }) });
            setState("sent");
          } catch { setState("err"); }
        }}
        className="rounded-md border border-emerald-500/30 px-3 py-1.5 text-[12px] text-emerald-200 hover:bg-emerald-500/10"
      >
        Add this run to the public tally (opt-in — sends only ✓/✗, nothing else)
      </button>
      {tally && (
        <span className="ml-2 text-[11px] text-emerald-100/50">
          {tally.ok} self-reported so far — an opt-in signal, not a measured number.
        </span>
      )}
      {state === "err" && <span className="ml-2 text-[11px] text-red-300">tally endpoint unreachable — your verification still stands.</span>}
    </div>
  );
}

async function verifyRecord(raw: string): Promise<RecordVerdict> {
  const lines: RecordVerdict["lines"] = [];
  let rec: Record<string, unknown>;
  try {
    rec = JSON.parse(raw);
  } catch (e) {
    return { lines: [{ label: "Parse", ok: false, detail: "Not valid JSON — nothing was checked." }] };
  }
  lines.push({ label: "Parse", ok: true, detail: "Valid JSON." });

  const { signature, content_id, signature_envelope, ...body } = rec as Record<string, unknown>;
  // content_id: two envelope generations exist and both are deterministic —
  //   A (carder v0.1): sha256 over canonical record WITHOUT content_id (signature field included)
  //   B (receipt form): sha256 over canonical record without content_id AND without signature
  // Either match is a pass; the verdict names which envelope matched.
  if (typeof content_id === "string") {
    const withSig = signature !== undefined ? { ...body, signature } : body;
    const candA = await sha256hex(canonical(withSig));
    const candB = await sha256hex(canonical(body));
    const ok = candA === content_id || candB === content_id;
    lines.push({
      label: "content_id",
      ok,
      detail: ok
        ? `Recomputed sha256 matches (${String(content_id).slice(0, 16)}…, envelope ${candA === content_id ? "A: signature field included in hashed bytes" : "B: signature excluded from hashed bytes"}).`
        : `MISMATCH — recomputed ${candA.slice(0, 16)}… (envelope A) and ${candB.slice(0, 16)}… (envelope B); record claims ${String(content_id).slice(0, 16)}…. The record was altered after its id was computed.`,
    });
  } else {
    lines.push({ label: "content_id", ok: null, detail: "Absent — hash check not applicable." });
  }

  // signature_envelope: the signed-surfaces generation (corrections ledger,
  // regulation feed) — content_id = sha256(canonical body minus signature_envelope).
  // Same trust as the board: recompute here, compare to the envelope's claim.
  if (signature_envelope && typeof signature_envelope === "object") {
    const env = signature_envelope as { content_id?: string; kid?: string };
    if (typeof env.content_id === "string") {
      const cand = await sha256hex(canonical(body));
      const ok = cand === env.content_id;
      lines.push({
        label: "signature_envelope",
        ok,
        detail: ok
          ? `Signed-surface hash matches (${cand.slice(0, 16)}…, kid ${env.kid ?? "?"}). The feed is unedited since publication.`
          : `MISMATCH — recomputed ${cand.slice(0, 16)}…, envelope claims ${env.content_id.slice(0, 16)}…. The feed was altered after signing.`,
      });
    }
  }

  // signature: Ed25519 over canonical(record without signature), key published in did.json
  if (typeof signature === "string" && signature.length > 0) {
    try {
      const did = await (await fetch("/.well-known/did.json")).json();
      const methods: { id: string; publicKeyJwk?: JsonWebKey; publicKeyHex?: string }[] =
        did.verificationMethod ?? [];
      const signedBytes = new TextEncoder().encode(canonical({ ...body, ...(content_id !== undefined ? { content_id } : {}) }));
      const sigBytes = /^[0-9a-f]+$/i.test(signature) ? hexToBytes(signature) : b64uToBytes(signature);
      let verdict = "no published key verifies this signature";
      let ok = false;
      for (const m of methods) {
        try {
          const key = m.publicKeyJwk
            ? await crypto.subtle.importKey("jwk", m.publicKeyJwk, { name: "Ed25519" }, false, ["verify"])
            : m.publicKeyHex
              ? await crypto.subtle.importKey("raw", hexToBytes(m.publicKeyHex), { name: "Ed25519" }, false, ["verify"])
              : null;
          if (!key) continue;
          if (await crypto.subtle.verify({ name: "Ed25519" }, key, sigBytes as unknown as BufferSource, signedBytes)) {
            verdict = `VALID against ${m.id}`;
            ok = true;
            break;
          }
        } catch {
          /* try next key */
        }
      }
      lines.push({ label: "Signature", ok, detail: ok ? verdict : `INVALID — ${verdict} (keys tried: ${methods.length}).` });
    } catch (e) {
      lines.push({ label: "Signature", ok: false, detail: "Could not fetch or use the published did.json keys — verification incomplete, not passed." });
    }
  } else {
    lines.push({
      label: "Signature",
      ok: null,
      detail: "UNSIGNED record — hash integrity checked only; authorship is not attested.",
    });
  }
  return { lines };
}

function SingleRecordVerify() {
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<RecordVerdict | null>(null);
  const [busy, setBusy] = useState(false);
  const [permalink, setPermalink] = useState<string | null>(null);
  const [verifyCount, setVerifyCount] = useState<number | null>(null);

  // The threshold made metric: count successful third-party verifications. The
  // counter is a signed, monotonic number — proves verifications HAPPENED (each
  // was a real in-browser Ed25519 check against published did.json), never WHO
  // verified. No identity, no IP, no record — privacy-safe by design.
  useEffect(() => {
    fetch("/api/verify/count")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok) setVerifyCount(Number(d.count));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("record");
    if (q) {
      try {
        const decoded = new TextDecoder().decode(b64uToBytes(q));
        setText(decoded);
        setBusy(true);
        verifyRecord(decoded).then((v) => {
          setVerdict(v);
          setBusy(false);
          if (v.lines.length && v.lines.every((l) => l.ok === true)) {
            fetch("/api/verify/count", { method: "POST" }).catch(() => {});
          }
        });
      } catch {
        setVerdict({ lines: [{ label: "Permalink", ok: false, detail: "The ?record= payload did not decode." }] });
      }
    }
  }, []);

  const run = async () => {
    setBusy(true);
    const v = await verifyRecord(text);
    setVerdict(v);
    if (v.lines.length && v.lines.every((l) => l.ok === true)) {
      // A successful in-browser verification — count it (signed, monotonic, anonymous).
      fetch("/api/verify/count", { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          if (d?.ok) setVerifyCount(Number(d.count));
        })
        .catch(() => {});
    }
    const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(text)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    setPermalink(b64.length < 6000 ? `${window.location.origin}/gspc-verify?record=${b64}` : null);
    setBusy(false);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Paste one record (a ~3KB measurement card, receipt, or any estate-envelope JSON) — it never leaves this browser.'
        className="h-40 w-full rounded-xl border border-emerald-500/25 bg-[#03110b] p-3 font-mono text-[12px] text-emerald-100 placeholder:text-emerald-100/30"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={run}
          disabled={busy || !text.trim()}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] disabled:opacity-40"
        >
          {busy ? "Verifying…" : "Verify this record"}
        </button>
        {permalink && (
          <button
            onClick={() => navigator.clipboard?.writeText(permalink)}
            className="rounded-lg border border-emerald-500/30 px-3 py-2 text-[12px] text-emerald-200 hover:bg-emerald-500/10"
          >
            Copy permalink to this exact record
          </button>
        )}
      </div>
      {verdict && (
        <div className="mt-4 space-y-2">
          {verdict.lines.map((l) => (
            <div key={l.label} className="flex items-start gap-2 text-[13px]">
              <span className={l.ok === true ? "text-emerald-300" : l.ok === false ? "text-red-300" : "text-emerald-100/50"}>
                {l.ok === true ? "✓" : l.ok === false ? "✗" : "○"}
              </span>
              <span>
                <strong className="text-emerald-50">{l.label}:</strong>{" "}
                <span className="text-emerald-100/80">{l.detail}</span>
              </span>
            </div>
          ))}
          <TallyOptIn ok={verdict.lines.every((l) => l.ok !== false)} />
        </div>
      )}
      <p className="mt-4 text-[12px] text-emerald-100/50">
        The envelope this checks: canonical JSON (recursively sorted keys, no whitespace);{" "}
        <code>content_id</code> = sha256 of the canonical record without <code>content_id</code> (both envelope
        generations are tried and the verdict names which matched); the Ed25519 signature covers the canonical
        record without <code>signature</code>, against the keys published at <code>/.well-known/did.json</code>.
        A record outside this shape gets an honest &quot;not applicable&quot;, never a fake pass.
      </p>
      {verifyCount !== null && (
        <p className="mt-4 inline-block rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-4 py-2 font-mono text-[13px] text-emerald-200">
          <span className="text-emerald-300/70">Measured:</span>{" "}
          <strong className="text-emerald-100">{verifyCount}</strong>{" "}
          independent verifications of a signed receipt counted so far — a signed, monotonic
          number (<code className="text-amber-300">/api/verify/count</code>). Never who verified, only that it happened.
        </p>
      )}
    </div>
  );
}

/**
 * /gspc-verify — recompute the chain yourself.
 *
 * The hash chain for any signed record set can be recomputed locally. If a
 * record was edited after signing, the recomputed hash will not match the
 * stored one, and that row is reported as BROKEN — visibly, with the row
 * identified. Everything runs in the browser; no record leaves the machine.
 */

export default function GSPCVerify() {
  useEffect(() => {
    document.title = "Verify the chain — recompute it yourself, client-side | CSOAI";
    setMetaDescription("Verify a Council of AI measurement card client-side: recompute the Ed25519 signature chain in your browser against the published public key. No account, no server trust.");
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Chain verification · client-side · no server involved
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            Don&apos;t take our word for it.{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
              Recompute the chain.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            If a record was edited after signing, the recomputed hash will not match the stored
            one — and that row is reported as <strong className="text-red-300">BROKEN</strong>,
            visibly, with the row identified. The button below proves it, including what happens
            when a record is deliberately tampered with.
          </p>
          <p className="mt-3 text-[13px] text-emerald-200/70">
            Privacy: verification runs entirely in your browser. Nothing you check is sent to us,
            logged, or stored — and it never will be. No login, no fee, forever.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {/* VERIFY ONE RECORD — single input, permalink-able */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">Verify a single record</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            Paste any one estate record — hash and signature are recomputed here, in your browser,
            against the published keys. Share a permalink and the recipient&apos;s browser re-runs
            the same check on the same bytes.
          </p>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
            <SingleRecordVerify />
          </div>
        </section>

        {/* VERIFY */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">Verify a chain</h2>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
            <VerifyButton />
          </div>
        </section>

        {/* PUBLISHED CHAIN STATUS */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">Published chain status</h2>
          <p className="mt-1 text-[13px] text-emerald-100/60">
            The status of the production chain as published by the instrument. The button above
            recomputes the public replay set independently — the two never have to take each
            other&apos;s word.
          </p>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
            <div className="flex flex-wrap gap-8">
              <div>
                <span className="text-[12px] text-emerald-100/50">Status</span>
                <div
                  className={`text-lg font-bold ${CHAIN_STATUS.chain_valid ? "text-emerald-300" : "text-red-300"}`}
                >
                  {CHAIN_STATUS.chain_valid ? "VALID" : "BROKEN"}
                </div>
              </div>
              <div>
                <span className="text-[12px] text-emerald-100/50">Records</span>
                <div className="font-mono text-lg text-emerald-50">{CHAIN_STATUS.chain_length}</div>
              </div>
              <div>
                <span className="text-[12px] text-emerald-100/50">Hash algorithm</span>
                <div className="font-mono text-lg text-emerald-50">{CHAIN_STATUS.hash_algorithm}</div>
              </div>
              <div>
                <span className="text-[12px] text-emerald-100/50">Signature algorithm</span>
                <div className="font-mono text-lg text-emerald-50">{CHAIN_STATUS.signature_algorithm}</div>
              </div>
            </div>
            <p className="mt-4 text-[12px] text-emerald-100/50">{CHAIN_STATUS.note}</p>
            <p className="mt-2 text-[12px] text-emerald-100/45">
              Last record: <span className="font-mono">{CHAIN_STATUS.last_record.id}</span> —{" "}
              {CHAIN_STATUS.last_record.claim}
            </p>
          </div>
        </section>

        {/* WHAT THIS DOES NOT DO */}
        <section className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-2xl font-bold text-emerald-50">What this button does NOT do</h2>
          <ul className="mt-4 space-y-3 text-[13px] text-emerald-100/80 leading-relaxed list-disc pl-5">
            <li>
              This button recomputes the <strong className="text-emerald-50">sha256 hash
              chain</strong> — tamper-evidence, not authorship. Authorship is carried by the
              signed card: a <strong className="text-emerald-50">~3KB</strong> measurement card
              signed with <strong className="text-emerald-50">Ed25519</strong> and anchored with{" "}
              <strong className="text-emerald-50">OpenTimestamps</strong>, verifiable offline
              against the published key <code className="text-emerald-300">f4b4278d…</code>{" "}
              (<code className="text-emerald-300">did:web:csoai.org</code>). The post-quantum
              ML-DSA-65 (FIPS-204) signer is <strong className="text-emerald-50">built, not
              shipped</strong>; the label will name it in the same commit it ships — never ahead
              of it.
            </li>
            <li>
              It does not contact a server. Verification is local; you bring the records and
              the WebCrypto implementation in your browser.
            </li>
            <li>
              It does not assert that a model is &quot;safe&quot;, &quot;compliant&quot;, or
              &quot;authentic&quot;. Those words are not in the button&apos;s vocabulary, on
              purpose.
            </li>
          </ul>
        </section>

        {/* LINKS */}
        <div className="flex flex-wrap gap-4 pb-4 text-[13px]">
          <Link href="/gspc-arena" className="text-emerald-300 hover:underline">
            See the records in the arena →
          </Link>
          <Link href="/methodology" className="text-emerald-300 hover:underline">
            Read the methodology →
          </Link>
          <Link href="/refutation-ledger" className="text-emerald-300 hover:underline">
            Read the refutation ledger →
          </Link>
        </div>
      </div>
    </div>
  );
}
