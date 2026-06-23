import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "We Built a 47-Agent AI Town You Can Walk Through — And Every Decision Is Signed",
  description:
    "CSOAI and MEOK launch a live 3D sovereign AI town: 47 autonomous agents, Byzantine-fault-tolerant governance, and cryptographically-attested verdicts you can verify yourself.",
  alternates: { canonical: "/blog/launch-47-agent-town" },
  openGraph: {
    title: "47-Agent AI Town Now Live in 3D — With Signed Governance Verdicts",
    description:
      "Walk through a town where AI agents govern themselves. Every high-stakes decision is signed, anchored, and independently verifiable.",
    type: "article",
    url: "https://csoai.org/blog/launch-47-agent-town",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: "We Built a 47-Agent AI Town You Can Walk Through — And Every Decision Is Signed",
  description:
    "CSOAI and MEOK launch a live 3D sovereign AI town: 47 autonomous agents, Byzantine-fault-tolerant governance, and cryptographically-attested verdicts.",
  datePublished: "2026-06-22",
  author: { "@type": "Organization", name: "CSOAI" },
  publisher: {
    "@type": "Organization",
    name: "CSOAI",
    logo: { "@type": "ImageObject", url: "https://csoai.org/assets/og-image.png" },
  },
  url: "https://csoai.org/blog/launch-47-agent-town",
};

export default function Launch47AgentTownPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto px-6 py-24">
        <div className="mb-8">
          <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Launch</span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mt-3 mb-4 leading-tight">
            We Built a 47-Agent AI Town You Can Walk Through — And Every Decision Is Signed
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>June 22, 2026</span>
            <span>·</span>
            <span>4 min read</span>
          </div>
        </div>

        <div className="prose prose-invert prose-lg max-w-none text-slate-300">
          <p className="lead text-xl text-white">
            Today we are opening the gates to the first live, walkable, cryptographically-attested AI governance town.
          </p>

          <p>
            Most AI governance work happens in slide decks. Ours happens in a town.{" "}
            <Link href="https://try.meok.ai/town-3d" className="text-emerald-400 hover:underline">
              try.meok.ai/town-3d
            </Link>{" "}
            is a 3D world where 47 autonomous agents live, work, trade, debate, and vote — and where every consequential decision is signed, logged, and anchored for independent verification.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">What you can see today</h2>
          <ul className="space-y-2">
            <li>
              <strong className="text-white">A 3D sovereign town</strong> with districts for governance, commerce, wellness, innovation, safety, legal, media, and residential life.
            </li>
            <li>
              <strong className="text-white">47 agents</strong> moving between buildings, each with a role, district, wallet, and social graph.
            </li>
            <li>
              <strong className="text-white">Live BFT governance</strong> in the Council: agents propose, deliberate, and vote on town policy.
            </li>
            <li>
              <strong className="text-white">Real attested verdicts</strong> from the King hive: 486 rounds, 20 attestable governed-vs-ungoverned decisions, signed and anchored.
            </li>
            <li>
              <strong className="text-white">Verify-it-yourself links</strong> so regulators, auditors, and skeptics can check the proofs without trusting us.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Why this matters for the EU AI Act</h2>
          <p>
            The EU AI Act Article 50 deadline is August 2, 2026. High-risk AI systems must demonstrate human oversight,
            risk management, traceability, and auditability. Aethelgard — the EU Finance Hive inside the town — is
            designed precisely around Articles 9–15: a council of specialist agents where no single model can act alone,
            every vote is recorded, and human overseers retain override authority.
          </p>
          <p>
            Instead of promising compliance in a PDF, we are running it in public. The town produces behavioural
            governance data that maps directly to regulatory requirements.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Honest scope labels</h2>
          <p>
            We are not pretending this is a finished product. The town is explicitly labeled{" "}
            <strong className="text-white">IN-SIMULATION</strong>. Some policy-lab results are still stubbed. Bitcoin
            timestamp anchors are pending confirmation. We show these labels because trust is built on honesty, not
            polish.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Try it now</h2>
          <p>
            <Link href="https://try.meok.ai/town-3d" className="text-emerald-400 hover:underline font-semibold">
              Enter the 3D town →
            </Link>
          </p>
          <p>
            We are also looking for 3–5 design partners — GRC consultancies, system integrators, and regulated
            enterprises — to stress-test Aethelgard ahead of the August deadline. If that is you,{" "}
            <Link href="/contact" className="text-emerald-400 hover:underline">
              get in touch
            </Link>{" "}
            or grab the{" "}
            <Link href="/partners" className="text-emerald-400 hover:underline">
              partner one-pager
            </Link>.
          </p>

          <div className="mt-12 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-white font-semibold mb-2">Want the technical architecture?</p>
            <p className="text-slate-400 text-base mb-4">
              The source for the 3D town, the policy-lab feed generator, and the sigil verification repo are all open
              on GitHub.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/CSOAI-ORG/meok-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-600 transition"
              >
                meok-ai repo
              </a>
              <a
                href="https://github.com/CSOAI-ORG/sigil-proofs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border border-emerald-500/30 text-emerald-400 font-bold text-sm hover:bg-emerald-500/10 transition"
              >
                sigil-proofs repo
              </a>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
