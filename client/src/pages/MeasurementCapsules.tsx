/**
 * /measurement-capsules/ — the human page for the measurement-capsule index. The folder itself only
 * holds data (latest.json, v0.2/index.json, the batches and the 256 endpoint shards); this page
 * explains it in plain English and shows today's figures.
 *
 * NO NUMBER ON THIS PAGE IS WRITTEN IN SOURCE. Kinds, capsule counts and states are read in the
 * browser from /measurement-capsules/latest.json -> its index; the chain head, Bitcoin heights,
 * Rekor log indexes and the Hugging Face commit are read from the public dataset
 * huggingface.co/datasets/csoai/evidence-index (its API answers CORS for this origin). Anything that
 * cannot be read says so; nothing is filled in. States and proofs only: no score, grade or ranking.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import PlainEmail from "@/components/PlainEmail";

const TITLE = "Measurement Capsules: signed, checkable records | Council of AI";
const DESCRIPTION =
  "What a measurement capsule is, what kinds Council of AI measures today, the signed daily index and its public anchors, and how to verify any capsule yourself.";

const HF_DS = "csoai/evidence-index";
const HF = "https://huggingface.co";
const EMBED_SNIPPET = '<script src="https://councilof.ai/embed/measurement-capsules.js" async></script>';

/** Plain-English meaning per capsule kind. An unknown kind is shown by its raw name, never hidden. */
const KIND_LABEL: Record<string, { title: string; what: string }> = {
  "measurement.contract_parity": {
    title: "MCP contract parity",
    what: "Does the tool set an MCP server's public descriptions declare match the tool set the live server lists?",
  },
  "measurement.tool_drift": {
    title: "Tool drift",
    what: "Did the tools an endpoint advertised at one read change by the next read?",
  },
  "measurement.cross_ledger_supply": {
    title: "Cross-ledger token supply",
    what: "Is a token at this address the issuer's own deployment on that ledger, and what does the ledger's own state say is issued?",
  },
  "measurement.cross_runtime_reproduction": {
    title: "Cross-runtime reproduction",
    what: "Does a signed model result come out the same when it is re-run on a different runtime?",
  },
  "measurement.self_parity": {
    title: "Self-parity (our own listings)",
    what: "Does a public index's listing of one of our own services say what we actually serve?",
  },
  "measurement.public_signal": {
    title: "Public signals",
    what: "What value did this public signal (a package version, a listing, a count) read on this day, from which source?",
  },
  "measurement.a2a_card_signature": {
    title: "A2A agent card signatures",
    what: "Is a published agent card signed by the key it references?",
  },
};

type Batch = {
  kind: string;
  adapter: string;
  n_capsules: number;
  states?: Record<string, number>;
  merkle_root?: string;
  signature_state?: string;
  ots_state?: string;
};
type Index = {
  as_of?: string;
  index_root?: string;
  n_capsules_total?: number;
  batches?: Batch[];
};
type Loaded = { index: Index; indexUrl: string; sha256: string | null };

type Anchors = {
  day: string | null;
  indexFile: string | null;
  headFile: string | null;
  head: {
    head_date?: string;
    head_index_sha256?: string;
    head_index_root?: string;
    chain_length?: number;
    genesis_date?: string;
    verification?: { result?: string; at?: string };
    bitcoin_attested_days?: { date: string; heights: number[] }[];
  } | null;
  rekor: { subject: string; logIndex: number }[];
  commit: { id: string; title: string; date: string } | null;
};

async function sha256Hex(buf: ArrayBuffer): Promise<string | null> {
  try {
    const d = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${url} answered ${r.status}`);
  return (await r.json()) as T;
}

async function loadIndex(): Promise<Loaded> {
  const latest = await getJson<{ index?: string }>("/measurement-capsules/latest.json");
  const indexUrl = latest.index || "/measurement-capsules/v0.2/index.json";
  const r = await fetch(indexUrl, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${indexUrl} answered ${r.status}`);
  const buf = await r.arrayBuffer();
  const index = JSON.parse(new TextDecoder().decode(buf)) as Index;
  return { index, indexUrl, sha256: await sha256Hex(buf) };
}

type TreeEntry = { type: string; path: string };
const tree = (p: string) => getJson<TreeEntry[]>(`${HF}/api/datasets/${HF_DS}/tree/main/${p}`);
const resolve = (p: string) => `${HF}/datasets/${HF_DS}/resolve/main/${p}`;

async function loadAnchors(): Promise<Anchors> {
  const days = (await tree("measurement-index"))
    .filter((e) => e.type === "directory")
    .map((e) => e.path)
    .sort()
    .reverse();
  const out: Anchors = { day: null, indexFile: null, headFile: null, head: null, rekor: [], commit: null };
  for (const dir of days) {
    const files = (await tree(dir)).map((e) => e.path);
    if (!out.day) {
      out.day = dir.split("/").pop() ?? dir;
      out.indexFile = files.find((f) => /measurement-index-v[\d.]+-\d{4}-\d{2}-\d{2}\.json$/.test(f)) ?? null;
      for (const f of files.filter((x) => x.endsWith(".rekor-receipt.json"))) {
        try {
          const rc = await getJson<{ subject?: string; logIndex?: number }>(resolve(f));
          if (typeof rc.logIndex === "number") out.rekor.push({ subject: rc.subject ?? f.split("/").pop()!, logIndex: rc.logIndex });
        } catch {
          /* a receipt that cannot be read is simply not listed */
        }
      }
    }
    const head = files.find((f) => /measurement-index-chain-head-\d{4}-\d{2}-\d{2}\.json$/.test(f));
    if (head) {
      out.headFile = head;
      out.head = await getJson<Anchors["head"]>(resolve(head));
      break;
    }
  }
  try {
    const commits = await getJson<{ id: string; title: string; date: string }[]>(`${HF}/api/datasets/${HF_DS}/commits/main`);
    out.commit = commits.find((c) => /^measurement-index/i.test(c.title)) ?? null;
  } catch {
    out.commit = null;
  }
  return out;
}

const fmt = (n: number) => n.toLocaleString("en-GB");
const when = (iso?: string) => (iso ? iso.replace("T", " ").replace(/(\.\d+)?Z$/, " UTC") : "—");

export default function MeasurementCapsules() {
  const [idx, setIdx] = useState<Loaded | null>(null);
  const [idxErr, setIdxErr] = useState<string | null>(null);
  const [anc, setAnc] = useState<Anchors | null>(null);
  const [ancErr, setAncErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = TITLE;
    setMetaDescription(DESCRIPTION);
    loadIndex().then(setIdx, (e) => setIdxErr((e as Error).message));
    loadAnchors().then(setAnc, (e) => setAncErr((e as Error).message));
  }, []);

  const kinds = new Map<string, { n: number; batches: number; states: Record<string, number> }>();
  for (const b of idx?.index.batches ?? []) {
    const k = kinds.get(b.kind) ?? { n: 0, batches: 0, states: {} };
    k.n += b.n_capsules || 0;
    k.batches += 1;
    for (const [s, v] of Object.entries(b.states ?? {})) k.states[s] = (k.states[s] ?? 0) + v;
    kinds.set(b.kind, k);
  }
  const kindRows = [...kinds.entries()].sort((a, b) => b[1].n - a[1].n);
  const i = idx?.index;
  const headSha = anc?.head?.head_index_sha256;
  const heights = (anc?.head?.bitcoin_attested_days ?? []).flatMap((d) => d.heights.map((h) => ({ date: d.date, h })));

  return (
    <div data-testid="measurement-capsules-page" className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-600">
        <Link href="/">Home</Link> › <span>Measurement Capsules</span>
      </nav>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Measurement Capsules</h1>
      <p className="mt-4 leading-relaxed text-slate-700">
        A measurement capsule is one small, signed record of one check we ran: what something <em>declared</em> about itself,
        what we <em>observed</em> when we looked, when we looked, and the limits of the look. Every capsule is published, so
        anyone can re-check it without asking us. Council of AI is operated by CSOAI Ltd.
      </p>
      <p data-testid="doctrine" className="mt-4 rounded-md border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800">
        <strong className="font-semibold">Measurement, not endorsement.</strong> A capsule records a state, such as{" "}
        <code>CONSISTENT</code>, <code>INCONSISTENT</code> or <code>UNCHECKABLE</code>. It is never a score, grade, ranking or
        approval of the thing measured. Something we hold no capsule about is not measured, not “clean”.
      </p>

      <section aria-labelledby="what-heading" className="mt-10">
        <h2 id="what-heading" className="text-xl font-bold text-slate-900">What a capsule is</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <strong>Declared vs observed.</strong> Each capsule sets a public claim (a server's own description, an agent card, an
            issuer's list) beside what our instrument saw, and names the difference if there is one.
          </li>
          <li>
            <strong>Small.</strong> One capsule is a compact JSON record, most of them a few kilobytes, so it can travel with the
            thing it describes.
          </li>
          <li>
            <strong>Content-addressed.</strong> A capsule's id is the SHA-256 of its own content (canonical JSON, keys sorted,
            the id field left out). Change one character and the id changes, so any copy can be checked against the original.
          </li>
          <li>
            <strong>Bound and signed.</strong> Capsules are grouped into batches with a Merkle root each; one daily index binds
            every batch, is signed with the board key <code>did:web:csoai.org#board-attestation-1</code> and is timestamped.
          </li>
          <li>
            <strong>Correctable.</strong> A capsule we got wrong is not edited; a later one points back to it, and the change is
            dated in the <Link href="/corrections/" className="underline underline-offset-4">corrections ledger</Link>.
          </li>
        </ul>
      </section>

      <section aria-labelledby="kinds-heading" className="mt-10" aria-busy={!idx && !idxErr}>
        <h2 id="kinds-heading" className="text-xl font-bold text-slate-900">What we measure today</h2>
        <div aria-live="polite">
          {idxErr ? (
            <p className="mt-3 text-slate-800">The index could not be read just now ({idxErr}). Nothing is shown in its place.</p>
          ) : !i ? (
            <p className="mt-3 text-slate-700">Reading the published index…</p>
          ) : (
            <>
              <p data-testid="capsule-totals" className="mt-3 text-slate-700">
                The current index, as of {when(i.as_of)}, holds{" "}
                <strong>{typeof i.n_capsules_total === "number" ? fmt(i.n_capsules_total) : "an unstated number of"}</strong> capsules
                of <strong>{kindRows.length}</strong> kinds, in {(i.batches ?? []).length} signed batches. Read from{" "}
                <a className="underline underline-offset-4" href={idx!.indexUrl}>{idx!.indexUrl}</a>.
              </p>
              <ul data-testid="capsule-kinds" className="mt-4 space-y-3">
                {kindRows.map(([kind, k]) => {
                  const label = KIND_LABEL[kind];
                  return (
                    <li key={kind} className="rounded-lg border border-slate-300 bg-white p-4">
                      <h3 className="text-base font-bold text-slate-900">{label?.title ?? kind}</h3>
                      {label ? <p className="mt-1 text-sm text-slate-700">{label.what}</p> : null}
                      {kind === "measurement.cross_runtime_reproduction" ? (
                        <p className="mt-1 text-sm text-slate-700">
                          These capsules are the evidence behind the preprint{" "}
                          <Link href="/research/cross-hardware-reproducibility/" className="underline underline-offset-4">
                            Same model, same prompts, different answers
                          </Link>
                          .
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-slate-800">
                        <strong>{fmt(k.n)}</strong> capsule{k.n === 1 ? "" : "s"}
                        {k.batches > 1 ? ` in ${k.batches} batches` : ""} · <code className="break-all text-xs">{kind}</code>
                      </p>
                      <p className="mt-1 text-xs text-slate-700">
                        States:{" "}
                        {Object.entries(k.states)
                          .sort((a, b) => b[1] - a[1])
                          .map(([s, v]) => `${s} ${fmt(v)}`)
                          .join(", ")}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="chain-heading" className="mt-10">
        <h2 id="chain-heading" className="text-xl font-bold text-slate-900">The current index, its chain and its anchors</h2>
        <p className="mt-3 text-slate-700">
          Each day's index commits to the day before, so the days form a hash chain that cannot be rewritten quietly. The chain
          is published on Hugging Face and anchored in public logs that show <em>when</em> the bytes existed. The anchors say
          nothing about what the capsules measured.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold text-slate-900">Index root</dt>
          <dd data-testid="index-root" className="break-all font-mono text-slate-800">{i?.index_root ?? (idxErr ? "unavailable" : "reading…")}</dd>
          <dt className="font-semibold text-slate-900">Index SHA-256</dt>
          <dd className="break-all font-mono text-slate-800">
            {idx?.sha256 ?? (idxErr ? "unavailable" : "computing…")}
            {idx?.sha256 && headSha ? (
              <span className="mt-1 block font-sans text-slate-700">
                {idx.sha256 === headSha
                  ? `The same bytes as the chain head of ${anc?.head?.head_date ?? "the newest head"}.`
                  : `Not the bytes the chain head of ${anc?.head?.head_date ?? "the newest head"} names (${headSha.slice(0, 12)}…). This site's copy can lag or lead the chain by a deploy.`}
              </span>
            ) : null}
          </dd>
        </dl>
        <div aria-live="polite">
          {ancErr ? (
            <p className="mt-4 text-slate-800">
              The chain on Hugging Face could not be read from this browser just now ({ancErr}). Open{" "}
              <a className="underline underline-offset-4" href={`${HF}/datasets/${HF_DS}/tree/main/measurement-index`}>
                the measurement-index folder
              </a>{" "}
              directly.
            </p>
          ) : !anc ? (
            <p className="mt-4 text-slate-700">Reading the chain from Hugging Face…</p>
          ) : (
            <dl data-testid="anchors" className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              <dt className="font-semibold text-slate-900">Chain</dt>
              <dd className="text-slate-800">
                {anc.head ? (
                  <>
                    {anc.head.chain_length ?? "?"} day{anc.head.chain_length === 1 ? "" : "s"} from genesis ({anc.head.genesis_date ?? "?"}) to the head of{" "}
                    {anc.head.head_date ?? "?"}; last check <code>{anc.head.verification?.result ?? "not stated"}</code> at {when(anc.head.verification?.at)}.{" "}
                    {anc.headFile ? (
                      <a className="underline underline-offset-4" href={resolve(anc.headFile)}>Chain head</a>
                    ) : null}
                  </>
                ) : (
                  "No weekly chain head found yet."
                )}
              </dd>
              <dt className="font-semibold text-slate-900">Newest day</dt>
              <dd className="text-slate-800">
                {anc.day ?? "—"}
                {anc.indexFile ? (
                  <>
                    {" "}· <a className="underline underline-offset-4" href={resolve(anc.indexFile)}>that day's index</a>
                  </>
                ) : null}
              </dd>
              <dt className="font-semibold text-slate-900">Bitcoin</dt>
              <dd className="text-slate-800">
                {heights.length ? (
                  heights.map((x, n) => (
                    <span key={`${x.date}-${x.h}`}>
                      {n ? ", " : ""}
                      <a className="underline underline-offset-4" href={`https://mempool.space/block/${x.h}`}>block {x.h}</a> ({x.date})
                    </span>
                  ))
                ) : (
                  "No Bitcoin attestation recorded in the chain head yet (OpenTimestamps proofs wait for a block)."
                )}
              </dd>
              <dt className="font-semibold text-slate-900">Rekor (Sigstore)</dt>
              <dd className="text-slate-800">
                {anc.rekor.length ? (
                  <ul className="space-y-1">
                    {anc.rekor.map((r) => (
                      <li key={r.logIndex} className="break-all">
                        <a className="underline underline-offset-4" href={`https://search.sigstore.dev/?logIndex=${r.logIndex}`}>
                          logIndex {r.logIndex}
                        </a>{" "}
                        <span className="text-slate-600">— {r.subject}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No Rekor receipt published for the newest day."
                )}
              </dd>
              <dt className="font-semibold text-slate-900">Hugging Face</dt>
              <dd className="break-all text-slate-800">
                {anc.commit ? (
                  <>
                    <a className="underline underline-offset-4" href={`${HF}/datasets/${HF_DS}/commit/${anc.commit.id}`}>
                      commit {anc.commit.id.slice(0, 8)}
                    </a>{" "}
                    <span className="text-slate-600">({when(anc.commit.date)})</span>
                  </>
                ) : (
                  <a className="underline underline-offset-4" href={`${HF}/datasets/${HF_DS}`}>{HF_DS}</a>
                )}
              </dd>
            </dl>
          )}
        </div>
      </section>

      <section aria-labelledby="verify-heading" className="mt-10">
        <h2 id="verify-heading" className="text-xl font-bold text-slate-900">How to verify</h2>
        <h3 className="mt-4 text-base font-bold text-slate-900">In your browser</h3>
        <p className="mt-1 text-slate-700">
          Paste an MCP server, A2A agent or x402 endpoint URL into{" "}
          <Link href="/verify-server/" className="font-semibold underline underline-offset-4">Verify a server</Link>. You get every
          capsule we hold about that URL, and a button on each that recomputes its id, its Merkle path and the index signature in
          your browser.
        </p>
        <h3 className="mt-5 text-base font-bold text-slate-900">From the command line</h3>
        <ol className="mt-1 list-decimal space-y-1.5 pl-5 text-slate-700">
          <li>
            Fetch <a className="underline underline-offset-4" href="/measurement-capsules/latest.json">/measurement-capsules/latest.json</a>; it
            names the current index.
          </li>
          <li>
            Each batch folder under <code>/measurement-capsules/v0.2/</code> holds <code>capsules.jsonl.gz</code> and{" "}
            <code>leaves.json</code>. Recompute every capsule id (SHA-256 of the
            capsule's canonical JSON without its <code>capsule_id</code> field) and the batch's Merkle root (RFC 6962, leaves sorted), and compare with the index.
          </li>
          <li>
            Check the index's signature in <code>index.signed.json</code> against the board key published at{" "}
            <a className="underline underline-offset-4" href="https://csoai.org/.well-known/did.json">csoai.org/.well-known/did.json</a>.
          </li>
          <li>
            Walk the daily chain back to genesis with the steps in the{" "}
            <a className="underline underline-offset-4" href={`${HF}/datasets/${HF_DS}/blob/main/measurement-index/README.md`}>
              measurement-index README
            </a>
            , then check the OpenTimestamps proofs (<code>ots verify</code>) and the Rekor entries.
          </li>
        </ol>
        <h3 className="mt-5 text-base font-bold text-slate-900">For agents</h3>
        <ul className="mt-1 list-disc space-y-1.5 pl-5 text-slate-700">
          <li>
            MCP at <code>POST https://councilof.ai/mcp</code>: the tools <code>measurement_index</code>, <code>verify_capsule</code>{" "}
            and <code>server_evidence</code>.
          </li>
          <li>
            A2A: the skills <code>measurement-capsules</code> and <code>server-evidence</code>, listed in{" "}
            <a className="underline underline-offset-4" href="/.well-known/agent-card.json">our agent card</a>.
          </li>
          <li>
            x402: <code>/api/measurement/fresh-capsule</code> re-measures one claim about one MCP endpoint on demand and returns a
            new signed capsule. That door is paid; reading and verifying capsules is free, always.
          </li>
        </ul>
      </section>

      <section aria-labelledby="embed-heading" className="mt-10">
        <h2 id="embed-heading" className="text-xl font-bold text-slate-900">Show it on your site</h2>
        <p className="mt-2 text-slate-700">
          One script tag renders a small card that reads the current index and links here and to Verify a server. It sends
          nothing about your visitors anywhere; it only reads our public index.
        </p>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded bg-slate-100 p-3 text-xs text-slate-900">{EMBED_SNIPPET}</pre>
        <p className="mt-2 text-sm text-slate-700">
          The card says “measurement, not endorsement”. It does not say anything about the site that shows it.
        </p>
      </section>

      <section aria-labelledby="object-heading" className="mt-10">
        <h2 id="object-heading" className="text-xl font-bold text-slate-900">Objections and re-checks</h2>
        <p className="mt-2 text-slate-700">
          If you run something we measured and think a capsule is wrong, or you want an endpoint left out, see{" "}
          <Link href="/census/" className="font-semibold underline underline-offset-4">how our crawler works and how to object</Link>, or
          email <PlainEmail className="underline underline-offset-4" subject="Measurement capsule" />. A re-check produces a new
          capsule; the old one stays published, and the change is dated in the{" "}
          <Link href="/corrections/" className="underline underline-offset-4">corrections ledger</Link>.
        </p>
      </section>
    </div>
  );
}
