import { Helmet } from "react-helmet-async";

export default function CustodyDisclosure() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <Helmet>
        <title>Custody disclosure | Council of AI</title>
        <meta
          name="description"
          content="Where the board attestation key lives. Axis 19 evidence, not a SOC 2 report."
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
          .
        </p>
        <p className="mt-4 leading-7 text-slate-300">
          This page is a custody statement, not a SOC 2 report, not a certification, and not a
          claim that a ceremony has been independently audited. If the well-known scitt-keys
          document is missing, that fact is UNCHECKABLE here until the publisher emits it.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-slate-300">
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
