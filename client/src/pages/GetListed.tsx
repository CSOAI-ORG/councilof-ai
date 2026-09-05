import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /get-listed — the opt-in funnel (TRACK C3.4).
 *
 * The census lists; it never grades. This page tells a maintainer exactly what
 * being in a CSOAI census means (nothing, until they opt in), what the three
 * badges are, and how to opt in to a frozen bank if they want a card.
 *
 * COUNTS ARE LIVE. Nothing here types an axis count or a census size — the board
 * strip reads public_count from GET /api/gspc and renders only once the payload
 * lands. Census sizes live inside the census datasets themselves.
 */

type Gspc = {
  totals?: { public_count?: string };
  axes?: { kind?: string }[];
};

/**
 * Composition derived from the payload, never typed: the board's own grammar is
 * "quote both or quote the smaller", and a bare measured count hides that some
 * measurements are deterministic fact cards, not model comparisons.
 */
function composition(g: Gspc | null): string | null {
  const axes = g?.axes;
  if (!axes || axes.length === 0) return null;
  const mc = axes.filter((a) => a.kind === "model-comparison").length;
  const facts = axes.filter((a) => a.kind === "deterministic-facts").length;
  if (mc + facts === 0) return null;
  return `${mc} model-comparison + ${facts} fact card${facts === 1 ? "" : "s"}`;
}

function useGspc(): Gspc | null {
  const [data, setData] = useState<Gspc | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/gspc", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive) setData(j as Gspc);
      })
      .catch(() => {
        /* offline / prerender: render without the number, never with a guess */
      });
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

const MAINTAINER_BLOCK = `[![GSPC](https://councilof.ai/badge/gspc.svg)](https://councilof.ai/gspc-scoreboard)
This model is **DISCOVERED** in the CSOAI hub census unless a verify link is present.
Verify a card: https://councilof.ai/gspc-verify
Live board: https://councilof.ai/api/gspc
Measurement, not certification.`;

const BADGES = [
  {
    id: "listed",
    label: "GSPC listed",
    dot: "#9ca3af",
    tone: "grey",
    when: "The id appears in a CSOAI census (hub-queue / catalog / oss-model-census). DISCOVERED. Nothing has been run.",
  },
  {
    id: "unmeasured",
    label: "GSPC unmeasured",
    dot: "#f59e0b",
    tone: "amber",
    when: "Named on the board or in the queue, but no VALID card exists yet. The empty cell stays empty.",
  },
  {
    id: "measured",
    label: "GSPC measured",
    dot: "#0B1F33",
    tone: "navy",
    when: "A signed card verifies VALID under did:web:csoai.org#card-attestation-1, with a card sha and a public verify URL.",
  },
] as const;

export default function GetListed() {
  const gspc = useGspc();
  const [copied, setCopied] = useState(false);
  const count = gspc?.totals?.public_count;

  function copyBlock() {
    try {
      navigator.clipboard.writeText(MAINTAINER_BLOCK);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the block is selectable text */
    }
  }

  useEffect(() => {
    document.title = "You are listed. You are not graded. — Council of AI";
    setMetaDescription(
      "What being in a CSOAI census means, what the three GSPC badges are, and how a maintainer opts in to a frozen bank to earn a card. Measurement, not certification.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
          GSPC census · opt-in funnel
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          You are listed. You are not graded.
        </h1>
        <p className="mt-4 text-emerald-100/80 leading-relaxed">
          CSOAI runs censuses of the open ecosystem — open-licence models on the
          Hugging Face Hub, hub listings, on-chain agent registrations. A census
          row means one thing only: <b className="text-emerald-200">we saw your id</b>.
          Every census row is <code className="text-emerald-300">status=DISCOVERED</code>,{" "}
          <code className="text-emerald-300">measured=false</code>. No run happened.
          No score exists. Being listed asserts nothing about your model, and we
          never claim otherwise. The size of each census is written inside its
          own dataset file — the number frozen is the number fetched.
        </p>
        <p className="mt-4 text-emerald-100/80 leading-relaxed">
          Measurement is scarce and earned. A model becomes MEASURED only when a
          run on a published, frozen bank produces a signed card that verifies
          VALID under <code className="text-emerald-300">did:web:csoai.org#card-attestation-1</code>.
          {count ? (
            <>
              {" "}The live board today: <b className="text-emerald-200">{count}</b>
              {composition(gspc) ? (
                <> ({composition(gspc)})</>
              ) : null}{" "}
              <span className="text-emerald-100/60">
                (read straight from <code className="text-emerald-300">GET /api/gspc</code>)
              </span>
              .
            </>
          ) : (
            <>
              {" "}The live count is on{" "}
              <code className="text-emerald-300">GET /api/gspc</code> — this page
              prints no number until that payload lands.
            </>
          )}
        </p>

        <h2 className="mt-10 text-2xl font-black tracking-tight">The three badges</h2>
        <p className="mt-2 text-sm text-emerald-100/70">
          These are the only three states a model or agent can wear. Measurement,
          not certification. There is no certified badge and no gold badge.
        </p>
        <div className="mt-5 space-y-3">
          {BADGES.map((b) => (
            <div
              key={b.id}
              className="flex items-start gap-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-4"
            >
              <span
                className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/25 bg-black/40 px-3 py-1 font-mono text-[11px] font-bold"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: b.dot, boxShadow: "0 0 0 1px rgba(255,255,255,.35)" }}
                />
                {b.label}
                <span className="text-emerald-300/60">({b.tone})</span>
              </span>
              <p className="text-sm leading-relaxed text-emerald-100/80">{b.when}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 text-2xl font-black tracking-tight">Opt in to a frozen bank</h2>
        <p className="mt-3 text-emerald-100/80 leading-relaxed">
          If you maintain a listed model and want a card: opt in. Your model is
          run against a published, frozen split on the public harness. Whatever
          the run measures is what the card says — including a poor score, a TIE,
          or an UNMEASURED cell where no label could be read. Cards are signed
          Ed25519 JSON anyone can re-verify; the harness is public and anyone can
          recompute and challenge a result. Verification is free forever, and a
          grade is never sold.
        </p>
        <p className="mt-3 text-emerald-100/80 leading-relaxed">
          Write to{" "}
          <a className="text-emerald-300 underline" href="mailto:nicholas@csoai.org">
            nicholas@csoai.org
          </a>{" "}
          with the model id, or open an issue on the GitHub org. We never open
          unsolicited PRs against your repository and we rate-limit everything we
          send; opting in is the only path from grey to navy.
        </p>

        <h2 className="mt-10 text-2xl font-black tracking-tight">
          Maintainer badge block
        </h2>
        <p className="mt-2 text-sm text-emerald-100/70">
          Copy-paste for your model card, if you want to show your census state.
          The badge SVG reads the live board; it never freezes a count.
        </p>
        <div className="relative mt-4">
          <pre className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-[#05140d] p-4 font-mono text-[12px] leading-relaxed text-emerald-100/90">
            <code>{MAINTAINER_BLOCK}</code>
          </pre>
          <button
            onClick={copyBlock}
            className="absolute right-3 top-3 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-[#03110b] hover:bg-emerald-400"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <p className="mt-8 text-sm text-emerald-100/70">
          Measurement, not certification. There is no certified badge and no gold
          badge. An UNMEASURED axis stays visibly empty until a run exists — the
          gap is the product.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/gspc-verify"
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400"
          >
            Verify a card
          </Link>
          <Link
            href="/dashboard?tab=board"
            className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-bold hover:bg-white/5"
          >
            Live board
          </Link>
          <a
            href="/api/gspc"
            className="rounded-xl border border-emerald-400/40 px-5 py-2.5 text-sm font-bold hover:bg-white/5"
          >
            Machine JSON
          </a>
        </div>
      </main>
    </div>
  );
}
