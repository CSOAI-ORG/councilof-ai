import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { setPageMetadata } from "@/lib/utils";

const CANONICAL = "https://councilof.ai/events/three-root-ceremony";

interface RootRecord {
  kind?: string;
  as_of?: string;
  merkle_root?: string;
  card_count?: number;
  did_intended?: string;
  sig_ed25519?: string;
}

interface WitnessRecord {
  as_of?: string;
  artifact?: {
    sha256?: string;
    merkle_root?: string;
    card_count?: number;
    as_of?: string;
  };
  witnesses?: {
    rekor?: {
      status?: string;
      url?: string;
      logIndex?: number;
    };
    ots?: {
      status?: string;
      url?: string;
      bitcoin_blocks?: number[];
      note?: string;
    };
    eas_base?: {
      status?: string;
      reason?: string;
    };
    xrpl_memo?: {
      status?: string;
      reason?: string;
    };
  };
  conflict?: {
    status?: string;
  };
}

type LoadState =
  | { state: "loading" }
  | { state: "unreachable"; reason: string }
  | {
      state: "ready";
      root: RootRecord;
      witness: WitnessRecord;
      rootSha256: string;
      exactWitnessMatch: boolean;
    };

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function StateBadge({
  label,
  tone,
}: {
  label: string;
  tone: "good" | "pending" | "absent" | "unknown";
}) {
  const styles = {
    good: "border-emerald-300 bg-emerald-50 text-emerald-900",
    pending: "border-amber-300 bg-amber-50 text-amber-950",
    absent: "border-slate-300 bg-slate-50 text-slate-800",
    unknown: "border-rose-300 bg-rose-50 text-rose-900",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 font-mono text-xs font-bold ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

export default function ThreeRootCeremony() {
  const [load, setLoad] = useState<LoadState>({ state: "loading" });

  useEffect(() => {
    setPageMetadata({
      title: "Three-root ceremony — public witness record | Council of AI",
      description:
        "Inspect the current Council of AI public root, exact witness match, Ed25519 signature presence, Rekor state and Bitcoin OpenTimestamps state.",
      openGraphTitle: "Three-root ceremony — public-root witness record",
      openGraphDescription:
        "A live, fail-closed view of the Council of AI public root, its signature, Rekor witness and OpenTimestamps state.",
    });
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/root.json", { cache: "no-store" }),
      fetch("/interop/root-witness-latest.json", { cache: "no-store" }),
    ])
      .then(async ([rootResponse, witnessResponse]) => {
        if (!rootResponse.ok || !witnessResponse.ok) {
          throw new Error(
            `root ${rootResponse.status}; witness ${witnessResponse.status}`,
          );
        }
        const rootText = await rootResponse.text();
        const root = JSON.parse(rootText) as RootRecord;
        const witness = (await witnessResponse.json()) as WitnessRecord;
        const rootSha256 = await sha256Hex(rootText);
        const exactWitnessMatch =
          rootSha256 === witness.artifact?.sha256 &&
          root.merkle_root === witness.artifact?.merkle_root &&
          root.card_count === witness.artifact?.card_count &&
          root.as_of === witness.artifact?.as_of;
        if (active) {
          setLoad({
            state: "ready",
            root,
            witness,
            rootSha256,
            exactWitnessMatch,
          });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoad({
            state: "unreachable",
            reason: error instanceof Error ? error.message : "fetch failed",
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Three-root ceremony — public-root witness record",
    description:
      "A live, fail-closed view of the Council of AI public root, its signature, Rekor witness and OpenTimestamps state.",
    datePublished: "2026-09-12",
    dateModified: "2026-09-13",
    url: CANONICAL,
    isPartOf: {
      "@type": "WebSite",
      name: "Council of AI",
      url: "https://councilof.ai/",
    },
  };

  const exact = load.state === "ready" && load.exactWitnessMatch;
  const rekor =
    load.state === "ready" ? load.witness.witnesses?.rekor : undefined;
  const ots = load.state === "ready" ? load.witness.witnesses?.ots : undefined;
  const bitcoinBlocks = ots?.bitcoin_blocks ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-emerald-950 px-4 py-12 text-slate-100 sm:px-6 sm:py-16">
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(page)}</script>
      </Helmet>

      <article className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
          <Link
            href="/"
            className="underline decoration-slate-600 underline-offset-4 hover:text-emerald-300"
          >
            Council of AI
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span>Public-root record</span>
        </nav>

        <header className="mt-8 max-w-4xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
            Live evidence record · fail closed
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            One public root. Three evidence layers.
          </h1>
          <p className="mt-6 text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            “Three-root ceremony” is the public working name. Technically, the
            system has one Merkle root: an Ed25519 publisher signature, a
            Sigstore Rekor transparency-log witness and a Bitcoin timestamp
            through OpenTimestamps. Each state below applies only when the
            witness names the exact bytes fetched from <code>/root.json</code>.
          </p>
        </header>

        <section
          aria-labelledby="live-root-heading"
          aria-live="polite"
          className="mt-10 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 shadow-2xl sm:p-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="live-root-heading"
              className="text-xl font-extrabold sm:text-2xl"
            >
              Exact root loaded in this browser
            </h2>
            {load.state === "loading" ? (
              <StateBadge label="CHECKING" tone="pending" />
            ) : null}
            {load.state === "unreachable" ? (
              <StateBadge label="UNCHECKABLE" tone="unknown" />
            ) : null}
            {load.state === "ready" ? (
              <StateBadge
                label={
                  load.exactWitnessMatch
                    ? "EXACT WITNESS MATCH"
                    : "WITNESS MISMATCH"
                }
                tone={load.exactWitnessMatch ? "good" : "unknown"}
              />
            ) : null}
          </div>

          {load.state === "loading" ? (
            <p className="mt-4 text-slate-300">
              Fetching the root and witness records…
            </p>
          ) : null}
          {load.state === "unreachable" ? (
            <p className="mt-4 break-words text-slate-300">
              The records could not both be read ({load.reason}). Current
              witness status is UNCHECKABLE; no prior value is reused.
            </p>
          ) : null}
          {load.state === "ready" ? (
            <>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-slate-700 p-4">
                  <dt className="font-semibold text-slate-400">
                    Public-root SHA-256
                  </dt>
                  <dd className="mt-2 break-all font-mono text-emerald-300">
                    {load.rootSha256}
                  </dd>
                </div>
                <div className="min-w-0 rounded-xl border border-slate-700 p-4">
                  <dt className="font-semibold text-slate-400">Merkle root</dt>
                  <dd className="mt-2 break-all font-mono text-emerald-300">
                    {load.root.merkle_root ?? "UNAVAILABLE"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-700 p-4">
                  <dt className="font-semibold text-slate-400">
                    Public-root leaves
                  </dt>
                  <dd className="mt-2 font-mono text-lg text-white">
                    {typeof load.root.card_count === "number"
                      ? load.root.card_count
                      : "UNAVAILABLE"}
                  </dd>
                </div>
                <div className="rounded-xl border border-slate-700 p-4">
                  <dt className="font-semibold text-slate-400">Root as-of</dt>
                  <dd className="mt-2 break-words font-mono text-white">
                    {load.root.as_of ?? "UNAVAILABLE"}
                  </dd>
                </div>
              </dl>
              {!load.exactWitnessMatch ? (
                <p className="mt-5 rounded-xl border border-rose-400/40 bg-rose-950/40 p-4 text-sm leading-6 text-rose-100">
                  The latest witness record does not name these exact root
                  bytes. Its rail states are therefore not applied to this root.
                  Rotation can cause a short mismatch; re-fetch both records.
                </p>
              ) : null}
            </>
          ) : null}
        </section>

        <section aria-labelledby="layers-heading" className="mt-14">
          <h2
            id="layers-heading"
            className="text-2xl font-black tracking-tight sm:text-3xl"
          >
            Current evidence layers
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold">1. Publisher signature</h3>
                {load.state === "ready" && load.root.sig_ed25519 ? (
                  <StateBadge label="PRESENT" tone="pending" />
                ) : (
                  <StateBadge label="UNCHECKABLE" tone="unknown" />
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Presence is reported here; cryptographic verification requires
                recomputing the documented preimage against the pinned
                <code className="mx-1 break-all">did:web</code> key.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold">2. Rekor witness</h3>
                <StateBadge
                  label={
                    exact ? (rekor?.status ?? "UNAVAILABLE") : "UNCHECKABLE"
                  }
                  tone={
                    exact && rekor?.status === "WITNESSED" ? "good" : "unknown"
                  }
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Rekor records existence and integrated time for the signed
                preimage. It is a transparency witness, not an endorsement.
              </p>
              {exact && rekor?.url ? (
                <a
                  className="mt-4 inline-block break-all text-sm font-semibold text-emerald-300 underline underline-offset-4"
                  href={rekor.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Inspect Rekor entry
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold">3. Bitcoin timestamp</h3>
                <StateBadge
                  label={exact ? (ots?.status ?? "UNAVAILABLE") : "UNCHECKABLE"}
                  tone={
                    exact && bitcoinBlocks.length > 0
                      ? "good"
                      : exact && ots?.status?.includes("PENDING")
                        ? "pending"
                        : "unknown"
                  }
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {exact && bitcoinBlocks.length > 0
                  ? `The upgraded proof names Bitcoin block${bitcoinBlocks.length === 1 ? "" : "s"} ${bitcoinBlocks.join(", ")}, confirming that these exact root bytes existed no later than the attested block time.`
                  : "A calendar stamp is pending until an upgraded proof names one or more Bitcoin blocks. Pending proves submission, not Bitcoin inclusion."}
              </p>
              {exact && bitcoinBlocks.length > 0 ? (
                <p className="mt-3 break-words font-mono text-xs text-emerald-300">
                  blocks {bitcoinBlocks.join(", ")}
                </p>
              ) : null}
              {exact && ots?.url ? (
                <a
                  className="mt-4 inline-block break-all text-sm font-semibold text-emerald-300 underline underline-offset-4"
                  href={ots.url.replace(/^https:\/\/councilof\.ai/, "")}
                >
                  Download exact .ots proof
                </a>
              ) : null}
            </section>
          </div>
        </section>

        <section
          aria-labelledby="other-rails-heading"
          className="mt-14 rounded-2xl border border-slate-700 bg-slate-900/60 p-5 sm:p-7"
        >
          <h2
            id="other-rails-heading"
            className="text-xl font-extrabold sm:text-2xl"
          >
            Other anchor rails stay separate
          </h2>
          <p className="mt-3 leading-7 text-slate-300">
            EAS on Base and an XRPL memo are not silently folded into “three.”
            Their exact status is reported by the witness record for the exact
            root.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-700 p-4">
              <dt className="font-semibold text-slate-400">EAS on Base</dt>
              <dd className="mt-2 font-mono text-sm text-white">
                {exact
                  ? load.state === "ready"
                    ? (load.witness.witnesses?.eas_base?.status ??
                      "UNAVAILABLE")
                    : "UNAVAILABLE"
                  : "UNCHECKABLE"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-700 p-4">
              <dt className="font-semibold text-slate-400">XRPL memo</dt>
              <dd className="mt-2 font-mono text-sm text-white">
                {exact
                  ? load.state === "ready"
                    ? (load.witness.witnesses?.xrpl_memo?.status ??
                      "UNAVAILABLE")
                    : "UNAVAILABLE"
                  : "UNCHECKABLE"}
              </dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="verify-heading"
          className="mt-14 rounded-2xl border border-emerald-300/30 bg-emerald-950/60 p-5 sm:p-7"
        >
          <h2
            id="verify-heading"
            className="text-xl font-extrabold sm:text-2xl"
          >
            Recheck the record without trusting this page
          </h2>
          <ul className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <li>
              <a
                className="block break-words rounded-xl border border-emerald-900 p-3 font-mono text-emerald-300 hover:border-emerald-400"
                href="/root.json"
              >
                /root.json
              </a>
            </li>
            <li>
              <a
                className="block break-words rounded-xl border border-emerald-900 p-3 font-mono text-emerald-300 hover:border-emerald-400"
                href="/interop/root-witness-latest.json"
              >
                /interop/root-witness-latest.json
              </a>
            </li>
            <li>
              <a
                className="block break-words rounded-xl border border-emerald-900 p-3 font-mono text-emerald-300 hover:border-emerald-400"
                href="/.well-known/did.json"
              >
                /.well-known/did.json
              </a>
            </li>
            <li>
              <a
                className="block break-words rounded-xl border border-emerald-900 p-3 font-mono text-emerald-300 hover:border-emerald-400"
                href="/signed/HOW-TO-VERIFY-ROOT.md"
              >
                /signed/HOW-TO-VERIFY-ROOT.md
              </a>
            </li>
          </ul>
          <p className="mt-5 text-sm leading-6 text-emerald-100">
            Completion means the signature verifies, the witness matches the
            exact root bytes and OpenTimestamps reports Bitcoin block
            attestations. Anything less is shown as PRESENT, PENDING, NOT_YET or
            UNCHECKABLE.
          </p>
        </section>

        <footer className="mt-12 border-t border-slate-700 pt-7 text-sm leading-6 text-slate-400">
          <p>
            Measurement, not certification.{" "}
            <Link
              href="/doctrine"
              className="font-semibold text-emerald-300 underline underline-offset-4"
            >
              Doctrine and refusal lines
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              href="/postmortems/x402-settlement-reading"
              className="font-semibold text-emerald-300 underline underline-offset-4"
            >
              X402 postmortem
            </Link>
          </p>
        </footer>
      </article>
    </div>
  );
}
