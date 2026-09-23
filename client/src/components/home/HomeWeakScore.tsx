/**
 * HomeWeakScore — the weakest score we publish, verified in the reader's own browser.
 *
 * WHY IT IS ON THE FRONT DOOR. "We publish our failures" is the kind of sentence anybody can
 * write. This band makes it checkable in one screen: it names a low published score on one of
 * our OWN models, fetches that card off the wire, pins our key from the published DID
 * document, recomputes the card's id from its canonical body and checks the Ed25519 signature —
 * all in the reader's browser, with nothing sent to us. The verdict on screen is whatever the
 * check returns. If it ever says INVALID or UNCHECKABLE, that is what will be on this page.
 *
 * THE CARD ID IS TYPED. THE FIGURES ARE NOT. A signed record is addressed by its hash; naming
 * one is naming a fixed object, not quoting a count. Everything read OUT of that card — the
 * axis, the model, the accuracy, the date — is read from the bytes that were fetched, never
 * from this file. If the card ever stops resolving, the band says so instead of printing a
 * number from memory.
 *
 * THE SUPERSEDED FRAMING STAYS VISIBLE. The card's body carries public_framing "13 measured of
 * 14 quotable" — true on the day it was signed and superseded since. Signed bytes are never
 * edited, so the old framing stays inside the signature and the band says out loud that the
 * live board, not the card body, is what is true today. That is the rule this whole estate runs
 * on: supersede, never overwrite.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fetchPinnedCardKey, verifyCard, type CardVerdict } from "@/lib/cardVerify";

/**
 * A low published score on one of our own models, addressed by its own hash.
 *
 * NOT "the lowest" - that superlative was on this page until it was counted, and it was wrong.
 * Across all 335 signed bodies the minimum accuracy is 0.0, not this one: eighty-five records
 * sit at zero. What this card is, exactly, is a single-digit score on a model we trained
 * ourselves, signed under the same key as every other result and still on the board. Three
 * cards share this accuracy on this axis; this is the one whose chain begins at genesis.
 */
export const WEAK_CARD_ID = "82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c";
export const WEAK_CARD_URL = `/signed/cards/${WEAK_CARD_ID}.json`;

export interface WeakCard {
  id?: string;
  alg?: string;
  pubkey?: string;
  body?: {
    axis?: string;
    model?: string;
    accuracy?: number;
    created?: string;
    issuer?: string;
    public_framing?: string;
    prev?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export type CardRead =
  | { kind: "loading" }
  | { kind: "ready"; card: WeakCard; verdict: CardVerdict }
  | { kind: "failed"; reason: string };

/** Percentage from the card's own accuracy field. Absent stays absent. */
export function accuracyText(card: WeakCard | null): string {
  const a = card?.body?.accuracy;
  return typeof a === "number" && Number.isFinite(a) ? `${(a * 100).toFixed(1)}%` : "not published";
}

export function fieldText(card: WeakCard | null, key: string): string {
  const v = card?.body?.[key];
  return typeof v === "string" && v.trim() !== "" ? v : "not published";
}

/** The three words the verifier is allowed to say, and how each one reads on screen. */
export const VERDICT_WORDS: Record<CardVerdict["state"], { word: string; tone: string }> = {
  VALID: { word: "VALID", tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200" },
  INVALID: { word: "INVALID", tone: "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:text-rose-200" },
  UNCHECKABLE: { word: "UNCHECKABLE", tone: "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200" },
};

function useWeakCard(injected?: CardRead): CardRead {
  const [read, setRead] = useState<CardRead>({ kind: "loading" });
  useEffect(() => {
    if (injected) return;
    let alive = true;
    const ac = new AbortController();
    (async () => {
      const r = await fetch(WEAK_CARD_URL, { signal: ac.signal, headers: { accept: "application/json" } });
      if (!r.ok) throw new Error(`${WEAK_CARD_URL} answered HTTP ${r.status}`);
      const card = (await r.json()) as WeakCard;
      const key = await fetchPinnedCardKey(ac.signal);
      const verdict = await verifyCard(card, key);
      if (alive) setRead({ kind: "ready", card, verdict });
    })().catch((e: unknown) => {
      if (alive) setRead({ kind: "failed", reason: e instanceof Error ? e.message : String(e) });
    });
    return () => {
      alive = false;
      ac.abort();
    };
  }, [injected]);
  return injected ?? read;
}

/**
 * One field of the card panel.
 *
 * INK TOKENS, NOT THEME TOKENS. This panel sits on `surface-ink`, which is dark in BOTH colour
 * schemes. `text-foreground` and `text-muted-foreground` follow the scheme, so in light mode
 * they resolved to near-black — and the four values a reader most needs from a signed card (what
 * was tested, which system, when it was signed, who issued it) rendered dark-on-dark and were
 * effectively invisible. Caught by looking at a 1280px light-mode screenshot on 2026-09-23.
 * Every other line in this component already used the --ink-* tokens; this one did not.
 */
function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="t-kicker ink-muted">{label}</dt>
      <dd
        className={`mt-1.5 text-[15px] font-bold text-[color:var(--ink-foreground)] ${mono ? "break-all font-mono text-[13px]" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

export default function HomeWeakScore({ read: injected }: { read?: CardRead }) {
  const read = useWeakCard(injected);
  const card = read.kind === "ready" ? read.card : null;
  const verdict = read.kind === "ready" ? read.verdict : null;

  return (
    <section
      id="weak-score"
      aria-labelledby="weak-h"
      className="surface-ink section-y scroll-mt-20"
      data-testid="home-weak-score"
    >
      <div className="section-shell grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-20">
        <div>
          <p className="t-kicker ink-kicker">The number a vendor would bury</p>
          <h2 id="weak-h" className="t-band mt-4 text-[color:var(--ink-foreground)]">
            Here is one of our own models, scoring single digits.
          </h2>
          <p className="t-lede measure mt-6 ink-muted">
            We trained it. It has been on the board since the day it was measured, signed with the
            same key as every other result, and it is not going anywhere. It is not even the
            bottom: the signed set runs all the way down to zero. A score that only ever goes up
            is not a measurement — it is marketing with a chart.
          </p>
          <p className="measure mt-5 text-[15px] leading-[1.65] ink-muted">
            The panel beside this is not a screenshot. Your browser fetched the record, pinned our
            public key from the published identity document, recomputed the record&apos;s
            fingerprint from its own contents and checked the signature. Nothing was sent to us,
            and nothing needed our permission.
          </p>
          <p className="measure mt-4 text-[15px] leading-[1.65] ink-muted">
            And you do not have to take our word for which record we chose to show you.{" "}
            <a href="/signed/card_index.json" className="font-bold text-emerald-300 underline underline-offset-4">
              Every signed record is listed here
            </a>
            , each one a single fetch from its own body, so you can go and find the low ones
            yourself.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/gspc-verify"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-400 px-6 text-sm font-black text-[#03110b] transition hover:bg-emerald-300"
            >
              Check any record yourself →
            </Link>
            <a
              href="/signed/HOW-TO-VERIFY.md"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[color:var(--ink-border)] px-6 text-sm font-bold text-[color:var(--ink-foreground)] transition hover:border-[color:var(--ink-border-hover)]"
            >
              The rule, written out
            </a>
          </div>
        </div>

        <div className="ink-card rounded-3xl p-6 sm:p-8" data-testid="weak-card-panel">
          {read.kind === "loading" ? (
            <p className="font-mono text-sm ink-muted">fetching {WEAK_CARD_URL} …</p>
          ) : read.kind === "failed" ? (
            <div>
              <p className="text-lg font-black text-amber-200">The record could not be read.</p>
              <p className="mt-2 text-sm leading-relaxed ink-muted">{read.reason}</p>
              <p className="mt-3 text-sm ink-muted">
                Nothing is shown in its place.{" "}
                <a href={WEAK_CARD_URL} className="font-bold text-emerald-300 underline underline-offset-2">
                  Try the record directly
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <p className="font-mono text-5xl font-black tabular-nums text-white sm:text-6xl" data-testid="weak-accuracy">
                  {accuracyText(card)}
                </p>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs font-black ${
                    VERDICT_WORDS[verdict!.state].tone
                  }`}
                  data-verdict={verdict!.state}
                >
                  {VERDICT_WORDS[verdict!.state].word}
                </span>
              </div>
              <p className="mt-2 text-sm ink-muted">{verdict!.reason}</p>

              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[color:var(--ink-border)] pt-7">
                <Field label="what was tested" value={fieldText(card, "axis")} />
                <Field label="which system" value={fieldText(card, "model")} />
                <Field label="signed on" value={fieldText(card, "created")} />
                <Field label="issued by" value={fieldText(card, "issuer")} />
              </dl>
              <p className="mt-6 break-all font-mono text-[11px] leading-relaxed text-[color:var(--ink-muted)]">
                <span className="font-sans font-bold uppercase tracking-wider">record id · </span>
                {card?.id ?? "not published"}
              </p>

              <p className="mt-6 rounded-2xl border border-[color:var(--ink-border)] bg-white/[0.04] p-4 text-[13px] leading-relaxed ink-muted">
                <strong className="font-black text-[color:var(--ink-foreground)]">
                  One thing inside this record is out of date, on purpose.
                </strong>{" "}
                It describes the board as &ldquo;{fieldText(card, "public_framing")}&rdquo;, which was
                true when it was signed. Signed bytes are never edited here, so the old wording stays
                inside the signature and the live board above says what is true today. We supersede;
                we do not overwrite.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
