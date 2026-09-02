import { useEffect, useMemo, useState } from "react";
import { anchorsFromDid, verifyCard as verifySignedCard, type Anchor } from "../../../functions/_lib/cardVerify";
import {
  BOARD_KEY_ID,
  classifyQuery,
  HOW_TO_VERIFY,
  latestCorrections,
  latestSignedCards,
  ledgerSignatureState,
  sha256Hex,
  verifyInclusion,
  verifyRootSignature,
  witnessRails,
  type CardIndexDoc,
  type Check,
  type CorrectionsDoc,
  type EasDoc,
  type PointerDoc,
  type ProofDoc,
  type PublicRoot,
  type RailTone,
  type Verdict,
  type WitnessDoc,
  type WitnessRail,
} from "@/lib/attestations";

/**
 * Council OS · Attestations — the one root, its witnesses, a search box, and the
 * corrections ledger. Native pane; door: /dashboard?tab=attestations.
 *
 * Everything printed here is read on this load from the estate's own published
 * files (root.json, the witness sidecar and pointer, the EAS log when it is
 * served, the signed-card index, /api/corrections) and re-checked in this
 * browser. Nothing is typed. A state is printed verbatim — NOT_YET stays
 * NOT_YET and never earns a tick. A check reports VALID, INVALID or
 * UNCHECKABLE, and a check that could not run is never shown as a failure.
 *
 * Learned from EAS explorers (docs/LEARN-FROM-EAS.md): one identifier, one search
 * box, decoded-beside-raw, a verify path that is a command. Not copied: a wallet,
 * a chain, a token, a resolver that gates. What they do not have: a corrections
 * ledger — the instrument that catches its own owner. That is section 4.
 */

type Fetched<T> = { http: number | null; doc: T | null; error?: string };

async function getJson<T>(url: string, signal: AbortSignal): Promise<Fetched<T>> {
  try {
    const r = await fetch(url, { signal, headers: { accept: "application/json" } });
    let doc: T | null = null;
    try {
      doc = (await r.json()) as T;
    } catch {
      doc = null;
    }
    return { http: r.status, doc: r.ok ? doc : doc && typeof doc === "object" ? doc : null };
  } catch (e: any) {
    if (signal.aborted) return { http: null, doc: null };
    return { http: null, doc: null, error: e?.message ?? String(e) };
  }
}

const TONE_CLASS: Record<RailTone, string> = {
  done: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  pending: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  absent: "border-border bg-muted text-muted-foreground",
  unknown: "border-border bg-muted text-muted-foreground",
};

const VERDICT_CLASS: Record<Verdict, string> = {
  VALID: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  INVALID: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
  UNCHECKABLE: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

function StateChip({ state, tone }: { state: string; tone: RailTone }) {
  return (
    <span
      data-testid="witness-state"
      data-tone={tone}
      className={`inline-block rounded border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${TONE_CLASS[tone]}`}
    >
      {state || "—"}
    </span>
  );
}

function VerdictChip({ state }: { state: Verdict }) {
  return (
    <span data-testid="verdict" className={`inline-block rounded border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ${VERDICT_CLASS[state]}`}>
      {state}
    </span>
  );
}

function Mono({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <code className={`break-all font-mono text-[12px] ${className}`}>{children}</code>;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border/60 py-2 text-sm last:border-b-0 md:grid-cols-[160px_1fr] md:gap-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className="min-w-0">{v}</dd>
    </div>
  );
}

function HttpNote({ label, f }: { label: string; f: Fetched<unknown> | null }) {
  if (!f) return <span className="text-muted-foreground">{label}: reading…</span>;
  if (f.http === 200) return <span className="text-muted-foreground">{label}: HTTP 200</span>;
  return (
    <span className="text-amber-700 dark:text-amber-300">
      {label}: {f.http != null ? `HTTP ${f.http}` : `not read${f.error ? ` (${f.error})` : ""}`}
    </span>
  );
}

interface SearchResult {
  query: string;
  inclusion: Check & { http?: number | null; index?: number; siblings?: number };
  card: Check & { http?: number | null; axis?: string; family?: string };
}

export default function DashboardAttestationsPane() {
  const [root, setRoot] = useState<Fetched<PublicRoot> | null>(null);
  const [rootBytesSha, setRootBytesSha] = useState<string | null>(null);
  const [witness, setWitness] = useState<Fetched<WitnessDoc> | null>(null);
  const [pointer, setPointer] = useState<Fetched<PointerDoc> | null>(null);
  const [eas, setEas] = useState<Fetched<EasDoc> | null>(null);
  const [index, setIndex] = useState<Fetched<CardIndexDoc> | null>(null);
  const [ledger, setLedger] = useState<Fetched<CorrectionsDoc> | null>(null);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [rootSig, setRootSig] = useState<Check | null>(null);

  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [queryErr, setQueryErr] = useState<string | null>(null);
  const [showAllCorrections, setShowAllCorrections] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      // root.json is read as TEXT so the sha256 the witnesses name can be recomputed over the exact bytes.
      try {
        const r = await fetch("/root.json", { signal: ac.signal, headers: { accept: "application/json" } });
        const text = await r.text();
        let doc: PublicRoot | null = null;
        try {
          doc = JSON.parse(text);
        } catch {
          doc = null;
        }
        setRoot({ http: r.status, doc: r.ok ? doc : null });
        if (r.ok) {
          try {
            setRootBytesSha(await sha256Hex(new TextEncoder().encode(text)));
          } catch {
            setRootBytesSha(null);
          }
          setRootSig(await verifyRootSignature(doc));
        } else {
          setRootSig({ state: "UNCHECKABLE", reason: `root.json HTTP ${r.status}.` });
        }
      } catch (e: any) {
        if (!ac.signal.aborted) {
          setRoot({ http: null, doc: null, error: e?.message ?? String(e) });
          setRootSig({ state: "UNCHECKABLE", reason: "root.json could not be read on this load." });
        }
      }
    })();
    getJson<WitnessDoc>("/interop/root-witness-latest.json", ac.signal).then(setWitness);
    getJson<PointerDoc>("/interop/root-witness-pointer.json", ac.signal).then(setPointer);
    getJson<EasDoc>("/interop/eas-root-attestations.json", ac.signal).then(setEas);
    getJson<CardIndexDoc>("/signed/card_index.json", ac.signal).then(setIndex);
    getJson<CorrectionsDoc>("/api/corrections", ac.signal).then(setLedger);
    getJson<unknown>("/.well-known/did.json", ac.signal).then((d) => setAnchors(d.doc ? anchorsFromDid(d.doc) : []));
    return () => ac.abort();
  }, []);

  const rails: WitnessRail[] = useMemo(
    () => witnessRails(witness?.doc ?? null, eas?.http === 200 ? eas.doc : null, eas ? eas.http : null),
    [witness, eas],
  );

  const bytesMatch: Check | null = useMemo(() => {
    if (!rootBytesSha || !witness?.doc?.artifact?.sha256) return null;
    return rootBytesSha === witness.doc.artifact.sha256
      ? { state: "VALID", reason: `sha256 of the root.json bytes read on this load equals the sidecar's artifact.sha256 — the witnesses below are witnesses of THESE bytes.` }
      : { state: "INVALID", reason: `root.json read on this load hashes to ${rootBytesSha.slice(0, 16)}…; the sidecar witnessed ${witness.doc.artifact.sha256.slice(0, 16)}…. The witnesses are true of older bytes, not of this root — drift.` };
  }, [rootBytesSha, witness]);

  const cards = useMemo(() => latestSignedCards(index?.doc ?? null, 8), [index]);
  const corrections = useMemo(() => latestCorrections(ledger?.doc ?? null), [ledger]);
  const shownCorrections = showAllCorrections ? corrections : corrections.slice(0, 5);

  // Takes the value explicitly: a card-list click sets the box AND runs the check in
  // one go, and a closure over `q` would still hold the previous box contents.
  async function runSearch(value: string) {
    const parsed = classifyQuery(value);
    setResult(null);
    if (parsed.kind === "empty") {
      setQueryErr("Paste a sha256 leaf or a card id — 64 hex characters.");
      return;
    }
    if (parsed.kind === "invalid") {
      setQueryErr(parsed.reason);
      return;
    }
    setQueryErr(null);
    setBusy(true);
    const hex = parsed.value;
    const ac = new AbortController();

    // 1. Inclusion in the one root — GET /api/proof?sha= then re-hash the path here.
    const p = await getJson<ProofDoc>(`/api/proof?sha=${encodeURIComponent(hex)}`, ac.signal);
    let inclusion: SearchResult["inclusion"];
    if (p.http === 200 && p.doc) {
      const v = await verifyInclusion(p.doc);
      inclusion = { ...v, http: 200, index: p.doc.index, siblings: Array.isArray(p.doc.proof) ? p.doc.proof.length : undefined };
    } else if (p.http === 404) {
      inclusion = { state: "UNCHECKABLE", reason: `Not a leaf of the last published root (GET /api/proof HTTP 404${p.doc?.reason ? `: ${p.doc.reason}` : ""}). There is no inclusion path to check.`, http: 404 };
    } else {
      inclusion = { state: "UNCHECKABLE", reason: `GET /api/proof ${p.http != null ? `HTTP ${p.http}` : "not read"} on this load.`, http: p.http };
    }

    // 2. A signed measurement card of that id — /signed/cards/<id>.json, verified by the shared rule.
    const c = await getJson<unknown>(`/signed/cards/${hex}.json`, ac.signal);
    let card: SearchResult["card"];
    if (c.http === 200 && c.doc) {
      try {
        const v = await verifySignedCard(c.doc, anchors);
        const family = v.family;
        const axis = typeof (c.doc as any)?.body?.axis === "string" ? (c.doc as any).body.axis : undefined;
        if (v.valid) card = { state: "VALID", reason: v.checks.map((x) => x.detail).join(" "), http: 200, axis, family };
        else if (v.reasons.includes("unrecognised_family")) card = { state: "UNCHECKABLE", reason: v.checks.map((x) => x.detail).join(" "), http: 200, family };
        else card = { state: "INVALID", reason: v.checks.filter((x) => x.ok === false).map((x) => x.detail).join(" ") || v.reasons.join(", "), http: 200, axis, family };
      } catch (err: any) {
        card = { state: "UNCHECKABLE", reason: `The card check could not run: ${err?.message ?? err}.`, http: 200 };
      }
    } else if (c.http === 404) {
      card = { state: "UNCHECKABLE", reason: "No signed card of this id at /signed/cards/ (HTTP 404). Nothing to check.", http: 404 };
    } else {
      card = { state: "UNCHECKABLE", reason: `/signed/cards/<id>.json ${c.http != null ? `HTTP ${c.http}` : "not read"} on this load.`, http: c.http };
    }

    setResult({ query: hex, inclusion, card });
    setBusy(false);
  }

  const r = root?.doc ?? null;
  const w = witness?.doc ?? null;
  const drift = pointer?.doc?.drift?.status;

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-4 md:p-6" data-testid="dashboard-pane-attestations-body">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">Attestations</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          One signed root, its witnesses, and the ledger of our own mistakes. Every state below is printed as the sidecar
          wrote it; every check is re-run in this browser. Existence and time of bytes — not certification, not a rank, not a
          token. Verify is free.
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <HttpNote label="root.json" f={root} />
          <HttpNote label="witness sidecar" f={witness} />
          <HttpNote label="pointer" f={pointer} />
          <HttpNote label="EAS log" f={eas} />
          <HttpNote label="card index" f={index} />
          <HttpNote label="corrections" f={ledger} />
        </p>
      </header>

      {/* (a) the root card */}
      <section aria-labelledby="att-root" className="rounded-lg border border-border bg-card p-4 md:p-5" data-testid="attestations-root-card">
        <h2 id="att-root" className="text-base font-semibold">The root</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          <Mono>GET /root.json</Mono> · kind <Mono>{r?.kind ?? "—"}</Mono>
        </p>
        <dl className="mt-3">
          <Row k="merkle_root" v={<Mono>{r?.merkle_root ?? (root ? "—" : "reading…")}</Mono>} />
          <Row k="n (card_count)" v={<span className="font-mono text-sm">{r?.card_count ?? "—"}{Array.isArray(r?.card_sha256) ? ` · card_sha256[] carries ${r!.card_sha256!.length}` : ""}</span>} />
          <Row k="as_of" v={<Mono>{r?.as_of ?? "—"}</Mono>} />
          <Row k="signed by" v={<Mono>{r?.did_intended ?? "—"}</Mono>} />
          <Row
            k="signature"
            v={
              rootSig ? (
                <span className="flex flex-wrap items-center gap-2">
                  <VerdictChip state={rootSig.state} />
                  <span className="text-xs text-muted-foreground">{rootSig.reason}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">checking Ed25519 under the pinned {BOARD_KEY_ID} key…</span>
              )
            }
          />
          <Row
            k="bytes"
            v={
              <span className="flex flex-wrap items-center gap-2">
                {rootBytesSha ? <Mono>sha256 {rootBytesSha}</Mono> : <span className="text-xs text-muted-foreground">hashing…</span>}
                {bytesMatch ? <VerdictChip state={bytesMatch.state} /> : null}
                {bytesMatch ? <span className="text-xs text-muted-foreground">{bytesMatch.reason}</span> : null}
              </span>
            }
          />
          <Row
            k="drift (pointer)"
            v={
              <span className="flex flex-wrap items-center gap-2">
                <StateChip state={drift ?? (pointer ? "—" : "reading…")} tone={drift === "MATCH" ? "done" : drift ? "unknown" : "absent"} />
                <span className="text-xs text-muted-foreground">{pointer?.doc?.drift?.reason ?? "root-witness-pointer.json states whether the witnessed bytes are the live bytes."}</span>
              </span>
            }
          />
        </dl>

        <h3 className="mt-5 text-sm font-semibold">Witnesses</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Sidecar as_of <Mono>{w?.as_of ?? "—"}</Mono>. A witness attests the existence and time of the bytes named above. Where it says NOT_YET, there is
          no witness — and this pane will not draw one.
        </p>
        <ul className="mt-3 divide-y divide-border/60" data-testid="witness-rails">
          {rails.map((rail) => (
            <li key={rail.id} className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[220px_1fr]" data-testid={`witness-${rail.id}`}>
              <div className="text-sm font-medium">{rail.label}</div>
              <div className="min-w-0 space-y-1">
                <StateChip state={rail.state} tone={rail.tone} />
                {rail.detail ? <p className="break-words text-xs text-muted-foreground">{rail.detail}</p> : null}
                {rail.links.length > 0 ? (
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    {rail.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-foreground">
                        {l.label}
                      </a>
                    ))}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {Array.isArray(pointer?.doc?.hard_stops) && pointer!.doc!.hard_stops!.length > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Hard stops the pointer publishes: {pointer!.doc!.hard_stops!.join(" ")}
          </p>
        ) : null}
      </section>

      {/* (b) search */}
      <section aria-labelledby="att-search" className="rounded-lg border border-border bg-card p-4 md:p-5" data-testid="attestations-search">
        <h2 id="att-search" className="text-base font-semibold">Look one up</h2>
        <p className="mt-1 max-w-[72ch] text-xs text-muted-foreground">
          Paste a sha256 leaf of the root or a signed card id (both are 64 hex). Two checks run here: the inclusion path from{" "}
          <Mono>GET /api/proof?sha=</Mono> is re-hashed to <Mono>merkle_root</Mono>, and a card of that id at <Mono>/signed/cards/</Mono> is
          re-hashed and its Ed25519 signature checked under the published key. Each prints VALID, INVALID or UNCHECKABLE — nothing else.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(q);
          }}
          className="mt-3 flex flex-col gap-2 md:flex-row"
        >
          <label htmlFor="att-q" className="sr-only">sha256 or card id</label>
          <input
            id="att-q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="64 hex — sha256 leaf or card id"
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded border border-border bg-accent px-4 py-2 text-sm font-medium hover:bg-accent/80 disabled:opacity-60"
          >
            {busy ? "Checking…" : "Check"}
          </button>
          {Array.isArray(r?.card_sha256) && r!.card_sha256!.length > 0 ? (
            <button
              type="button"
              onClick={() => setQ(r!.card_sha256![Math.floor(Math.random() * r!.card_sha256!.length)])}
              className="rounded border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
              title="Fill the box with a leaf read from root.json on this load"
            >
              Use a leaf from root.json
            </button>
          ) : null}
        </form>
        {queryErr ? <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{queryErr}</p> : null}
        {result ? (
          <div className="mt-4 space-y-3" data-testid="attestations-search-result">
            <p className="text-xs text-muted-foreground">
              Query <Mono>{result.query}</Mono>
            </p>
            <div className="rounded border border-border/60 p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">Root inclusion</span>
                <VerdictChip state={result.inclusion.state} />
                {result.inclusion.index != null ? <span className="font-mono text-xs text-muted-foreground">index {result.inclusion.index} · {result.inclusion.siblings} siblings</span> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{result.inclusion.reason}</p>
            </div>
            <div className="rounded border border-border/60 p-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">Signed card</span>
                <VerdictChip state={result.card.state} />
                {result.card.axis ? <span className="font-mono text-xs text-muted-foreground">axis {result.card.axis}</span> : null}
                {result.card.family ? <span className="font-mono text-xs text-muted-foreground">{result.card.family}</span> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{result.card.reason}</p>
              {result.card.http === 200 ? (
                <p className="mt-1 text-xs">
                  <a href={`/signed/cards/${result.query}.json`} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">raw card</a>
                  {" · "}
                  <a href={`/api/proof?sha=${result.query}`} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">raw proof response</a>
                </p>
              ) : (
                <p className="mt-1 text-xs">
                  <a href={`/api/proof?sha=${result.query}`} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2">raw proof response</a>
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              VALID means the bytes reproduce the hash and the signature verifies under a key published at did:web:csoai.org. It does not
              mean the measurement is right, and it is not a certificate.
            </p>
          </div>
        ) : null}
      </section>

      {/* (c) attestations list */}
      <section aria-labelledby="att-list" className="grid grid-cols-1 gap-6 md:grid-cols-2" data-testid="attestations-list">
        <div className="rounded-lg border border-border bg-card p-4 md:p-5">
          <h2 id="att-list" className="text-base font-semibold">Latest witnesses</h2>
          <p className="mt-1 text-xs text-muted-foreground">Per sidecar — one root anchor, never N leaves.</p>
          <ul className="mt-3 space-y-2 text-xs">
            {rails.map((rail) => (
              <li key={rail.id} className="flex flex-wrap items-center gap-2">
                <StateChip state={rail.state} tone={rail.tone} />
                <span>{rail.label}</span>
                {w?.artifact?.sha256 ? <Mono className="text-muted-foreground">of {w.artifact.sha256.slice(0, 12)}…</Mono> : null}
              </li>
            ))}
          </ul>
          {w?.artifact ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Witnessed artefact: <Mono>{w.artifact.url}</Mono> · {w.artifact.bytes} bytes · sha256 <Mono>{w.artifact.sha256}</Mono>
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:p-5">
          <h2 className="text-base font-semibold">Latest signed cards</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            From <Mono>/signed/card_index.json</Mono>
            {index?.doc?.n_cards != null ? <> · index declares n_cards {index.doc.n_cards}</> : null}
            {index?.doc?.packaged_at ? <> · packaged {index.doc.packaged_at.slice(0, 10)}</> : null}. Click one to run both checks.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs">
            {cards.length === 0 ? <li className="text-muted-foreground">{index ? "no rows read" : "reading…"}</li> : null}
            {cards.map((c) => (
              <li key={c.card} className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQ(c.card);
                    void runSearch(c.card);
                  }}
                  className="font-mono underline underline-offset-2 hover:text-foreground"
                >
                  {c.card.slice(0, 16)}…
                </button>
                {c.axis ? <span className="text-muted-foreground">{c.axis}</span> : null}
                {c.ts ? <span className="text-muted-foreground">{String(c.ts).slice(0, 10)}</span> : null}
                {c.signed === false ? <StateChip state="UNSIGNED" tone="absent" /> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 md:col-span-2 md:p-5">
          <h2 className="text-base font-semibold">How to verify yourself</h2>
          <p className="mt-1 text-xs text-muted-foreground">Free, offline, no account. Each link is a file you can fetch or a command you can run.</p>
          <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs md:grid-cols-2">
            {HOW_TO_VERIFY.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="underline underline-offset-2 hover:text-foreground" target="_blank" rel="noreferrer noopener">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* (d) corrections ledger */}
      <section aria-labelledby="att-corr" className="rounded-lg border border-border bg-card p-4 md:p-5" data-testid="attestations-corrections">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="att-corr" className="text-base font-semibold">Corrections ledger</h2>
          <span className="text-xs text-muted-foreground">
            <Mono>GET /api/corrections</Mono> · signature_state <StateChip state={ledgerSignatureState(ledger?.doc ?? null)} tone={ledgerSignatureState(ledger?.doc ?? null) === "SIGNED" ? "done" : "pending"} />
          </span>
        </div>
        <p className="mt-1 max-w-[72ch] text-xs text-muted-foreground">
          {ledger?.doc?.policy ?? "Appended, never edited or deleted."} An attestation explorer shows what was claimed; this shows where the claimant was wrong,
          how it was caught, and what changed. {ledger?.doc?.note ? <>The ledger says of itself: “{ledger.doc.note}”</> : null}
        </p>
        <ol className="mt-3 space-y-3">
          {corrections.length === 0 ? <li className="text-xs text-muted-foreground">{ledger ? "no entries read" : "reading…"}</li> : null}
          {shownCorrections.map((c) => (
            <li key={c.id} className="rounded border border-border/60 p-3 text-sm" data-testid="correction-entry">
              <div className="flex flex-wrap items-center gap-2">
                <Mono className="font-semibold">{c.id}</Mono>
                <span className="text-xs text-muted-foreground">{c.date}</span>
                <span className="text-xs">{c.status}</span>
              </div>
              <dl className="mt-2 space-y-1 text-xs">
                <div><dt className="inline font-medium">What was wrong: </dt><dd className="inline text-muted-foreground">{c.what_was_wrong}</dd></div>
                <div><dt className="inline font-medium">How it was caught: </dt><dd className="inline text-muted-foreground">{c.how_caught}</dd></div>
                <div><dt className="inline font-medium">Fix: </dt><dd className="inline text-muted-foreground">{c.fix}</dd></div>
              </dl>
            </li>
          ))}
        </ol>
        {corrections.length > 5 ? (
          <button type="button" onClick={() => setShowAllCorrections((s) => !s)} className="mt-3 text-xs underline underline-offset-2">
            {showAllCorrections ? "Show the latest five" : `Show all ${corrections.length} entries`}
          </button>
        ) : null}
      </section>
    </div>
  );
}
