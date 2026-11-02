/**
 * HomeLast30Days - what shipped in the last 30 days, each line linked to the merged pull request
 * that is its evidence. Owner ask (16 Oct 2026): visitors should see the progression.
 *
 * Rules: no typed counts (the live figures stay in the proof strip, from /api/momentum and
 * /api/gspc); every line is a merged PR on CSOAI-ORG/councilof-ai; no partnership or
 * integration claims; nothing under review is listed.
 */
const REPO = "https://github.com/CSOAI-ORG/councilof-ai/pull/";

const SHIPPED: { date: string; pr: number; text: string }[] = [
  { date: "16 Oct", pr: 3256, text: "Hugging Face dataset viewers repaired; GSPC dataset cards refresh live counts after every deploy." },
  { date: "16 Oct", pr: 3257, text: "Kaggle batch workflow for reproducible GSPC measurement batches." },
  { date: "15 Oct", pr: 3238, text: "Artifact seal: POST /api/sign on a dedicated signing key, fail-closed." },
  { date: "15 Oct", pr: 3200, text: "AI Claims Index v0 - claims measured against evidence." },
  { date: "14 Oct", pr: 3191, text: "Pending OpenTimestamps stamps upgraded to Bitcoin attestations." },
  { date: "14 Oct", pr: 3189, text: "Versioned open data (data/v1): dated snapshots, latest pointer, add-only changelog and per-version citation." },
  { date: "14 Oct", pr: 3188, text: "GSPC-G2 cards published with schema.org Dataset metadata." },
  { date: "14 Oct", pr: 3185, text: "No-model reproduction task: verify a G2 card yourself with an MIT script." },
  { date: "14 Oct", pr: 3216, text: "Team page: the people, and each AI desk labelled as AI." },
];

const ALL_MERGED =
  "https://github.com/CSOAI-ORG/councilof-ai/pulls?q=is%3Apr+is%3Amerged+sort%3Aupdated-desc";

export default function HomeLast30Days() {
  return (
    <section aria-label="The last 30 days" className="surface-base border-t border-border" data-testid="home-last-30-days">
      <div className="section-shell py-10 sm:py-14">
        <h2 className="text-2xl font-bold tracking-tight">The last 30 days</h2>
        <p className="mt-2 max-w-3xl text-base text-muted-foreground">
          What shipped, each line linked to the merged change behind it. Measured, not a certificate.
        </p>
        <ul className="mt-6 space-y-3">
          {SHIPPED.map((s) => (
            <li key={s.pr} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
              <span className="w-20 shrink-0 font-mono text-sm text-muted-foreground">{s.date}</span>
              <span className="text-base">
                {s.text}{" "}
                <a href={`${REPO}${s.pr}`} className="text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
                  #{s.pr}
                </a>
              </span>
            </li>
          ))}
        </ul>
        <a href={ALL_MERGED} className="mt-6 inline-flex min-h-11 items-center text-base font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
          Every merged change →
        </a>
      </div>
    </section>
  );
}
