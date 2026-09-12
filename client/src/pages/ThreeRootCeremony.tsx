import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /events/three-root-ceremony — the 2026-09-13 public anchoring ceremony,
 * framed as what it is: a dated public event with a verifiable artifact trail.
 *
 * Doctrine compliance:
 *  - The root numbers on this page are FETCHED from /root.json at load, never
 *    typed (ADR-001: no surface types a count).
 *  - Forward-looking statements are labeled as planned. "Stamped is not
 *    anchored": until a calendar upgrades the OpenTimestamps proof, this page
 *    says PENDING — the same fail-closed rule as /.well-known/anchor-posture.json.
 */

interface RootState {
  state: "loading" | "live" | "unreachable";
  card_count?: number;
  merkle_root?: string;
  as_of?: string;
}

const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "1",
    title: "Sign — Ed25519, already on every root",
    body:
      "The public root (GET /root.json) is Ed25519-signed over its compact preimage under did:web:csoai.org#board-attestation-1. This layer is live and has been for every hourly republication.",
  },
  {
    n: "2",
    title: "Witness — Sigstore Rekor, live",
    body:
      "Each root is witnessed to the Rekor transparency log; the pointer at /interop/root-witness-pointer.json names the witnessed root, its sha256 and its as_of. Existence and time of bytes — never endorsement.",
  },
  {
    n: "3",
    title: "Anchor — Bitcoin via OpenTimestamps, the step that closes the gap",
    body:
      "The anchor posture page has said plainly: the root is SIGNED_NOT_ANCHORED, and the gap closes when an OpenTimestamps proof over the single Merkle root is published and UPGRADED by a calendar. The ceremony performs exactly that: stamp the Merkle root, submit to the calendars, publish the proof, and upgrade it once a Bitcoin block confirms it.",
  },
];

export default function ThreeRootCeremony() {
  const [root, setRoot] = useState<RootState>({ state: "loading" });

  useEffect(() => {
    document.title = "The three-root ceremony — 2026-09-13 | Council of AI";
    setMetaDescription(
      "On 2026-09-13 the Council of AI public root is anchored three ways: Ed25519 signature, Sigstore Rekor witness, and a Bitcoin OpenTimestamps proof published and upgraded — closing the documented SIGNED_NOT_ANCHORED gap. The transcript card follows here.",
    );
    fetch("/root.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) =>
        setRoot({
          state: "live",
          card_count: d.card_count,
          merkle_root: d.merkle_root,
          as_of: d.as_of,
        }),
      )
      .catch(() => setRoot({ state: "unreachable" }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          Public event · Sunday 2026-09-13 · the artifact trail is the venue
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-gray-900">
          The three-root ceremony.
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          One Merkle root, three independent proofs of existence and time: our own Ed25519
          signature, the Sigstore Rekor transparency log, and the Bitcoin chain via
          OpenTimestamps. No venue, no tickets — the event is the artifacts landing in public,
          in order, each independently checkable by anyone. This page is the event record; the
          signed transcript card is linked here once the ceremony completes.
        </p>

        <section className="mt-10 rounded-xl border border-emerald-600/15 bg-white p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-gray-900">
            The root being anchored — fetched live when you loaded this page
          </h2>
          {root.state === "loading" && (
            <p className="mt-2 text-[15px] text-gray-500">Fetching /root.json…</p>
          )}
          {root.state === "unreachable" && (
            <p className="mt-2 text-[15px] text-gray-600">
              /root.json is unreachable right now. That is UNCHECKABLE, not a failure of the
              chain — re-fetch and compare, as the verification guide says.
            </p>
          )}
          {root.state === "live" && (
            <dl className="mt-3 space-y-2 text-[15px] leading-relaxed text-gray-600">
              <div>
                <dt className="inline font-bold text-gray-900">Leaves (signed cards): </dt>
                <dd className="inline">{root.card_count}</dd>
              </div>
              <div>
                <dt className="inline font-bold text-gray-900">Merkle root: </dt>
                <dd className="inline break-all font-mono text-sm">{root.merkle_root}</dd>
              </div>
              <div>
                <dt className="inline font-bold text-gray-900">as_of: </dt>
                <dd className="inline font-mono text-sm">{root.as_of}</dd>
              </div>
              <p className="pt-1 text-sm text-gray-500">
                Source:{" "}
                <a className="text-emerald-700 underline" href="/root.json">
                  GET /root.json
                </a>{" "}
                — the number you just read was fetched, not typed. The root republishes hourly, so
                a later load may show a newer root; that is the cadence working, not an edit.
              </p>
            </dl>
          )}
        </section>

        <h2 className="mt-12 text-2xl font-black leading-tight text-gray-900">The three layers</h2>
        <div className="mt-6 space-y-5">
          {STEPS.map((s) => (
            <section key={s.n} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-extrabold text-gray-900">
                <span className="mr-2 text-emerald-700">{s.n}.</span>
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{s.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-xl border border-amber-500/30 bg-amber-50 p-5">
          <h2 className="text-base font-extrabold text-gray-900">
            The honesty rule for this event — stamped is not anchored
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-700">
            A fresh OpenTimestamps stamp carries a PendingAttestation. It proves submission, not
            inclusion. It becomes a proof only once a calendar commits it to a Bitcoin block and
            the proof is upgraded. Until that upgrade verifies, every surface — this page included
            — says <strong>PENDING</strong>, never ANCHORED. If any step fails on the day, the
            failure is recorded in{" "}
            <a className="text-emerald-700 underline" href="/api/corrections">
              /api/corrections
            </a>
            , not smoothed over.
          </p>
        </section>

        <section className="mt-10 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-gray-900">Verify it yourself, after the fact</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-gray-600">
            <li>
              The posture we are closing:{" "}
              <a className="text-emerald-700 underline" href="/.well-known/anchor-posture.json">
                /.well-known/anchor-posture.json
              </a>{" "}
              — states in machine-readable form what is signed, what is anchored, and what is
              neither, including the parts that are absent.
            </li>
            <li>
              The witness trail:{" "}
              <a className="text-emerald-700 underline" href="/interop/root-witness-pointer.json">
                /interop/root-witness-pointer.json
              </a>
            </li>
            <li>
              The verification rule: pin the published did:web key, recompute, re-fetch —{" "}
              <a className="text-emerald-700 underline" href="/signed/HOW-TO-VERIFY.md">
                /signed/HOW-TO-VERIFY.md
              </a>
            </li>
          </ul>
        </section>

        <p className="mt-10 text-sm text-gray-500">
          Measurement, not certification.{" "}
          <Link href="/doctrine" className="text-emerald-700 underline">
            Doctrine &amp; refusals
          </Link>
          {" · "}
          <Link href="/honesty" className="text-emerald-700 underline">
            Honesty gate
          </Link>
          {" · "}
          <Link
            href="/postmortems/x402-settlement-reading"
            className="text-emerald-700 underline"
          >
            Latest postmortem
          </Link>
        </p>
      </div>
    </div>
  );
}
