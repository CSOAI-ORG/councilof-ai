import { Helmet } from "react-helmet-async";

const KEYS: Array<{ kid: string; alg: string; signs: string }> = [
  { kid: "did:web:csoai.org#board-attestation-1", alg: "Ed25519", signs: "Public-root envelope (/root.json)" },
  { kid: "did:web:csoai.org#card-attestation-1", alg: "Ed25519", signs: "Measurement cards (card-v0 sig_ed25519; shape-A chain cards, Aug 2026)" },
  { kid: "did:web:csoai.org#site-release-1", alg: "Ed25519", signs: "Site release attestation" },
  { kid: "did:web:csoai.org#estate-chain-1", alg: "Ed25519", signs: "Estate chain links" },
  { kid: "did:web:csoai.org#gspc-board-22axis-2026", alg: "Ed25519 (3-party)", signs: "22-axis board configuration attestation" },
];

const GUARDS: Array<{ name: string; what: string }> = [
  { name: "Halt-on-split", what: "The publisher refuses to publish when the committed tree and the computed tree disagree." },
  { name: "Public-root watcher", what: "After every publish, three hosts' copies are byte-compared; drift turns the run red." },
  { name: "Health inventory", what: "Hourly probe of root freshness, endpoint health, witness presence; failure opens a tracked issue." },
  { name: "Corrections ledger", what: "Our own failed attestations stay visible — published, not buried (/api/corrections)." },
];

export default function CustodyDisclosure() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Custody disclosure | Council of AI</title>
        <meta
          name="description"
          content="Where the board attestation key lives, what signs what, rotation policy, and the guards that enforce this page. Axis 19 evidence, not a SOC 2 report."
        />
      </Helmet>
      <section className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-300">
          Axis 19 · custody · published policy
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Custody disclosure</h1>
        <p className="mt-4 leading-7 text-slate-300">
          Board cards are signed by the GitHub Actions publisher on Cloudflare Pages. The
          signing key does not live on a laptop, in MetaMask, or in this chat. Identity for
          the public board is{" "}
          <code className="font-mono text-emerald-200">did:web:csoai.org#board-attestation-1</code>
          . One writer law: only the publisher workflow writes the board, the root, or cards —
          every other lane, human or agent, produces unsigned artifacts and pull requests. The{" "}
          <code className="font-mono text-emerald-200">NO_LAPTOP_SIGN</code> tag exists so an
          unsigned card can never masquerade as signed.
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
          Keys rotate by DID-document update. Signatures name their key id, so historical
          artefacts stay verifiable against the key that signed them. A key id absent from{" "}
          <code className="font-mono text-emerald-200">did.json</code> after a disclosed rotation
          is retired — never silently compromised. Rotations are disclosed in the public
          corrections ledger.
        </p>

        <h2 className="mt-10 text-xl font-bold text-slate-100">What enforces this page</h2>
        <p className="mt-3 leading-7 text-slate-300">
          A custody statement nobody checks is marketing. Ours is wired to machines:
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
          <li>Signing: GHA publisher only.</li>
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
    </main>
  );
}
