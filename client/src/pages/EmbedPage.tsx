import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { badgeSnippet, cardSnippet, CARD_EMBED_HEIGHT, CARD_EMBED_WIDTH } from "@/lib/embedSnippet";
import JoinedSpecsFooter from "@/components/JoinedSpecsFooter";

/**
 * /embed — the white-label "Powered by Council of AI" onboarding page.
 *
 * A third party can drop an independently signed Council of AI measurement into
 * their own site: a live-status badge, and a self-verifying card widget anyone can
 * re-verify client-side. The honest pitch: embed a signed measurement anyone can
 * re-verify — verification is free forever. This is measurement and attestation,
 * not certification, and the embedder cannot alter the signed verdict.
 */

const ORIGIN = "https://councilof.ai";

function Snippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl border border-emerald-500/20 bg-[#03110b] p-4 font-mono text-[12px] leading-relaxed text-emerald-100/90">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          try {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard blocked — the snippet is selectable above */
          }
        }}
        className="absolute right-3 top-3 rounded-md border border-emerald-500/30 bg-[#05140d] px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function EmbedPage() {
  useEffect(() => {
    document.title = "Embed / white-label — Powered by Council of AI | CSOAI";
    setMetaDescription(
      "Embed an independently signed Council of AI measurement into your own site: a live-status badge and a self-verifying card widget anyone can re-verify client-side. Measurement, not certification. Verification is free forever.",
    );
  }, []);

  const axisBadge = badgeSnippet("governance", ORIGIN);
  const overallSnippet = badgeSnippet("", ORIGIN);
  const iframeSnippet = cardSnippet("/signals/cross-border-card.signed.json", ORIGIN);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* HERO */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Powered by Council of AI · white-label embed
          </p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            Embed a signed measurement{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-amber-300 bg-clip-text text-transparent">
              anyone can re-verify.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            Drop an independently signed Council of AI measurement into your own site — a live-status
            badge and a self-verifying card. The signed verdict travels with its own bytes: your
            visitors recompute the hash and check the Ed25519 signature in their own browser, against
            the published key, without trusting you <em>or</em> us.{" "}
            <strong className="text-emerald-50">Verification is free forever.</strong> That is the
            n-site spray: your origin, our 3kb glass, their visitors checking the same bytes. We do
            not fork your stack into CSOAI-ORG.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {/* BOUNDARY BOX */}
        <section className="rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-6">
          <h2 className="text-lg font-bold text-amber-200">What this is — and is not</h2>
          <ul className="mt-3 space-y-2 text-[13px] text-emerald-100/85 leading-relaxed list-disc pl-5">
            <li>
              It is a <strong className="text-emerald-50">measurement and attestation</strong> — a
              signed record of a measured run on a frozen split. We measure; we do not certify.
            </li>
            <li>
              It is <strong className="text-emerald-50">not a certification, conformity mark, or
              accreditation</strong>. A determination of compliance stays with regulators and
              authorities, never with a badge.
            </li>
            <li>
              The embedder <strong className="text-emerald-50">cannot alter the signed verdict</strong>:
              any edit to the card's bytes breaks the signature, and the widget shows it red.
            </li>
            <li>
              Regulators and the public verify for free, forever — no account, no key, no fee.
            </li>
          </ul>
        </section>

        {/* 0 — DROP-IN SCRIPT (the missing piece of the 2026-08-25 kit) */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">0 · One script tag</h2>
          <p className="mt-2 max-w-3xl text-[14px] text-emerald-100/75 leading-relaxed">
            Drop this in the body, where the badge should appear — not in{" "}
            <code className="text-emerald-300">&lt;head&gt;</code>. It fetches the live board
            and paints the board&apos;s own public count. Partner colour is yours; the
            evidence is not. If the board cannot be read it says unavailable — it never
            fabricates a number. If the tag lands in head, the script mounts on the body.
          </p>
          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
            <Snippet
              code={
                `<script src="${ORIGIN}/embed.js"\n` +
                `        data-org="Your organisation" data-brand="#0B3D91" data-size="md"></script>`
              }
            />
            <p className="mt-3 text-[12px] text-emerald-100/55">
              Machine contract: <a href="/api/embed" className="text-emerald-300 hover:underline">GET /api/embed</a>
              {" · "}
              <Link href="/badge" className="text-emerald-300 hover:underline">human kit at /badge</Link>
            </p>
          </div>
        </section>

        {/* 1 — BADGE */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">1 · The live-status badge</h2>
          <p className="mt-2 max-w-3xl text-[14px] text-emerald-100/75 leading-relaxed">
            A shields-style SVG that states one axis's real status from{" "}
            <Link href="/api/gspc" className="text-emerald-300 hover:underline">the live board</Link>:
            three honest states — <span className="text-emerald-300">measured</span>,{" "}
            <span className="text-amber-300">untested</span>, or{" "}
            <span className="text-emerald-100/60">unmeasured</span> — and the real bank size{" "}
            <code className="text-emerald-300">n</code>. It never shows a number that is not on the
            board. Omit <code className="text-emerald-300">?axis</code> for the overall count.
          </p>

          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 space-y-5">
            <div>
              <p className="text-[12px] uppercase tracking-wide text-emerald-200/60">Live previews</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <img src="/api/badge?axis=governance" alt="governance — measured by Council of AI" height={20} />
                <img src="/api/badge?axis=affect" alt="affect — measured by Council of AI" height={20} />
                <img src="/api/badge" alt="Council of AI — measured axis overall" height={20} />
              </div>
              <p className="mt-2 text-[12px] text-emerald-100/50">
                (If the board changes, every embedded badge changes with it — the SVG is generated
                per request from the same data <code>/api/gspc</code> serves.)
              </p>
            </div>
            <div>
              <p className="mb-2 text-[12px] uppercase tracking-wide text-emerald-200/60">Copy-paste — one axis</p>
              <Snippet code={axisBadge} />
            </div>
            <div>
              <p className="mb-2 text-[12px] uppercase tracking-wide text-emerald-200/60">Copy-paste — overall count</p>
              <Snippet code={overallSnippet} />
            </div>
          </div>
        </section>

        {/* 2 — SELF-VERIFYING CARD */}
        <section>
          <h2 className="text-2xl font-bold text-emerald-50">2 · The self-verifying card</h2>
          <p className="mt-2 max-w-3xl text-[14px] text-emerald-100/75 leading-relaxed">
            A small, self-contained widget your visitors can iframe. It fetches a signed measurement
            card and does <strong className="text-emerald-50">real Ed25519 verification</strong> in
            their browser: it recomputes the content hash from the card's own bytes and checks the
            signature against the published key. A green{" "}
            <span className="text-emerald-300">✓ signature verified</span> means the bytes are
            unaltered and signed by the published key; any tampering shows red. Nothing is faked and
            nothing is sent to a server.
          </p>

          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6 space-y-5">
            <div>
              <p className="mb-3 text-[12px] uppercase tracking-wide text-emerald-200/60">Live widget</p>
              <iframe
                src="/embed/verify.html?card=/signals/cross-border-card.signed.json"
                width={CARD_EMBED_WIDTH}
                height={CARD_EMBED_HEIGHT}
                loading="lazy"
                style={{ border: 0, maxWidth: "100%" }}
                title="Council of AI — verify a signed measurement card"
              />
            </div>
            <div>
              <p className="mb-2 text-[12px] uppercase tracking-wide text-emerald-200/60">Copy-paste</p>
              <Snippet code={iframeSnippet} />
            </div>
            <p className="text-[12px] text-emerald-100/55 leading-relaxed">
              Point <code className="text-emerald-300">?card</code> at any same-origin signed card
              JSON (the envelope carries <code>content_id</code> + an Ed25519{" "}
              <code>signature</code>). Prefer the extension-less{" "}
              <code className="text-emerald-300">/embed/verify</code> path for a clean iframe URL; the
              same widget also serves directly at{" "}
              <code className="text-emerald-300">/embed/verify.html</code>.
            </p>
          </div>
        </section>

        {/* HOW TRUST WORKS */}
        <section className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-2xl font-bold text-emerald-50">Why a visitor can trust it without trusting you</h2>
          <ol className="mt-4 space-y-3 text-[13px] text-emerald-100/80 leading-relaxed list-decimal pl-5">
            <li>
              The card commits to its own contents: <code className="text-emerald-300">content_id</code>{" "}
              is the SHA-256 of the card's canonical bytes. The widget recomputes it locally — an edit
              anywhere changes the hash.
            </li>
            <li>
              The <code className="text-emerald-300">content_id</code> is signed with Ed25519. The
              widget verifies the signature against the key on the card and cross-checks that key
              against the published Council of AI signer.
            </li>
            <li>
              None of this contacts us. You could host the card and the widget yourself; the maths is
              the same. That is what &quot;self-verifying&quot; means.
            </li>
          </ol>
        </section>

        {/* LINKS */}
        <div className="flex flex-wrap gap-4 pb-4 text-[13px]">
          <Link href="/gspc-verify" className="text-emerald-300 hover:underline">
            Verify a card yourself →
          </Link>
          <Link href="/api/gspc" className="text-emerald-300 hover:underline">
            The live board (JSON) →
          </Link>
          <Link href="/.well-known/did.json" className="text-emerald-300 hover:underline">
            The published signer (did:web) →
          </Link>
          <Link href="/methodology" className="text-emerald-300 hover:underline">
            Read the methodology →
          </Link>
          <Link href="/licensing-agreement" className="text-emerald-300 hover:underline">
            Licence (invoice, not a token) →
          </Link>
          <Link href="/distribution-integrity" className="text-emerald-300 hover:underline">
            Represented is not distributed →
          </Link>
        </div>
        <JoinedSpecsFooter variant="dark" />
      </div>
    </div>
  );
}
