import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";

/* /estate — one index of everything CSOAI holds, across every surface, under one Merkle root.
 *
 * The honesty this page has to carry, because the census is easy to misread:
 *  - INDEXED is not MEASURED. A row here says we found the artifact. It says nothing about
 *    whether anything was measured against it. The board at /api/gspc is the only place that
 *    answers the measurement question.
 *  - Two kinds of leaf sit under the root and they answer different questions. A bytes leaf is
 *    the sha256 of an artifact we actually read. A record leaf is the sha256 of our own note
 *    about a remote artifact we did not download; it proves we recorded that identity, and
 *    nothing at all about the remote bytes. They are never added together.
 *  - The root is unsigned. It says when, not who.
 */

interface Entry {
  surface: string;
  kind: string;
  id: string;
  digest: string;
  leaf_class: "bytes_leaf" | "record_leaf";
  state: string;
  items?: number;
  visibility?: string;
  private?: boolean;
  url?: string;
}
interface Master {
  as_of: string;
  what_this_is: string;
  what_the_root_proves: string;
  what_this_is_not: string[];
  leaf_classes: Record<string, string>;
  merkle_rule: string;
  merkle_root: string;
  totals: {
    entries: number;
    bytes_leaves: number;
    record_leaves: number;
    by_surface: Record<string, number>;
    never_add_these: string;
  };
  inclusion_self_check: { sampled: number; verified: number; a_leaf_outside_the_set_is_rejected: boolean };
  entries: Entry[];
}

const ARTIFACT = "/interop/master-consolidation-2026-09-16.json";

export default function EstateIndex() {
  const [m, setM] = useState<Master | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "Estate index — Council of AI";
    setMetaDescription(
      "Every artifact Council of AI holds, across Hugging Face, GitHub, Kaggle and this repository, committed to one Merkle root. Indexed is not measured.",
    );
    fetch(ARTIFACT)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setM)
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  const banks = (m?.entries || []).filter((e) => e.kind === "frozen_question_bank");
  const shown = q.trim()
    ? (m?.entries || []).filter((e) => e.id.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 200)
    : [];

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Estate index</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
        Everything we hold, wherever it lives, written down once and committed to a single root.
        You can search it, and you can recompute the root yourself from the published file.
      </p>

      {err && (
        <p className="mt-6 rounded-md border border-amber-400/40 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          The index could not be read live: {err}. The file is at{" "}
          <a className="underline" href={ARTIFACT}>{ARTIFACT}</a>.
        </p>
      )}

      {m && (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="text-sm text-neutral-500">Entries under the root</div>
              <div className="mt-1 text-3xl font-semibold tabular-nums">{m.totals.entries}</div>
              <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {m.totals.bytes_leaves} are artifacts we read. {m.totals.record_leaves} are our own
                records about artifacts held elsewhere. Those answer different questions, so we
                never add them into one number.
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="text-sm text-neutral-500">Merkle root</div>
              <code className="mt-1 block break-all text-xs leading-relaxed">{m.merkle_root}</code>
              <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                As of {m.as_of}. {m.inclusion_self_check.verified} of{" "}
                {m.inclusion_self_check.sampled} sampled entries verify against it, and a leaf from
                outside the set is rejected.
              </div>
            </div>
          </section>

          <h2 className="mt-10 text-xl font-semibold">Where it lives</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr><th className="py-2 pr-6 font-medium">Surface</th><th className="py-2 font-medium">Entries</th></tr>
              </thead>
              <tbody>
                {Object.entries(m.totals.by_surface).map(([s, n]) => (
                  <tr key={s} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="py-2 pr-6">{s}</td>
                    <td className="py-2 tabular-nums">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-10 text-xl font-semibold">Frozen question banks</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            These we read end to end, so the digest covers the bank's own bytes. A published result
            names the bank it was answered against by this digest.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="py-2 pr-6 font-medium">Bank</th>
                  <th className="py-2 pr-6 font-medium">Items</th>
                  <th className="py-2 font-medium">sha256 of items.jsonl</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((b) => (
                  <tr key={b.id} className="border-t border-neutral-200 dark:border-neutral-800">
                    <td className="py-2 pr-6">{b.id}</td>
                    <td className="py-2 pr-6 tabular-nums">{b.items}</td>
                    <td className="py-2"><code className="text-xs">{b.digest.slice(0, 24)}…</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-10 text-xl font-semibold">Search the index</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="a repository, a dataset, a file path"
            className="mt-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
          {q.trim() && (
            <div className="mt-3 overflow-x-auto">
              <p className="text-sm text-neutral-500">{shown.length} shown</p>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {shown.map((e) => (
                    <tr key={e.surface + e.id} className="border-t border-neutral-200 dark:border-neutral-800">
                      <td className="py-1.5 pr-4 text-neutral-500">{e.surface}</td>
                      <td className="py-1.5 pr-4">{e.id}</td>
                      <td className="py-1.5 text-xs text-neutral-500">
                        {e.leaf_class === "bytes_leaf" ? "bytes read" : "record only"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 className="mt-10 text-xl font-semibold">What this does not prove</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            {m.what_this_is_not.map((s) => (<li key={s}>{s}</li>))}
            <li>{m.totals.never_add_these}</li>
          </ul>

          <p className="mt-8 text-sm text-neutral-500">
            The file, and the rule for recomputing the root, are at{" "}
            <a className="underline" href={ARTIFACT}>{ARTIFACT}</a>. Its OpenTimestamps proof is at{" "}
            <a className="underline" href={`${ARTIFACT}.ots`}>{ARTIFACT}.ots</a>.
          </p>
        </>
      )}
    </main>
  );
}
