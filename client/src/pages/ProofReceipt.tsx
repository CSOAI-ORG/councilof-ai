import { useState } from "react";
import { Helmet } from "react-helmet-async";

type ProofBody = {
  schema?: string;
  included?: boolean;
  error?: string;
  merkle_root?: string;
  sha?: string;
  reason?: string;
};

async function sha256Hex(buf: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function ProofReceipt() {
  const [text, setText] = useState("");
  const [sha, setSha] = useState("");
  const [proof, setProof] = useState<ProofBody | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function runHash(bytes: BufferSource) {
    const h = await sha256Hex(bytes);
    setSha(h);
    setProof(null);
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/proof?sha=${h}`);
      const body = (await r.json()) as ProofBody;
      setProof(body);
      if (!r.ok && !body.error) setErr(`HTTP ${r.status}`);
    } catch (e) {
      setErr((e as Error).message || "UNCHECKABLE");
    } finally {
      setBusy(false);
    }
  }

  const verdict = !proof
    ? null
    : proof.error
      ? "UNCHECKABLE"
      : proof.included === true
        ? "VALID"
        : "INVALID";

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Inclusion receipt | Council of AI</title>
        <meta
          name="description"
          content="Hash bytes locally, then GET /api/proof?sha= against the last published public root. Free. Not a grade."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Free inclusion check · GET /api/proof?sha=
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Receipt</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Bytes are hashed in this browser. Nothing is uploaded. The only question this page
          answers is whether that SHA-256 is a leaf of the last published public root. Three
          states only: VALID, INVALID, UNCHECKABLE. Never a grade, rank, or certificate.
        </p>
        <textarea
          className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono text-sm"
          rows={8}
          placeholder="Paste text to hash…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-xl bg-emerald-400 px-4 py-2.5 font-bold text-slate-950 disabled:opacity-50"
            disabled={busy || !text}
            onClick={() => runHash(new TextEncoder().encode(text))}
          >
            Hash text
          </button>
          <label className="rounded-xl border border-slate-600 px-4 py-2.5 font-semibold">
            Hash a file
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                await runHash(await f.arrayBuffer());
              }}
            />
          </label>
        </div>
        {sha ? (
          <p className="mt-6 break-all font-mono text-xs text-slate-400">sha256 {sha}</p>
        ) : null}
        {busy ? <p className="mt-4 font-mono text-sm text-slate-400">Checking inclusion…</p> : null}
        {err ? <p className="mt-4 font-mono text-sm text-rose-300">UNCHECKABLE {err}</p> : null}
        {verdict ? (
          <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/80 p-5">
            <div className="font-mono text-lg text-emerald-300">{verdict}</div>
            {proof?.reason ? <p className="mt-2 text-sm text-slate-300">{proof.reason}</p> : null}
            {proof?.error ? <p className="mt-2 text-sm text-slate-300">{proof.error}</p> : null}
            {proof?.merkle_root ? (
              <p className="mt-2 break-all font-mono text-xs text-slate-500">
                root {proof.merkle_root}
              </p>
            ) : null}
            <p className="mt-4 text-xs text-slate-500">
              Print this page. Verification of the same sha stays free at{" "}
              <code>/api/proof?sha={sha}</code>. A 402 on <code>bundle=1</code> is not this
              receipt.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
