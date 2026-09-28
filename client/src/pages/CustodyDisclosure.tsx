import { Helmet } from "react-helmet-async";

const KEYS: Array<{ kid: string; alg: string; signs: string }> = [
  { kid: "did:web:csoai.org#board-attestation-1", alg: "Ed25519", signs: "Public-root envelope (/root.json)" },
  { kid: "did:web:csoai.org#card-attestation-1", alg: "Ed25519", signs: "Measurement cards (card-v0 sig_ed25519; shape-A chain cards, Aug 2026)" },
  { kid: "did:web:csoai.org#site-release-1", alg: "Ed25519", signs: "Site release attestation" },
  { kid: "did:web:csoai.org#estate-chain-1", alg: "Ed25519", signs: "Estate chain links" },
  { kid: "did:web:csoai.org#gspc-board-22axis-2026", alg: "Ed25519 (3-party)", signs: "Historical 22-axis board configuration attestation; not the current board count" },
];

const GUARDS: Array<{ name: string; what: string }> = [
  { name: "Release gate", what: "The publisher checks the source tree, built output and root witness before uploading." },
  { name: "Served-byte readback", what: "The release is checked against the public site after upload; a deploy log alone is not proof of what a reader receives." },
  { name: "Corrections ledger", what: "Our own failed attestations stay visible — published, not buried (/api/corrections)." },
];

export default function CustodyDisclosure() {
  return (
    <section className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Custody disclosure | Council of AI</title>
        <meta
          name="description"
          content="Which public keys sign which CSOAI artifacts, how to verify each signature, and the limits of the publication checks. Not a SOC 2 report."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Custody · public-key and release disclosure
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Custody disclosure</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Cloudflare Pages serves the public board and evidence. Publication is separate from
          signing: each artifact must carry a verifiable signature over its own bytes and name
          the public key that verifies it. The board snapshot uses{" "}
          <code className="font-mono text-emerald-200">did:web:csoai.org#board-attestation-1</code>;
          issued measurement cards can use a different key. Some supporting fact runs are
          content-addressed but unsigned, and must be described as such. The historical
          22-axis key below identifies a frozen configuration, not today's board count.
          Check the current count at{" "}
          <a className="text-emerald-300 underline" href="/api/gspc">/api/gspc</a>.
        </p>

        <h2 className="mt-10 text-xl font-bold text-slate-100">Public key disclosure</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-4">Key id</th>
                <th className="py-2 pr-4">Algorithm</th>
                <th className="py-2">Signs</th>
              </tr>
            </thead>
            <tbody>
              {KEYS.map((k) => (
                <tr key={k.kid} className="border-b border-slate-800 align-top">
                  <td className="py-2 pr-4 font-mono text-emerald-200">{k.kid}</td>
                  <td className="py-2 pr-4 text-slate-300">{k.alg}</td>
                  <td className="py-2 text-slate-300">{k.signs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-400">
          Full public key material (JWK):{" "}
          <a className="text-emerald-300 underline" href="/.well-known/did.json">/.well-known/did.json</a>
          {" "}· key-discovery document:{" "}
          <a className="text-emerald-300 underline" href="/.well-known/scitt-keys">/.well-known/scitt-keys</a>
          {" "}(<code className="font-mono">we_operate_a_ts: false</code> — discovery only, never a
          transparency-service claim).
        </p>

        <h2 className="mt-10 text-xl font-bold text-slate-100">Rotation &amp; retirement</h2>
        <p className="mt-3 leading-7 text-slate-300">
          A signature names the key used at issuance. Verifying an older artifact still
          requires the corresponding historical public key and the exact signed bytes. If
          that key or those bytes cannot be retrieved, report the result as uncheckable;
          do not infer validity from today's DID document. Check the corrections ledger
          for any disclosed key or evidence changes.
        </p>

        <h2 className="mt-10 text-xl font-bold text-slate-100">What enforces this page</h2>
        <p className="mt-3 leading-7 text-slate-300">
          The release checks below concern publication integrity. They do not prove that
          every supporting run is signed or Bitcoin anchored:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
          {GUARDS.map((g) => (
            <li key={g.name}>
              <strong className="text-slate-100">{g.name}.</strong> {g.what}
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-bold text-slate-100">What we do not hold</h2>
        <p className="mt-3 leading-7 text-slate-300">
          This page is a custody statement, not a SOC 2 report, not a certification, and not a
          claim that a ceremony has been independently audited. No HSM claim either. If those
          ever change, this section changes — with a dated entry in the corrections ledger, not
          a quiet edit.
        </p>

        <ul className="mt-8 list-disc space-y-2 pl-5 text-sm text-slate-300">
          <li>Verify the signature and key named by each artifact; publication alone is not a signature.</li>
          <li>No board writes from MCP. MCP stays read-only.</li>
          <li>
            Verify a card at{" "}
            <a className="text-emerald-300 underline" href="/gspc-verify">
              /gspc-verify
            </a>
            .
          </li>
        </ul>
      </section>
    </section>
  );
}
