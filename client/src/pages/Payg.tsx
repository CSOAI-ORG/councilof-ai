import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";
import { VideoEmbed } from "@/components/home/VideoEmbed";
import { Band, Caveat, MediaHero, Panel, PanelGrid } from "@/components/pagekit/PageKit";

// /payg — the agent rail (pay-per-call / x402), in detail.
// Machine-access pricing is pending a published ruling — not yet set. 100 free
// calls/day per key remain free. Every call returns a ~3KB Ed25519-signed,
// hash-chained measurement card. CTAs point at real destinations (get a key,
// top up), never a bounce back to /pricing.
//
// Design: the homepage scroll-world language via components/pagekit/PageKit.

const PRICING_STATUS = "Machine-access pricing is pending a published ruling — not yet set";

const INSTRUMENTS = [
  "Governance",
  "Safety",
  "Provenance",
  "Continuity",
  "Conformance",
  "Openness",
  "Full spectrum",
];

const WHY = [
  {
    h: "One key, every instrument",
    b: "The same token works across every published instrument, on every machine, and in CI. No per-instrument onboarding, no separate contract for each axis.",
  },
  {
    h: "Nothing expires",
    b: "A balance is a balance. It does not lapse at the end of a month, and there is no seat to renew for a colleague who left.",
  },
  {
    h: "100 free cards a day",
    b: "Per key, every day, before anything is metered. Enough to wire the rail into a build and see real signed output before you decide anything.",
  },
  {
    h: "Your auditor checks it, not us",
    b: "Every call returns a ~3KB Ed25519-signed, hash-chained card. It verifies offline against the published signer — so the evidence does not depend on us still being here.",
  },
];

export default function Payg() {
  useEffect(() => {
    document.title = "Pay as you go — one key, signed measurement cards | Council of AI";
    setMetaDescription("The Council of AI agent rail: one key across every published instrument, 100 free calls a day, and a ~3KB Ed25519-signed measurement card on every call that your auditor verifies independently.");
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <MediaHero
        kicker="Agent rail · pay-per-call · no subscription"
        title={
          <>
            One key. Every instrument.
            <br />
            A signed card on every call.
          </>
        }
        lede={
          <>
            Wire measurement into the thing you are already building. A hundred free calls a day per
            key, then metered machine access — and every single call comes back as a small signed
            card your auditor can check without asking us anything.
          </>
        }
        points={[
          { tag: "pain", text: "Assurance is normally sold as an annual seat contract you sign before you know whether it works." },
          { tag: "benefit", text: "Start on the free daily allowance, in a build, today — no sales call, no seat, no lock-in." },
          { tag: "usp", text: "Every call returns a ~3KB Ed25519-signed, hash-chained card that verifies offline against did:web:csoai.org." },
        ]}
        actions={[
          { href: "/start", label: "Get a free key" },
          { href: "/api-docs", label: "Read the API docs", tone: "ghost" },
        ]}
        media={
          <VideoEmbed
            src="/videos/csoai-architecture.mp4"
            poster="/videos/csoai-architecture.jpg"
            title="How the measurement rail is put together"
            className="!max-w-none"
          />
        }
        footnote={<>{PRICING_STATUS}. Verification of any signed card is free forever, for everyone.</>}
      />

      <Band
        tone="tint"
        kicker="What one key reaches"
        title={<>Every published instrument, behind one token.</>}
        lede={
          <>
            Call a single axis or the full spectrum. The card that comes back is the same shape either
            way, so whatever you build against it keeps working as the board grows.
          </>
        }
      >
        <div className="flex flex-wrap gap-2.5">
          {INSTRUMENTS.map((m) => (
            <span
              key={m}
              className="rounded-full border border-emerald-600/25 bg-white px-4 py-2 text-sm font-bold text-emerald-800"
            >
              {m}
            </span>
          ))}
        </div>
        <div className="mt-8 overflow-hidden rounded-3xl bg-[#03110b] p-6 shadow-[0_28px_70px_-40px_rgba(4,18,12,.8)] sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-300/80">
            Setup, in about thirty seconds
          </p>
          <pre className="mt-4 overflow-x-auto font-mono text-[13px] leading-relaxed text-emerald-100/90">
{`export COAI_PAYG_KEY="key_xxxxxxxxxxxxxxxx"

# 100 free calls/day per key. After that:
#   machine-access pricing is pending a published ruling — not yet set.
# Every call returns a ~3KB Ed25519-signed measurement card.
# When the balance hits zero, the call returns a top-up URL.`}
          </pre>
        </div>
      </Band>

      <Band
        kicker="Why pay-per-call"
        title={<>Because you should be able to stop.</>}
        lede={
          <>
            A metered rail is the honest shape for measurement: you pay for the measurements you took,
            you can leave whenever, and the evidence you already hold keeps verifying either way.
          </>
        }
        actions={[
          { href: "/start", label: "Get a free key" },
          { href: "/firewall-charter", label: "Read the Firewall Charter", tone: "ghost" },
        ]}
      >
        <PanelGrid cols={2}>
          {WHY.map((w) => (
            <Panel key={w.h}>
              <h3 className="text-lg font-black tracking-tight text-gray-900">{w.h}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{w.b}</p>
            </Panel>
          ))}
        </PanelGrid>
      </Band>

      <Band tone="deep" width="prose">
        <div className="space-y-6">
          <Panel>
            <h3 className="text-lg font-black tracking-tight text-gray-900">Two ways to top up</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
              Card, or USDC on Base via x402 for agent-to-agent payments. Every call is metered and
              every result is Ed25519-signed, so your auditor verifies the card independently of us.
            </p>
          </Panel>
          <Caveat title="What paying does not buy">
            <p>
              Payment buys machine access to the instruments. It does not buy a score, a placement, a
              faster queue, or a favourable reading. Nobody we measure or rank pays us for
              measurement — that is written down in the{" "}
              <a href="/firewall-charter" className="font-semibold underline">
                Firewall Charter
              </a>
              , and no payment metadata ever reaches the measurement or signing path.
            </p>
            <p>
              This is measurement, not certification. A card records what a system did on a published
              test. It is not a conformity mark, an accreditation, or an approval.
            </p>
          </Caveat>
          <p className="text-[15px] leading-relaxed text-gray-600">
            Prefer a fixed plan for a human team?{" "}
            <a href="/pricing" className="font-semibold text-emerald-700 underline">
              See the Council rail
            </a>
            .
          </p>
        </div>
      </Band>
    </div>
  );
}
