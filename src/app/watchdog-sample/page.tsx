import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sample Watchdog Certificate",
  description:
    "See a sample CSOAI Watchdog Certificate. Ed25519-signed, publicly verifiable, and aligned to EU AI Act, NIST AI RMF, and ISO 42001.",
  openGraph: {
    title: "Sample CSOAI Watchdog Certificate",
    description: "Ed25519-signed, publicly verifiable AI safety certificate.",
    images: ["/api/og?title=Sample%20Watchdog%20Certificate&desc=Ed25519-signed%2C%20publicly%20verifiable%20AI%20safety%20certificate."],
  },
  alternates: { canonical: "/watchdog-sample" },
};

const sample = {
  certId: "WDG-2026-06-21-A1B2C3",
  issuedAt: "2026-06-21T06:00:00Z",
  expiresAt: "2027-06-21T06:00:00Z",
  subject: "Acme AI Chatbot v2.4",
  operator: "Acme Technologies Ltd",
  frameworks: ["EU AI Act Article 50", "NIST AI RMF", "ISO 42001"],
  controls: ["Transparency disclosure", "Human oversight trigger", "Watermarking audit", "Risk classification"],
  signature: "ed25519:7d9f...a3e2",
  status: "Valid",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Sample Certificate", item: "https://csoai.org/watchdog-sample" },
  ],
};

export default function WatchdogSamplePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Example
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Sample Watchdog Certificate</h1>
        <p className="mb-12 text-lg text-slate-400">
          This is what a customer receives after CSOAI certifies an AI system. Every certificate is Ed25519-signed and
          can be verified publicly without trusting CSOAI.
        </p>

        <div className="mb-12 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8">
          <div className="mb-6 flex items-center justify-between border-b border-emerald-500/20 pb-4">
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-500">Certificate</div>
              <div className="text-xl font-bold text-white">{sample.certId}</div>
            </div>
            <div className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-slate-950">{sample.status}</div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-slate-500">Subject system</div>
              <div className="font-medium text-white">{sample.subject}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Operator</div>
              <div className="font-medium text-white">{sample.operator}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Issued</div>
              <div className="font-medium text-white">{sample.issuedAt}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Expires</div>
              <div className="font-medium text-white">{sample.expiresAt}</div>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Frameworks assessed</div>
            <div className="flex flex-wrap gap-2">
              {sample.frameworks.map((f) => (
                <span key={f} className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Controls passed</div>
            <ul className="space-y-1 text-sm text-slate-300">
              {sample.controls.map((c) => (
                <li key={c} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1 text-xs font-black uppercase tracking-widest text-slate-500">Signature</div>
            <code className="block rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-400 break-all">
              {sample.signature}
            </code>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-4 text-2xl font-bold">How verification works</h2>
          <ol className="list-decimal space-y-2 pl-5 text-slate-300">
            <li>Anyone with the certificate ID can fetch the signed JSON from csoai.org.</li>
            <li>The Ed25519 signature is checked against the published CSOAI public key.</li>
            <li>The audit trail, control evidence, and BFT council votes are optionally inspectable.</li>
            <li>No login or CSOAI API key is required to verify authenticity.</li>
          </ol>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/pricing" className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-emerald-600">
            Get certified →
          </Link>
          <Link href="/verify" className="rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 font-bold text-white transition hover:border-emerald-500/40">
            Verify a certificate
          </Link>
        </div>
      </div>
    </div>
  );
}
