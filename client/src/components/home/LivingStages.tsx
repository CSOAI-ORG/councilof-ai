import { useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { VideoEmbed } from "@/components/scrollworld";
import FooterVerifyStrip from "../FooterVerifyStrip";
import { ANCHORING_CLAIM } from "../../data/anchoringClaim";

/**
 * Six compact homepage stories. Live counts render only after their public
 * endpoints answer; the static page never substitutes a remembered value.
 * Long trust boundaries remain reachable in native disclosures.
 */

function useJson<T>(url: string): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(url, { headers: { accept: "application/json" } })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (alive && value) setData(value as T);
      })
      .catch(() => {
        // Offline and prerendered views omit live values rather than guessing.
      });
    return () => {
      alive = false;
    };
  }, [url]);

  return data;
}

type Gspc = {
  measured_on?: { date?: string };
  totals?: { axes?: number; measured_axes?: number };
  axes?: { axis?: string; n?: number }[];
};
type Corrections = { corrections?: { id: string; date: string }[] };
type Reported = {
  entries?: { id: string; claim: string; source: string; as_of?: string }[];
};
type RegFeed = {
  verified_as_of?: string;
  deadlines?: { date: string; instrument: string; what: string }[];
};

type Point = { tag: "pain" | "benefit" | "usp"; text: string };

const TAG_STYLE: Record<Point["tag"], string> = {
  pain: "bg-rose-100 text-rose-700",
  benefit: "bg-emerald-100 text-emerald-700",
  usp: "bg-emerald-600/15 text-emerald-800 ring-1 ring-inset ring-emerald-600/25",
};
const TAG_LABEL: Record<Point["tag"], string> = {
  pain: "problem",
  benefit: "benefit",
  usp: "difference",
};

function Points({ points }: { points: Point[] }) {
  return (
    <ul className="measure mt-6 space-y-3">
      {points.map((point) => (
        <li key={point.text} className="flex items-start gap-3">
          <span
            className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${TAG_STYLE[point.tag]}`}
          >
            {TAG_LABEL[point.tag]}
          </span>
          <span className="text-[15px] font-medium leading-[1.55] text-gray-700">
            {point.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Cta({
  href,
  label,
  secondary,
}: {
  href: string;
  label: string;
  secondary?: { href: string; label: string };
}) {
  return (
    <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Link
        href={href}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white transition-colors hover:bg-emerald-800"
      >
        {label}
      </Link>
      {secondary && (
        <Link
          href={secondary.href}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-700/35 bg-white px-5 py-3 text-sm font-extrabold text-emerald-800 transition-colors hover:border-emerald-700/60 hover:bg-emerald-50"
        >
          {secondary.label}
        </Link>
      )}
    </div>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return <span className="t-kicker text-emerald-700">{children}</span>;
}

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="t-band mt-3 text-gray-900">{children}</h2>;
}

function Body({ children }: { children: ReactNode }) {
  return (
    <p className="t-lede measure mt-4 font-medium text-gray-700">{children}</p>
  );
}

function TechnicalDetails({
  summary,
  children,
}: {
  summary: string;
  children: ReactNode;
}) {
  return (
    <details className="measure mt-5 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 open:bg-white sm:px-5">
      <summary className="cursor-pointer select-none text-sm font-extrabold text-gray-900 marker:text-emerald-700">
        {summary}
      </summary>
      <div className="mt-3 space-y-3 border-t border-gray-200 pt-3 text-[13px] leading-relaxed sm:text-sm">
        {children}
      </div>
    </details>
  );
}

function Figure({
  src,
  alt,
  caption,
  className = "",
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,.6)]">
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="max-h-[430px] w-full object-contain"
        />
      </div>
      {caption && (
        <figcaption className="measure mt-3 text-xs leading-relaxed text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** A compact image-and-copy band. The image never sits behind the text. */
function ImageBand({
  id,
  image,
  alt,
  contentSide = "left",
  objectPosition,
  tint = "surface-raised",
  children,
}: {
  id: string;
  image: string;
  alt: string;
  contentSide?: "left" | "right";
  objectPosition?: string;
  tint?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-living-topic={id}
      className={`border-t border-gray-200 ${tint}`}
    >
      <div className="section-shell grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className={contentSide === "left" ? "lg:order-1" : "lg:order-2"}>
          {children}
        </div>
        <figure
          className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_45px_-32px_rgba(15,23,42,.6)] ${
            contentSide === "left" ? "lg:order-2" : "lg:order-1"
          }`}
        >
          <img
            src={image}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] max-h-[470px] w-full object-cover"
            style={objectPosition ? { objectPosition } : undefined}
          />
        </figure>
      </div>
    </section>
  );
}

function MediaBand({
  id,
  image,
  alt,
  video,
  poster,
  mediaSide = "right",
  tint = "surface-raised",
  caption,
  children,
}: {
  id: string;
  image?: string;
  alt: string;
  video?: string;
  poster?: string;
  mediaSide?: "left" | "right";
  tint?: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-living-topic={id}
      className={`border-t border-gray-200 ${tint}`}
    >
      <div className="section-shell grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-2 lg:gap-12">
        <div className={mediaSide === "right" ? "lg:order-1" : "lg:order-2"}>
          {children}
        </div>
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

function Independence() {
  return (
    <ImageBand
      id="independence"
      image="/images/band/independence.png"
      objectPosition="72% 50%"
      alt="A pale sphere held inside thin orbital rings with green markers"
    >
      <Kicker>Independent by design</Kicker>
      <Heading>The board is not for sale.</Heading>
      <Body>
        Payment cannot buy a board position, a better score, suppression, or
        removal. Public card verification remains free and needs no account;
        paid work is scoped measurement and evidence work, not placement.
      </Body>
      <Points
        points={[
          {
            tag: "pain",
            text: "Opaque sponsorship makes a ranking hard to trust.",
          },
          {
            tag: "benefit",
            text: "Anyone can verify a published signed card without paying us.",
          },
          {
            tag: "usp",
            text: "Good, bad and unmeasured outcomes use the same publication rules.",
          },
        ]}
      />
      <Cta
        href="/dashboard?task=pricing-overview&tab=measured"
        label="See the free and paid rails"
        secondary={{ href: "/about", label: "Who we are" }}
      />
    </ImageBand>
  );
}

function Boundary() {
  const benefits = [
    [
      "Evidence you can verify",
      "Published paths let a reader check an issued artifact independently.",
    ],
    [
      "Open methods",
      "Frozen instruments and visible gaps make each result easier to challenge.",
    ],
    [
      "Human authority",
      "Regulators and qualified assessors retain the decisions that belong to them.",
    ],
    [
      "Informed decisions",
      "Dated measurements support judgment without pretending to replace it.",
    ],
  ];

  return (
    <MediaBand
      id="boundary"
      video="/videos/trust-lobby.mp4"
      poster="/videos/trust-lobby.jpg"
      alt="What the Council of AI measures and the line it does not cross"
      mediaSide="right"
      tint="surface-sunken"
      caption="Two minutes on what we measure and what we refuse to claim. Nothing in it issues a verdict."
    >
      <Kicker>Useful evidence, clear authority</Kicker>
      <Heading>Evidence people can verify. Decisions people retain.</Heading>
      <Body>
        A scoped result is useful when its method, limits and gaps travel with
        it.
      </Body>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {benefits.map(([heading, description]) => (
          <li
            key={heading}
            className="border-l-2 border-emerald-500 bg-white px-4 py-3"
          >
            <p className="text-sm font-black text-emerald-900">{heading}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
              {description}
            </p>
          </li>
        ))}
      </ul>
      <p className="measure mt-5 text-xs leading-relaxed text-gray-500">
        Boundary: measurement is not certification or accreditation; we do not
        enforce, and this is not legal advice or a compliance verdict.
      </p>
      <Cta
        href="/methodology"
        label="Read the method"
        secondary={{ href: "/honesty", label: "Read the limitations" }}
      />
    </MediaBand>
  );
}

const VERIFY_STEPS = [
  {
    n: "01",
    h: "Pin the issuer key",
    d: "Fetch did:web:csoai.org before trusting a key carried inside a card.",
  },
  {
    n: "02",
    h: "Recompute the body hash",
    d: "Canonicalise the body and confirm its SHA-256 matches the published id.",
  },
  {
    n: "03",
    h: "Verify the signature",
    d: "Check Ed25519 over those same bytes under the key you pinned.",
  },
];

function VerifyYourself() {
  return (
    <section
      id="verify-yourself"
      data-living-topic="verify-yourself"
      className="border-t border-gray-200 bg-white"
    >
      <div className="section-shell py-14 sm:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div>
            <Kicker>Do not trust us—check</Kicker>
            <Heading>Verify a published card yourself.</Heading>
            <Body>
              Current v0.1 signed cards are under a kilobyte. Some board
              aggregates are explicitly uncarded, so they cannot be verified
              through this card path.
            </Body>
            <p className="measure mt-4 text-sm leading-relaxed text-gray-600">
              The check can run offline, with no account and no permission from
              us.
            </p>
          </div>
          <Figure
            src="/images/infographics/crop/trust-root-offline-verify.jpg"
            alt="Diagram of a did:web key, signed card hash chain, and local offline verification"
            caption="Verification architecture. The precise card, ledger and OpenTimestamps boundaries are disclosed below."
          />
        </div>

        <ol className="mt-9 grid gap-4 lg:grid-cols-3 lg:gap-5">
          {VERIFY_STEPS.map((step) => (
            <li
              key={step.n}
              className="border-t-2 border-emerald-600 bg-gray-50 p-5"
            >
              <span className="font-mono text-sm font-black tabular-nums text-emerald-700">
                {step.n}
              </span>
              <h3 className="mt-3 text-lg font-extrabold leading-snug text-gray-900">
                {step.h}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {step.d}
              </p>
            </li>
          ))}
        </ol>

        <TechnicalDetails summary="Technical verification and anchoring boundary">
          <p>
            A key shipped inside a card proves self-consistency only. Pin the
            public key from <code>/.well-known/did.json</code>, then
            canonicalise the body with sorted keys and no whitespace. CPython
            preserves an integral float as <code>0.0</code>
            where JavaScript and Go may emit <code>0</code>; the published
            verifier handles that byte-level difference.
          </p>
          <p>{ANCHORING_CLAIM}</p>
        </TechnicalDetails>

        <div className="mt-8">
          <FooterVerifyStrip />
        </div>
        <Cta
          href="/gspc-verify"
          label="Verify a card"
          secondary={{ href: "/api-docs", label: "Read the API docs" }}
        />
      </div>
    </section>
  );
}

function OwnErrors() {
  const corrections = useJson<Corrections>("/api/corrections");
  const entries = corrections?.corrections ?? [];
  const latest = entries.slice(-3).reverse();

  return (
    <MediaBand
      id="corrections"
      image="/images/public_watchdog_intake.jpg"
      alt="People submitting reports to a public watchdog intake"
      mediaSide="left"
      tint="surface-sunken"
      caption="Illustration of public intake—not a measured result or a compliance verdict."
    >
      <Kicker>Self-correction</Kicker>
      <Heading>Errors stay visible.</Heading>
      <Body>
        Our public corrections record is source-maintained and
        version-controlled, not backed by append-only storage proof. Each entry
        says what was wrong, how it was caught, and what changed.
        {entries.length > 0 && (
          <>
            {" "}
            The live feed currently returns{" "}
            <strong className="font-black text-gray-900">
              {entries.length}
            </strong>{" "}
            entries.
          </>
        )}
      </Body>
      <Points
        points={[
          {
            tag: "benefit",
            text: "Corrections have a public route and dated identifiers.",
          },
          {
            tag: "usp",
            text: "The withdrawn DR-0007 council claim remains inspectable.",
          },
        ]}
      />
      <TechnicalDetails summary="Why the DR-0007 council claim was withdrawn">
        <p>
          The 33-seat council and its 23-of-33 threshold are a design. DR-0007
          records a retraction: its historical numeric result is unbound because
          the cited result artifact is absent from this repository.
        </p>
        <p>
          The{" "}
          <Link
            href="/interop/council-independence.json"
            className="underline underline-offset-2"
          >
            latest point experiment
          </Link>{" "}
          measured rho=1 and n_eff=1 across three nominal legs. Neither
          experiment demonstrates independent review or fault tolerance; the
          council remains a designed architecture, not a live property.
        </p>
      </TechnicalDetails>
      {latest.length > 0 && (
        <ul
          className="mt-5 flex flex-wrap gap-2"
          aria-label="Latest correction records"
        >
          {latest.map((entry) => (
            <li
              key={entry.id}
              className="border border-gray-200 bg-white px-3 py-2 text-xs"
            >
              <span className="font-mono font-bold text-emerald-800">
                {entry.id}
              </span>{" "}
              <span className="text-gray-500">{entry.date}</span>
            </li>
          ))}
        </ul>
      )}
      <Cta
        href="/refutation-ledger"
        label="Read the corrections record"
        secondary={{ href: "/watchdog-hub", label: "Open public watchdog" }}
      />
    </MediaBand>
  );
}

function LivingLaw() {
  const feed = useJson<RegFeed>("/api/regulation");
  const today = new Date().toISOString().slice(0, 10);
  const next = (feed?.deadlines ?? [])
    .filter((entry) => entry.date >= today)
    .slice(0, 3);

  return (
    <ImageBand
      id="living-law"
      image="/images/loop/four-states.png"
      objectPosition="50% 50%"
      alt="A translucent evidence container beside a pale block with a green keyhole"
      contentSide="right"
    >
      <Kicker>Living law</Kicker>
      <Heading>Regulation changes. Evidence ages.</Heading>
      <Body>
        The dated feed at <code>/api/regulation</code> tracks primary-source
        deadlines and change signals. A signal tells you to look again; it is
        not a new assessment.
      </Body>
      {next.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-500">
            Upcoming
            {feed?.verified_as_of
              ? ` · feed checked ${feed.verified_as_of}`
              : ""}
          </p>
          <ul className="mt-3 space-y-2">
            {next.map((entry) => (
              <li
                key={`${entry.date}-${entry.instrument}`}
                className="border-l-2 border-emerald-500 bg-white px-4 py-3"
              >
                <p className="font-mono text-[11px] font-black text-emerald-800">
                  {entry.date}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-700">
                  <strong className="text-gray-900">{entry.instrument}</strong>{" "}
                  — {entry.what}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
      <TechnicalDetails summary="What the current automation does—and does not do">
        <p>
          Source monitoring can raise a detection signal. Re-measurement and
          delta-card issuance require a separate run and are not yet automatic.
          Previously published signed artifacts remain addressable; this page
          does not claim append-only storage.
        </p>
      </TechnicalDetails>
      <Cta
        href="/eu-ai-act"
        label="Read the regulation timeline"
        secondary={{ href: "/assess", label: "Check measurement options" }}
      />
    </ImageBand>
  );
}

function LiveBoard() {
  const gspc = useJson<Gspc>("/api/gspc");
  const reported = useJson<Reported>("/api/reported");
  const measured = gspc?.totals?.measured_axes;
  const slots = gspc?.totals?.axes;
  const stamp = gspc?.measured_on?.date;
  const jail = gspc?.axes?.find((axis) => axis.axis === "jail");
  const humans = (reported?.entries ?? []).slice(0, 3);

  return (
    <ImageBand
      id="live-board"
      image="/images/band/hardened.png"
      objectPosition="72% 50%"
      alt="Pale solids connected by a lattice of green light"
      tint="surface-sunken"
    >
      <Kicker>The board{stamp ? ` · measured ${stamp}` : ""}</Kicker>
      <Heading>One board. No invented cells.</Heading>
      <Body>
        This teaser reads <code>/api/gspc</code>. It prints a count only after
        that endpoint answers, and sends every detailed comparison to the
        canonical board.
      </Body>
      {measured != null && slots != null ? (
        <p className="mt-6 border-l-4 border-emerald-600 bg-emerald-50 px-5 py-4 text-lg font-black tracking-tight text-emerald-950">
          {measured} measured of {slots} slots
          <span className="ml-2 text-sm font-semibold text-emerald-800">
            live from GET /api/gspc
          </span>
        </p>
      ) : (
        <p className="mt-6 border border-gray-200 bg-gray-50 px-5 py-4 text-sm font-semibold text-gray-600">
          Waiting for GET /api/gspc. No fallback count is shown.
        </p>
      )}
      <TechnicalDetails summary="Containment and reported-human boundaries">
        <p>
          The jail axis asks whether a model can be talked out of its
          guardrails. It is measured{jail?.n ? ` on ${jail.n} gold cells` : ""}{" "}
          on a smaller fleet, and its live separation state is TIE—not a
          separated leader or a pass.
        </p>
        <p>
          Human figures below, when available, are published third-party
          aggregates: cited, dated and unsigned. They do not enter our board and
          are not averaged with our measurements.
        </p>
        {humans.length > 0 && (
          <ul
            className="space-y-2"
            aria-label="Reported human reference figures"
          >
            {humans.map((entry) => (
              <li key={entry.id}>
                <strong className="text-gray-900">{entry.claim}</strong>{" "}
                <span className="text-gray-500">
                  — {entry.source}
                  {entry.as_of ? `, as of ${entry.as_of}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </TechnicalDetails>
      <Cta
        href="/dashboard?tab=board"
        label="Open the canonical GSPC board"
        secondary={{
          href: "/benchmark-index",
          label: "Compare reported benchmarks",
        }}
      />
    </ImageBand>
  );
}

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
