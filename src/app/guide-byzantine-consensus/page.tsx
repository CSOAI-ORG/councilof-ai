import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Byzantine Consensus Guide — CSOAI",
  description:
    "How to run an agent governance council with BFT-style voting. Honest supermajority, quorum rules, and what 5 voters can and cannot tolerate.",
  alternates: { canonical: "/guide-byzantine-consensus" },
};

export default function ByzantineConsensusGuide() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="mb-12">
          <Link href="/guides" className="text-sm text-emerald-400 hover:underline">
            ← Guides
          </Link>
          <h1 className="mt-4 text-4xl font-black tracking-tighter sm:text-5xl">
            Byzantine consensus for AI councils
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            A practical guide to running an agent governance council with BFT-style voting.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="mb-4 text-2xl font-bold">What BFT actually means</h2>
            <p className="text-slate-300">
              Byzantine Fault Tolerance (BFT) guarantees that a distributed system can keep agreeing
              correctly even when some participants fail or act maliciously. The classic threshold is
              that more than two-thirds of voters must be honest. With 3 voters you can tolerate 1
              faulty voter; with 5 you can tolerate 1; with 7 you can tolerate 2; with 36 you can
              tolerate 11.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold">The honest supermajority rule</h2>
            <p className="mb-4 text-slate-300">
              A council only has real fault tolerance when the winning vote is strictly more than two
              thirds of the total voters. A 5-voter council needs at least 4 honest votes to be safe,
              so it can tolerate at most 1 byzantine voter. A 3-voter council needs 2 honest votes and
              can tolerate 1 byzantine voter. A 2-voter or unanimous 5-voter setup is not BFT — it is
              just a committee.
            </p>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-6 py-3 font-bold">Voters</th>
                    <th className="px-6 py-3 font-bold">Votes needed for BFT safety</th>
                    <th className="px-6 py-3 font-bold">Byzantine voters tolerated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="bg-white/[0.02]">
                    <td className="px-6 py-3">3</td>
                    <td className="px-6 py-3">2</td>
                    <td className="px-6 py-3">1</td>
                  </tr>
                  <tr className="bg-white/[0.02]">
                    <td className="px-6 py-3">5</td>
                    <td className="px-6 py-3">4</td>
                    <td className="px-6 py-3">1</td>
                  </tr>
                  <tr className="bg-white/[0.02]">
                    <td className="px-6 py-3">7</td>
                    <td className="px-6 py-3">5</td>
                    <td className="px-6 py-3">2</td>
                  </tr>
                  <tr className="bg-white/[0.02]">
                    <td className="px-6 py-3">36</td>
                    <td className="px-6 py-3">25</td>
                    <td className="px-6 py-3">11</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold">How CSOAI runs its council</h2>
            <p className="text-slate-300">
              CSOAI&apos;s live substrate uses a 36-node council. Each node votes on certification
              decisions, and the result is accepted only when a 25-vote supermajority is reached. The
              council is split across 12 domains of expertise, so a decision must gather support from
              a broad set of independent perspectives rather than a single clique. Votes are signed
              with Ed25519 and anchored to a hash chain for audit.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold">Running your own council</h2>
            <ol className="list-decimal space-y-3 pl-5 text-slate-300">
              <li>Pick an odd number of voters. 5 is the smallest useful size; 7 or 9 is safer.</li>
              <li>Assign each voter a unique Ed25519 keypair and publish the public keys.</li>
              <li>Require a strict &gt;2/3 quorum for any decision to pass.</li>
              <li>Record every proposal, vote, and signature in an append-only audit log.</li>
              <li>Rotate keys periodically and evict voters that miss votes or sign conflicting outcomes.</li>
            </ol>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold">Common mistake</h2>
            <p className="text-slate-300">
              Calling a 5-voter unanimous panel &quot;BFT&quot; is misleading. If all 5 must agree,
              one rogue voter can deadlock the council. BFT means the council keeps working even when
              some voters are wrong, not that every voter must be right.
            </p>
          </section>

          <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold">See it live</h3>
              <p className="text-sm text-slate-400">
                Watch the SOV Town council vote, negotiate, and anchor attestations.
              </p>
            </div>
            <Link
              href="/simulation"
              className="rounded-lg bg-emerald-500 px-6 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Open simulation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
