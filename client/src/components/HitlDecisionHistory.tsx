import { useEffect, useRef, useState } from "react";
import {
  filterHitlReceipts,
  parseHitlRecord,
  type PublicHitlRecord,
} from "../lib/hitlRecord";

/** The already-public record; no approval, token handling or execution occurs here. */
export default function HitlDecisionHistory({
  revision = 0,
}: {
  revision?: number;
}) {
  const [reload, setReload] = useState(0);
  const [record, setRecord] = useState<PublicHitlRecord | null>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading the public decision record…");
  const [busy, setBusy] = useState(true);
  const generation = useRef(0);

  useEffect(() => {
    const current = ++generation.current;
    const controller = new AbortController();
    setBusy(true);
    setRecord(null);
    setRaw(null);
    setStatus("Loading the public decision record…");
    const timeout = setTimeout(() => controller.abort(), 15000);
    void (async () => {
      try {
        const response = await fetch("/api/hitl/record", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok)
          throw new Error(`The record returned HTTP ${response.status}.`);
        const text = await response.text();
        const parsed = parseHitlRecord(text);
        if (current !== generation.current) return;
        setRecord(parsed);
        setRaw(text);
        setStatus(
          "Current public record loaded. Signatures have not been verified here.",
        );
      } catch {
        if (current === generation.current) {
          setStatus(
            "The decision record could not be checked. This does not mean that no decisions exist. Retry the read or reopen a saved record.",
          );
        }
      } finally {
        clearTimeout(timeout);
        if (current === generation.current) setBusy(false);
      }
    })();
    return () => {
      ++generation.current;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [revision, reload]);

  async function reopen(file: File | undefined) {
    if (!file) return;
    const current = ++generation.current;
    setRecord(null);
    setRaw(null);
    setBusy(true);
    try {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("This file is larger than 2 MiB.");
      const text = await file.text();
      const parsed = parseHitlRecord(text);
      if (current !== generation.current) return;
      setRecord(parsed);
      setRaw(text);
      setStatus(
        "Saved snapshot reopened locally. It may be out of date. Its signatures and source have not been verified here; it grants no authority.",
      );
    } catch {
      if (current === generation.current)
        setStatus(
          "The saved record was not accepted. Use a supported decision-record JSON file no larger than 2 MiB.",
        );
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }

  function save() {
    if (!raw) return;
    try {
      const url = URL.createObjectURL(
        new Blob([raw], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "csoai-public-decisions.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(
        "Download requested. The original record bytes are unchanged; this is not a new signature or authorization.",
      );
    } catch {
      setStatus(
        "The download could not be started. The record is still available to inspect.",
      );
    }
  }

  const rows = record ? filterHitlReceipts(record.receipts, query) : [];
  return (
    <section
      aria-label="Past public decisions"
      className="mt-5 rounded-xl border border-sky-400/30 bg-slate-950 p-4 text-sky-50"
    >
      <h3 className="text-sm font-semibold text-sky-50">
        Past public decisions
      </h3>
      <p className="mt-2 text-xs text-sky-100/80">
        Find a recorded decision, inspect the proposed action, and keep a copy.
        These are public Council records, not private MEOK tasks. A recorded
        approval does not prove that an action ran. Only returned records are
        searched. History may be limited or delayed; a missing match does not
        establish that a decision was not recorded.
      </p>
      <div className="my-3 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setReload((n) => n + 1)}
          disabled={busy}
          className="rounded-lg border border-sky-400/40 px-3 py-2 disabled:opacity-50"
        >
          Refresh record
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!raw || busy}
          className="rounded-lg border border-sky-400/40 px-3 py-2 disabled:opacity-50"
        >
          Save decision record
        </button>
        <label className="max-w-full text-xs text-sky-100/80">
          Reopen saved decision record
          <input
            type="file"
            accept=".json,application/json"
            className="mt-1 block max-w-full"
            disabled={busy}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = "";
              void reopen(file);
            }}
          />
        </label>
      </div>
      <p role="status" className="my-3 text-xs text-sky-100/80">
        {status}
      </p>
      {record ? (
        <>
          {!record.store_bound ? (
            <p className="my-2 text-sm text-amber-200">
              This response reports no bound decision store. An empty response
              cannot establish that no decision was ever made.
            </p>
          ) : null}
          <label className="block text-xs text-sky-100/80">
            Find a decision by challenge ID, subject, outcome, axis or date
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1 w-full rounded-lg border border-sky-400/30 bg-black/30 px-3 py-2 text-sm"
            />
          </label>
          <p className="my-2 text-xs text-sky-100/70">
            {rows.length} of {record.count} returned decisions
          </p>
          {rows.length === 0 ? (
            <p className="text-sm text-sky-100/80">
              {record.count
                ? "No returned decisions match this filter."
                : "This response contains no decisions."}
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map((r, i) => (
                <details
                  key={`${r.challenge.id}-${r.at}-${i}`}
                  className="rounded-lg border border-sky-400/20 bg-black/20 p-3"
                >
                  <summary className="cursor-pointer break-words text-sm text-sky-50">
                    {r.decision} · {r.challenge.subject} · {r.at}
                  </summary>
                  <dl className="mt-3 space-y-2 break-words text-xs text-sky-100/85">
                    <div>
                      <dt className="font-semibold">Challenge ID</dt>
                      <dd className="break-all">{r.challenge.id}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Proposed action</dt>
                      <dd className="whitespace-pre-wrap">
                        {r.challenge.proposed_action}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Recorded operator label</dt>
                      <dd>
                        {r.operator || "Not supplied"} — not independent
                        identity verification
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Note</dt>
                      <dd className="whitespace-pre-wrap">
                        {r.note || "No note supplied"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold">Signature</dt>
                      <dd>
                        {r.signature.value_hex
                          ? `Present; not verified here. Declared signer: ${r.signature.did ?? "not supplied"}.`
                          : `Unsigned: ${r.signature.unsigned_reason ?? "no signature supplied"}.`}
                      </dd>
                    </div>
                  </dl>
                </details>
              ))}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}