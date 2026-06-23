import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GitHub Action",
  description:
    "Add CSOAI PR attestations to every pull request. Generate signed attestation comments, list changed files, and enforce lightweight risk gates.",
  openGraph: {
    title: "CSOAI GitHub Action",
    description: "Turn every pull request into a signed CSOAI attestation.",
    images: ["/api/og?title=CSOAI%20GitHub%20Action&desc=Turn%20every%20pull%20request%20into%20a%20signed%20CSOAI%20attestation."],
  },
  alternates: { canonical: "/github-action" },
};

const workflowYaml = `name: CSOAI PR Attestation

on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write
  id-token: write

jobs:
  attest:
    runs-on: ubuntu-latest
    name: Generate CSOAI attestation
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: CSOAI-ORG/csoai-org-v2/.github/actions/csoai-pr-attest@main
        with:
          csoai-api-token: \${{ secrets.CSOAI_API_TOKEN }}
          include-changed-files: "true"
          fail-on-blocked: "false"`;

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CSOAI PR Attestation GitHub Action",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Linux",
  offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
};

export default function GitHubActionPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Integration
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">GitHub Action</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Add a signed CSOAI attestation comment to every pull request. Track what changed, who changed it, and prove
            it with an Ed25519 signature.
          </p>
        </div>

        <div className="mb-16 grid gap-8 md:grid-cols-3">
          {[
            { title: "Signed comments", desc: "Every PR gets a cryptographic attestation with SHA-256 hash and Ed25519 signature." },
            { title: "Changed-file proof", desc: "Lists the files touched in the PR so reviewers and auditors can scope risk quickly." },
            { title: "Tenant-ready", desc: "Pass a CSOAI API token to switch from self-signed to CSOAI-tenant-signed attestations." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-bold text-emerald-400">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-16 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">.github/workflows/csoai-pr-attest.yml</span>
            <span className="text-xs text-slate-500">copy into your repo</span>
          </div>
          <pre className="overflow-x-auto p-6 text-sm leading-relaxed text-slate-300">
            <code>{workflowYaml}</code>
          </pre>
        </div>

        <div className="mb-16 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="mb-4 text-2xl font-bold">How it works</h2>
          <ol className="space-y-4">
            {[
              "The action runs on every PR open, update, or reopen.",
              "It builds a canonical JSON payload with repository, PR metadata, head/base SHAs, and changed files.",
              "It hashes the payload with SHA-256 and signs it using an ephemeral Ed25519 key (or your CSOAI tenant key).",
              "It posts a markdown comment containing the hash, signature, public key, and file list.",
              "Optional lightweight risk heuristics can warn or fail the run when sensitive filenames change.",
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-400">
                  {i + 1}
                </span>
                <span className="text-slate-300">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center sm:flex-row">
          <a
            href="https://github.com/CSOAI-ORG/csoai-org-v2/tree/main/.github/actions/csoai-pr-attest"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            View action on GitHub ↗
          </a>
          <Link
            href="/contact"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            Request tenant signing
          </Link>
        </div>
      </div>
    </div>
  );
}
