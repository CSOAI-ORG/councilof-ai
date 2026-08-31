import { useEffect, useMemo, useState } from "react";

/**
 * Unsigned public-root catalogue (NO_LAPTOP_SIGN).
 * Loads GET /root.json. Inclusion is membership in card_sha256[].
 * Does not verify Ed25519 on leaves — sig_ed25519 is null.
 */

type RootDoc = {
  kind?: string;
  as_of?: string;
  card_count?: number;
  merkle_root?: string;
  card_sha256?: string[];
  xrpl_fi_assetCount?: number;
  did_intended?: string;
  note?: string;
};

function normHex(s: string): string {
  return s.trim().toLowerCase().replace(/^0x/, "");
}

export default function PublicRootCatalogue({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const [root, setRoot] = useState<RootDoc | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [needle, setNeedle] = useState("");

  useEffect(() => {
    const ac = new AbortController();
    fetch("/root.json", { signal: ac.signal, headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`GET /root.json HTTP ${r.status}`))))
      .then(setRoot)
      .catch((e) => setErr(String(e?.message || e)));
    return () => ac.abort();
  }, []);

  const hashes = useMemo(
    () => (Array.isArray(root?.card_sha256) ? root!.card_sha256!.map(normHex) : []),
    [root],
  );
  const q = normHex(needle);
  const included = q.length === 64 && hashes.includes(q);
  const checked = q.length === 64;

  const box =
    variant === "dark"
      ? "rounded-2xl border border-amber-400/30 bg-amber-500/5 p-6"
      : "rounded-2xl border border-amber-300 bg-amber-50 p-6";
  const muted = variant === "dark" ? "text-emerald-100/70" : "text-slate-600";
  const mono = variant === "dark" ? "text-amber-200" : "text-amber-800";

  return (
    <div className={box} data-testid="public-root-catalogue">
      <p className={`text-xs font-bold uppercase tracking-wide ${mono}`}>
        Unsigned catalogue · NO_LAPTOP_SIGN
      </p>
      <p className={`mt-2 text-sm ${muted}`}>
        Load GET <a className="underline" href="/root.json">/root.json</a>. Leaves are not
        laptop-signed: <code>sig_ed25519</code> is null. Inclusion is membership in{" "}
        <code>card_sha256[]</code>. This is not a signed-card verify. Do not fake Ed25519.
        Intended DID fragment: <code>did:web:csoai.org#board-attestation-1</code>.{" "}
        <code>/api/xrpl</code> is 404 until it would serve the same 16 as this root.
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
            <dt className="uppercase tracking-wide opacity-70">unsigned-leaf</dt>
            <dd>NO_LAPTOP_SIGN</dd>
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
            ? "INCLUDED — hash is in this unsigned catalogue. Not a signature check."
            : "NOT IN THIS ROOT — hash is not in card_sha256[]. Still not a signature check."}
        </p>
      )}
      {q && q.length !== 64 && (
        <p className="mt-2 text-xs text-amber-200/80">Need a 64-character hex digest.</p>
      )}
    </div>
  );
}
