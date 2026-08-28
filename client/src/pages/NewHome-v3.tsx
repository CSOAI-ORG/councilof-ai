/**
 * NewHome-v3 — councilof.ai Homepage (LEAN rebuild 2026-08-28)
 *
 * Structure: hero with three doors → ONE living board → products → below the fold
 *
 * WHAT WAS CUT:
 * - StoryWorldRest (13 slides that repeated the same value props)
 * - Duplicate living board (AxesGrid + LiveLeaderboard = shown twice)
 * - ToolStack "Nine problems, nine tools" brochure wall
 * - Industries/demographics/buyer grids (marketing, not product)
 * - Repeated pain/benefit blocks
 *
 * WHAT STAYS:
 * - Hero with honest measurement claim + three doors a stranger can use
 * - ONE living board (AxesGrid), link to /gspc-scoreboard for full grid
 * - Products matching live SKUs
 * - Refusals (doctrine is product)
 * - FAQ below the fold
 * - EnterpriseTrust / RegionBanner
 */
import { useEffect, useState, type ReactNode } from "react";
import EnterpriseTrust from "../components/EnterpriseTrust";
import RegionBanner from "../components/RegionBanner";
import {
  fetchAxes, hasInterval, quotable, wilson, publicCaption,
  type Axis, type InLaneAxis,
} from "../lib/gspcAxes";
import { useEstateFacts } from "@/lib/estateFacts";
import FaqBlock from "@/components/FaqBlock";
import { StoryWorldHero } from "@/components/home/StoryWorld";
import {
  ChevronRight, BarChart3,
  Eye, FileCheck, RefreshCw, Ban, Scale,
} from "lucide-react";

// ── data ───────────────────────────────────────────────────
// The product family, mirrored from /products (the packaging page) so the two cannot
// state different things about the same product. Live SKUs only.
// No prices here or there: verification is free forever and a grade is never sold.
// Live SKUs only: verify, board, OS, Space, embed, assess
const PRODUCT_FAMILY = [
  {
    name: "Verify a card",
    href: "/gspc-verify",
    tag: "Free forever",
    what: "Paste a signed measurement card. Your browser recomputes the hash and checks the Ed25519 signature. Nothing is sent to us. No account, no fee.",
  },
  {
    name: "The living board",
    href: "/gspc-scoreboard",
    tag: "GSPC",
    what: "Every slot we publish about AI behaviour. Measured cells carry a figure; empty cells stay honestly empty. Live from GET /api/gspc.",
  },
  {
    name: "Council OS",
    href: "/os",
    tag: "The workspace",
    what: "One window that opens every surface here — board, verifier, assessment, evidence pack — without a second tab or login.",
  },
  {
    name: "Council Space",
    href: "/gspc-arena",
    tag: "The contest",
    what: "Model versus model on frozen instruments. Every match is evidence, not a brochure. Ties stay ties.",
  },
  {
    name: "Embed badge",
    href: "/embed",
    tag: "For your site",
    what: "A self-verifying badge: WebCrypto checks the signature in each reader's own browser. Green only when the bytes are true. Free forever.",
  },
  {
    name: "Get measured",
    href: "/assess",
    tag: "Your system",
    what: "We run your system against frozen, published tests and hand you a signed card — the scores, the sample sizes, and the slots we could not fill.",
  },
];

// The refusals. Doctrine is a product feature, so it belongs on the front door in
// plain words rather than buried in the FAQ.
const REFUSALS = [
  { no: "We do not certify", why: "No conformity mark, no badge, no seal, no accreditation chain. We are not a notified body under the EU AI Act or anything else." },
  { no: "We do not sell a grade", why: "Nobody on the board pays for their place on it, their score, or their removal from either. Verification is free forever and needs no account." },
  { no: "We do not publish a number we did not measure", why: "UNMEASURED is a first-class state. An empty cell stays empty — inventing one is the exact behaviour this instrument exists to catch." },
  { no: "We do not let a model judge a model", why: "Every verdict is deterministic code against pre-written gold labels. An AI grading an AI is a correlated error, not an audit." },
  { no: "We do not promote a lead into a win", why: "Where a lead is not statistically separated we call it a tie — including when the model in front is one of ours." },
  { no: "We do not edit history", why: "Re-attestation issues a new signed record; the old one stands. Corrections are appended in public at /api/corrections, never silently applied." },
];



// ── sections ───────────────────────────────────────────────
/**
 * Section — the ONE band primitive for this page.
 *
 * Every band was previously writing its own `py-20 px-6 bg-white` (or
 * `bg-gray-50`, or `bg-slate-950`) plus its own `max-w-*`, so nothing lined up
 * and three different neutral families were on screen at once. Now a band picks
 * a `tone` and inherits the shared rhythm (.section-y), shell (.section-shell)
 * and type scale (.t-section/.t-lede) — all defined once in styles/index.css.
 *
 * Colours come from tokens, never from hard-coded greys, so the page is correct
 * in BOTH themes instead of being a white page wearing a dark header.
 */
type Tone = "base" | "raised" | "sunken";
const TONE: Record<Tone, string> = {
  base: "surface-base",
  raised: "surface-raised",
  sunken: "surface-sunken",
};

function Section({
  id, title, subtitle, children, tone = "raised",
}: { id?: string; title?: string; subtitle?: string; children: ReactNode; tone?: Tone }) {
  return (
    <section id={id} className={`section-y ${TONE[tone]}`}>
      <div className="section-shell">
        {title && <h2 className="t-section text-center text-foreground">{title}</h2>}
        {subtitle && (
          <p className="t-lede measure measure-center mt-4 text-center text-muted-foreground">{subtitle}</p>
        )}
        <div className="mt-10 sm:mt-12">{children}</div>
      </div>
    </section>
  );
}

// ── the product family ─────────────────────────────────
function ProductBand() {
  return (
    <Section
      id="products"
      title="What you can use today"
      subtitle="Ed25519 over canonical JSON, three-state verdicts (pass / fail / UNMEASURED), every public number recomputable from a live API. Verification is free forever and a grade is never sold."
      tone="raised"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_FAMILY.map(p => (
          <a key={p.href} href={p.href} className="card-quiet group flex flex-col p-5 sm:p-6">
            <span className="t-kicker text-primary">{p.tag}</span>
            <h3 className="mt-3 text-lg font-extrabold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">{p.name}</h3>
            <p className="t-body mt-2 flex-1 text-muted-foreground">{p.what}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              Open <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>
    </Section>
  );
}

// ── the refusals ───────────────────────────────────────
function RefusalBand() {
  return (
    <Section
      id="refusals"
      title="What we refuse to do"
      subtitle="The limits are the product. An instrument that will say anything measures nothing."
      tone="sunken"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REFUSALS.map(r => (
          <div key={r.no} className="card-quiet p-5 sm:p-6">
            <div className="flex items-start gap-2.5">
              <Ban className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden />
              <h3 className="t-card text-foreground">{r.no}</h3>
            </div>
            <p className="t-body mt-3 text-muted-foreground">{r.why}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <a href="/honesty" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <Eye className="h-4 w-4" /> The honesty gate — everything we cannot yet measure
        </a>
      </div>
    </Section>
  );
}


function AxesGrid() {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [inLane, setInLane] = useState<InLaneAxis[]>([]);
  const [subtitle, setSubtitle] = useState("GSPC (Governance · Safety · Provenance · Continuity). Slot counts are live on GET /api/gspc — we do not type them into this page.");

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => {
      setAxes(r.axes);
      setInLane(r.inLane);
      setSubtitle(`${publicCaption(r.publicCount)}. Empty cells stay empty.`);
    });
    return () => ac.abort();
  }, []);

  return (
    <Section title="The GSPC measurement slots" subtitle={subtitle} tone="sunken">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {axes.map(a => {
          const q = quotable(a);
          // `hasInterval` implies `quotable`, which guarantees a real accuracy.
          const ci = hasInterval(a) ? wilson(a.accuracy as number, a.n) : null;
          // Prefer the resolved bank URL the API now publishes (dataset_url); fall back to
          // the slug only while the wire has not shipped it. Never build the host here —
          // it lives in ONE place, functions/api/gspc.ts.
          const href = a.dataset_url || (a.dataset ? `https://huggingface.co/datasets/${a.dataset}` : "/gspc-scoreboard");
          return (
            <a key={a.axis} href={href} className="card-quiet group block p-5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground/80">{a.bench}</span>
                {/* `unmeasured` is a first-class published status — it keeps a real
                    badge here, legible in both themes, never dimmed out of view. */}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  q ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground ring-1 ring-border"
                }`}>
                  {a.status}
                </span>
              </div>
              <h3 className="t-card text-foreground transition-colors group-hover:text-primary">{a.axis}</h3>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{a.task || a.seat}</p>
              {q && (
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black tabular-nums text-primary">{(a.accuracy * 100).toFixed(0)}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">n={a.n}{ci ? ` · [${(ci[0]*100).toFixed(0)}–${(ci[1]*100).toFixed(0)}%]` : ""}</span>
                </div>
              )}
              {/* Two different absences. An axis that is MEASURED with a bank but publishes
                  no accuracy (the deterministic-facts financial rows) is not an axis with
                  no stamp at all — lane/os-tools-real's distinction, in master's tokens. */}
              {!q && (
                <div className="mt-3 text-xs italic text-muted-foreground">
                  {a.status === "MEASURED" && a.n > 0
                    ? `measured · n=${a.n} · no accuracy published`
                    : "no score on this stamp"}
                </div>
              )}
            </a>
          );
        })}
      </div>
      {inLane.length > 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/60 p-5 sm:p-6">
          <h3 className="t-card text-foreground">In-lane — not board rows</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">Published as measured_in_lane on GET /api/gspc. Not counted in totals.public_count.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {inLane.map((e) => (
              <div key={e.axis} className="card-quiet p-5">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-foreground/80">{e.bench}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground ring-1 ring-border">
                    {e.status}
                  </span>
                </div>
                <h3 className="t-card text-foreground">{e.axis}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{e.task}</p>
                {e.n > 0 && (
                  <div className="mt-3 text-xs tabular-nums text-muted-foreground">n={e.n}{typeof e.accuracy === "number" ? ` · ${(e.accuracy * 100).toFixed(0)}` : " · no accuracy published"}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-10 text-center">
        <a href="/gspc-scoreboard" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <BarChart3 className="h-4 w-4" /> Open the live scoreboard — counts from GET /api/gspc
        </a>
      </div>
    </Section>
  );
}

// ── the signed card chain ───────────────────────────────────────────────────
// Every number here comes from GET /api/state -> card_chain, which is built from
// scripts/derive-chain-facts.mjs re-verifying every published body with the same
// verifier we ship. Nothing on this page types a count.
//
// The load-bearing pair is withheld / withheldAttested. Publishing "22 withheld,
// every position accounted for" alone would present a DISCLOSURE as a PROOF. Since
// 2026-08-27 the chain manifest is itself signed (card-shaped envelope, verified at
// derivation time — manifest_signed), which makes the LIST non-repudiable; but a
// withheld id is INDEPENDENTLY attested only when a published card's SIGNED body
// names it as `prev`. The copy reads both facts off estateFacts and words them
// with exactly that distinction — nothing here types a count or a claim.
function CardChainBand() {
  const f = useEstateFacts();
  return (
    <Section
      id="chain"
      title="What you can check without asking us"
      subtitle="The board says what we measured. This says what we published, and exactly how far the cryptography reaches."
      tone="sunken"
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-white p-6 lg:col-span-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Published and verifying</p>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{f.verifiedSentence}</p>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Each card carries its own signature bytes, the public key, and the preimage rule that
            says exactly which bytes were signed. A zero-dependency JavaScript verifier ships at{" "}
            <code className="text-[12px]">/signed/verify-card.mjs</code> and the rule is written out at{" "}
            <code className="text-[12px]">/signed/HOW-TO-VERIFY.md</code>. Pin our key from{" "}
            <code className="text-[12px]">/.well-known/did.json</code> first — a card checked against
            the key it ships with proves only that the file is self-consistent.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Withheld, and the limit of the proof</p>
          <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{f.withheldSentence}</p>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            We would rather publish that limit than let a complete-looking manifest do work a
            signature has not done. Read the positions yourself at{" "}
            <code className="text-[12px]">/signed/chain.json</code>.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a href="/gspc-verify" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-800">
          Verify a card yourself <ChevronRight className="w-4 h-4" />
        </a>
        <a href="/api/state" className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-200 px-6 py-3 text-sm font-extrabold text-emerald-700 hover:bg-emerald-50">
          GET /api/state — where these numbers come from
        </a>
      </div>
    </Section>
  );
}


// ── FAQ — 21 answers, the whole proposition in plain English ──────────
// AEO/GEO: FaqBlock renders these as a native <details> accordion (crawlable
// with JS off, keyboard-operable) AND emits FAQPage JSON-LD for exactly these
// 21 pairs. Register rules apply to every answer: measurement not certification;
// counts are named with the endpoint and the stamp they came from, never floated
// free; UNMEASURED is a state, not a failure; no timestamp-authority or
// blockchain-anchoring claim (there is none — the anchor is Ed25519 over a
// SHA-256 hash chain); the council figure is DESIGN and is labelled as such.
const HOME_FAQ = [
  {
    q: "What is Council of AI?",
    a: "Council of AI (legally CSOAI Ltd, UK Companies House 16939677) is an independent measurement body for AI behaviour. We run AI systems against frozen, published tests drawn from real statute, grade the answers with deterministic code, sign the result with an Ed25519 key, and publish it — including the parts we could not measure. We are the instrument, not the referee: we produce evidence, and regulators, insurers and buyers decide what to do with it.",
  },
  {
    q: "What is a measurement card?",
    a: "A measurement card is the output: a small signed record — under a kilobyte of JSON — holding the axis measured, the exact model, the accuracy, who issued it, when it was created, the hash of the card before it in the chain, and the Ed25519 signature over all of that. That is the whole of it. Sample sizes, confidence intervals and separation determinations live on the board at GET councilof.ai/api/gspc, not inside the card; a card tells you a specific measurement happened and has not been altered since, and the board tells you how much weight it carries. It is small enough to email, attach to a tender, or keep in a compliance folder, and it is yours to hold — it does not live on our server for us to quietly amend later.",
  },
  {
    q: "How do I verify a measurement card myself?",
    a: "Three steps, and none of them involve us. First, fetch our public key from /.well-known/did.json and check the card carries that exact key — a card verified against the key it ships with proves only that the file is self-consistent, not that we issued it. Second, canonicalise the card's body — every key sorted, no whitespace — and take the SHA-256; that hash must equal the card's id. Third, verify the Ed25519 signature over those same bytes. One warning that matters if you implement this outside Python: the bytes were produced by CPython, which writes a float of integral value as 0.0 where JavaScript and Go write 0, so a naive verifier reports a false failure on a large minority of the set. We publish a zero-dependency JavaScript verifier that handles it at /signed/verify-card.mjs, and the exact rule at /signed/HOW-TO-VERIFY.md. The whole check runs offline, with no CSOAI code, no account and no permission — or in your browser at councilof.ai/gspc-verify. Note what is not in that chain: there is no RFC-3161 timestamp authority and no OpenTimestamps or blockchain anchoring, and our records say so with timestamp_authority: none. The anchor is the signature over the hash chain — a smaller claim you can check in seconds rather than a larger one you have to take on faith.",
  },
  {
    q: "What does a “measured of N” figure on the board mean?",
    a: "It is a coverage statement, not a grade: how many slots on the current stamp carry a measured result, versus how many are described honestly or left empty. We do not type that fraction into this page — read totals.public_count from GET councilof.ai/api/gspc, which is also where the stamp date lives.",
  },
  {
    q: "Why is a slot ever left UNMEASURED?",
    a: "Because measuring it properly is not possible yet, and inventing a number would be worse than an empty cell. A slot stays UNMEASURED when the sample is too small to quote — we do not publish a score below thirty graded items — or when the instrument has not been frozen and published, or when the legal gold labels are still with counsel. UNMEASURED is not a failing grade for the AI system; it is a disclosure about us. Silently filling that gap is the exact behaviour this whole instrument exists to catch.",
  },
  {
    q: "What is jail, or containment?",
    a: "Jail asks a blunt question: can this model be talked out of its own guardrails and made to act outside its sandbox? It is a measured floor, not a ranking. It was measured on a smaller fleet than the main board and on its own set of gold cells, and its separation has now been tested and came back a TIE — meaning no model on it is separated from the others at p<0.05, so we name no winner. All of that is printed on the axis rather than hidden behind it, and the current separation counts live in the totals block of GET /api/gspc. The best detector we measured still misses most escapes, and we publish that too.",
  },
  {
    q: "Why do you report a tie instead of naming a winner?",
    a: "Because most leads on a leaderboard are noise. When one model scores a little higher than another, we run a McNemar test on the items where the two actually disagreed. If the difference is not statistically separated, we call it a tie and we do not count it as a win — even when the model in front is one of ours. On the current board most axis are ties, and the exact split of separated leads to ties is published in the totals block of GET /api/gspc. A ranking that promotes every point-estimate lead to a victory is selling you a decimal point.",
  },
  {
    q: "Who pays Council of AI, and who never pays?",
    a: "No company we measure pays for its place on the board, its score, or its removal from either. Members of the public never pay us anything. Verification is free forever and needs no account. We fund ourselves by selling signed evidence artefacts — an attested report, a published dataset, a scheduled re-attestation — which are published whether the result flatters the buyer or not, and never as a fee for a ranking or a placement. If you can verify it, it is not behind a paywall.",
  },
  {
    q: "What does Council of AI NOT do?",
    a: "We do not certify. We do not accredit, and there is no accreditation chain behind us; we are not a notified body under the EU AI Act or anything else. We do not enforce — we cannot approve, ban, fine or clear any system. We issue no conformity mark, no badge and no seal for anyone to put in a footer. And a measurement card is not legal advice: it describes what a system did on published tests on a stated date, which is a narrower and more useful thing than a compliance verdict.",
  },
  {
    q: "Which regulations and frameworks do you cover?",
    a: "Two different things, and they are worth separating. The frozen provision bank is anchored by a published corpus hash inside the signed Article 50 pack at /packs/eu-article-50/provbench.json — that anchor, not a number on this page, is what fixes how many provisions were in the bank when it was signed. The published crosswalk is narrower than the bank: /crosswalk/east-west-v1.json maps one signed measurement across four regimes — the EU AI Act, the UK DRCF alignment, Illinois SB 315 and the Chinese TC260 alignment. Mappings to NIST AI RMF and ISO/IEC 42001 are described on our framework pages but are not in that published crosswalk, so treat them as described rather than as verified. New instruments are added as regulation actually lands, not when it is announced.",
  },
  {
    q: "What happens when the law changes?",
    a: "We watch the primary sources — EUR-Lex, legislation.gov.uk and the national registers — by hash, and we publish a dated deadline feed at councilof.ai/api/regulation. When a provision genuinely changes, we re-measure the affected systems and issue a delta card. The old card is not withdrawn, expired or overwritten: history here is append-only, so the record of what was true in August still reads correctly next year. Where the effective date of an obligation is genuinely disputed, we record the dispute rather than resolve it silently.",
  },
  {
    q: "How does a company get measured?",
    a: "Today there are two different things behind that question and we will not blur them. The free self-serve tool at /assess is a deterministic EU AI Act classifier: you describe the system in text, and a keyword decision table returns the Annex III tier and the gaps against a fixed Article 9–15/50 control set. It never contacts your endpoint and it is not a bench run, so it cannot tell you how your model behaves. A GSPC bench run — your system answering a frozen, published bank, graded deterministically, ending in a card that joins the chain — is not yet self-serve; it is arranged with us directly, and the honest reason is capacity, not policy. Both use the same items, the same grader and the same thresholds every other subject faced, so results stay comparable, and you get back what we could not fill as well as what we could.",
  },
  {
    q: "What do regulators get from a measurement card?",
    a: "A behavioural record they can re-compute themselves, rather than a supplier's assurance about its own product. Each provision in our bank is traceable from the statute text through to the specific items that test it, so a supervisor can see exactly what was asked and how the answer was graded. The card is signed, so its provenance survives being forwarded, and the empty slots tell a regulator where evidence does not yet exist — which is often the more actionable half.",
  },
  {
    q: "What do insurers get from a measurement card?",
    a: "Something to price against. Underwriting AI deployment risk currently means reading a questionnaire the applicant filled in about itself. A measurement card is instead an observed behavioural sample, with its sample size and interval published beside it on the board, so exposure can be reasoned about from behaviour rather than from a self-declaration. Scheduled automatic re-attestation is not yet available — re-measurement today is arranged run by run — so track drift by comparing dated cards rather than by expecting a subscription feed. We are the rail, not the referee: we do not tell an insurer what to charge, and we take no share of anything written on the back of a card.",
  },
  {
    q: "How does the arena work?",
    a: "Two systems face the same frozen items. Each match is a subject, an instrument and a fixed rule — never an opinion. The verdict is a predicate: the answer either satisfies the provision or it does not, and ties are reported as ties. Any round can be promoted into a signed card; practice runs stay practice and are never quoted. We do not publish an uptime figure for the arena and we are not going to imply one — how continuously it has actually run is unmeasured, and /api/state says so rather than us calling it round-the-clock.",
  },
  {
    q: "Why does no model ever judge another model?",
    a: "Because an AI grading an AI is a correlated error, not an audit — the judge shares the blind spots of the thing it is judging, and the score becomes a measure of family resemblance. Every verdict we publish comes from deterministic code against pre-written gold labels, so the same input always produces the same grade and you can read the grader yourself. Where a response cannot be parsed into a label at all, it is counted as unmeasured rather than silently scored as a wrong answer.",
  },
  {
    q: "What happens when Council of AI gets something wrong?",
    a: "It goes in the public corrections ledger at councilof.ai/api/corrections, which is appended and never edited or deleted. Each entry records what was wrong, how it was caught, and what changed. The hardest example is on that record: we had published a consensus guarantee for our council architecture, then measured how independent those seats actually were and found the effective number was n_eff 1.21 out of a nominal 3. The guarantee did not hold, so we retracted it (DR-0007) instead of rewording it. The council remains a designed 33-seat structure with a designed 23-of-33 threshold, and it is labelled as a design figure everywhere it appears.",
  },
  {
    q: "Can I see the actual tests and the scoring code?",
    a: "Yes, and you should. The instrument banks are published as open datasets, the grading harness is public, and the per-item rows behind every published score are the same rows we scored. That is the point of freezing an instrument: a benchmark you cannot re-run is a press release. If you re-run it and get a different answer to ours, that is a correction we want, and it goes in the ledger under your name.",
  },
  {
    q: "Is my result published, or is it mine to share?",
    a: "Yours. The card is signed but disclosure is your decision — hand it to a customer, attach it to a regulatory filing, or keep it entirely private. The signing key is public, so whoever you do show it to can verify it without contacting us and without us learning that they did. What we publish on the open board is our own model fleet and the systems whose owners chose publication.",
  },
  {
    q: "What is the difference between MEASURED, UNMEASURED and REPORTED?",
    a: "They are three different kinds of claim and we never merge them. MEASURED means we ran it on our own frozen instruments and signed the result; that is the only state that goes on the board. UNMEASURED means the cell is honestly empty — too small a sample, no separation test, or an instrument not yet frozen. REPORTED means a figure published by somebody else, cited and dated, carried for context and left unsigned; the human-performance baselines you see beside our AI figures are REPORTED aggregates from other people's studies, not our own collection. A REPORTED number never enters our board and is never averaged with a MEASURED one.",
  },
  {
    q: "How does an AI agent or an answer engine read all of this?",
    a: "The same way you do, only faster. The board is machine-readable at GET councilof.ai/api/gspc, third-party figures at /api/reported, the corrections ledger at /api/corrections, the signing keys at /.well-known/did.json and the dated deadline feed at /api/regulation. There is a summary for language models at /llms.txt and the endpoints are documented at /api-docs. Everything an agent needs to verify a claim is served without an account, because a trust layer that requires a login is not a trust layer.",
  },
];

// ── SEO / schema ─────────────────────────
// (qa-sweep 2026-08-19) The page-level WebSite + FAQPage constants were REMOVED:
// the shell (client/index.html) already ships the canonical WebSite node, and the
// FaqBlock below emits the FAQPage node for exactly the FAQ this page renders —
// the extra copies made the prerendered home carry duplicate WebSite/FAQPage
// JSON-LD, which answer engines treat as conflicting claims. The removed WebSite
// node also asserted a SearchAction the shell audit (2026-08-14) had already
// declined to claim until /search?q= is verified.

// ── export ───────────────────────────────
export default function NewHomeV3() {
  return (
    /* LEAN HOMEPAGE (2026-08-28):
       Hero → ONE board → products → refusals → trust → FAQ
       Cut: ToolStack brochure, StoryWorldRest slides, duplicate board,
       demographics/industries/blog strips. */
    <main className="surface-base">

      {/* Hero with honest measurement claim + three doors */}
      <StoryWorldHero />

      {/* ONE living board — the claim everything else rests on */}
      <AxesGrid />

      {/* Chain transparency: what can be verified without us */}
      <CardChainBand />

      {/* Products matching live SKUs only */}
      <ProductBand />

      {/* Doctrine is product: what we refuse to do */}
      <RefusalBand />

      {/* Trust badges (C2PA/OIN/LOT) */}
      <EnterpriseTrust />

      {/* Region detection banner on ink ground */}
      <div className="surface-ink pb-12 sm:pb-16">
        <div className="section-shell">
          <RegionBanner />
        </div>
      </div>

      {/* FAQ below the fold — full proposition in plain English */}
      <FaqBlock
        title="Questions people ask"
        intro={`${HOME_FAQ.length} plain-English answers: what we measure, what we refuse to claim, and how to check any of it yourself.`}
        items={HOME_FAQ}
      />
    </main>
  );
}
