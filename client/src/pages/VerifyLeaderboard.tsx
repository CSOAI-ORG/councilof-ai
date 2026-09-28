import { useEffect, useState } from "react";
import { verifyPublishedArenaElo } from "@/lib/arenaAttestation";
import { setMetaDescription } from "@/lib/utils";
import { useBoardCount } from "@/lib/boardCount";

/**
 * /verify-leaderboard - the verify-this-leaderboard demo (the moat landing).
 * Fetch the signed per-axis Elo leaderboard and verify its signed envelope against
 * the pinned board DID key, including the displayed body's content ID.
 * Free, no records leave the machine.
 *
 * ── WHICH COUNT IS THIS? ─────────────────────────────────────────────────────
 * The axis count on this page is `elo.axes.length` from /arena/elo_reference.json
 * — the ARENA's axis set, not the GSPC board's. It is derived, never typed, but
 * until 2026-08-26 it rendered as a bare "N axis" with nothing naming its
 * instrument, so a reader saw a number that disagreed with the board and had no
 * way to tell why. The arena is a distinct instrument (see facts.json,
 * counts.namespaces.arena_elo) and is deliberately not reconciled to the board.
 * Both are now labelled, and the board's count is derived from GET /api/gspc.
 */
export default function VerifyLeaderboard() {
  // The board's own count, derived from /api/gspc. Shown so the arena's axis count
  // above cannot be mistaken for the board's. Never typed.
  const board = useBoardCount();
  const [elo, setElo] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "checking" | "ok" | "bad" | "uncheckable">("idle");
  const [reason, setReason] = useState("");

  useEffect(() => {
    document.title = "Verify this leaderboard - free, in your browser | Council of AI";
    setMetaDescription(
      "Recompute the arena reference's content ID and verify its Ed25519 envelope against the pinned public board DID key in your browser."
    );
    fetch("/arena/elo_reference.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((d) => setElo(d))
      .catch((e) => setErr(String(e)));
  }, []);

  async function verify() {
    if (!elo) return;
    setState("checking");
    const verdict = await verifyPublishedArenaElo(elo);
    setReason(verdict.reason);
    setState(verdict.state === "VALID" ? "ok" : verdict.state === "INVALID" ? "bad" : "uncheckable");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          The verify path is the product
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">Verify this leaderboard</h1>
        <p className="mt-3 text-gray-600">
          Anyone can re-verify the signed per-axis Elo leaderboard: the browser recomputes the
          displayed body's content ID and checks the Ed25519-signed envelope against the pinned
          public board DID key. The DID document is also cross-checked when reachable; no record is uploaded.
        </p>

        <div className="mt-8 rounded-2xl border border-emerald-600/15 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              {elo ? (
                <>
                  <span className="font-semibold text-gray-900">{elo.models ?? "—"}</span> models ·{" "}
                  <span className="font-semibold text-gray-900">{elo.axes?.length ?? 0}</span> arena
                  axes · measured rows carry their published n and interval
                </>
              ) : err ? (
                "Leaderboard not yet available."
              ) : (
                "Loading the signed leaderboard…"
              )}
            </div>
            <button
              onClick={verify}
              disabled={!elo}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              data-testid="verify-leaderboard"
            >
              {state === "checking" ? "Verifying…" : "Verify in my browser"}
            </button>
          </div>

          {state === "ok" && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700" data-testid="verify-leaderboard-ok">
              ✓ VALID — {reason}
            </p>
          )}
          {state === "bad" && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700" data-testid="verify-leaderboard-bad">
              ✗ INVALID — {reason}
            </p>
          )}
          {state === "uncheckable" && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800" data-testid="verify-leaderboard-uncheckable">
              UNCHECKABLE — {reason}
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-xl border border-emerald-600/10 p-4">
              <p className="font-semibold text-gray-900">1. Recompute</p>
              <p className="mt-1 text-gray-600">Canonical body → sha256 → content_id, in-browser.</p>
            </div>
            <div className="rounded-xl border border-emerald-600/10 p-4">
              <p className="font-semibold text-gray-900">2. Check key</p>
              <p className="mt-1 text-gray-600">Ed25519 verify against the pinned board DID key.</p>
            </div>
            <div className="rounded-xl border border-emerald-600/10 p-4">
              <p className="font-semibold text-gray-900">3. Trust nothing</p>
              <p className="mt-1 text-gray-600">No login; the record is checked in this browser.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <a href="/dashboard?tab=board" className="rounded-xl border border-emerald-600/20 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50">
            The full board — {board.public_count} →
          </a>
          <a href="/arena/elo_reference.json" className="rounded-xl border border-emerald-600/20 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50">
            Raw signed JSON
          </a>
          <a href="/api/arena/scoreboard?verify=1" className="rounded-xl border border-emerald-600/20 px-4 py-2 font-semibold text-emerald-700 hover:bg-emerald-50">
            API + verify receipt
          </a>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Measurement, not certification. Read the signed reference for each axis's published n,
          interval and empty state. A valid signature proves these bytes came from the pinned key;
          it does not admit a row to the GSPC board or prove benchmark quality.
        </p>
      </div>
    </div>
  );
}
