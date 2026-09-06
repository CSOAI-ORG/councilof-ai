/**
 * GET /feeds/x402-census.xml — the x402 settlement census, round by round and delta by delta.
 *
 * WHY A FEED AND NOT A PAGE. The value of this corpus is not the snapshot, it is the change: a
 * Bazaar listing does not move when a host stops answering paid requests, so "who flipped this
 * week" is the only place that fact appears. A change nobody can subscribe to is a change nobody
 * sees, which is the same defect /feeds itself was built to fix.
 *
 * DERIVED, NEVER TYPED. Every item is read from public/interop/x402-census/index.json, which is
 * produced by scripts/grants/x402_census_round.py from the committed rows and gated by --check.
 * Nothing here can claim a round that does not exist or a flip count the rows do not support.
 *
 * DATES. pubDate is the round's own as_of — the last observed_at in its rows — never the time the
 * request was served. A feed that stamps itself with now() reports a change on every poll.
 *
 * WHAT IT NEVER SAYS. No host is ranked, recommended or accused; REFUSED is not proof of bad
 * faith; and no per-host state above UNMEASURED appears, here or anywhere on this surface, below
 * 30 paid observations. The one-round case is stated as such rather than dressed as a series.
 */
import index from "../../public/interop/x402-census/index.json";
import { rss, FEED_HEADERS, type Entry } from "./_xml";

const SITE = "https://councilof.ai";
const SELF = `${SITE}/feeds/x402-census.xml`;

interface Round {
  round_id: string; as_of: string | null; probed: number; paid_rows: number;
  outcome: Record<string, number>; take_and_refuse: number; spend_usdc: number;
  hosts_sha256: string; leaves_staged: number | null; url: string;
}
interface Delta {
  id: string; from_round: string; to_round: string; as_of: string | null;
  common_hosts: number; flipped: number; delivered_to_refused: number; refused_to_delivered: number;
  price_drift_hosts: number; pay_to_changed: number; take_and_refuse_persisted: number;
  dropped: number; added: number; url: string;
}
interface Index {
  as_of: string | null; rounds: Round[]; deltas: Delta[];
  ladder: { n_required: number; rounds_so_far: number; hosts_observed: number; hosts_at_or_above_n_required: number; note: string };
  caveats: string[];
}

const CAVEAT =
  "REFUSED is not proof of bad faith: rate limits, account requirements and changed terms are " +
  "indistinguishable from outside. One purchase per host at one moment. Measurement, not certification.";

export function entries(): Entry[] {
  const idx = index as unknown as Index;
  const out: Entry[] = [];

  for (const d of idx.deltas || []) {
    out.push({
      id: d.url,
      title: `What changed — ${d.from_round} → ${d.to_round}: ${d.flipped} of ${d.common_hosts} hosts flipped`,
      link: d.url,
      iso: d.as_of || "",
      body: [
        `${d.flipped} of ${d.common_hosts} hosts present in both rounds returned a different outcome.`,
        `DELIVERED → REFUSED: ${d.delivered_to_refused}. REFUSED → DELIVERED: ${d.refused_to_delivered}.`,
        `${d.price_drift_hosts} hosts changed the amount they asked for; ${d.pay_to_changed} changed the payee their challenge names.`,
        `${d.take_and_refuse_persisted} hosts took a settlement and refused anyway in both rounds.`,
        `${d.added} hosts joined the population and ${d.dropped} left; a host that left did not change its mind, it left.`,
        CAVEAT,
      ].join(" "),
    });
  }

  for (const r of idx.rounds || []) {
    const o = r.outcome || {};
    out.push({
      id: r.url,
      title: `Round ${r.round_id} — ${o.DELIVERED ?? 0} delivered, ${o.REFUSED ?? 0} refused of ${r.probed} hosts paid`,
      link: r.url,
      iso: r.as_of || "",
      body: [
        `${r.probed} conformant x402 hosts were each paid once as an ordinary buyer; ${r.paid_rows} accepted a signed payment attempt.`,
        `DELIVERED ${o.DELIVERED ?? 0}, REFUSED ${o.REFUSED ?? 0}, MISMATCH ${o.MISMATCH ?? 0}, NO_CHALLENGE ${o.NO_CHALLENGE ?? 0}.`,
        `${r.take_and_refuse} hosts reported a settlement transaction in their own PAYMENT-RESPONSE and refused the retried request anyway; every tx hash is in the rows, so the chain is the check.`,
        `${r.spend_usdc} USDC left our wallet. None of it is revenue and our own hosts are excluded.`,
        `Population digest ${String(r.hosts_sha256).slice(0, 16)}…`,
        CAVEAT,
      ].join(" "),
    });
  }

  // Absence is stated, never rendered as an empty list that reads like "nothing changed".
  if (!(idx.deltas || []).length) {
    const n = (idx.rounds || []).length;
    out.push({
      id: `${SITE}/interop/x402-census/index.json#no-delta`,
      title: n < 2 ? "No delta yet — one round is not a time series" : "No delta published for the rounds on file",
      link: `${SITE}/interop/x402-census/`,
      iso: idx.as_of || "",
      body:
        `${n} round(s) published. A delta needs two, and an empty delta would read as "nothing changed", ` +
        `which is a different claim from "nothing has been compared". ` +
        `A host reaches a published state at ${idx.ladder?.n_required ?? 30} paid observations, one per round; ` +
        `${idx.ladder?.hosts_at_or_above_n_required ?? 0} are there today. ${idx.ladder?.note ?? ""}`,
    });
  }

  return out.sort((a, b) => String(b.iso).localeCompare(String(a.iso)));
}

export const onRequestGet: PagesFunction = async () =>
  new Response(
    rss(
      "x402 settlement census — what hosts deliver, round by round",
      SELF,
      "A fixed population of conformant x402 hosts, paid once per round from a wallet we control, " +
        "with the outcome of every purchase recorded and the rounds diffed. Derived from the committed " +
        "rows; measurement, not certification; no host is ranked or recommended.",
      entries(),
    ),
    { headers: FEED_HEADERS },
  );
