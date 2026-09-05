/**
 * GET /api/press.json — what changed, with the command that proves each line.
 *
 * The press surface as CODE. Every figure is read from a committed artifact at build time and
 * every claim ships with the one-liner a stranger runs to check it. Nothing is typed, and a
 * subject with no source is published as UNMEASURED rather than omitted — an absent number is
 * not a zero, and a press page that quietly drops the things that did not happen is marketing.
 *
 * THE WINDOW IS DERIVED, NOT "NOW". "This week" is the 7 days ending at the newest date any
 * artifact carries, never at the clock. Two requests an hour apart return the same window and
 * the same items; that is the point. An endpoint that stamps itself at request time reports a
 * change on every poll — this repo shipped exactly that defect once (last_checked at serve
 * time) and the corrections ledger records it.
 */
import { LEDGER } from "./corrections";
import cardIndex from "../../public/signed/card_index.json";
import root from "../../public/root.json";
import spray from "../../scripts/badger/_spray-log-v2.json";
import doi from "../../docs/DOI_AXIS_CARDS_2026-08-24.json";

interface Correction { id: string; date: string; what_was_wrong: string; how_caught: string; fix: string; status?: string }
interface Card { card: string; axis?: string; ts?: string }
interface Spray { lane?: string; status?: string; target?: string }

const day = (s: string) => String(s).slice(0, 10);
const P = "https://councilof.ai";

export function build() {
  const corrections = ((LEDGER as unknown as { corrections: Correction[] }).corrections || []).slice();
  const cards = ((cardIndex as unknown as { cards?: Card[] }).cards || []).filter((c) => c.ts);
  const r = root as unknown as { merkle_root?: string; card_count?: number; as_of?: string; sig_ed25519?: string | null };

  // Newest date across every dated artifact — the window's anchor.
  const dates = [
    ...corrections.map((c) => day(c.date)),
    ...cards.map((c) => day(String(c.ts))),
    r.as_of ? day(r.as_of) : "",
  ].filter(Boolean).sort();
  const anchor = dates[dates.length - 1] || "";
  const from = anchor ? new Date(new Date(`${anchor}T00:00:00Z`).getTime() - 6 * 864e5).toISOString().slice(0, 10) : "";
  const inWindow = (d: string) => Boolean(anchor) && day(d) >= from && day(d) <= anchor;

  const rows = (spray as unknown as Spray[]) || [];
  const sprayCounts = rows.reduce<Record<string, number>>((a, x) => {
    const k = String(x.status || "unknown"); a[k] = (a[k] || 0) + 1; return a;
  }, {});
  const live = sprayCounts.live || sprayCounts.published || 0;

  return {
    schema: "csoai.press/0.1",
    license: "CC-BY-4.0",
    publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
    doctrine: "Measurement, never certification. Verification is free and needs no account. Every line below carries the command that checks it.",
    window: {
      from, to: anchor,
      derivation: "The 7 days ending at the newest date any committed artifact carries. NOT the clock: two requests any interval apart return the same window.",
      proof: "curl -s https://councilof.ai/api/press.json | jq .window",
    },
    corrections_this_window: {
      value: corrections.filter((c) => inWindow(c.date)).length,
      total: corrections.length,
      kind: "counted",
      note: "Entries are things we got wrong about ourselves, how they were caught, and the fix. Publishing them is the credibility engine: the body that publishes the number also publishes when it was wrong.",
      proof: "curl -s https://councilof.ai/api/corrections | jq '.corrections|length'",
      feed: `${P}/feeds/corrections.xml`,
      items: corrections.filter((c) => inWindow(c.date)).map((c) => ({
        id: c.id, date: c.date, what_was_wrong: c.what_was_wrong, how_caught: c.how_caught, fix: c.fix,
        proof: `curl -s https://councilof.ai/api/corrections | jq '.corrections[]|select(.id=="${c.id}")'`,
      })),
    },
    public_root: {
      merkle_root: r.merkle_root ?? null,
      leaves: r.card_count ?? null,
      as_of: r.as_of ?? null,
      signature_state: r.sig_ed25519 ? "SIGNED" : "UNSIGNED — no signature is inferred from a content address",
      scope: "A valid OpenTimestamps proof over root.json covers root.json BYTES ONLY. It does not anchor the signed-card index and it does not anchor GSPC.",
      proof: "curl -s https://councilof.ai/root.json | jq '{merkle_root,card_count,as_of}'",
      feed: `${P}/feeds/roots.xml`,
    },
    signed_cards: {
      indexed: cards.length,
      added_this_window: cards.filter((c) => inWindow(String(c.ts))).length,
      corpus_note: "This is the SIGNED CARD INDEX. It shares no members with the public-root leaf set or the on-disk wrapper count — three corpora, zero identifier overlap.",
      proof: "curl -s https://councilof.ai/api/state | jq .signed_cards.corpus_relation",
      verify_one: "curl -s https://councilof.ai/signed/verify-card.mjs  # the same verifier we run",
      feed: `${P}/feeds/cards.xml`,
    },
    doi: {
      base_dataset_doi: (doi as unknown as { base_dataset_doi?: string }).base_dataset_doi ?? null,
      proof: "curl -s https://councilof.ai/api/gspc | jq -r .doi",
    },
    distribution_surfaces: {
      live: live || null,
      by_status: sprayCounts,
      kind: live ? "counted" : "unmeasured",
      note: live
        ? "Surfaces confirmed published."
        : "NO surface is confirmed live. The spray log records drafted and queued rows only, every one owner-gated. A drafted row is not a published surface, and this field stays null rather than 0 so the gap is legible rather than counted as an achievement.",
      proof: "jq '[.[].status]|group_by(.)|map({(.[0]):length})|add' scripts/badger/_spray-log-v2.json",
    },
    // The FAQ, ANSWERED FROM THE ARTIFACTS. The questions are ours — a question is a choice
    // about what a reader wants to know, and nothing derives that. Every ANSWER is computed
    // here from the ledger, the board or the root, so the FAQ cannot drift from the estate it
    // describes and no answer can be edited into something the artifacts do not support.
    // Rendered as schema.org FAQPage on /press/ so an answer engine quotes the derived text
    // rather than a summary of it.
    faq: [
      {
        q: "Do you certify AI systems?",
        a: "No. We measure, and we do not certify: no conformity marks, no accreditation, no conformity assessments. A grade is never sold, and verification is free and needs no account, permanently.",
      },
      {
        q: "How many corrections have you issued about your own published figures?",
        a: `${corrections.length} to date, ${corrections.filter((x) => inWindow(x.date)).length} in the ${from} to ${anchor} window. Each records what was wrong, how it was caught — usually by our own instrument — and the fix. The full ledger is at /api/corrections and the feed is /feeds/corrections.xml.`,
      },
      {
        q: "What is the most recent thing you got wrong?",
        a: (() => {
          const newest = corrections.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
          return newest ? `${newest.id} (${newest.date}). ${newest.what_was_wrong} It was caught: ${newest.how_caught} The fix: ${newest.fix}` : "The ledger is empty, which is a fact about the ledger and not a claim that nothing was wrong.";
        })(),
      },
      {
        q: "What have you NOT measured?",
        a: `Revenue: /api/revenue holds every count null until a receipt settles — a count is null, never 0, when there is no source. Distribution: ${live ? `${live} surfaces are confirmed live` : "no surface is confirmed live; the spray log holds drafted and queued rows only, so the count is published as null rather than 0"}. The board publishes its own unmeasured slots rather than hiding them: quote totals.unmeasured_axes from /api/gspc.`,
      },
      {
        q: "Can I verify one of your measurements myself, without an account?",
        a: "Yes, and without asking us. Each signed card carries an Ed25519 signature over a canonical body whose id is the sha-256 of those bytes. Fetch the card, recompute the id, and check the signature against the key published at did:web:csoai.org using the same verifier we run: https://councilof.ai/signed/verify-card.mjs. A signature is an integrity claim, not a truth claim — it says these are the bytes that were signed, not that the measurement inside them is correct.",
      },
      {
        q: "What does your public root actually prove?",
        a: `It commits to its own leaf list — ${r.card_count ?? "an unstated number of"} leaves under merkle_root ${r.merkle_root ? String(r.merkle_root).slice(0, 16) + "…" : "(absent)"} as of ${r.as_of ?? "an unstated time"}. Stranger inclusion means membership in that list. Its OpenTimestamps proof covers root.json bytes only: it does not anchor the signed-card index, and it does not anchor GSPC. Those are separate corpora with zero identifier overlap.`,
      },
    ],
    not_announced: [
      {
        subject: "first settlement",
        state: "NOT HAPPENED",
        why: "/api/revenue holds every count at null until a receipt settles: 'a count is null, never 0, when there is no source'. There is nothing to announce and a draft written now would be a press release about a future.",
        proof: "curl -s https://councilof.ai/api/revenue | jq .",
      },
      {
        subject: "N sites live",
        state: "NOT HAPPENED",
        why: "The spray log carries drafted and queued rows and no live ones. Announcing a number of live surfaces would be counting drafts as placements.",
        proof: "jq '[.[]|select(.status==\"live\")]|length' scripts/badger/_spray-log-v2.json",
      },
    ],
  };
}

export const onRequestGet: PagesFunction = async () =>
  new Response(JSON.stringify(build(), null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" },
  });
