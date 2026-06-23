import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security — CSOAI",
  description:
    "CSOAI LTD security disclosure: Ed25519-signed attestations, public verify URLs, no lock-in. UK Companies House 16939677.",
  alternates: { canonical: "/security" },
  openGraph: {
    title: "Security — CSOAI",
    description:
      "How CSOAI is built for security and trust: Ed25519 signatures, hash-chained ledger, and public verification.",
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CSOAI LTD",
  url: "https://csoai.org",
  sameAs: ["https://github.com/csoai-org"],
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="mb-4 text-xs font-black uppercase tracking-widest text-emerald-600">
          CSOAI · Security
        </p>
        <h1 className="mb-4 text-4xl font-black tracking-tighter text-emerald-700 sm:text-5xl">
          How CSOAI is built for security &amp; trust
        </h1>
        <p className="mb-12 text-lg text-slate-600">
          Every Watchdog Certificate we issue is cryptographically signed, publicly verifiable, and
          built to be vendor-independent. Here&apos;s exactly how.
        </p>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">1. Ed25519 signatures, not opaque seals</h2>
          <p className="mb-4 text-slate-700">
            Every Watchdog Certificate is signed with the <strong>Ed25519</strong> algorithm — a
            high-performance elliptic curve signature standardised by the IETF (RFC 8032). Each
            certificate is a JSON document with:
          </p>
          <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">ts</code> — Unix timestamp
              of issuance
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">line</code> — the canonical
              SIGIL line (immutable)
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">gloss</code> — plain-English
              interpretation
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">digest</code> — SHA-256 hash
              of the parsed line
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">prev_sig</code> — previous
              record&apos;s signature (chain)
            </li>
            <li>
              <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">signature</code> — Ed25519
              signature of (digest + prev_sig)
            </li>
          </ul>
          <p className="text-slate-700">
            You can verify any certificate yourself with{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">
              meok-attestation-api.vercel.app/verify/&#123;cert_id&#125;
            </code>{" "}
            — no login, no contact with us, no third party. The signature math is the trust.
          </p>
          <div className="mt-6 rounded-lg border-l-4 border-emerald-500 bg-emerald-50 p-4 text-emerald-800">
            <strong>Why Ed25519:</strong> NIST-recommended, ~10,000x faster than RSA-2048, no SHA-1
            dependencies, 64-byte signatures, 32-byte keys. Used by SSH, TLS 1.3, Signal, and the
            entire modern cryptography stack.
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">2. Hash-chained ledger, not a database</h2>
          <p className="mb-4 text-slate-700">
            Every certificate references the signature of the one before it. This means:
          </p>
          <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-700">
            <li>
              <strong>Tamper-evident:</strong> changing any historical record invalidates all
              subsequent signatures
            </li>
            <li>
              <strong>Auditable:</strong> anyone can recompute the chain from the public ledger
            </li>
            <li>
              <strong>Reproducible:</strong> the same input always produces the same chain
            </li>
          </ul>
          <p className="text-slate-700">
            The SOV3 substrate maintains this ledger in a tamper-evident JSONL file at{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">
              ~/clawd/sovereign-temple/data/sigil_ledger.jsonl
            </code>
            . Every CSOAI Watchdog Certificate is also a sigil, so the chain covers both.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">3. Public verify URLs, no lock-in</h2>
          <p className="mb-4 text-slate-700">
            Every Watchdog Certificate has a public verify URL of the form{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">
              meok-attestation-api.vercel.app/verify/&#123;cert_id&#125;
            </code>
            . The endpoint:
          </p>
          <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-700">
            <li>Returns the certificate JSON</li>
            <li>Verifies the Ed25519 signature cryptographically (no DB lookup needed)</li>
            <li>Returns the chain position (which record in the ledger)</li>
            <li>Is hosted on Vercel Edge (multi-region, sub-100ms response)</li>
          </ul>
          <p className="text-slate-700">
            If CSOAI disappears, your certificates still verify. The Ed25519 key is published in the
            cert itself — anyone can verify with <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">nacl</code>{" "}
            or <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">openssl</code>.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">4. UK legal entity, no off-shore ambiguity</h2>
          <p className="text-slate-700">
            CSOAI LTD is registered with UK Companies House (<strong>16939677</strong>). Director:
            Nicholas Templeman. Jurisdiction: England &amp; Wales. This is your recourse path if
            anything goes wrong.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">5. No telemetry, no tracking, no third-party cookies</h2>
          <p className="mb-4 text-slate-700">CSOAI&apos;s web properties:</p>
          <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-700">
            <li>No Google Analytics (a cookie-free, server-logged analytics is coming)</li>
            <li>No Facebook pixel, no tracking pixels, no third-party JS</li>
            <li>No data broker integrations</li>
            <li>No email open tracking (no pixels in our emails)</li>
          </ul>
          <p className="text-slate-700">
            You can verify by opening browser DevTools and inspecting the network tab. Every request
            goes to csoai.org or meok.ai directly.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold">6. Reporting a vulnerability</h2>
          <p className="text-slate-700">
            Found a security issue? Email{" "}
            <a href="mailto:security@csoai.org" className="text-emerald-700 underline">
              security@csoai.org
            </a>{" "}
            with a description. We respond within 24h and ship a fix within 72h. We do not run a paid
            bug bounty yet (sprint-priority is the Article 50 deadline) but will credit reporters in
            the public changelog.
          </p>
        </section>

        <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          © 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs ·{" "}
          <Link href="/" className="text-emerald-700 hover:underline">
            csoai.org
          </Link>{" "}
          ·{" "}
          <Link href="/trust" className="text-emerald-700 hover:underline">
            Trust
          </Link>{" "}
          ·{" "}
          <Link href="/status" className="text-emerald-700 hover:underline">
            Status
          </Link>{" "}
          ·{" "}
          <Link href="/charter" className="text-emerald-700 hover:underline">
            Charter
          </Link>
        </div>
      </div>
    </div>
  );
}
