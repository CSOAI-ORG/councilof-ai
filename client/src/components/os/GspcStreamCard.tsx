import { useEffect, useState } from "react";

/**
 * GspcStreamCard — live GSPC card for AG-UI / Council OS agent streams.
 * AG-UI presentation only — not a 7th evidence atom.
 *
 * Fetches GET /api/gspc + GET /root.json. Never pastes last week's numbers.
 * Shows axis score + root merkle short form + sha256 membership in card_sha256[].
 * Fetch fail = UNCHECKABLE. Jail is a measured floor, not a 16th pane.
 * Public-root leaf count is NOT the signed catalog. Do not say "313 signed".
 */

type AxisRow = {
  axis: string;
  status?: string;
  accuracy?: number;
  n?: number;
  separation?: string;
  bench?: string;
  task?: string;
};

type BoardPayload = {
  totals?: { public_count?: string; axes?: number; measured_axes?: number; unmeasured_axes?: number };
  axes?: AxisRow[];
};

type RootPayload = {
  merkle_root?: string;
  card_count?: number;
  card_sha256?: string[];
  as_of?: string;
  note?: string;
};

export type GspcStreamCardProps = {
  /** Axis id to highlight from the live board (e.g. "governance"). */
  axis?: string;
  /** Optional card content sha256 to check for membership in root card_sha256[]. */
  cardSha256?: string;
  className?: string;
};

function shortRoot(hex: string): string {
  return hex.length > 8 ? `${hex.slice(0, 8)}…` : hex;
}

function scoreLine(row: AxisRow | null | undefined, asked: string): string {
  if (!row) {
    return `No axis named “${asked}” on GET /api/gspc. Empty stays empty.`;
  }
  const status = String(row.status ?? "UNMEASURED");
  if (status !== "MEASURED") {
    return `${row.axis} is ${status} — a first-class cell, not a missing score.`;
  }
  const n = row.n ?? "—";
  const acc =
    typeof row.accuracy === "number" && Number.isFinite(row.accuracy)
      ? row.accuracy.toFixed(3)
      : "—";
  const sep = row.separation ?? "—";
  return `${row.axis} — MEASURED · accuracy ${acc} · n=${n} · separation ${sep}`;
}

export default function GspcStreamCard({ axis, cardSha256, className }: GspcStreamCardProps) {
  const [board, setBoard] = useState<BoardPayload | null>(null);
  const [root, setRoot] = useState<RootPayload | null>(null);
  const [boardErr, setBoardErr] = useState<string | null>(null);
  const [rootErr, setRootErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setBoardErr(null);
    setRootErr(null);

    Promise.all([
      fetch("/api/gspc", { signal: ac.signal })
        .then(async (r) => {
          if (!r.ok) throw new Error(`GET /api/gspc HTTP ${r.status}`);
          return r.json() as Promise<BoardPayload>;
        })
        .then((j) => setBoard(j))
        .catch((e) => {
          if (e?.name === "AbortError") return;
          setBoard(null);
          setBoardErr(String(e?.message || e));
        }),
      fetch("/root.json", { signal: ac.signal })
        .then(async (r) => {
          if (!r.ok) throw new Error(`GET /root.json HTTP ${r.status}`);
          return r.json() as Promise<RootPayload>;
        })
        .then((j) => setRoot(j))
        .catch((e) => {
          if (e?.name === "AbortError") return;
          setRoot(null);
          setRootErr(String(e?.message || e));
        }),
    ]).finally(() => {
      if (!ac.signal.aborted) setLoading(false);
    });

    return () => ac.abort();
  }, [axis, cardSha256]);

  const asked = (axis || "").trim();
  const row =
    asked && board?.axes
      ? board.axes.find((a) => a.axis === asked) ?? null
      : null;

  const merkle = root?.merkle_root || "";
  const leaves = Array.isArray(root?.card_sha256) ? root!.card_sha256! : [];
  const sha = (cardSha256 || "").trim().toLowerCase();
  const membership =
    sha.length > 0
      ? leaves.some((h) => String(h).toLowerCase() === sha)
        ? "in root"
        : "not in root"
      : null;

  const boardUncheckable = Boolean(boardErr) || (!loading && !board);
  const rootUncheckable = Boolean(rootErr) || (!loading && !root);

  return (
    <div
      className={
        className ||
        "rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-700 shadow-sm"
      }
      data-testid="gspc-stream-card"
    >
      <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[2px] text-emerald-700">
          Live GSPC
        </span>
        <span className="text-[11px] text-slate-500">
          {loading
            ? "Reading GET /api/gspc + /root.json…"
            : board?.totals?.public_count || "GET /api/gspc"}
        </span>
      </div>

      {boardUncheckable ? (
        <p className="font-semibold text-amber-800">
          UNCHECKABLE — board fetch failed. Do not guess a score.
          {boardErr ? ` (${boardErr})` : ""}
        </p>
      ) : asked ? (
        <p className="font-medium text-slate-900">{scoreLine(row, asked)}</p>
      ) : (
        <p className="text-slate-600">
          No axis named. Caption from live totals only — empty stays empty.
        </p>
      )}

      {asked === "jail" && row && (
        <p className="mt-1 text-[11px] text-slate-500">
          Jail is a measured floor, not a 16th pane.
        </p>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3">
        {rootUncheckable ? (
          <p className="font-semibold text-amber-800">
            UNCHECKABLE — root fetch failed. Do not invent a merkle.
            {rootErr ? ` (${rootErr})` : ""}
          </p>
        ) : (
          <ul className="space-y-1 font-mono text-[11px] text-slate-600">
            <li>
              root merkle{" "}
              <span className="text-slate-900">{merkle ? shortRoot(merkle) : "—"}</span>
            </li>
            {membership && (
              <li>
                card sha256 membership:{" "}
                <span className="text-slate-900">{membership}</span>
              </li>
            )}
            <li className="text-slate-400">
              public-root leaves ≠ signed catalog · not a seventh evidence type
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
