import { useEffect, useState } from "react";
import { Link } from "wouter";
import { verifyEd25519Detached, type Ed25519Result } from "@/lib/verify";

/**
 * /packs/eu-article-50 — scoped content-marking durability evidence.
 *
 * This page attempts browser verification of each artifact's exact .body bytes
 * and detached signature against the pinned public key. Findings are displayed
 * only after supported verification succeeds; signature integrity is separate
 * from measurement truth, signer identity, freshness and legal compliance.
 */

const BASE = "/packs/eu-article-50";
const PUBKEY = "ZnF3DZUFc5QOoy+y07rvzNUyxJgza2kUQmn1nv4S9SY=";

interface Sidecar {
  alg: string;
  sig_b64: string;
  pubkey_b64: string;
  body_sha256: string;
}

interface PooledCell {
  config: string;
  check: string;
  survived: number;
  destroyed: number;
  n_measured: number;
  rate: number;
  ci_clustered?: [number, number];
  n_assets?: number;
}

async function loadAndVerify(name: string): Promise<{ sidecar: Sidecar; res: Ed25519Result; body: ArrayBuffer }> {
  const [bodyRes, sideRes] = await Promise.all([
    fetch(`${BASE}/${name}.body`),
    fetch(`${BASE}/${name}.sig.json`),
  ]);
  if (!bodyRes.ok || !sideRes.ok) {
    throw new Error(`${name}: body HTTP ${bodyRes.status}; signature HTTP ${sideRes.status}`);
  }
  const body = await bodyRes.arrayBuffer();
  const sidecar: Sidecar = await sideRes.json();
  if (
    typeof sidecar?.alg !== "string" || sidecar.alg.toLowerCase() !== "ed25519" ||
    typeof sidecar.sig_b64 !== "string" || typeof sidecar.pubkey_b64 !== "string" ||
    typeof sidecar.body_sha256 !== "string" || !/^[0-9a-f]{64}$/.test(sidecar.body_sha256)
  ) {
    throw new Error(`${name}: unsupported or malformed signature sidecar`);
  }
  // Pin verification to the PUBLISHED key shown on this page, not the sidecar's
  // self-declared key — a swapped sidecar keypair must fail, not verify green.
  const res = await verifyEd25519Detached(body, sidecar.sig_b64, sidecar.pubkey_b64, sidecar.body_sha256, PUBKEY);
  return { sidecar, res, body };
}

function VerifyBadge({ res, error }: { res: Ed25519Result | null; error?: string | null }) {
  if (error) return <span className="text-amber-400 text-sm">⚠ evidence unavailable — see error</span>;
  if (!res) return <span className="text-zinc-400 text-sm">verifying…</span>;
  if (!res.supported)
    return <span className="text-amber-400 text-sm font-medium">⚠ can't check here — verify offline</span>;
  return res.ok ? (
    <span className="text-emerald-400 text-sm font-semibold">✅ signature valid · body digest matches</span>
  ) : (
    <span className="text-red-400 text-sm font-semibold">❌ signature or integrity check failed</span>
  );
}

export default function Article50Pack() {
  const [pb, setPb] = useState<{ sidecar: Sidecar; res: Ed25519Result; body: ArrayBuffer } | null>(null);
  const [oscal, setOscal] = useState<{ sidecar: Sidecar; res: Ed25519Result } | null>(null);
  const [cells, setCells] = useState<PooledCell[]>([]);
  const [findingDataAdmitted, setFindingDataAdmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [oscalErr, setOscalErr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setFindingDataAdmitted(false);
    loadAndVerify("provbench").then((p) => {
      if (!active) return;
      setPb(p);
      if (!p.res.supported || !p.res.ok) {
        setFindingDataAdmitted(false);
        return;
      }
      // Parse/display findings only from bytes that passed the pinned-key check.
      const parsed = JSON.parse(new TextDecoder().decode(p.body));
      const rows: unknown = parsed?.pooled_by_check;
      if (!Array.isArray(rows) || !rows.every((value: unknown) => {
        if (!value || typeof value !== "object") return false;
        const c = value as PooledCell;
        return (c.config === "embedded_only" || c.config === "sidecar_oracle") &&
          typeof c.check === "string" && c.check.length > 0 &&
          Number.isInteger(c.survived) && c.survived >= 0 &&
          Number.isInteger(c.n_measured) && c.n_measured > 0 && c.survived <= c.n_measured &&
          Number.isFinite(c.rate) && c.rate >= 0 && c.rate <= 1 &&
          (c.ci_clustered === undefined || (
            Array.isArray(c.ci_clustered) && c.ci_clustered.length === 2 &&
            c.ci_clustered.every((n) => Number.isFinite(n) && n >= 0 && n <= 1) &&
            c.ci_clustered[0] <= c.ci_clustered[1]
          ));
      })) {
        throw new Error("Unsupported per-check data in the verified ProvBench artifact");
      }
      setCells(rows as PooledCell[]);
      setFindingDataAdmitted(true);
    }).catch((e) => {
      if (!active) return;
      setCells([]);
      setFindingDataAdmitted(false);
      setErr(String((e as Error).message || e));
    });
    loadAndVerify("article50_oscal").then((o) => {
      if (active) setOscal({ sidecar: o.sidecar, res: o.res });
    }).catch((e) => {
      if (active) setOscalErr(String((e as Error).message || e));
    });
    return () => { active = false; };
  }, []);

  const findingVerified = findingDataAdmitted && pb?.res.supported === true && pb.res.ok === true && !err;
  const embedded = cells.filter((c) => c.config === "embedded_only");
  const sidecarCells = cells.filter((c) => c.config === "sidecar_oracle");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-5 py-12">
        <nav className="text-sm text-zinc-500 mb-6">
          <Link href="/" className="hover:text-zinc-300">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/provbench" className="hover:text-zinc-300">ProvBench</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-300">EU Article 50 evidence pack</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight mb-3">
          EU AI Act Article 50 — content-marking durability evidence
        </h1>
        <p className="text-zinc-400 leading-relaxed mb-2">
          This pack examines specific content-marking durability checks relevant to Article 50.
          C2PA credentials are the format tested here; this pack does not establish that they are
          the exclusive means of meeting Article 50. Findings concern the recorded instrument,
          assets and transforms, not every real-world handling operation.
        </p>
        <p className="text-zinc-500 text-sm mb-8">
          This page fetches the published artifacts and attempts detached-signature verification
          <em> in your browser</em> against the pinned public key below. A successful check establishes
          integrity under that key for those bytes. It does not independently reproduce the run,
          establish signer identity or freshness, or determine legal compliance.
        </p>

        {(err || oscalErr) && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 mb-8 text-red-300 text-sm">
            {err && <p>ProvBench findings unavailable: {err}</p>}
            {oscalErr && <p>OSCAL artifact unavailable: {oscalErr}</p>}
          </div>
        )}

        {/* Verification state; no finding is asserted before successful verification */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Artifact verification</h2>
            <VerifyBadge res={pb?.res ?? null} error={err} />
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {findingVerified
              ? cells.length > 0
                ? "The verified artifact's per-check rows are shown below. Read each check and its limits separately; no aggregate survival claim is made here."
                : "The verified artifact contains no per-check rows."
              : "Findings are withheld until the artifact loads and a supported signature and body-digest check succeeds against the pinned key."}
          </p>
        </section>

        {/* Per-check table, rendered from the verified bytes */}
        {findingVerified && cells.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Survival by check — recorded values</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Counts, rates and clustered intervals are copied from the verified bytes; this page
              does not rerun the instrument. The sidecar-oracle configuration supplies the manifest
              directly, and issuer resolution depends on the test credential. Signature validity,
              asset binding and issuer resolution are separate checks. Read the artifact&apos;s
              corpus, transform and coverage caveats before generalising.
            </p>
            {[["Embedded credential", embedded], ["Detached sidecar (oracle-assisted)", sidecarCells]].map(
              ([label, rows]) => (
                <div key={label as string} className="mb-5">
                  <div className="text-sm text-zinc-400 mb-2">{label as string}</div>
                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-900 text-zinc-400">
                        <tr>
                          <th className="text-left font-medium px-3 py-2">Check</th>
                          <th className="text-right font-medium px-3 py-2">Survived</th>
                          <th className="text-right font-medium px-3 py-2">Rate</th>
                          <th className="text-right font-medium px-3 py-2">95% CI (clustered)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rows as PooledCell[]).map((c) => (
                          <tr key={c.check} className="border-t border-zinc-800/70">
                            <td className="px-3 py-2 text-zinc-300">{c.check}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {c.survived}/{c.n_measured}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {(c.rate * 100).toFixed(0)}%
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-zinc-400">
                              {c.ci_clustered
                                ? `[${(c.ci_clustered[0] * 100).toFixed(1)}, ${(c.ci_clustered[1] * 100).toFixed(1)}]%`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
            )}
          </section>
        )}

        {/* Machine-readable + signatures */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Machine-readable evidence</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <a href={`${BASE}/article50_oscal.json`} download className="text-emerald-400 hover:underline font-medium">
                  article50_oscal.json
                </a>
                <span className="text-zinc-500 ml-2">
                  OSCAL 1.1.0 assessment-results · control EU-AI-ACT-50
                </span>
              </div>
              <VerifyBadge res={oscal?.res ?? null} error={oscalErr} />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <a href={`${BASE}/provbench.json`} download className="text-emerald-400 hover:underline font-medium">
                  provbench.json
                </a>
                <span className="text-zinc-500 ml-2">measurement artifact · check signature status</span>
              </div>
              <VerifyBadge res={pb?.res ?? null} error={err} />
            </div>
          </div>
          <p className="text-zinc-500 text-xs mt-4 leading-relaxed">
            The badges check each artifact&apos;s fetched .body bytes and detached signature sidecar.
            They do not establish that a separately downloaded .json envelope matches those bytes,
            or validate its regulatory mappings. Each artifact has its own verification state.
          </p>
        </section>

        {/* Trust anchor */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">Verify it yourself</h2>
          <p className="text-zinc-400 text-sm mb-3">
            This page attempts WebCrypto Ed25519 verification. If unsupported, independently verify
            the exact artifacts and pinned key before relying on any findings. The existing offline command:
          </p>
          <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs overflow-x-auto text-zinc-300">
python3 sign.py --verify provbench.json</pre>
          <div className="mt-4 text-xs">
            <div className="text-zinc-500 mb-1">Published Ed25519 public key</div>
            <code className="text-emerald-300 break-all">{PUBKEY}</code>
          </div>
          {pb?.res && (
            <div className="mt-4 text-xs text-zinc-500">
              provbench.json body sha256 (recomputed here):{" "}
              <code className="text-zinc-400 break-all">{pb.res.sha256}</code>
            </div>
          )}
        </section>

        {/* Honest scope */}
        <section className="text-xs text-zinc-500 leading-relaxed border-t border-zinc-800 pt-6">
          <p className="mb-2">
            <strong className="text-zinc-400">Integrity scope:</strong> only a supported, successful
            badge establishes that the fetched .body bytes match the stated digest and verify under
            the pinned public key. Displayed values are read from those bytes, not independently
            remeasured or recomputed from the underlying trials.
          </p>
          <p className="mb-2">
            <strong className="text-zinc-400">Identity and freshness:</strong> this page does not
            independently bind the signing key to CSOAI&apos;s legal identity or establish that the
            record is current. A valid signature does not validate the artifact&apos;s narrative,
            credential-trust statements, or legal interpretations.
          </p>
          <p>
            CSOAI is an independent measurement body. This pack records specific content-marking
            checks, not an assessment of all Article 50 obligations or a certificate of conformity.
            It is evidence for review, not legal advice.
          </p>
        </section>
      </div>
    </div>
  );
}
