import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { RotatingHighlight } from "../type/RotatingHighlight";
import { SECTION_TITLES } from "../type/sectionTitles";
import { VideoEmbed } from "@/components/scrollworld";
import FooterVerifyStrip from "../FooterVerifyStrip";
import { ANCHORING_CLAIM } from "../../data/anchoringClaim";

/**
 * LivingStages — the lower homepage. Six image-backed bands that answer the
 * questions the rest of the page never gets to.
 *
 * WHY THIS FILE WAS REBUILT (2026-08-20). It used to render three flat near-black
 * sections with no imagery — voids that restated what StoryWorld had already said
 * (arena, colosseum, board). The page had no answer at all for the questions a
 * first-time reader actually asks: who pays you, what are you NOT, how do I check
 * a card without trusting you, what happens when you are wrong, what happens when
 * the law moves, and where do humans sit in the numbers. Those are the gaps this
 * file now fills, in the same design language as StoryWorld: a bright full-bleed
 * plate with a frosted WHITE type panel over its open space — never a dark scrim.
 *
 * IMAGERY IS FACT-CHECKED, NOT DECORATIVE. Five of the nine rebranded infographics
 * were REJECTED outright because they render claims we have publicly corrected
 * (RFC-3161 / OpenTimestamps anchoring — our timestamp_authority is "none" and the
 * real anchor is Ed25519 + a SHA-256 hash chain; "certificates that expire" — we
 * issue a delta card and history is append-only; jail as a "gated unmeasured slot"
 * — jail is MEASURED, n=71, separation TIE; and a withdrawn consensus claim).
 * The four that survived ship ONLY as pre-cropped derivatives under
 * /images/infographics/crop/. The nine originals are deliberately NOT committed:
 * public/ is the served publicDir, so committing them would put the corrected
 * claims back on a live URL, and a CSS-masked crop could be un-masked by a later
 * layout change. Cropping at source makes what ships identical to what was
 * fact-checked. The rejection list is in the PR body; never add an image here
 * without opening it and reading every panel first.
 *
 * COUNTS ARE LIVE. Nothing here hardcodes an axis count, a model count or a
 * corrections count. They read from /api/gspc, /api/corrections, /api/reported and
 * /api/regulation. A count renders ONLY once its payload has landed — the
 * prerendered snapshot therefore carries no figure at all rather than a stale one,
 * and no heading is ever left holding a placeholder dash.
 */

/* ─── live data ─────────────────────────────────────────────── */

function useJson<T>(url: string): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(url, { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive) setData(j as T);
      })
      .catch(() => {
        /* offline / prerender: the surface renders without the number, never with a guess */
      });
    return () => {
      alive = false;
    };
  }, [url]);
  return data;
}

type GspcTotals = {
  axes?: number;
  measured_axes?: number;
  quotable_axes?: number;
  public_count?: string;
  items?: number;
  separated_leads?: number;
  ties?: number;
};
type Gspc = {
  measured_on?: { date?: string; model?: string };
  totals?: GspcTotals;
  axes?: { axis?: string; status?: string; n?: number }[];
};
type Corrections = { corrections?: { id: string; date: string; what_was_wrong: string }[] };
type Reported = { count?: number; entries?: { id: string; claim: string; source: string; as_of?: string }[] };
type RegFeed = {
  verified_as_of?: string;
  deadlines?: { date: string; instrument: string; what: string; basis?: string; status?: string }[];
};

/* ─── shared shapes ───────────────────────────────────────── */

type Point = { tag: "pain" | "benefit" | "usp"; text: string };

const TAG_STYLE: Record<Point["tag"], string> = {
  pain: "bg-rose-100 text-rose-700",
  benefit: "bg-emerald-100 text-emerald-700",
  usp: "bg-emerald-600/15 text-emerald-800 ring-1 ring-inset ring-emerald-600/25",
};
const TAG_LABEL: Record<Point["tag"], string> = {
  pain: "pain",
  benefit: "benefit",
  usp: "only here",
};

function Points({ points }: { points: Point[] }) {
  return (
    <ul className="measure mt-7 space-y-3">
      {points.map((p) => (
        <li key={p.text} className="flex items-start gap-3">
          <span
            className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${TAG_STYLE[p.tag]}`}
          >
            {TAG_LABEL[p.tag]}
          </span>
          <span className="text-[15px] font-medium leading-[1.6] text-gray-700">{p.text}</span>
        </li>
      ))}
    </ul>
  );
}

function Cta({ href, label, secondary }: { href: string; label: string; secondary?: { href: string; label: string } }) {
  return (
    <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-emerald-700"
      >
        {label}
      </Link>
      {secondary && (
        <Link
          href={secondary.href}
          className="inline-flex items-center justify-center rounded-xl border border-emerald-600/35 bg-white px-6 py-3.5 text-sm font-extrabold text-emerald-700 transition-colors hover:border-emerald-600/60 hover:bg-emerald-50"
        >
          {secondary.label}
        </Link>
      )}
    </div>
  );
}

/** Full-bleed bright plate, frosted white type panel over its open space. */
function HeavyBand({
  image,
  alt,
  panelSide = "left",
  objectPosition,
  children,
}: {
  image: string;
  alt: string;
  panelSide?: "left" | "right";
  objectPosition?: string;
  children: ReactNode;
}) {
  const wash =
    panelSide === "right"
      ? "bg-gradient-to-l from-white/75 via-white/25 to-transparent"
      : "bg-gradient-to-r from-white/75 via-white/25 to-transparent";
  return (
    <section className="surface-raised relative flex min-h-[78svh] items-center overflow-hidden">
      <img
        src={image}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={objectPosition ? { objectPosition } : undefined}
      />
      <div className={`absolute inset-0 ${wash}`} />
      <div className="section-shell section-y relative z-10">
        <div className={`max-w-xl ${panelSide === "right" ? "ml-auto" : ""}`}>
          <div className="rounded-3xl border border-white/70 bg-white/88 p-6 shadow-[0_24px_70px_-30px_rgba(4,18,12,.55)] backdrop-blur-md sm:p-9 lg:p-10">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * A pre-cropped infographic panel. The files under /images/infographics/crop/ are
 * cut to the honest region at build time rather than masked with CSS, so what
 * ships is exactly what was fact-checked — there is no way for a layout change to
 * reveal a panel that was meant to stay out of frame.
 */
function Figure({ src, alt, caption, className = "" }: { src: string; alt: string; caption?: string; className?: string }) {
  return (
    <figure className={className}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="w-full rounded-3xl bg-card shadow-xl ring-1 ring-border"
      />
      {caption && <figcaption className="measure mt-3 text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

/** Split band: an honest infographic panel beside the type. */
function SplitBand({
  image,
  alt,
  video,
  poster,
  mediaSide = "right",
  tint = "surface-raised",
  caption,
  children,
}: {
  image?: string;
  alt: string;
  /** when set, the media column plays a branded clip instead of showing a still */
  video?: string;
  poster?: string;
  mediaSide?: "left" | "right";
  tint?: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section className={`relative ${tint}`}>
      <div className="section-shell section-y grid grid-cols-1 items-center gap-14 py-8 lg:grid-cols-2 lg:gap-20">
        <div className={mediaSide === "right" ? "lg:order-1" : "lg:order-2"}>{children}</div>
        {video ? (
          <VideoEmbed
            src={video}
            poster={poster ?? ""}
            title={alt}
            caption={caption}
            className={mediaSide === "right" ? "lg:order-2" : "lg:order-1"}
          />
        ) : (
          <Figure
            src={image!}
            alt={alt}
            caption={caption}
            className={mediaSide === "right" ? "lg:order-2" : "lg:order-1"}
          />
        )}
      </div>
    </section>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="t-kicker text-emerald-700">{children}</span>
  );
}
function Heading({ children }: { children: ReactNode }) {
  return (
    <h2 className="t-band mt-4 text-gray-900">
      {children}
    </h2>
  );
}
function Body({ children }: { children: ReactNode }) {
  return <p className="t-lede measure mt-5 font-medium text-gray-700">{children}</p>;
}

/* ─── 1 · independence ────────────────────────────────────────── */

function Independence() {
  return (
    <HeavyBand
      // 2026-08-26: this band shipped /images/band/anchor.png, whose largest element was a
      // baked-in Zenodo DOI ("10.5281/zenodo.21991104") sitting over the headline. A DOI is not
      // a statement about funding, the alt text never mentioned it, and a hard-coded identifier
      // inside a raster is invisible to every gate this repo runs. The plate is the same artwork
      // with that text cropped away, saved under a name that says what the band is about.
      image="/images/band/independence.png"
      objectPosition="72% 50%"
      alt="A pale sphere held inside thin orbital rings studded with green markers"
      panelSide="left"
    >
      <Kicker>How we are funded</Kicker>
      <Heading>
        <RotatingHighlight {...SECTION_TITLES.independence} />
      </Heading>
      <Body>
        The obvious question about any body that scores AI is: who is writing the cheque? Here is the
        whole answer. No company we measure pays for its place, its score, or its removal. Members of
        the public never pay anything at all. Verifying a card is free forever, with no account. We
        fund ourselves by selling signed evidence artefacts — the report, the dataset, the
        re-attestation — published win or lose, and never a fee for a ranking or a placement.
      </Body>
      <Points
        points={[
          { tag: "pain", text: "Most AI ratings are paid for by the company being rated" },
          { tag: "pain", text: "You are asked to trust a score you cannot see the invoice behind" },
          { tag: "benefit", text: "Verification is free forever — no login, no fee, no tier" },
          { tag: "benefit", text: "A bad result is published exactly like a good one" },
          { tag: "usp", text: "We take no money from anything we rank — the board is not for sale" },
        ]}
      />
      <Cta
        // /pricing is an ARCHIVED path (library-ia REPLACEMENTS maps it forward), so this CTA
        // was landing a front-door reader on a page carrying the "reference / archive" banner.
        href="/os?lobby=assess&task=pricing-overview"
        label="How the free rail works"
        secondary={{ href: "/about", label: "Who we are" }}
      />
    </HeavyBand>
  );
}

/* ─── 2 · the boundary ──────────────────────────────────────── */

function Boundary() {
  return (
    <SplitBand
      video="/videos/trust-lobby.mp4"
      poster="/videos/trust-lobby.jpg"
      alt="What the Council of AI is, and the line it does not cross"
      mediaSide="right"
      tint="surface-sunken"
      caption="Two minutes on what we measure and what we refuse to claim. Nothing in it issues a verdict."
    >
      <Kicker>The boundary</Kicker>
      <Heading>
        <RotatingHighlight {...SECTION_TITLES.boundary} />
      </Heading>
      <Body>
        The limits are the brand. We are a measurement body and nothing else, and saying so plainly is
        more useful to you than any badge would be. Read the four lines below as hard exclusions, not
        modesty.
      </Body>
      <ul className="mt-7 grid gap-3 sm:grid-cols-2">
        {[
          ["Not certification", "We issue no certificate and no conformity mark."],
          ["Not accreditation", "There is no accreditation chain behind us, and we are not a notified body."],
          ["Not enforcement", "We cannot approve, ban, fine or clear anything. Regulators do that."],
          ["Not legal advice", "A score describes a measured run on a date. It is not a compliance verdict."],
        ].map(([h, d]) => (
          <li key={h} className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
            <p className="text-sm font-black text-rose-700">{h}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{d}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-[15px] leading-relaxed text-gray-700">
        <strong className="font-black text-emerald-800">What we do:</strong> run your system against
        frozen, published instruments; sign the result with Ed25519 and chain it to a SHA-256 hash;
        publish what we could not measure, in the same table, in the same breath.
      </p>
      <Cta href="/methodology" label="Read the method" secondary={{ href: "/honesty", label: "What we withhold" }} />
    </SplitBand>
  );
}

/* ─── 3 · verify it yourself ──────────────────────────────────── */

const VERIFY_STEPS = [
  {
    n: "01",
    h: "Pin our key first — this step is not optional",
    d: "Fetch /.well-known/did.json and take the card-attestation key. Every published card must carry that exact pubkey. Verifying a card against the key it ships with proves only that the file is self-consistent — anyone can alter a body and sign it with a key they generated a second ago.",
  },
  {
    n: "02",
    h: "Recompute the id from the body",
    d: "Canonicalise the card's body — every key sorted, no whitespace — and take the SHA-256. That hash must equal the card's id. One changed character and it will not match. One warning if you implement this outside Python: the bytes were written by CPython, which renders a float of integral value as 0.0 where JavaScript and Go write 0, so a naive verifier reports a false failure on a large minority of the set. Our verifier at /signed/verify-card.mjs handles it and the rule is written out at /signed/HOW-TO-VERIFY.md.",
  },
  {
    n: "03",
    h: "Check the Ed25519 signature — then you are done",
    d: "Verify the signature over those same bytes under the pinned key. The whole check runs offline on your machine, with no CSOAI code, no account and no permission — or in your browser with WebCrypto. The banks and the grader are published too, so a measurement can be re-run as well as re-checked.",
  },
];

function VerifyYourself() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="max-w-3xl">
          <Kicker>Do not trust us — check</Kicker>
          <Heading>Three steps. Then you know.</Heading>
          <Body>
            Every measurement we publish is a small signed record — under a kilobyte, carrying the
            axis, the model, the accuracy, the issuer, the date and the hash of the card before it.
            You do not need an account, our servers, or our permission to confirm it is genuine and
            unaltered. Pin our key from /.well-known/did.json first: a card checked against the key
            it ships with proves only that the file is self-consistent, not that we issued it.
            {ANCHORING_CLAIM} That signature over that hash chain is exactly what you re-compute.
          </Body>
        </div>

        <Figure
          className="mt-12"
          src="/images/infographics/crop/trust-root-offline-verify.jpg"
          alt="The trust root did:web:csoai.org anchoring signed measurement cards through a hash-chained evidence ledger to local, offline verification on the reader's own machine"
        />

        <div className="mt-12 space-y-8">
          <ol className="grid gap-4 lg:grid-cols-3 lg:gap-5">
            {VERIFY_STEPS.map((s) => (
              <li
                key={s.n}
                className="flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-5 sm:p-6"
              >
                <span className="font-mono text-2xl font-black tabular-nums text-emerald-500">{s.n}</span>
                <div>
                  <h3 className="text-lg font-extrabold leading-snug text-gray-900">{s.h}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-gray-600 sm:text-[15px]">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>

          <FooterVerifyStrip />
        </div>

        <div className="mt-10 max-w-3xl rounded-2xl border border-emerald-200/70 bg-emerald-50/50 px-5 py-4">
          <Points
            points={[
              { tag: "benefit", text: "The whole check runs offline — no account and no permission" },
              { tag: "benefit", text: "Pin our key first. A card checked against the key it ships with only proves it is self-consistent" },
              { tag: "usp", text: "You recompute the same Ed25519 signature over the same hash chain we published" },
            ]}
          />
        </div>

        <Cta href="/gspc-verify" label="Verify a card now" secondary={{ href: "/api-docs", label: "Read the API docs" }} />
      </div>
    </section>
  );
}

/* ─── 4 · we publish our own errors ─────────────────────────────── */

function OwnErrors() {
  const corr = useJson<Corrections>("/api/corrections");
  const entries = corr?.corrections ?? [];
  const latest = entries.slice(-3).reverse();

  return (
    <SplitBand
      image="/images/infographics/crop/report-to-deterministic-test.jpg"
      alt="A report entering the intake, being mapped to frozen statutory provisions, then tested by deterministic predicates in a sandbox"
      mediaSide="left"
      tint="surface-sunken"
      caption="Cropped to the honest half of the journey: report, provision mapping, deterministic sandbox test. Verdicts come from code, never from one model judging another."
    >
      <Kicker>Self-correction</Kicker>
      <Heading>
        <RotatingHighlight {...SECTION_TITLES.corrections} />
      </Heading>
      <Body>
        Anyone can be right on a good day. What you should judge a measurement body on is what it does
        on a bad one. We keep a public corrections ledger at{" "}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[15px]">/api/corrections</code>, appended
        and never edited or deleted. Each entry says what was wrong, how it was caught, and what
        changed.
        {entries.length > 0 && (
          <>
            {" "}It currently holds{" "}
            <strong className="font-black text-gray-900">{entries.length}</strong> entries.
          </>
        )}
      </Body>
      <Points
        points={[
          { tag: "pain", text: "Most measurement bodies quietly reword a claim that did not hold" },
          { tag: "benefit", text: "The ledger is append-only — entries are never edited or deleted" },
          { tag: "usp", text: "We retracted our own consensus claim (DR-0007) rather than dress it up" },
        ]}
      />
      <p className="measure mt-5 rounded-2xl border border-gray-200 border-l-4 border-l-gray-400 bg-gray-50 p-5 text-[15px] leading-[1.65] text-gray-700">
        <strong className="font-black text-gray-900">The hardest one:</strong> we withdrew our own
        consensus claim. Our council architecture is a <strong>designed</strong> 33-seat structure with
        a designed 23-of-33 threshold — and when we actually measured how independent those seats
        were, the effective number came out at n_eff 1.21 of 3. The guarantee we had published did not
        hold, so we retracted it (DR-0007) rather than quietly rewording it. The design figure stays
        labelled as a design figure everywhere it appears.
      </p>
      {latest.length > 0 && (
        <ul className="mt-6 space-y-2">
          {latest.map((c) => (
            <li key={c.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <span className="font-mono text-[11px] font-bold text-emerald-700">{c.id}</span>
              <span className="ml-2 text-[11px] text-gray-400">{c.date}</span>
              {/* Excerpts removed: what_was_wrong may quote retired counts (e.g. "14-slot", 
                  "13 measured of 14"). Show id/date only; full content at /refutation-ledger. */}
            </li>
          ))}
        </ul>
      )}
      <Cta
        href="/refutation-ledger"
        label="Read the ledger"
        secondary={{ href: "/report", label: "Report something to us" }}
      />
    </SplitBand>
  );
}

/* ─── 5 · living law ────────────────────────────────────────── */

function LivingLaw() {
  const feed = useJson<RegFeed>("/api/regulation");
  const today = new Date().toISOString().slice(0, 10);
  const next = (feed?.deadlines ?? []).filter((e) => e.date >= today).slice(0, 3);

  return (
    <HeavyBand
      image="/images/band/clock.png"
      objectPosition="28% 50%"
      alt="A plain white clock face with a single green hand"
      panelSide="right"
    >
      <Kicker>Living law</Kicker>
      <Heading>
        <RotatingHighlight {...SECTION_TITLES.living} />
      </Heading>
      <Body>
        A one-off assessment starts going stale the day it is stamped, because the statute underneath
        it does not hold still. We track the primary sources — EUR-Lex, legislation.gov.uk and the
        national registers — and publish a dated deadline feed at{" "}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[15px]">/api/regulation</code>. When a
        provision actually changes, we re-measure and issue a delta card. Nothing expires and nothing
        is overwritten: the old card stays exactly where it was, because history here is append-only.
      </Body>
      {next.length > 0 && (
        <>
          <p className="mt-7 text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">
            Next up{feed?.verified_as_of ? ` · verified as of ${feed.verified_as_of}` : ""}
          </p>
          <ul className="mt-3 space-y-2">
            {next.map((e) => (
              <li
                key={`${e.date}-${e.instrument}`}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white/80 p-3"
              >
                <span className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 font-mono text-[11px] font-black text-white">
                  {e.date}
                </span>
                <span className="text-[13px] leading-relaxed text-gray-700">
                  <strong className="font-bold text-gray-900">{e.instrument}</strong> — {e.what}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <Cta href="/eu-ai-act" label="What is coming, and when" secondary={{ href: "/assess", label: "Get re-measured" }} />
    </HeavyBand>
  );
}

/* ─── 6 · the live board, with humans beside it ───────────────────────── */

function LiveBoard() {
  const gspc = useJson<Gspc>("/api/gspc");
  const reported = useJson<Reported>("/api/reported");

  const totals = gspc?.totals;
  const measured = totals?.measured_axes;
  const slots = totals?.axes;
  const stamp = gspc?.measured_on?.date;
  const jail = gspc?.axes?.find((a) => a.axis === "jail");
  const humans = (reported?.entries ?? []).slice(0, 3);

  // Occupancy schematic — drawn from the live payload, never from a constant.
  const cols = slots ?? 0;
  const filled = measured ?? 0;

  return (
    <HeavyBand
      image="/images/band/hardened.png"
      objectPosition="72% 50%"
      alt="A field of pale solids linked by a lattice of green light"
      panelSide="left"
    >
      <Kicker>The board{stamp ? ` · stamped ${stamp}` : ""}</Kicker>
      <Heading>
        <RotatingHighlight {...SECTION_TITLES.board} />
      </Heading>
      <Body>
        A filled cell is a measurement. A dash is honest emptiness. Every count in this section is read
        live from <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[15px]">/api/gspc</code> — we
        do not type numbers into the page, because a typed number is the first thing to go stale.
      </Body>
      {measured != null && slots != null ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-lg font-black tracking-tight text-emerald-900">
          {measured} measured of {slots} slots
          <span className="ml-2 text-sm font-semibold text-emerald-700">live from GET /api/gspc</span>
        </p>
      ) : (
        <p className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-500">
          Reading the live board from GET /api/gspc. No count is printed here until the payload
          arrives — we would rather show nothing than a number that has gone stale.
        </p>
      )}
      <p className="mt-4 text-[15px] leading-relaxed text-gray-700">
        The last slot is jail, containment: whether a model can be talked out of its own guardrails.
        It is measured{jail?.n ? ` on ${jail.n} gold cells` : ""}, on a smaller fleet than the rest of
        the board, and its separation is TIE on the live board — a tie is not a separated leader. We
        print that instead of leaving the cell blank, and instead of dressing it up as a pass.
      </p>

      {cols > 0 && (
        <div className="mt-7">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols * 6 }).map((_, n) => (
              <div
                key={n}
                className={`h-3 rounded-sm ${
                  n % cols < filled ? "bg-emerald-500/80" : "border border-dashed border-gray-400/60"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500">
            schematic of occupancy — not scores
          </p>
        </div>
      )}

      {humans.length > 0 && (
        <div className="mt-7 rounded-2xl border border-gray-200 border-l-4 border-l-gray-400 bg-gray-50 p-5">
          <p className="t-kicker font-black text-gray-600">
            Humans, beside the AI — labelled REPORTED
          </p>
          <p className="measure mt-2.5 text-[14px] leading-[1.65] text-gray-700">
            AI numbers mean little without a human figure next to them. These are published aggregates
            from other people's studies — cited, dated and unsigned. They are <strong>not</strong> our
            own human collection, they never enter our board, and we never average them together with
            what we measured.
          </p>
          <ul className="mt-3 space-y-1.5">
            {humans.map((h) => (
              <li key={h.id} className="text-[13px] leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-900">{h.claim}</span>{" "}
                <span className="text-gray-400">
                  — {h.source}
                  {h.as_of ? `, as of ${h.as_of}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Cta
        href="/gspc-scoreboard"
        label="Open the scoreboard"
        secondary={{ href: "/benchmark-index", label: "Reported beside measured" }}
      />
    </HeavyBand>
  );
}

/* ─── export ────────────────────────────────────────────── */

export default function LivingStages() {
  return (
    <div>
      <Independence />
      <Boundary />
      <VerifyYourself />
      <OwnErrors />
      <LivingLaw />
      <LiveBoard />
    </div>
  );
}
