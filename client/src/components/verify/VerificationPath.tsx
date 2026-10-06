/**
 * VerificationPath — a signed card's verification drawn as the path the check walks (the Cloudflare
 * SSL/TLS "current state + last / next check" pattern): record bytes → signature → signing key →
 * DID document → signed card index → public root, one mark per hop.
 *
 * Every mark comes from a check that actually ran: the browser verdict (RecordVerdict lines) for the
 * first four hops, the served card index for the fifth. The public-root hop is NOT_APPLICABLE on
 * purpose: signed-index cards are a separate corpus from the root's leaves (identifier overlap 0),
 * and the root's timestamp proof covers root.json bytes only. A hop that did not run is shown as
 * not run, never as passed. "Last verified" is this browser check; "next re-check" is only what a
 * published schedule says, and says so when there is none.
 */
import { useEffect, useState } from "react";
import type { RecordVerdict } from "@/lib/recordVerify";

type Mark = "pass" | "fail" | "not_run" | "not_applicable";
type Hop = { key: string; label: string; mark: Mark; detail: string };

const RULES: { key: string; label: string; re: RegExp }[] = [
  { key: "bytes", label: "Record bytes reproduce the id", re: /hash|content_id|preimage|\bid\b|canonical|framing|integral|envelope/i },
  { key: "sig", label: "Signature verifies", re: /signature|ed25519|unsigned/i },
  { key: "key", label: "Signing key is a pinned anchor", re: /anchor|key|signer|family/i },
  { key: "did", label: "Key is published in did:web:csoai.org", re: /did\.json|did:web|live/i },
];

// Claim lines in this order (the DID line also mentions a key); show them in RULES order.
const CLAIM_ORDER = ["did", "sig", "bytes", "key"];

export function hopsFrom(v: RecordVerdict | null): Hop[] {
  const used = new Set<number>();
  const byKey = new Map<string, Hop>();
  for (const k of CLAIM_ORDER) {
    const r = RULES.find((x) => x.key === k)!;
    byKey.set(k, hopFor(r, v, used));
  }
  return RULES.map((r) => byKey.get(r.key)!);
}

function hopFor(r: (typeof RULES)[number], v: RecordVerdict | null, used: Set<number>): Hop {
  {
    if (!v) return { key: r.key, label: r.label, mark: "not_run" as Mark, detail: "No check has run in this tab yet." };
    const lines = v.lines.filter((l, i) => {
      if (used.has(i) || l.code === "parse_ok") return false;
      const hit = r.re.test(`${l.label} ${l.code}`);
      if (hit) used.add(i);
      return hit;
    });
    if (!lines.length) return { key: r.key, label: r.label, mark: "not_run" as Mark, detail: "The verifier reported no check for this hop." };
    const fail = lines.find((l) => l.ok === false);
    const ran = lines.filter((l) => l.ok !== null);
    return {
      key: r.key,
      label: r.label,
      mark: (fail ? "fail" : ran.length ? "pass" : "not_run") as Mark,
      detail: (fail ?? ran[0] ?? lines[0]).detail,
    };
  }
}

/** True when at least one hop of the browser check passed or failed (ran), never for "not run". */
export function lastVerifiedApplies(hops: Hop[]): boolean {
  return hops.some((h) => h.mark === "pass" || h.mark === "fail");
}

const MARK: Record<Mark, { sym: string; word: string; cls: string }> = {
  pass: { sym: "✓", word: "passed", cls: "border-emerald-700 bg-emerald-50 text-emerald-950" },
  fail: { sym: "✗", word: "failed", cls: "border-rose-700 bg-rose-50 text-rose-950" },
  not_run: { sym: "○", word: "not run", cls: "border-slate-400 bg-slate-50 text-slate-900" },
  not_applicable: { sym: "–", word: "not applicable", cls: "border-slate-300 bg-white text-slate-800" },
};

export default function VerificationPath({
  verdict,
  cardId,
  indexIds,
  checkedAt,
}: {
  verdict: RecordVerdict | null;
  cardId: string | null;
  /** Card ids the pane read from the served signed card index (null when it could not be read). */
  indexIds: Set<string> | null;
  checkedAt: string | null;
}) {
  const [facts, setFacts] = useState<{ as_of: string | null } | null>(null);
  const [root, setRoot] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/state", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Record<string, any> | null) => {
        setFacts({ as_of: typeof d?.card_chain?.bodies_verified_valid?.as_of === "string" ? d.card_chain.bodies_verified_valid.as_of : null });
        setRoot(typeof d?.ledgers?.root_job === "string" ? d.ledgers.root_job : null);
      })
      .catch(() => setFacts({ as_of: null }));
  }, []);

  const checkHops = hopsFrom(verdict);
  // "Last verified" only when the browser check actually ran a hop. A pasted id or a malformed
  // record ends UNCHECKABLE with every hop "not run"; printing a time beside that read as a pass.
  const ranAny = lastVerifiedApplies(checkHops);
  const hops: Hop[] = [
    ...checkHops,
    {
      key: "index",
      label: "Listed in the signed card index (corpus 3)",
      mark: !cardId || !indexIds ? "not_run" : indexIds.has(cardId) ? "pass" : "fail",
      detail: !cardId
        ? "No card id to look up."
        : !indexIds
          ? "The served index could not be read, so membership was not checked."
          : indexIds.has(cardId)
            ? "The id is in the index this pane read from the site."
            : "The id is not in the index this pane read. A valid signature on an unlisted card is still only a signature.",
    },
    {
      key: "root",
      label: "Public root and its timestamp",
      mark: "not_applicable",
      detail: "Signed-index cards are a separate corpus from the public root's leaves (overlap 0); the root's timestamp covers root.json bytes only.",
    },
  ];

  return (
    <section aria-labelledby="vpath-h" className="mt-4 rounded-2xl border border-slate-900/10 bg-white p-4" data-ui-region="verify-result" data-testid="verification-path">
      <h3 id="vpath-h" className="text-sm font-semibold text-slate-900">
        Verification path{cardId ? <span className="ml-1 break-all font-mono text-xs font-normal text-slate-700">{cardId}</span> : null}
      </h3>
      <ol className="mt-3 space-y-0">
        {hops.map((h, i) => (
          <li key={h.key} className="relative flex gap-3 pb-3" data-mark={h.mark}>
            {i < hops.length - 1 ? <span aria-hidden="true" className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 bg-slate-300" /> : null}
            <span aria-hidden="true" className={`z-[1] inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 font-bold ${MARK[h.mark].cls}`}>
              {MARK[h.mark].sym}
            </span>
            <span className="min-w-0 pt-1">
              <span className="block text-sm font-semibold text-slate-900">
                {h.label} <span className="sr-only">: {MARK[h.mark].word}</span>
                <span aria-hidden="true" className="ml-1 font-mono text-xs font-normal text-slate-700">
                  {MARK[h.mark].word}
                </span>
              </span>
              <span className="block text-xs text-slate-700 [overflow-wrap:anywhere]">{h.detail}</span>
            </span>
          </li>
        ))}
      </ol>
      <dl className="mt-1 grid grid-cols-1 gap-x-3 gap-y-1 border-t border-slate-200 pt-3 text-xs text-slate-800 sm:grid-cols-[9rem_1fr]">
        <dt className="font-semibold">{ranAny && checkedAt ? "Last verified" : "Checked"}</dt>
        <dd data-testid="vpath-last-verified">
          {ranAny && checkedAt
            ? `${checkedAt.replace("T", " ").slice(0, 19)}Z, in this browser`
            : checkedAt
              ? "Not checked yet. The last attempt could not run any check on this text."
              : "Not checked yet."}
        </dd>
        <dt className="font-semibold">Corpus-wide check</dt>
        <dd>{facts?.as_of ? `Every body in the index last re-verified ${facts.as_of} (GET /api/state → card_chain)` : facts ? "The last corpus-wide run could not be read." : "Reading…"}</dd>
        <dt className="font-semibold">Next re-check</dt>
        <dd>
          No published schedule re-derives the card index (its producer signs, so it runs by hand, never in CI). You can re-check this
          card here at any time, free.{root ? ` The public root is rebuilt on its own schedule: ${root}.` : ""}
        </dd>
      </dl>
    </section>
  );
}
