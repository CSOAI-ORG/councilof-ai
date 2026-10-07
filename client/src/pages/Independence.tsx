import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";

// /independence: who runs CSOAI, who pays, where we have an interest, and how to challenge us.
//
// Every figure on this page is either (a) read in the browser from a file or endpoint this site
// serves, and says so, or (b) a public-register fact with the time it was fetched. Nothing is
// typed from memory. Where a fact has not been published, the page says "not yet published"; it
// never fills the gap. The own-model counts come from public/independence/own-model-disclosure.json,
// which scripts/build-own-model-disclosure.mjs derives from the signed card index on every build.
//
// Companies House, read 2026-09-27 (UTC):
//   https://find-and-update.company-information.service.gov.uk/company/16939677/officers        01:31:59Z
//   https://find-and-update.company-information.service.gov.uk/company/16939677                 01:31:59Z
//   https://find-and-update.company-information.service.gov.uk/company/16939677/persons-with-significant-control  01:32:10Z
// Re-read those pages before changing this block. Date of birth, nationality and residence are on
// the register and deliberately left off this page: they say nothing about independence.

const CH = "https://find-and-update.company-information.service.gov.uk/company/16939677";
const CONTACT = "nicholas@csoai.org";

type Load<T> = { state: "loading" } | { state: "ok"; data: T } | { state: "error" };

function useJson<T>(url: string): Load<T> {
  const [v, setV] = useState<Load<T>>({ state: "loading" });
  useEffect(() => {
    let live = true;
    fetch(url, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => live && setV({ state: "ok", data }))
      .catch(() => live && setV({ state: "error" }));
    return () => {
      live = false;
    };
  }, [url]);
  return v;
}

type Tag = { model: string; cards: number };
type Disclosure = {
  n_cards: number;
  source_sha256: string;
  source_created: string | null;
  header_agrees: boolean;
  rules: { id: string; test: string; basis: string; cards: number; model_tags: number; tags?: Tag[] }[];
  own_model_cards: number;
  unconfirmed: { cards: number; tags: Tag[] };
  no_rule_matched: { cards: number; tags: Tag[] };
};
type Gspc = {
  totals?: {
    own_leaders_excluded?: number;
    own_leaders_excluded_axes?: string[];
    comparison_axes?: number;
    public_leader_count?: number;
  };
  axes?: { axis: string; kind?: string; leader?: string | null; public_leader_state?: string; separation?: string }[];
};

/** How the board treats the axes where our own model held the point lead, partitioned from the
 *  served payload. Nothing is typed: every count and name is read off /api/gspc. `reconciles` is
 *  false when the parts do not add up to the comparison axes, and the page then says so instead
 *  of printing a sentence it cannot stand behind. */
export function exclusionPartition(g: Gspc | null | undefined) {
  const t = g?.totals ?? {};
  const cmp = (g?.axes ?? []).filter((a) => a.kind === "model-comparison");
  const ownLed = new Set(t.own_leaders_excluded_axes ?? []);
  const reranked = cmp.filter((a) => ownLed.has(a.axis) && a.leader);
  const withheld = cmp.filter((a) => a.public_leader_state === "EXCLUDED_OWN_MODEL");
  const noCard = cmp.filter((a) => a.public_leader_state === "NO_SIGNED_CARD");
  const namedLeaders = cmp.filter((a) => a.leader);
  const count = (xs: typeof cmp, s: string) => xs.filter((a) => (a.separation ?? "UNTESTED") === s).length;
  const comparison = typeof t.comparison_axes === "number" ? t.comparison_axes : cmp.length;
  return {
    comparison,
    ownLedCount: typeof t.own_leaders_excluded === "number" ? t.own_leaders_excluded : ownLed.size,
    reranked,
    withheld,
    noCard,
    namedLeaders,
    rerankedSeparated: count(reranked, "SEPARATED"),
    rerankedTie: count(reranked, "TIE"),
    rerankedUntested: count(reranked, "UNTESTED"),
    reconciles: namedLeaders.length + withheld.length + noCard.length === comparison,
  };
}
type Corrections = { corrections?: { detected_by?: string }[]; signature_state?: string };
type State = { card_chain?: { bodies_verified_valid?: { value?: number }; distinct_signing_keys?: { value?: number } } };
type Did = { verificationMethod?: { id: string; type?: string; controller?: string; publicKeyJwk?: { crv?: string } }[] };

// Same two name rules as the producer; used only to check the live board's named leaders.
const ownByName = (m?: string | null) =>
  typeof m === "string" && (/^(sov|clan)/i.test(m.trim()) || /^council\b/i.test(m.trim()) || /\(council specialist\)/i.test(m));

const Pending = ({ l, err }: { l: Load<unknown>; err: string }) => (
  <span className="text-slate-600">{l.state === "loading" ? "(reading…)" : `(${err})`}</span>
);

const Src = ({ children }: { children: ReactNode }) => (
  <p className="mt-2 text-sm leading-relaxed text-slate-600">{children}</p>
);

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="font-medium text-emerald-800 underline underline-offset-2 hover:decoration-2">
    {children}
  </a>
);

const NotPublished = ({ children }: { children: ReactNode }) => (
  <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] leading-relaxed text-amber-950">
    {children}
  </p>
);

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[17px] leading-relaxed text-slate-800">{children}</div>
    </section>
  );
}

const tagList = (tags: Tag[]) => tags.map((t) => `${t.model} (${t.cards})`).join(", ");

const LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Independence and conflicts of interest",
  description:
    "Who runs CSOAI Ltd, what is and is not published about its funding, how many of its signed cards measure its own models, whose keys sign its results, and how to challenge them.",
  url: "https://councilof.ai/independence/",
  publisher: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai", identifier: "UK Companies House 16939677" },
};

export default function Independence() {
  useEffect(() => {
    document.title = "Independence and conflicts of interest | Council of AI";
  }, []);

  const disc = useJson<Disclosure>("/independence/own-model-disclosure.json");
  const gspc = useJson<Gspc>("/api/gspc");
  const corr = useJson<Corrections>("/api/corrections");
  const state = useJson<State>("/api/state");
  const did = useJson<Did>("/.well-known/did.json");

  const d = disc.state === "ok" && disc.data.header_agrees ? disc.data : null;
  const namedLeaders = gspc.state === "ok" ? (gspc.data.axes || []).filter((a) => a.kind === "model-comparison" && a.leader) : [];
  const ownNamedLeaders = namedLeaders.filter((a) => ownByName(a.leader));
  const part = gspc.state === "ok" ? exclusionPartition(gspc.data) : null;
  const entries = corr.state === "ok" ? corr.data.corrections || [] : null;
  const external = entries ? entries.filter((e) => e.detected_by === "external report").length : null;
  const chain = state.state === "ok" ? state.data.card_chain : undefined;
  const keys = did.state === "ok" ? did.data.verificationMethod || [] : null;
  const ownControlled = keys ? keys.filter((k) => k.controller === "did:web:csoai.org").length : null;

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0c1a12]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Independence and conflicts of interest</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Who runs us, who pays, and where we have an interest</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          We measure AI systems, and we also build some of our own. This page sets out what the public register and our own
          signed data show about that, so you can weigh our results with it in mind. Where we have not published a fact yet,
          the page says so rather than filling the gap.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Register facts read on 27 September 2026. Counts marked as read live are fetched by your browser when this page loads.
        </p>

        <Section id="who" title="Who runs CSOAI Ltd">
          <p>
            The Council of AI is run by <strong>CSOAI Ltd</strong>, a private limited company, Companies House number{" "}
            <strong>16939677</strong>, incorporated on 2 January 2026, with its registered office in London, England.
          </p>
          <p>
            The register lists <strong>one officer and no resignations</strong>: Nicholas Brian George Templeman, director,
            appointed 2 January 2026. It lists <strong>one person with significant control</strong>, the same person, through
            ownership of 75% or more of the shares.
          </p>
          <p>
            So one person directs and controls the company that writes our tests, runs them, signs the results and publishes
            them.
          </p>
          <Src>
            Source: Companies House, <A href={`${CH}/officers`}>officers</A> and{" "}
            <A href={CH}>company overview</A> read 27 September 2026 at 01:31:59 UTC;{" "}
            <A href={`${CH}/persons-with-significant-control`}>persons with significant control</A> read at 01:32:10 UTC.
          </Src>
          <NotPublished>
            Roles, shareholdings or paid work that anyone at CSOAI holds with an AI developer whose models we measure: not yet
            published.
          </NotPublished>
        </Section>

        <Section id="funding" title="How we are funded">
          <NotPublished>
            Funding sources: not yet published; request via <a href={`mailto:${CONTACT}`} className="font-medium underline">{CONTACT}</a>.
          </NotPublished>
          <NotPublished>In-kind support (free compute, credits or programme membership): not yet published.</NotPublished>
          <p>Reading what we have published, and checking any signature on it, needs no account and costs nothing.</p>
        </Section>

        <Section id="own-models" title="We build and measure our own models">
          <p>This is our largest conflict of interest, so here it is with the numbers.</p>
          <p>
            Of the <strong>{d ? d.n_cards : <Pending l={disc} err="count unavailable" />}</strong> cards in our signed card
            index, <strong>{d ? d.own_model_cards : <Pending l={disc} err="count unavailable" />}</strong> measure a model we
            built ourselves.
          </p>
          {d ? (
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>{d.rules[0].cards}</strong> cards, across {d.rules[0].model_tags} model tags, name a model whose tag
                begins <code>sov</code> or <code>clan</code>. Our own models (prompt overlays and specialists built on stock
                base models) are published under those two prefixes.
              </li>
              <li>
                <strong>{d.rules[1].cards}</strong> cards name a model whose tag begins with the word <code>council</code> (
                {tagList(d.rules[1].tags || [])}). This is the same test the public board uses to recognise our models.
              </li>
              <li>
                <strong>{d.unconfirmed.cards}</strong> cards, on {tagList(d.unconfirmed.tags)}, may also be ours. Their names
                suggest a model we derived, but nothing we hold confirms it, so they are counted on neither side.
              </li>
              <li>
                <strong>{d.no_rule_matched.cards}</strong> cards match no rule. That describes the rule, not who built the model.
              </li>
            </ul>
          ) : null}
          <p>
            How each card was classed: only the <code>model</code> field of each signed card body is read, and it is tested
            against the name rules above, in that order. Ownership is decided by name, not by a registry of model digests,
            which is the weakness of this count.
          </p>
          <Src>
            Source: <A href="/independence/own-model-disclosure.json">own-model-disclosure.json</A>, derived on every build from{" "}
            <A href="/signed/card_index.json">/signed/card_index.json</A>
            {d ? ` (SHA-256 ${d.source_sha256.slice(0, 16)}…, index created ${d.source_created?.slice(0, 10) ?? "undated"})` : ""}.
            The signed card index is one of three separate card collections we publish, and these counts describe that one
            only. They are not a count of everything we have measured.
          </Src>

          <h3 className="pt-4 text-xl font-semibold">How we keep it off the public board</h3>
          <p>
            The public board never names our own model as the leader. Where one of our models held the point lead, it is
            taken out of the comparison. Where the published per-item rows let us compare the base models again without it,
            the board shows the best third-party model and says whether its lead separated. Where they do not, the board
            shows no leader. The measurements of our models and their signed cards stay on the record.
          </p>
          <p data-testid="own-model-partition">
            {gspc.state !== "ok" ? (
              <Pending l={gspc} err="board unavailable" />
            ) : !part || !part.reconciles ? (
              "(counts do not reconcile; read /api/gspc)"
            ) : (
              <>
                Read live: one of our models held the point lead on <strong>{part.ownLedCount}</strong> of{" "}
                {part.comparison} model-comparison axes.{" "}
                {part.reranked.length > 0 && (
                  <>
                    On {part.reranked.length} of them ({part.reranked.map((a) => a.axis).join(", ")}) the board compares
                    the base models without ours and shows the best third-party model; {part.rerankedSeparated} of those
                    leads separated
                    {part.rerankedTie > 0 ? `, ${part.rerankedTie} ${part.rerankedTie === 1 ? "is a tie" : "are ties"} (top observed, not separated)` : ""}
                    {part.rerankedUntested > 0 ? `, ${part.rerankedUntested} untested` : ""}.{" "}
                  </>
                )}
                {part.withheld.length > 0 && (
                  <>
                    On {part.withheld.length} ({part.withheld.map((a) => a.axis).join(", ")}) it shows no leader.{" "}
                  </>
                )}
                {part.noCard.length > 0 && (
                  <>
                    On {part.noCard.length} more ({part.noCard.map((a) => a.axis).join(", ")}) it shows no leader because
                    that leader has no signed card.{" "}
                  </>
                )}
                In all, the board names {part.namedLeaders.length} leaders on the {part.comparison} model-comparison axes, and{" "}
                {ownNamedLeaders.length} of them match any of our own-model name rules.
              </>
            )}
          </p>
          <p>
            A gap we have not closed: the board&rsquo;s test only recognises names that begin with <code>council</code> or are
            marked &ldquo;council specialist&rdquo;. It would not recognise a <code>sov</code> or <code>clan</code> tag. The
            check above runs every rule against the named leaders so you can see it holds today.
          </p>
          <Src>
            Source: <A href="/api/gspc">/api/gspc</A> → <code>totals.own_leaders_excluded</code>,{" "}
            <code>totals.own_leaders_excluded_axes</code>, <code>axes[].public_leader_state</code>,{" "}
            <code>axes[].separation</code> and <code>axes[].historical_measurement_record.scope</code>. The rule is{" "}
            <code>isOwnCouncilModel</code> in <code>functions/api/gspc.ts</code>.
          </Src>
          <p>
            <strong>Proposed, not built:</strong> each new card would carry a signed yes-or-no field saying whether it measures
            one of our models, decided from a published registry of model digests rather than by name.
          </p>
        </Section>

        <Section id="keys" title="Who holds the signing keys">
          <p>
            Our DID document lists{" "}
            <strong>{keys ? keys.length : <Pending l={did} err="DID document unavailable" />}</strong> Ed25519 keys
            {keys ? `, and names did:web:csoai.org as the controller of ${ownControlled} of them` : ""}. That is our own
            identifier: every key listed there is ours, and our cards and our board are signed with these keys, not by an
            outside party.
          </p>
          {keys ? (
            <ul className="list-disc space-y-1 pl-5 font-mono text-sm break-all">
              {keys.map((k) => (
                <li key={k.id}>{k.id}</li>
              ))}
            </ul>
          ) : null}
          <p>
            The board is signed with <code>#board-attestation-1</code>. The cards in the signed card index are signed with{" "}
            <code>#card-attestation-1</code>: read live,{" "}
            <strong>{chain?.bodies_verified_valid?.value ?? <Pending l={state} err="unavailable" />}</strong> card bodies
            verify, under <strong>{chain?.distinct_signing_keys?.value ?? "?"}</strong> signing{" "}
            {chain?.distinct_signing_keys?.value === 1 ? "key" : "keys"}.
          </p>
          <p>A valid signature shows that we signed the bytes. It does not show that anyone else has checked them.</p>
          <Src>
            Source: <A href="/.well-known/did.json">/.well-known/did.json</A> (also served at csoai.org);{" "}
            <A href="/api/state">/api/state</A> → <code>card_chain</code>.
          </Src>
        </Section>

        <Section id="evaluator" title="We are the evaluator and the publisher">
          <p>
            The same company writes the frozen tests, runs the models, grades the answers, signs the cards and publishes the
            board.
          </p>
          <p>
            <strong>No outside party has yet re-run one of our measurements</strong>, as far as our records show. Outsiders
            have checked our published bytes: an outside audit on 26 August 2026 recomputed the jail axis from our published
            per-item rows and found one arithmetic error (correction C-2026-0826-09), and an outside implementer verified a card
            signature in Python (C-2026-0826-07). Recomputing from our rows and checking a signature are useful, but they are
            not the same as running the test again.
          </p>
          <p>
            Read live: our corrections ledger holds{" "}
            <strong>{entries ? entries.length : <Pending l={corr} err="ledger unavailable" />}</strong> entries, of which{" "}
            <strong>{external ?? "?"}</strong> were reported from outside CSOAI.
          </p>
          <Src>
            Source: <A href="/api/corrections">/api/corrections</A> → <code>corrections[].detected_by</code>; readable at{" "}
            <Link href="/corrections/" className="font-medium text-emerald-800 underline underline-offset-2">
              /corrections/
            </Link>
            .
          </Src>
        </Section>

        <Section id="challenge" title="How to challenge a result">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong>Check it yourself first.</strong> Every signed card can be verified on your own machine with our public
              key, with no account and no permission from us:{" "}
              <Link href="/gspc-verify" className="font-medium text-emerald-800 underline underline-offset-2">
                how to verify
              </Link>
              .
            </li>
            <li>
              <strong>Ask for a re-check.</strong> Email <a href={`mailto:${CONTACT}`} className="font-medium underline">{CONTACT}</a>{" "}
              with the card id and what you think is wrong. Disputes are answered by re-running the frozen test:{" "}
              <Link href="/dispute/" className="font-medium text-emerald-800 underline underline-offset-2">
                appeals and disputes
              </Link>
              . Today the owner of CSOAI Ltd reviews every dispute; there is no independent arbiter yet.
            </li>
            <li>
              <strong>Lodge a formal objection.</strong>{" "}
              <Link href="/challenge/" className="font-medium text-emerald-800 underline underline-offset-2">
                /challenge/
              </Link>{" "}
              gives you a receipt, but challenges are not stored on our side yet, so email us as well and keep the receipt.
            </li>
            <li>
              <strong>See what we got wrong before.</strong> Every correction goes in the public{" "}
              <Link href="/corrections/" className="font-medium text-emerald-800 underline underline-offset-2">
                corrections ledger
              </Link>
              , which says what was wrong, how it was caught and what changed.
            </li>
          </ol>
        </Section>

        <Section id="not-certification" title="Measurement, not certification">
          <p>
            A score describes one run of one model on one frozen test on one date. We do not certify, approve or endorse
            anything, we issue no conformity marks, and we are not a regulator. A good result from us is not a compliance
            verdict, and a bad one is not a ban.
          </p>
        </Section>

        <p className="mt-12 border-t border-slate-200 pt-4 text-sm text-slate-600">
          This page changes when our ownership, funding or own-model counts change. The counts regenerate on every build; the
          register facts are re-read by hand. See also{" "}
          <Link href="/methodology" className="font-medium text-emerald-800 underline underline-offset-2">
            methodology
          </Link>{" "}
          and{" "}
          <Link href="/about/" className="font-medium text-emerald-800 underline underline-offset-2">
            about
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
