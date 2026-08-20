import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { VideoEmbed } from "@/components/home/VideoEmbed";
import { Band, Caveat, PageHero, Panel, PanelGrid, SplitBand } from "@/components/pagekit/PageKit";

/**
 * /insurers — the evidence pack, underwriter-legible.
 *
 * Audience: an underwriter or actuary pricing AI risk who lands here cold and
 * needs loss-relevant evidence they can verify without trusting us.
 *
 * Register (binding): measurement, not certification. Three data states, never
 * blended — MEASURED (our signed deterministic runs, live at /api/gspc),
 * UNMEASURED (honestly withheld, with the reason), REPORTED (third-party
 * figures, cited + dated, "reported by the source, not measured here", live at
 * /api/reported). No pricing anywhere. No hardcoded counts — the live board is
 * the source of truth.
 */

interface Axis {
  axis: string;
  bench: string;
  n: number;
  accuracy: number;
  leader: string;
  separation: "SEPARATED" | "TIE" | "UNTESTED";
  separation_p?: number;
  interval?: [number, number];
  status: string;
}

interface ReportedEntry {
  id: string;
  claim: string;
  source: string;
  source_url: string;
  captured_at: string;
  as_of: string;
  attribution_basis: string;
  note?: string;
}

const CHIP: Record<string, string> = {
  SEPARATED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  TIE: "bg-amber-100 text-amber-800 border-amber-300",
  UNTESTED: "bg-gray-100 text-gray-600 border-gray-300",
};

const PAGE_LD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Evidence an underwriter can verify",
  url: "https://councilof.ai/insurers",
  publisher: {
    "@type": "Organization",
    name: "CSOAI Ltd",
    url: "https://councilof.ai",
    identifier: "UK Companies House 16939677",
  },
  author: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
  description:
    "Signed, deterministic AI measurement an underwriter can verify offline: per-axis results with n and Wilson intervals, Ed25519 signatures, a sha256 hash chain, and an honest register of what is not measured. Not a certification.",
};

const CARD_ANATOMY = [
  {
    term: "Deterministic per-axis results",
    body: "Every axis result carries its n and, where the n is honestly independent, a Wilson 95% interval. Same rows, same grader, rerun gives the same number — no model judging another model.",
  },
  {
    term: "Ed25519 signature",
    body: "The board is signed. The signature covers the canonical board content (minus the signature fields themselves), so any edit after signing breaks verification.",
  },
  {
    term: "SHA-256 hash chain",
    body: "Signed record sets chain their hashes: sha256 of the canonical content, sorted keys. Recompute it locally — if a record was edited after signing, your hash will not match the stored one. That is what the chain gives you: tamper-evidence, checkable offline.",
  },
  {
    term: "did:web:csoai.org published key",
    body: "The Ed25519 public keys are published at GET /.well-known/did.json under did:web:csoai.org. You fetch the key from the domain itself — no key exchange with us required, and no third party in the loop.",
  },
];

export default function Insurers() {
  const [board, setBoard] = useState<any>(null);
  const [boardErr, setBoardErr] = useState<string | null>(null);
  const [reported, setReported] = useState<any>(null);
  const [reportedErr, setReportedErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Evidence an underwriter can verify | Council of AI";
    setMetaDescription("Evidence an underwriter can verify: Ed25519-signed AI measurement cards, recomputable from published rows. Council of AI (CSOAI LTD, UK 16939677) — measurement, not certification. Live board: GET /api/gspc.");
    fetch("/api/gspc")
      .then((r) => r.json())
      .then(setBoard)
      .catch((e) => setBoardErr(String(e)));
    fetch("/api/reported")
      .then((r) => r.json())
      .then(setReported)
      .catch((e) => setReportedErr(String(e)));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_LD) }} />

      <PageHero
        kicker="For insurers and underwriters — verify everything, free"
        title={<>Evidence you can price, not a promise you have to take on faith.</>}
        lede={
          <>
            We measure AI systems against the rules that govern them, sign the result, and publish
            what we could not measure. Every number below is either fetched live from a signed
            endpoint or labelled with its third-party source and capture date. Nothing is blended.
          </>
        }
        image={{ src: "/images/verifiable_evidence_card.jpg", alt: "A verifiable evidence card being examined, its signature and hash chain visible" }}
        points={[
          { tag: "pain", text: "AI risk submissions arrive as vendor decks: no sample sizes, no method, nothing an actuary can rerun." },
          { tag: "benefit", text: "Per-axis failure rates with n and Wilson intervals, plus harm tails where the n supports them." },
          { tag: "usp", text: "Verify any card offline against a key published on the domain itself. You never have to trust us." },
        ]}
        actions={[
          { href: "/gspc-verify", label: "Verify a card, free" },
          { href: "/gspc-scoreboard", label: "See the live board", tone: "ghost" },
        ]}
        footnote={
          <>
            What this is <strong>not</strong>: not a certification, not a conformity mark, not a legal
            determination. It is a measurement record you can recompute yourself.
          </>
        }
      />

      <Band
        tone="tint"
        kicker="Three data states, never blended"
        title={<>Measured, unmeasured, or reported by someone else.</>}
        lede={
          <>
            The single most useful thing we do for an underwriting file is refuse to mix these three
            together. Each has its own endpoint and its own honesty rule.
          </>
        }
      >
        <PanelGrid cols={3}>
          <Panel>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Measured</p>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              Our own signed, deterministic runs. Live at <code className="text-[13px]">GET /api/gspc</code>.
            </p>
          </Panel>
          <Panel>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">Unmeasured</p>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              Honestly withheld, with the reason stated — insufficient n, or no separation test yet.
              Empty cells stay empty.
            </p>
          </Panel>
          <Panel>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">Reported</p>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
              Third-party figures, cited and dated — reported by the source, not measured here. Live
              at <code className="text-[13px]">GET /api/reported</code>.
            </p>
          </Panel>
        </PanelGrid>
      </Band>

      <SplitBand
        kicker="What a signed card gives you"
        title={<>About three kilobytes, and every part of it exists for you.</>}
        lede={
          <>
            A measurement card is a small signed record. Each component is there so an actuary can
            check it without trusting the issuer — which, from your side of the table, is the only
            kind of evidence worth having.
          </>
        }
        media={
          <VideoEmbed
            src="/videos/trust-ecosystem.mp4"
            poster="/videos/trust-ecosystem.jpg"
            title="How the trust ecosystem fits together"
            className="!max-w-none"
          />
        }
        mediaRight
        actions={[{ href: "/gspc-verify", label: "Verify one now", tone: "ghost" }]}
      />

      <Band tone="tint">
        <div className="grid gap-5 sm:grid-cols-2">
          {CARD_ANATOMY.map((item) => (
            <Panel key={item.term}>
              <p className="text-lg font-black tracking-tight text-gray-900">{item.term}</p>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{item.body}</p>
            </Panel>
          ))}
        </div>
      </Band>

      <Band
        kicker="Verify one yourself, offline"
        title={<>A stranger with a terminal can check us.</>}
        lede={<>No account, no key exchange, no permission, no charge — today and always.</>}
        width="prose"
      >
        <ol className="list-decimal space-y-5 pl-5 text-[16px] text-gray-700">
          <li>
            Fetch the signed board
            <pre className="mt-2 overflow-x-auto rounded-xl bg-[#03110b] p-4 font-mono text-xs text-emerald-300">
              curl https://councilof.ai/api/gspc
            </pre>
          </li>
          <li>
            Fetch the published verification key
            <pre className="mt-2 overflow-x-auto rounded-xl bg-[#03110b] p-4 font-mono text-xs text-emerald-300">
              curl https://councilof.ai/.well-known/did.json
            </pre>
          </li>
          <li>
            Recompute the hash chain in your own browser at{" "}
            <Link href="/gspc-verify" className="font-semibold text-emerald-700 underline">
              /gspc-verify
            </Link>{" "}
            — client-side, nothing leaves your machine.
          </li>
        </ol>
      </Band>

      <Band
        tone="tint"
        kicker="Loss context"
        title={<>Why this maps onto an underwriting file.</>}
        lede={<>Four things a measurement record gives you that a vendor questionnaire does not.</>}
      >
        <PanelGrid cols={2}>
          <Panel>
            <p className="text-lg font-black tracking-tight text-gray-900">Frequency</p>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
              The board shows which axes a system fails, with the n behind each result. A failure
              rate with a sample size and a Wilson interval is a frequency input, not a marketing
              claim.
            </p>
          </Panel>
          <Panel>
            <p className="text-lg font-black tracking-tight text-gray-900">Severity tails</p>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
              Where n≥100, the board publishes <code className="text-[13px]">mean_harm</code> and{" "}
              <code className="text-[13px]">cvar05_harm</code> per axis. CVaR@5% is the average harm
              across the worst 5% of items — the tail you price, not the average day. Where n&lt;100
              the field is honestly null.
            </p>
          </Panel>
          <Panel>
            <p className="text-lg font-black tracking-tight text-gray-900">Drift</p>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
              Regulation changes and measurements go stale. A daily reg-watch detector watches the
              governing corpus and publishes state changes to{" "}
              <a href="/api/feed.xml" className="font-semibold text-emerald-700 underline">
                /api/feed.xml
              </a>
              , so re-measurement is observable rather than promised.
            </p>
          </Panel>
          <Panel>
            <p className="text-lg font-black tracking-tight text-gray-900">The honesty gate</p>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
              At{" "}
              <Link href="/honesty" className="font-semibold text-emerald-700 underline">
                /honesty
              </Link>{" "}
              we publish our own models losing our own arena. An instrument that catches its owner is
              the instrument you can price on.
            </p>
          </Panel>
        </PanelGrid>
      </Band>

      <Band
        kicker="The live board — MEASURED"
        title={<>Read straight off the wire.</>}
        lede={
          <>
            Fetched live from <code className="text-[15px]">GET /api/gspc</code> — the count lives
            there, not in this page. A <strong>TIE</strong> means the leader&apos;s edge is
            statistically indistinguishable, and ties are never counted as wins.
          </>
        }
      >
        {boardErr && (
          <p className="text-red-600">
            Board fetch failed: {boardErr} — the API at /api/gspc is the source of truth.
          </p>
        )}
        {!board && !boardErr && <p className="text-gray-500">Loading the live board…</p>}

        {board && (
          <div className="overflow-x-auto rounded-2xl border border-emerald-900/10 bg-white shadow-[0_18px_50px_-32px_rgba(4,18,12,.45)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-gray-600">
                  <th className="p-4">Axis</th>
                  <th className="p-4">n</th>
                  <th className="p-4">Leader accuracy</th>
                  <th className="p-4">Separation</th>
                </tr>
              </thead>
              <tbody>
                {(board.axes as Axis[]).map((a) => (
                  <tr key={a.axis} className="border-b border-gray-100 last:border-0">
                    <td className="p-4 font-semibold text-gray-900">{a.axis}</td>
                    <td className="p-4 font-mono">{a.n}</td>
                    <td className="p-4 font-mono">{(a.accuracy * 100).toFixed(1)}%</td>
                    <td className="p-4">
                      <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${CHIP[a.separation]}`}>
                        {a.separation === "TIE" ? "TIE — indistinguishable" : a.separation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-[13px] text-gray-500">
          Full per-axis detail — Wilson intervals, fleet means, harm tails, the signature:{" "}
          <Link href="/gspc-scoreboard" className="font-semibold text-emerald-700 underline">
            /gspc-scoreboard
          </Link>{" "}
          and <code>GET /api/gspc</code>.
        </p>
      </Band>

      <Band
        tone="tint"
        kicker="REPORTED — third-party context, never blended"
        title={<>Other people&apos;s figures, kept at arm&apos;s length.</>}
        lede={
          <>
            Figures published by others, cited with their capture date. Each entry is{" "}
            <strong>reported by the source, not measured here</strong> — unsigned, and it never enters
            the board.
          </>
        }
      >
        {reportedErr && (
          <p className="text-red-600">
            REPORTED fetch failed: {reportedErr} — the API at /api/reported is the source of truth.
          </p>
        )}
        {!reported && !reportedErr && <p className="text-gray-500">Loading REPORTED entries…</p>}

        {reported && (
          <ul className="space-y-3">
            {(reported.entries as ReportedEntry[]).map((e) => (
              <li key={e.id} className="rounded-2xl border border-amber-300/60 bg-amber-50/50 p-5">
                <p className="text-[15px] font-bold text-gray-900">{e.claim}</p>
                <p className="mt-2 text-xs text-gray-600">
                  Source:{" "}
                  <a href={e.source_url} className="font-semibold text-emerald-700 underline" rel="noopener noreferrer">
                    {e.source}
                  </a>{" "}
                  · source date {e.as_of} · captured {e.captured_at}
                </p>
                <p className="mt-1 text-xs font-bold text-amber-800">
                  Reported by the source, not measured here.
                </p>
              </li>
            ))}
          </ul>
        )}
      </Band>

      <Band tone="deep" width="prose">
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/gspc-scoreboard", label: "The full live board" },
              { href: "/gspc-verify", label: "Verify a card — free, in your browser" },
              { href: "/firewall-charter", label: "The measurement/remediation firewall" },
              { href: "mailto:nicholas@csoai.org", label: "Talk to us about an evidence pack" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-2xl border border-emerald-600/20 bg-white p-5 text-[15px] font-bold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                {l.label} →
              </a>
            ))}
          </div>
          <Caveat title="The register">
            <p>
              Measurement, not certification. CSOAI Ltd · UK Companies House 16939677 ·{" "}
              <a href="mailto:nicholas@csoai.org" className="underline">
                nicholas@csoai.org
              </a>
              .
            </p>
            <p>
              Every MEASURED number on this page is recomputable from{" "}
              <code>GET /api/gspc</code>; every REPORTED figure carries its source and capture date;
              and what we cannot measure is withheld and says so.
            </p>
          </Caveat>
        </div>
      </Band>
    </div>
  );
}
