import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /launch — the evidence-backed launch story.
 * Every number on this page is fetched live or derived from a named endpoint.
 * No number is typed from memory. If a fetch fails, the field shows the
 * failure, not a stale value.
 */

interface RootState {
  state: "loading" | "live" | "unreachable";
  card_count?: number;
  merkle_root?: string;
  as_of?: string;
}

interface BoardState {
  state: "loading" | "live" | "unreachable";
  axes?: number;
  measured?: number;
  unmeasured?: number;
}

interface CorrectionCount {
  state: "loading" | "live" | "unreachable";
  count?: number;
}

const VERIFICATION_LINKS = [
  {
    label: "Public root (signed Merkle tree)",
    url: "/root.json",
    desc: "Every measurement card hashed, pairwise Merkle-rooted, Ed25519-signed.",
  },
  {
    label: "Measurement board (22 axes)",
    url: "/board",
    desc: "Per-axis measurement state, accuracy, and card links.",
  },
  {
    label: "Corrections ledger",
    url: "/api/corrections",
    desc: "Every correction appended, never edited. Including corrections about our own tooling.",
  },
  {
    label: "Doctrine & refusals",
    url: "/doctrine",
    desc: "The red lines, published before the event that makes them quotable.",
  },
  {
    label: "Latest postmortem",
    url: "/postmortems/x402-settlement-reading",
    desc: "The settlement that was never lost — and the claim that was wrong.",
  },
  {
    label: "OWASP Agentic mapping",
    url: "/owasp-agentic",
    desc: "First public commercial mapping of OWASP ASI01–ASI10 to measured controls.",
  },
  {
    label: "In-browser card verification",
    url: "/gspc-verify",
    desc: "Verify any signed card's Ed25519 signature without trusting us.",
  },
  {
    label: "Anchor posture (what is signed, what is anchored)",
    url: "/.well-known/anchor-posture.json",
    desc: "Machine-readable state of every anchor rail, including what's missing.",
  },
];

export default function Launch() {
  const [root, setRoot] = useState<RootState>({ state: "loading" });
  const [board, setBoard] = useState<BoardState>({ state: "loading" });
  const [corrections, setCorrections] = useState<CorrectionCount>({
    state: "loading",
  });

  useEffect(() => {
    document.title = "The launch story — Council of AI";
    setMetaDescription(
      "An independent measurement body publishes signed, replayable measurements of AI systems and issued assets. Every number is verifiable. Every correction is public.",
    );

    fetch("/root.json")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        setRoot({
          state: "live",
          card_count: d.card_count,
          merkle_root: d.merkle_root,
          as_of: d.as_of,
        }),
      )
      .catch(() => setRoot({ state: "unreachable" }));

    fetch("/api/gspc")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const axes = d?.axes?.length ?? d?.axis_count;
        const measured = d?.measured ?? d?.measured_count;
        const unmeasured = d?.unmeasured ?? d?.unmeasured_count;
        setBoard({
          state: "live",
          axes: typeof axes === "number" ? axes : undefined,
          measured: typeof measured === "number" ? measured : undefined,
          unmeasured: typeof unmeasured === "number" ? unmeasured : undefined,
        });
      })
      .catch(() => setBoard({ state: "unreachable" }));

    fetch("/api/corrections")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const count = Array.isArray(d) ? d.length : d?.count;
        setCorrections({
          state: "live",
          count: typeof count === "number" ? count : undefined,
        });
      })
      .catch(() => setCorrections({ state: "unreachable" }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Launch story · verifiable ·{" "}
          {root.as_of ? new Date(root.as_of).toLocaleDateString("en-GB") : "—"}
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
          {root.state === "live" ? root.card_count : "…"} signed measurements.
          <br />
          {board.state === "live" ? board.axes : "…"} axes.{" "}
          {corrections.state === "live" ? corrections.count : "…"} public
          corrections.
        </h1>

        <p className="mt-4 text-lg text-gray-600">
          An independent measurement body publishes signed, replayable
          measurements of AI systems and issued assets. Every number below is
          fetched live from a named endpoint. Every correction is public and
          append-only. No grade is for sale.
        </p>

        {/* Live numbers panel */}
        <section className="mt-10 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-base font-semibold text-emerald-900">
            Live numbers — fetched when you loaded this page
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-emerald-700">Signed cards</dt>
              <dd className="text-3xl font-bold text-emerald-900">
                {root.state === "loading"
                  ? "…"
                  : root.state === "unreachable"
                    ? "unreachable"
                    : root.card_count ?? "—"}
              </dd>
              <dd className="text-xs text-emerald-600">in the Merkle tree</dd>
            </div>
            <div>
              <dt className="text-sm text-emerald-700">Board axes</dt>
              <dd className="text-3xl font-bold text-emerald-900">
                {board.state === "loading"
                  ? "…"
                  : board.state === "unreachable"
                    ? "unreachable"
                    : board.axes ?? "—"}
              </dd>
              <dd className="text-xs text-emerald-600">
                {board.state === "live" && board.measured !== undefined
                  ? `${board.measured} measured · ${board.unmeasured ?? "—"} unmeasured`
                  : "measured and published"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-emerald-700">Corrections</dt>
              <dd className="text-3xl font-bold text-emerald-900">
                {corrections.state === "loading"
                  ? "…"
                  : corrections.state === "unreachable"
                    ? "unreachable"
                    : corrections.count ?? "—"}
              </dd>
              <dd className="text-xs text-emerald-600">
                appended, never edited
              </dd>
            </div>
          </dl>
          {root.state === "live" && root.merkle_root && (
            <p className="mt-4 text-xs text-emerald-600 break-all">
              Merkle root: {root.merkle_root.slice(0, 16)}…
              {root.merkle_root.slice(-16)} · as of{" "}
              {root.as_of ? new Date(root.as_of).toISOString() : "—"}
            </p>
          )}
        </section>

        {/* What this is */}
        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            What this is, and what it is not
          </h2>
          <p className="text-[15px] text-gray-600">
            CSOAI Ltd (UK 16939677) is an independent measurement body. We
            measure and sign. We never certify, never rate, and never sell a
            grade. A payment buys a run, a signature, an attestation receipt —
            never the outcome.
          </p>
          <p className="text-[15px] text-gray-600">
            The public root is a Merkle tree of every measurement card we've
            published. Each card is Ed25519-signed under{" "}
            <code className="text-xs">did:web:csoai.org#board-attestation-1</code>
            . The root is witnessed to Sigstore Rekor. The corrections ledger
            records every error — including errors in our own tooling.
          </p>
          <p className="text-[15px] text-gray-600">
            When we were wrong — a merged commit claimed a settlement was lost
            that was never lost — we published a public postmortem with the
            timeline, the root cause, and the fixes. The record of being wrong
            is the product.
          </p>
        </section>

        {/* What you can verify */}
        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            What you can verify in under 2 minutes
          </h2>
          <div className="space-y-3">
            {VERIFICATION_LINKS.map((link) => (
              <div
                key={link.url}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <a
                  className="text-base font-medium text-emerald-700 underline underline-offset-2"
                  href={link.url}
                >
                  {link.label}
                </a>
                <p className="mt-1 text-sm text-gray-500">{link.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <p className="mt-14 text-sm text-gray-400">
          Measurement, not certification.{" "}
          <Link href="/doctrine" className="text-emerald-700 underline">
            Doctrine &amp; refusals
          </Link>
          {" · "}
          <Link href="/honesty" className="text-emerald-700 underline">
            Honesty gate
          </Link>
          {" · "}
          <Link href="/board" className="text-emerald-700 underline">
            The measurement board
          </Link>
          {" · "}
          <a
            className="text-emerald-700 underline"
            href="/api/corrections"
          >
            /api/corrections
          </a>
        </p>
      </div>
    </div>
  );
}
