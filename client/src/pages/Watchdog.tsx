import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { verifyRecord } from "@/lib/recordVerify";
// Shared with the server-side router (#3141): 4xx/5xx/timeout is UNCHECKABLE, never FAILED.
import { retrievalState } from "../../../functions/_lib/watchdogRoute";
import {
  CORRECTIONS_URL,
  REGISTER_URL,
  claimHref,
  claimsFromRegistry,
  conclusionResult,
  correctionsFor,
  evidenceLinkState,
  libraryHref,
  parseJourney,
  registryPath,
  retrievalFailed,
  sha256Hex,
  sidecarPath,
  signatureResult,
  summariseRegister,
  verifierHref,
  verifyInclusion,
  type Retrieval,
  type ThreeResults,
  type WatchClaim,
} from "@/lib/watchdogJourney";
import { NLM_CHECKED_ON, NLM_IDS, NLM_NAMED, NLM_SOURCE, ZENODO_REDIRECTED, ZENODO_TOMBSTONED } from "@/data/nlmCrosswalk";

/**
 * /watchdog — Public Watchdog: one journey over what is already published.
 * Pick a claim → see its dated evidence and history → verify it (three separate results) →
 * re-fetch the same record by its URL. Plus the research library (NLM crosswalk).
 *
 * Replaces the old redirect to the dashboard (14 Oct 2026, owner move #1). No account, no price,
 * no score: this page reads public files and says what it could not read.
 */

const FOCUS = "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const TOMBSTONES = { checkedOn: NLM_CHECKED_ON, ids: ZENODO_TOMBSTONED };

async function getJson(url: string): Promise<Retrieval<{ json: unknown; text: string }>> {
  const fetchedAt = new Date().toISOString();
  try {
    const res = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });
    if (retrievalState(res.status) === "UNCHECKABLE" || !res.ok) return retrievalFailed(`HTTP ${res.status}`, fetchedAt, res.status);
    const text = await res.text();
    try {
      return { state: "OK", value: { json: JSON.parse(text), text }, fetchedAt, status: res.status, sha256: await sha256Hex(text) };
    } catch {
      return retrievalFailed("The response was not JSON", fetchedAt, res.status);
    }
  } catch (e) {
    // A network error or timeout maps through the same helper: retrievalState(null, true) is UNCHECKABLE.
    return retrievalFailed(e instanceof Error ? e.message : "Network error", fetchedAt);
  }
}

function Chip({ word }: { word: string }) {
  return <span className="inline-flex items-center rounded-md border border-border px-2 py-0.5 font-mono text-xs font-semibold text-foreground">{word}</span>;
}

function Unreadable({ what, r }: { what: string; r: { reason: string; fetchedAt: string } }) {
  return (
    <p className="text-sm text-muted-foreground" data-testid="watchdog-uncheckable">
      <Chip word="UNCHECKABLE" /> {what} could not be read ({r.reason}) at {r.fetchedAt}.
    </p>
  );
}

export default function Watchdog() {
  const [search, setSearch] = useState(() => (typeof window === "undefined" ? "" : window.location.search));
  useEffect(() => {
    const on = () => setSearch(window.location.search);
    window.addEventListener("popstate", on);
    return () => window.removeEventListener("popstate", on);
  }, []);
  const params = useMemo(() => parseJourney(search), [search]);
  const go = useCallback((href: string) => {
    window.history.pushState(null, "", href);
    setSearch(window.location.search);
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10" data-testid="watchdog-journey">
      <h1 className="text-3xl font-bold text-foreground">Ask a question. Inspect the evidence.</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        The Public Watchdog reads public claims organisations make about themselves, records them verbatim with source and date, and re-reads them. Pick a claim, see its dated history, check it yourself, and keep the link: it re-fetches the same published record.
        Nothing here is a verdict, a score or a certification, and no listing implies a claim is false.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/dashboard" className={`inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-semibold ${FOCUS}`}>
          Ask a question
        </Link>
        <button type="button" onClick={() => go("/watchdog/")} aria-pressed={params.view === "claims"} className={`min-h-11 rounded-lg border border-border px-3 text-sm font-semibold ${FOCUS}`}>
          Claims
        </button>
        <button type="button" onClick={() => go(libraryHref())} aria-pressed={params.view === "library"} className={`min-h-11 rounded-lg border border-border px-3 text-sm font-semibold ${FOCUS}`} data-testid="watchdog-library-tab">
          Research library
        </button>
        <Link href="/board" className={`inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm ${FOCUS}`}>
          Live board
        </Link>
        <Link href="/corrections" className={`inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm ${FOCUS}`}>
          Corrections
        </Link>
      </div>
      {params.view === "library" ? <Library /> : <Claims params={params} go={go} />}
    </div>
  );
}

function Claims({ params, go }: { params: ReturnType<typeof parseJourney>; go: (h: string) => void }) {
  const [register, setRegister] = useState<Retrieval<{ json: unknown; text: string }> | null>(null);
  const [registries, setRegistries] = useState<Record<string, Retrieval<{ json: unknown; text: string }>>>({});

  useEffect(() => {
    let off = false;
    getJson(REGISTER_URL).then(async (r) => {
      if (off) return;
      setRegister(r);
      if (r.state !== "OK") return;
      const live = summariseRegister(r.value.json).live;
      const got = await Promise.all(live.map(async (l) => [l.registryId, await getJson(l.url)] as const));
      if (!off) setRegistries(Object.fromEntries(got));
    });
    return () => {
      off = true;
    };
  }, []);

  const summary = register?.state === "OK" ? summariseRegister(register.value.json) : null;
  const claims = useMemo(
    () => Object.values(registries).flatMap((r) => (r.state === "OK" ? claimsFromRegistry(r.value.json) : [])),
    [registries],
  );
  const failed = Object.entries(registries).filter(([, r]) => r.state !== "OK") as [string, Extract<Retrieval<unknown>, { state: "UNCHECKABLE" }>][];
  const bySubject = useMemo(() => {
    const m = new Map<string, WatchClaim[]>();
    for (const c of claims) m.set(c.subject, [...(m.get(c.subject) ?? []), c]);
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [claims]);

  if (params.registry && params.claim) return <ClaimDetail registryId={params.registry} claimId={params.claim} go={go} />;

  return (
    <section className="mt-8" aria-labelledby="wd-claims">
      <h2 id="wd-claims" className="text-xl font-semibold">Pick a claim</h2>
      {!register ? (
        <p className="mt-2 text-sm text-muted-foreground">Reading the claim-maintenance register…</p>
      ) : register.state !== "OK" ? (
        <Unreadable what="The claim-maintenance register" r={register} />
      ) : (
        <p className="mt-2 text-sm text-muted-foreground" data-testid="watchdog-totals">
          {summary?.subjects ?? "UNMEASURED"} subjects · {summary?.claims ?? "UNMEASURED"} claims, as of {summary?.asOf ?? "UNRECORDED"} (from{" "}
          <a className="underline" href={REGISTER_URL}>the register</a>). {claims.length && summary?.claims !== null && claims.length !== summary?.claims ? `Loaded ${claims.length} from the live registries; the difference is shown, not reconciled.` : ""}
        </p>
      )}
      {failed.map(([id, r]) => (
        <Unreadable key={id} what={`Registry ${id}`} r={r} />
      ))}
      <div className="mt-4 space-y-4">
        {bySubject.map(([subject, list]) => (
          <details key={subject} className="rounded-xl border border-border bg-card p-3">
            <summary className={`cursor-pointer font-semibold ${FOCUS}`}>
              {subject} <span className="text-sm font-normal text-muted-foreground">({list.length})</span>
            </summary>
            <ul className="mt-2 list-none space-y-2 p-0">
              {list.map((c) => (
                <li key={`${c.registryId}#${c.claimId}`} className="flex flex-wrap items-center gap-2">
                  <Chip word={c.state} />
                  <a
                    href={claimHref(c.registryId, c.claimId)}
                    onClick={(e) => {
                      e.preventDefault();
                      go(claimHref(c.registryId, c.claimId));
                    }}
                    className={`min-w-0 flex-1 underline ${FOCUS}`}
                    data-testid="watchdog-claim-link"
                  >
                    “{c.text || c.claimId}”
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  );
}

function ClaimDetail({ registryId, claimId, go }: { registryId: string; claimId: string; go: (h: string) => void }) {
  const [reg, setReg] = useState<Retrieval<{ json: unknown; text: string }> | null>(null);
  const [corr, setCorr] = useState<Retrieval<{ json: unknown; text: string }> | null>(null);
  const [results, setResults] = useState<ThreeResults | null>(null);
  const [busy, setBusy] = useState(false);
  const path = registryPath(registryId);

  const load = useCallback(() => {
    setResults(null);
    if (path) getJson(path).then(setReg);
    getJson(CORRECTIONS_URL).then(setCorr);
  }, [path]);
  useEffect(load, [load]);

  const claim = reg?.state === "OK" ? claimsFromRegistry(reg.value.json).find((c) => c.claimId === claimId) ?? null : null;

  const verify = async () => {
    if (!claim || reg?.state !== "OK") return;
    setBusy(true);
    const inclusion = await verifyInclusion(claim.inclusion);
    const side = sidecarPath(registryId);
    const sc = side ? await getJson(side) : null;
    let sigState: string | null = null;
    let pinned: string | null = null;
    let reasons: string[] = [];
    if (sc?.state === "OK") {
      const v = await verifyRecord(sc.value.text);
      sigState = v.state;
      reasons = v.reasons;
      const p = (sc.value.json as { payload?: { artifact?: { sha256?: unknown } } })?.payload?.artifact?.sha256;
      pinned = typeof p === "string" ? p : null;
    } else sigState = "UNCHECKABLE";
    const signature = sc?.state === "OK" ? signatureResult(sigState, pinned, reg.sha256 ?? null, reasons) : { result: "UNCHECKABLE" as const, detail: `The signed sidecar could not be read (${sc ? sc.reason : "no path"}).` };
    setResults({ signature, inclusion, conclusion: conclusionResult(claim) });
    setBusy(false);
  };

  return (
    <section className="mt-8" aria-labelledby="wd-claim" data-testid="watchdog-claim-detail">
      <button type="button" onClick={() => go("/watchdog/")} className={`min-h-11 text-sm underline ${FOCUS}`}>
        ← All claims
      </button>
      {!path ? (
        <p className="text-sm">That registry id is not a published registry name.</p>
      ) : !reg ? (
        <p className="text-sm text-muted-foreground">Reading {path}…</p>
      ) : reg.state !== "OK" ? (
        <Unreadable what={`Registry ${registryId}`} r={reg} />
      ) : !claim ? (
        <p className="text-sm" data-testid="watchdog-claim-missing">
          <Chip word="UNMEASURED" /> Registry {registryId} has no claim {claimId}.
        </p>
      ) : (
        <>
          <h2 id="wd-claim" className="mt-2 text-xl font-semibold">
            {claim.subject}: “{claim.text}”
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Claim {claim.claimId} in {registryId}. Registry fetched {reg.fetchedAt}, sha256 <code>{reg.sha256?.slice(0, 16)}…</code>.{" "}
            <a className="underline" href={path}>Raw JSON</a>
          </p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold">State</dt><dd><Chip word={claim.state} /></dd></div>
            <div><dt className="font-semibold">Source</dt><dd>{claim.sourceUrl ? <><a className="underline [overflow-wrap:anywhere]" href={claim.sourceUrl} rel="noreferrer" target="_blank">{claim.sourceUrl}</a> <span className="text-muted-foreground">{evidenceLinkState(claim.sourceUrl, TOMBSTONES).state === "UNCHECKABLE" ? evidenceLinkState(claim.sourceUrl, TOMBSTONES).note : ""}</span></> : "UNMEASURED"}</dd></div>
            <div><dt className="font-semibold">First captured</dt><dd>{claim.firstCaptured ?? "UNMEASURED"}</dd></div>
            <div><dt className="font-semibold">Last read</dt><dd>{claim.lastRead ?? "UNMEASURED"}</dd></div>
            <div><dt className="font-semibold">Next read</dt><dd>{claim.nextRead ?? "UNMEASURED"}</dd></div>
          </dl>

          <h3 className="mt-6 font-semibold">History</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm" data-testid="watchdog-history">
            {claim.history.length ? claim.history.map((e) => <li key={e.at + e.what}><time>{e.at}</time> — {e.what}</li>) : <li>UNMEASURED: no dated event is published.</li>}
          </ol>
          <h3 className="mt-4 font-semibold">Corrections naming this registry</h3>
          {!corr ? (
            <p className="text-sm text-muted-foreground">Reading the corrections record…</p>
          ) : corr.state !== "OK" ? (
            <Unreadable what="The corrections record" r={corr} />
          ) : (
            (() => {
              const hits = correctionsFor(corr.value.json, claim);
              return hits.length ? (
                <ul className="text-sm">{hits.map((h) => <li key={h.id}>{h.date} · {h.id} — {h.text}</li>)}</ul>
              ) : (
                <p className="text-sm text-muted-foreground">No correction names this registry (read {corr.fetchedAt}).</p>
              );
            })()
          )}

          <h3 className="mt-6 font-semibold">Check it yourself</h3>
          <p className="text-sm text-muted-foreground">Three separate results. None decides the others, and none is a finding about {claim.subject}.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={verify} disabled={busy} className={`min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground ${FOCUS}`} data-testid="watchdog-verify">
              {busy ? "Checking…" : "Verify in this browser"}
            </button>
            {verifierHref(registryId) ? (
              <a href={verifierHref(registryId)!} className={`inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm ${FOCUS}`}>
                Open in the free verifier
              </a>
            ) : null}
            <button type="button" onClick={load} className={`min-h-11 rounded-lg border border-border px-3 text-sm ${FOCUS}`} data-testid="watchdog-refetch">
              Re-fetch this record
            </button>
          </div>
          <p className="mt-2 text-sm">
            Stable link: <a className="font-mono underline [overflow-wrap:anywhere]" href={claimHref(registryId, claimId)} data-testid="watchdog-stable-link">{claimHref(registryId, claimId)}</a>
          </p>
          {results ? (
            <dl className="mt-4 grid gap-3 sm:grid-cols-3" data-testid="watchdog-three-results">
              <div className="rounded-xl border border-border p-3" data-testid="watchdog-result-signature">
                <dt className="font-semibold">1. Signature validity</dt>
                <dd><Chip word={results.signature.result} /> <span className="text-sm">{results.signature.detail}</span></dd>
              </div>
              <div className="rounded-xl border border-border p-3" data-testid="watchdog-result-inclusion">
                <dt className="font-semibold">2. Root inclusion</dt>
                <dd><Chip word={results.inclusion.result} /> <span className="text-sm">{results.inclusion.detail}</span></dd>
              </div>
              <div className="rounded-xl border border-border p-3" data-testid="watchdog-result-conclusion">
                <dt className="font-semibold">3. What the record concludes</dt>
                <dd><Chip word={results.conclusion.state} /> <span className="text-sm">{results.conclusion.detail}</span></dd>
              </div>
            </dl>
          ) : null}
        </>
      )}
    </section>
  );
}

function Library() {
  return (
    <section className="mt-8" aria-labelledby="wd-library" data-testid="watchdog-library">
      <h2 id="wd-library" className="text-xl font-semibold">Research library</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {NLM_IDS.length} datasets from CSOAI Ltd are indexed by NLM in its{" "}
        <a className="underline" href={NLM_SOURCE} target="_blank" rel="noreferrer">Dataset Catalog</a> (read {NLM_CHECKED_ON}). Being indexed by NLM does not mean NLM or NIH has validated any record.
      </p>
      <p className="mt-2 text-sm" data-testid="watchdog-zenodo-note">
        <Chip word="UNCHECKABLE" /> {ZENODO_TOMBSTONED.length} of the {ZENODO_TOMBSTONED.length + ZENODO_REDIRECTED.length} Zenodo records those entries point at returned 410 (deleted) when checked on {NLM_CHECKED_ON}. Their DOIs still resolve; the records behind them do not. An appeal is pending.
      </p>
      <table className="mt-4 w-full text-left text-sm">
        <thead><tr><th className="py-1">Dataset</th><th>NLM id</th><th>Zenodo record</th></tr></thead>
        <tbody>
          {NLM_NAMED.map((n) => {
            const z = n.zenodo ? evidenceLinkState(`https://zenodo.org/records/${n.zenodo}`, TOMBSTONES) : null;
            return (
              <tr key={n.nlmId} className="border-t border-border">
                <td className="py-1">{n.title}</td>
                <td className="font-mono">{n.nlmId}</td>
                <td>{n.zenodo ? <><Chip word={z!.state === "UNCHECKABLE" ? "UNCHECKABLE" : "UNVERIFIED"} /> <span className="text-muted-foreground">{z!.state === "UNCHECKABLE" ? z!.note : n.zenodo}</span></> : "UNMEASURED"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <details className="mt-4 text-sm">
        <summary className={`cursor-pointer ${FOCUS}`}>All {NLM_IDS.length} NLM ids (pairing with records is UNVERIFIED)</summary>
        <p className="mt-2 font-mono [overflow-wrap:anywhere]">{NLM_IDS.join(" ")}</p>
        <p className="mt-2">Redirected, destination UNVERIFIED: {ZENODO_REDIRECTED.join(", ")}.</p>
      </details>
    </section>
  );
}
