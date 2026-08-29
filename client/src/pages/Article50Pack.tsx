import { useEffect, useState } from "react";
import { Link } from "wouter";
import { verifyEd25519Detached, type Ed25519Result } from "@/lib/verify";

/**
 * /packs/eu-article-50 — the EU AI Act Article 50 alternative-means evidence pack.
 *
 * This page consumes the artifacts CSOAI measured and signed on a RunPod node:
 *   - provbench.json      — the C2PA transform-durability measurement
 *   - article50_oscal.json — the same finding as OSCAL 1.1.0 assessment-results
 * Both carry an Ed25519 signature. The page verifies that signature IN YOUR
 * BROWSER against the published public key — you don't have to trust us.
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
  const body = await bodyRes.arrayBuffer();
  const sidecar: Sidecar = await sideRes.json();
  // Pin verification to the PUBLISHED key shown on this page, not the sidecar's
  // self-declared key — a swapped sidecar keypair must fail, not verify green.
  const res = await verifyEd25519Detached(body, sidecar.sig_b64, sidecar.pubkey_b64, sidecar.body_sha256, PUBKEY);
  return { sidecar, res, body };
}

function VerifyBadge({ res }: { res: Ed25519Result | null }) {
  if (!res) return <span className="text-zinc-400 text-sm">verifying…</span>;
  if (!res.supported)
    return <span className="text-amber-400 text-sm font-medium">⚠ can't check here — verify offline</span>;
  return res.ok ? (
    <span className="text-emerald-400 text-sm font-semibold">✅ signature valid · unaltered</span>
  ) : (
    <span className="text-red-400 text-sm font-semibold">❌ signature INVALID</span>
  );
}

export default function Article50Pack() {
  const [pb, setPb] = useState<{ sidecar: Sidecar; res: Ed25519Result; body: ArrayBuffer } | null>(null);
  const [oscal, setOscal] = useState<{ sidecar: Sidecar; res: Ed25519Result } | null>(null);
  const [cells, setCells] = useState<PooledCell[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await loadAndVerify("provbench");
        setPb(p);
        // render the finding FROM the exact bytes we verified (what you see is what was signed)
        const parsed = JSON.parse(new TextDecoder().decode(p.body));
        setCells((parsed.pooled_by_check ?? []) as PooledCell[]);
        const o = await loadAndVerify("article50_oscal");
        setOscal({ sidecar: o.sidecar, res: o.res });
      } catch (e) {
        setErr(String((e as Error).message || e));
      }
    })();
  }, []);

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
          Article 50 requires providers of generative AI to mark AI-generated content so it is
          detectable. The endorsed technical rail is C2PA content credentials. <strong className="text-zinc-200">
          We measured whether that marking actually survives ordinary handling</strong> — re-encoding,
          resizing, cropping, screenshots, format conversion.
        </p>
        <p className="text-zinc-500 text-sm mb-8">
          The measurement and its signature were produced on an independent compute node. This page
          re-checks the signature <em>in your browser</em> against the published public key — nothing
          here depends on trusting CSOAI&apos;s server. This is the <strong>one C2PA durability
          pack</strong> we publish — a measured finding, not an Art 50 certificate, and not a
          watermark SKU. Extra watermark MCP forks are not products on this site.
        </p>

        {err && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 mb-8 text-red-300 text-sm">
            Could not load the evidence artifacts: {err}
          </div>
        )}

        {/* The headline finding */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">The finding</h2>
            <VerifyBadge res={pb?.res ?? null} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4">
              <div className="text-3xl font-bold text-red-400">0%</div>
              <div className="text-sm text-zinc-400 mt-1">
                of embedded C2PA manifests survived <em>any</em> real transform
              </div>
            </div>
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4">
              <div className="text-3xl font-bold text-amber-400">valid ≠ bound</div>
              <div className="text-sm text-zinc-400 mt-1">
                detached sidecar: signature stays valid, but binding to the image and issuer
                resolution both drop to 0%
              </div>
            </div>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Plain English: the marking Article 50 relies on mostly does not survive the things people
            do to images every day. A provider cannot assume an embedded credential proves provenance
            downstream — which is exactly what an <strong className="text-zinc-200">
            &ldquo;adequate alternative means&rdquo;</strong> gap analysis must document.
          </p>
        </section>

        {/* Per-check table, rendered from the verified bytes */}
        {cells.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Survival by check</h2>
            {[["Embedded credential", embedded], ["Detached sidecar", sidecarCells]].map(
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
              <VerifyBadge res={oscal?.res ?? null} />
            </div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <a href={`${BASE}/provbench.json`} download className="text-emerald-400 hover:underline font-medium">
                  provbench.json
                </a>
                <span className="text-zinc-500 ml-2">raw measurement · signed</span>
              </div>
              <VerifyBadge res={pb?.res ?? null} />
            </div>
          </div>
          <p className="text-zinc-500 text-xs mt-4 leading-relaxed">
            OSCAL is NIST's machine-readable compliance language (accepted in FedRAMP deliverables).
            Per FedRAMP RFC-0024, OSCAL does not itself mandate cryptographic signatures — this pack
            ships the Ed25519 signature <em>inside</em> the envelope, closing that gap.
          </p>
        </section>

        {/* Trust anchor */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">Verify it yourself</h2>
          <p className="text-zinc-400 text-sm mb-3">
            Signatures above are checked in your browser (WebCrypto Ed25519). To verify offline:
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
            <strong className="text-zinc-400">What is proven:</strong> the artifacts are unaltered and
            were signed by the holder of the published key; the survival rates are recomputed from the
            exact signed bytes.
          </p>
          <p className="mb-2">
            <strong className="text-zinc-400">What is not (yet) proven here:</strong> that the signing
            key belongs to CSOAI as a legal identity — that is a separate identity-binding step (a
            published key page and, per the roadmap, an SSL.com / C2PA conformance certificate). This
            page proves <em>integrity</em>, not attributed <em>identity</em>.
          </p>
          <p>
            CSOAI is an independent measurement body. We issue measurements and signed attestations,
            never certificates of conformity. This evidence supports an Article 50 &ldquo;adequate
            alternative means&rdquo; case; it is not legal advice.
          </p>
        </section>
      </div>
    </div>
  );
}
