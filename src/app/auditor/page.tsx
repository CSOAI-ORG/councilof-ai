import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For Auditors — CSOAI",
  description:
    "How auditors, regulators, and assurance teams can verify CSOAI Watchdog Certificates. The 5-step verification flow + cryptographic math.",
  openGraph: {
    title: "For Auditors — CSOAI",
    description:
      "Verify any Watchdog Certificate in 5 steps. Ed25519 signatures, chain integrity, and public audit endpoints.",
    images: ["/api/og?title=For%20Auditors&desc=Verify%20Watchdog%20Certificates"],
  },
  alternates: { canonical: "/auditor" },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Verify a CSOAI Watchdog Certificate",
  description:
    "A 5-step guide for auditors, regulators, and assurance teams to independently verify CSOAI Watchdog Certificates.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Hit the verify URL",
      text: "Every cert has a public URL of the form https://meok-attestation-api.vercel.app/verify/{cert_id}. The URL is idempotent — anyone can hit it, no auth, no rate limit.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Get the certificate JSON",
      text: "The response is a JSON object with the cert's full details including id, timestamp, digest, previous signature, and Ed25519 signature.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Verify the Ed25519 signature",
      text: "Use any Ed25519 library to verify the signature against the digest and previous signature included in the cert response.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Verify the chain",
      text: "Each cert references the previous cert's signature. Walk the chain from genesis using the manifest endpoint to confirm tamper-evident ordering.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Accept the cert",
      text: "Record the cert_id, timestamp, cert JSON, and chain position. The cert is your evidence — the cryptographic math is your trust.",
    },
  ],
};

const steps = [
  {
    num: "1",
    title: "Hit the verify URL",
    content: (
      <>
        <p>
          Every cert has a public URL of the form{" "}
          <code className="rounded bg-slate-800 px-1 py-0.5 text-emerald-400">
            https://meok-attestation-api.vercel.app/verify/&#123;cert_id&#125;
          </code>
          . The URL is idempotent — anyone can hit it, no auth, no rate limit.
        </p>
      </>
    ),
  },
  {
    num: "2",
    title: "Get the certificate JSON",
    content: (
      <>
        <p className="mb-4">The response is a JSON object with the cert&apos;s full details:</p>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
{`{
  "id": "MEOK-MEOKSP-7D1E008FE28",
  "ts": 1781669322.0,
  "line": "C|jeeves-cli|nicholas-templeman|DAY 17 SEAL...",
  "gloss": "Plain-English summary of the attestation",
  "digest": "909c0295afb058e9",     // SHA-256 of the parsed line
  "prev_sig": "a9dd344e8b54b2db...",  // Previous record in the chain
  "signature": "abc123def456...",     // Ed25519 sig of (digest + prev_sig)
  "alg": "ed25519"
}`}
        </pre>
      </>
    ),
  },
  {
    num: "3",
    title: "Verify the Ed25519 signature",
    content: (
      <>
        <p className="mb-4">
          Use any Ed25519 library to verify the signature. The public key is in the cert response:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
{`# Python
from nacl.signing import VerifyKey
vk = VerifyKey(bytes.fromhex(pubkey_hex))
vk.verify(
    bytes.fromhex(signature_hex),
    bytes.fromhex(digest + prev_sig)
)`}
        </pre>
        <p className="mt-4">
          If valid: the cert was issued by the holder of the private key (CSOAI). If invalid: the
          cert is fake.
        </p>
      </>
    ),
  },
  {
    num: "4",
    title: "Verify the chain (optional but recommended)",
    content: (
      <>
        <p className="mb-4">
          Each cert references the previous cert&apos;s signature. To verify the entire chain, walk from
          genesis:
        </p>
        <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
{`curl -s "https://meok-attestation-api.vercel.app/api/manifest" | jq
# Returns the full sigil ledger
# Each record: { digest, prev_sig, signature }
# Walk and verify each link`}
        </pre>
        <p className="mt-4">
          If the chain is intact: the cert was issued in the right order, no records were tampered
          with. If the chain is broken: something was edited.
        </p>
      </>
    ),
  },
  {
    num: "5",
    title: "Accept the cert",
    content: (
      <p>
        For your audit, you can record the cert_id, the timestamp, the cert JSON, and the chain
        position. The cert is your evidence — the cryptographic math is your trust.
      </p>
    ),
  },
];

const dontNeed = [
  "No contact with CSOAI (the URL is enough)",
  "No account or login",
  "No payment",
  "No DB lookup — the verify is cryptographic",
  "No third-party (the verification math is the verification)",
];

const mightWant = [
  "The full chain manifest: https://meok-attestation-api.vercel.app/api/manifest",
  "The CSOAI public key (for batch verification scripts)",
  "The sigil bus's chain integrity proof (for periodic checks)",
  "White-label verification (your own branded verify page that calls ours)",
];

const failureChecks = [
  {
    cause: "Signature fails",
    action: "the cert is fake OR the line was tampered with. Reject.",
  },
  {
    cause: "Chain is broken",
    action: "a previous cert was tampered with. This is rare but possible. The chain break point tells you which cert was edited.",
  },
  {
    cause: "Cert not found",
    action: "the cert_id is wrong. Re-check the URL.",
  },
];

export default function AuditorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-32">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            CSOAI · For Auditors
          </span>
          <h1 className="mb-4 text-4xl font-black tracking-tighter sm:text-5xl">
            5 steps to verify any Watchdog Certificate
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            If you&apos;re an auditor, regulator, or assurance team, this is your verification flow. Every
            Watchdog Certificate is cryptographically signed. You can verify in 1 click, with no
            contact with us.
          </p>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-12">
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/[0.05] p-8 text-center">
            <h2 className="mb-2 text-2xl font-black text-white">Try it now</h2>
            <p className="mb-4 text-slate-300">
              Pick any cert_id (e.g. <code className="text-emerald-400">MEOK-MEOKSP-7D1E008FE28</code>) and
              verify:
            </p>
            <div className="mb-6 break-all rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-300">
              https://meok-attestation-api.vercel.app/verify/MEOK-MEOKSP-7D1E008FE28
            </div>
            <a
              href="https://meok-attestation-api.vercel.app/verify/MEOK-MEOKSP-7D1E008FE28"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Verify Now
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-20">
          <h2 className="mb-10 text-3xl font-black tracking-tight">
            <span className="gradient-accent">The 5-step verification flow</span>
          </h2>
          <div className="space-y-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-[60px_1fr]"
              >
                <div className="text-4xl font-black text-emerald-400">{step.num}</div>
                <div>
                  <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>
                  <div className="space-y-2 text-sm leading-relaxed text-slate-400">
                    {step.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-emerald-500/[0.03] py-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="mb-6 text-2xl font-black text-white">What you don&apos;t need</h2>
                <ul className="space-y-3">
                  {dontNeed.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="text-emerald-400">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="mb-6 text-2xl font-black text-white">What you might want</h2>
                <ul className="space-y-3">
                  {mightWant.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="text-emerald-400">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-12">
              <h2 className="mb-6 text-2xl font-black text-white">When verification fails</h2>
              <p className="mb-4 text-slate-300">Three things to check:</p>
              <ol className="space-y-4">
                {failureChecks.map((check, idx) => (
                  <li key={check.cause} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                    <strong className="text-white">{idx + 1}. {check.cause}:</strong>{" "}
                    {check.action}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-12">
              <h2 className="mb-4 text-2xl font-black text-white">For tooling</h2>
              <p className="mb-4 text-slate-300">
                If you want a CLI verifier, we provide a Python script:
              </p>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
{`pip install pynacl requests
python3 -c "
import requests, json
r = requests.get('https://meok-attestation-api.vercel.app/verify/MEOK-MEOKSP-7D1E008FE28')
print(json.dumps(r.json(), indent=2))
"`}
              </pre>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-slate-500">
          © 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs ·{" "}
          <Link href="/" className="text-emerald-400 hover:underline">
            csoai.org
          </Link>{" "}
          ·{" "}
          <Link href="/security" className="text-emerald-400 hover:underline">
            Security
          </Link>{" "}
          ·{" "}
          <Link href="/trust" className="text-emerald-400 hover:underline">
            Trust
          </Link>{" "}
          ·{" "}
          <Link href="/pricing" className="text-emerald-400 hover:underline">
            /pricing
          </Link>{" "}
          · Updated 2026-06-17
        </section>
      </div>
    </>
  );
}
