import { useEffect, useMemo, useState } from "react";

/**
 * Public-root catalogue (GET /root.json) + GET /api/xrpl reader.
 * Sig counts are COMPUTED from the live /api/xrpl payload on every load — never
 * typed. (This file used to hard-code "14/16 GH-secret sigs; EURQ/USDQ unsigned"
 * and the live reader moved under it. Bytes adjudicate; typed tallies rot.)
 * Inclusion is membership in card_sha256[]. Paste-hash also hits live GET /api/proof?sha=.
 * DEVNET historical. Do not restamp. Do not mix represented TVL. Do not add /api/swift.
 */

type RootDoc = {
  kind?: string;
  as_of?: string;
  card_count?: number;
  merkle_root?: string;
  card_sha256?: string[];
  xrpl_fi_assetCount?: number;
  xrpl_asset_count_attempted?: number;
  did_intended?: string;
  note?: string;
};

type XrplReader = {
  kind?: string;
  writes_board?: boolean;
  n?: number;
  status?: number;
  /** Leaves with a non-null sig_ed25519, computed from the payload this load. */
  signed?: number;
  /** Symbols whose sig_ed25519 is null this load (NO_LAPTOP_SIGN gaps). */
  unsignedSymbols?: string[];
};

type ProofDoc = {
  schema?: string;
  kind?: string;
  error?: string;
  sha256?: string;
  index?: number;
  merkle_root?: string;
  as_of?: string;
  proof?: string[];
  reason?: string;
  unmeasured?: string[];
};

function normHex(s: string): string {
  return s.trim().toLowerCase().replace(/^0x/, "");
}

export default function PublicRootCatalogue({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [root, setRoot] = useState<RootDoc | null>(null);
  const [xrpl, setXrpl] = useState<XrplReader | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [needle, setNeedle] = useState("");
  const [proofHttp, setProofHttp] = useState<number | null>(null);
  const [proof, setProof] = useState<ProofDoc | null>(null);
  const [proofErr, setProofErr] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/root.json", { signal: ac.signal, headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`GET /root.json HTTP ${r.status}`))))
      .then(setRoot)
      .catch((e) => setErr(String(e?.message || e)));
    fetch("/api/xrpl", { signal: ac.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        const body = r.ok ? await r.json().catch(() => ({})) : {};
        const assets: { symbol?: string; sig_ed25519?: string | null }[] = Array.isArray(body.assets)
          ? body.assets
          : [];
        setXrpl({
          status: r.status,
          kind: body.kind,
          writes_board: body.writes_board,
          n: body.n,
          signed: assets.filter((a) => a.sig_ed25519 != null).length,
          unsignedSymbols: assets.filter((a) => a.sig_ed25519 == null).map((a) => a.symbol || "?"),
        });
      })
      .catch(() => setXrpl({ status: 0 }));
    return () => ac.abort();
  }, []);

  const hashes = useMemo(
    () => (Array.isArray(root?.card_sha256) ? root!.card_sha256!.map(normHex) : []),
    [root],
  );
  const q = normHex(needle);
  const included = q.length === 64 && hashes.includes(q);
  const checked = q.length === 64;

  useEffect(() => {
    if (q.length !== 64) {
      setProof(null);
      setProofHttp(null);
      setProofErr(null);
      return;
    }
    const ac = new AbortController();
    setProofErr(null);
    fetch(`/api/proof?sha=${encodeURIComponent(q)}`, {
      signal: ac.signal,
      headers: { accept: "application/json" },
    })
      .then(async (r) => {
        const body = (await r.json().catch(() => ({}))) as ProofDoc;
        setProofHttp(r.status);
        setProof(body);
      })
      .catch((e) => setProofErr(String(e?.message || e)));
    return () => ac.abort();
  }, [q]);

  // The sig tally, computed from the live reader on THIS load — never typed.
  // While the fetch is in flight the tally says loading; a failed fetch says
  // UNCHECKABLE, never a remembered number.
  const xrplLive = xrpl?.status === 200 && typeof xrpl.n === "number" && typeof xrpl.signed === "number";
  const unsignedNames = xrpl?.unsignedSymbols ?? [];
  const sigLine = xrplLive
    ? `${xrpl!.signed}/${xrpl!.n} leaves carry sig_ed25519${unsignedNames.length > 0 ? `; ${unsignedNames.join("/")} unsigned` : ""}`
    : xrpl == null
      ? "sig tally loading — no number shown until the reader answers"
      : `sig tally UNCHECKABLE this load (GET /api/xrpl ${xrpl.status ? `HTTP ${xrpl.status}` : "unreachable"})`;

  const box =
    variant === "dark"
      ? "rounded-2xl border border-amber-400/30 bg-amber-500/5 p-6"
      : "rounded-2xl border border-amber-300 bg-amber-50 p-6";
  const muted = variant === "dark" ? "text-emerald-100/70" : "text-slate-600";
  const mono = variant === "dark" ? "text-amber-200" : "text-amber-800";

  return (
    <div className={box} data-testid="public-root-catalogue">
      <p className={`text-xs font-bold uppercase tracking-wide ${mono}`}>
        Public-root catalogue · live sig tally
      </p>
      <p className={`mt-2 text-sm ${muted}`}>
        Load GET <a className="underline" href="/root.json">/root.json</a>. GET{" "}
        <code>/api/xrpl</code>: <strong>{sigLine}</strong>
        {xrplLive && unsignedNames.length > 0 && (
          <> (<code>sig_ed25519</code> null, NO_LAPTOP_SIGN)</>
        )}
        . The tally is computed from the reader on this load — do not say all leaves unsigned, and
        do not quote a remembered count.
        Inclusion is membership in <code>card_sha256[]</code> plus live GET <code>/api/proof?sha=</code>{" "}
        (kind=inclusion). This is not a signed-card verify of the two unsigned leaves. Do not fake
        Ed25519. DEVNET historical. Not a second scoreboard. Intended DID fragment:{" "}
        <code>did:web:csoai.org#board-attestation-1</code>.{" "}
        <code>/api/xrpl</code> is a reader of this root
        {xrpl?.status === 200 && xrpl.kind === "reader"
          ? ` (live, n=${xrpl.n ?? "—"}, writes_board=${String(xrpl.writes_board)})`
          : xrpl?.status != null
            ? ` (HTTP ${xrpl.status} this load)`
            : ""}
        . Not a GSPC mill. The writer of this root is <strong>councilof.ai/root.json</strong>;
        the csoai.org twin can lag behind it and is STALE whenever the bytes differ (issue #1010
        tracks the twin) — verify against this host. Hugging Face mirror:{" "}
        <a className="underline" href="https://huggingface.co/datasets/csoai/gspc-boards">
          csoai/gspc-boards
        </a>{" "}
        <code>public-root/root.json</code>.
      </p>
      {err && <p className="mt-3 text-sm text-red-400">Root fetch failed: {err}</p>}
      {root && (
        <dl className={`mt-4 grid gap-2 sm:grid-cols-2 font-mono text-[12px] ${mono}`}>
          <div>
            <dt className="uppercase tracking-wide opacity-70">as_of</dt>
            <dd>{root.as_of || "—"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide opacity-70">card_count</dt>
            <dd>{root.card_count ?? hashes.length}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="uppercase tracking-wide opacity-70">merkle_root</dt>
            <dd className="break-all">{root.merkle_root || "—"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide opacity-70">did_intended</dt>
            <dd className="break-all">{root.did_intended || "did:web:csoai.org#board-attestation-1"}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide opacity-70">/api/xrpl sigs</dt>
            <dd>{sigLine}</dd>
          </div>
        </dl>
      )}
      <label className={`mt-5 block text-sm font-semibold ${muted}`} htmlFor="root-hash-needle">
        Check inclusion (sha256 hex)
      </label>
      <input
        id="root-hash-needle"
        className="mt-1 w-full rounded-lg border border-amber-400/30 bg-black/20 px-3 py-2 font-mono text-sm"
        placeholder="paste a 64-char sha256 from a card-v0 leaf"
        value={needle}
        onChange={(e) => setNeedle(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      {checked && (
        <p className={`mt-2 text-sm font-semibold ${included ? "text-emerald-300" : "text-amber-300"}`}>
          {included
            ? `INCLUDED in card_sha256[] — catalogue membership. Not a signature check. ${unsignedNames.length > 0 ? `${unsignedNames.join("/")} stay unsigned (NO_LAPTOP_SIGN).` : ""}`
            : `NOT IN THIS ROOT — hash is not in card_sha256[]. Still not a signature check.${unsignedNames.length > 0 ? ` ${unsignedNames.join("/")} stay unsigned.` : ""}`}
        </p>
      )}
      {checked && proofErr && (
        <p className="mt-2 text-sm text-red-400">GET /api/proof failed: {proofErr}. Inclusion UNCHECKABLE this load.</p>
      )}
      {checked && proofHttp != null && (
        <p className={`mt-2 text-sm font-semibold ${proofHttp === 200 && proof?.kind === "inclusion" ? "text-emerald-300" : "text-amber-300"}`}>
          {proofHttp === 200 && proof?.kind === "inclusion"
            ? `LIVE INCLUSION HTTP 200 — GET /api/proof?sha= kind=inclusion index=${proof.index ?? "—"}. merkle_root=${(proof.merkle_root || "").slice(0, 16) || "—"}… /api/xrpl this load: ${sigLine}. Not a score. Not a second scoreboard.`
            : proofHttp === 404
              ? `NOT A LEAF of the last published root (GET /api/proof HTTP 404).${unsignedNames.length > 0 ? ` ${unsignedNames.join("/")} stay unsigned.` : ""} Not a score.`
              : `GET /api/proof HTTP ${proofHttp}. Inclusion UNCHECKABLE this load.`}
        </p>
      )}
      {q && q.length !== 64 && (
        <p className="mt-2 text-xs text-amber-200/80">Need a 64-character hex digest.</p>
      )}
    </div>
  );
}
