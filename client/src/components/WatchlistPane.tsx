import { useEffect, useState } from "react";
import {
  applyDigest,
  digestFromHubModel,
  dropWatch,
  loadWatchlist,
  parseWatchIds,
  saveWatchlist,
  upsertWatch,
  WATCHLIST_RULING,
  type WatchRow,
} from "@/lib/watchlist";

async function probe(id: string): Promise<string | null> {
  const r = await fetch(`https://huggingface.co/api/models/${encodeURIComponent(id)}?blobs=true`, {
    headers: { accept: "application/json" },
  });
  if (!r.ok) return null;
  return digestFromHubModel(await r.json());
}

export default function WatchlistPane() {
  const [rows, setRows] = useState<WatchRow[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setRows(loadWatchlist(typeof localStorage === "undefined" ? null : localStorage));
  }, []);

  function persist(next: WatchRow[]) {
    setRows(next);
    saveWatchlist(typeof localStorage === "undefined" ? null : localStorage, next);
  }

  function add() {
    const ids = parseWatchIds(draft);
    if (!ids.length) {
      setNote("Paste owner/name ids. Listing is DISCOVERED, never MEASURED.");
      return;
    }
    persist(upsertWatch(rows, ids));
    setDraft("");
    setNote(`Watching ${ids.length}. Local digest compare only.`);
  }

  async function refresh() {
    if (!rows.length || busy) return;
    setBusy(true);
    setNote(null);
    let next = [...rows];
    try {
      for (let i = 0; i < next.length; i++) {
        try {
          const sha = await probe(next[i].id);
          next[i] = applyDigest(next[i], sha);
        } catch {
          next[i] = applyDigest(next[i], null);
        }
      }
      persist(next);
      const moved = next.filter((r) => r.digest_moved).length;
      setNote(
        moved
          ? `${moved} digest(s) moved. Still DISCOVERED, not MEASURED.`
          : "No digest move on this check. Still DISCOVERED, not MEASURED.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 space-y-4" data-testid="watchlist-pane" aria-labelledby="watch-h">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-800">
          Watchlist · local digest
        </p>
        <h2 id="watch-h" className="mt-2 text-xl font-bold text-slate-900">
          {WATCHLIST_RULING}
        </h2>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Qwen/Qwen3.8-27B, openai/whisper-tiny"
          className="min-h-[3rem] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={add}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Watch
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={busy || !rows.length}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
          >
            {busy ? "…" : "Check digests"}
          </button>
        </div>
      </div>
      {note && <p className="text-sm text-slate-600">{note}</p>}
      {rows.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3" data-testid={`watch-${r.id}`}>
              <div>
                <p className="font-semibold text-slate-900">{r.id}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  {r.last_sha256 ? r.last_sha256.slice(0, 12) + "…" : "no digest yet"}
                  {r.digest_moved ? " · moved" : ""}
                  {" · DISCOVERED"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => persist(dropWatch(rows, r.id))}
                className="text-sm text-slate-600 hover:text-rose-700"
              >
                Drop
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
