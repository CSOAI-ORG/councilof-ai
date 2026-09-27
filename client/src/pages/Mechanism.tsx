import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import raw from "../../../public/mechanism/coverage.json";
import vcRaw from "../../../public/mechanism/vc.json";

// /mechanism — the open measurement mechanism: any declared claim, mapped to frozen provision ids,
// tested by a deterministic predicate, recorded as a signed capsule, bound into the daily index,
// verified free. Every count on this page is read from public/mechanism/coverage.json, which
// scripts/mechanism/build-coverage.mjs derives from the frozen manifest, the inventory, the crosswalk
// files and the published capsule batches. Edit scripts/mechanism/coverage.source.json and re-run
// the producer; never type a number here.

type Status = "PREDICATE" | "RELATED_MEASURE" | "CROSSWALK_ONLY" | "HASH_ONLY";
type Instrument = {
  celex: string;
  name: string;
  long: string;
  jurisdiction: string;
  source_url: string;
  provisions: number;
  ids_positive: number;
  ids_negative: number;
  by_status: Record<Status, number>;
  levels: {
    authority: { state: string; record?: string; authority?: string; binding_type?: string };
    applicability: { state: string };
    crosswalks: { rows: number; sources: string[] };
    watcher: { state: string };
  };
};
type Touched = {
  provision_id: string;
  provision_sha256: string;
  instrument: string;
  article: string;
  status: Status;
  predicates: string[];
  related_axes: string[];
};
type Jurisdiction = {
  id: string;
  label: string;
  state: string;
  frozen_provisions: number;
  instruments_in_corpus: string[];
  predicate_provisions: number;
  related_measure_provisions: number;
  authority_records: { id: string; binding_type: string; output_mode: string }[];
  east_west_rows: number;
  prose_pages: { path: string; component: string; cites_frozen_provision_ids: number }[];
};
type Route = { id: string; name: string; how: string; link: string; is: string; is_not: string };
type Data = {
  url: string;
  json: string;
  edited: string;
  generated_from: { path: string; sha256: string; producer: string };
  statements: string[];
  hierarchy: { level: string; label: string; means: string }[];
  corpus: {
    manifest: string;
    manifest_sha256: string;
    corpus_root: string;
    root_algorithm: string;
    provisions: number;
    instruments: number;
    frozen_at: string;
    state: string;
    source_database_state: string;
    watcher: string;
    limitation: string;
  };
  recovered_counts: { what: string; value: number; derived_from: string }[];
  totals: Record<Status, number>;
  instruments: Instrument[];
  provisions_touched: Touched[];
  unresolved_references: { source: string; text: string; reference: string }[];
  jurisdictions: Jurisdiction[];
  frameworks_outside_corpus: { id: string; name: string; kind: string; axis_pointers: number; authority_record: string | null; page: string }[];
  predicates: {
    id: string;
    name: string;
    provision_id: string;
    scope: string;
    deterministic: string;
    not_measured: string;
    evidence_requirement: string;
    result_wording: string;
    binding_today: string;
    free_route: string;
  }[];
  capsule_adapters: {
    batch: string;
    adapter: string;
    n_capsules: number;
    capsules_binding_a_provision: number;
    owasp_items: string[];
    record: string;
  }[];
  routes_today: Route[];
  not_open_today: { id: string; what: string; why: string }[];
};

const d = raw as unknown as Data;
const vc = vcRaw as unknown as {
  credentialSubject: { capsuleId: string; kind: string; measurementState: string };
  evidence: { verificationMethod: string; merkleRoot: string; treeSize: number; id: string }[];
};

const STATUS_LABEL: Record<Status, string> = {
  PREDICATE: "Predicate",
  RELATED_MEASURE: "Related measure",
  CROSSWALK_ONLY: "Crosswalk only",
  HASH_ONLY: "Hash only",
};
const STATE_LABEL: Record<string, string> = {
  IN_FROZEN_CORPUS: "In the frozen corpus",
  ROUTING_RECORD_ONLY: "Routing record only",
  CROSSWALK_ROWS_ONLY: "Crosswalk rows only",
  PROSE_PAGES_ONLY: "Prose pages only",
  NOTHING_HELD: "Nothing held",
};

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="break-words font-medium text-emerald-800 underline underline-offset-2 hover:decoration-2">
    {children}
  </a>
);
const L = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="font-medium text-emerald-800 underline underline-offset-2 hover:decoration-2">
    {children}
  </Link>
);

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[17px] leading-relaxed text-slate-800">{children}</div>
    </section>
  );
}

function Table({ label, head, children }: { label: string; head: string[]; children: ReactNode }) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full min-w-[36rem] border-collapse text-left text-[15px]">
        <thead className="bg-slate-100 text-slate-900">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-800">{children}</tbody>
      </table>
    </div>
  );
}
const Td = ({ children, mono }: { children: ReactNode; mono?: boolean }) => (
  <td className={`border-t border-slate-200 px-3 py-2 align-top ${mono ? "whitespace-nowrap font-mono text-sm" : ""}`}>{children}</td>
);

const LD = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Open measurement mechanism: coverage of the frozen provision corpus",
  description:
    "Provisions per instrument and jurisdiction in Council of AI's frozen provision manifest, which of them a deterministic check tests, which a measured axis points to, and which are held as hashes only. Measurement, not certification.",
  url: d.url,
  license: "https://creativecommons.org/licenses/by/4.0/",
  distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: d.json }],
  creator: { "@type": "Organization", name: "CSOAI Ltd", url: "https://councilof.ai" },
};

export default function Mechanism() {
  useEffect(() => {
    document.title = "The open measurement mechanism | Council of AI";
  }, []);

  const c = d.corpus;
  const eu = d.instruments.filter((i) => i.jurisdiction === "EU");
  const noCorpus = d.jurisdictions.filter((j) => j.frozen_provisions === 0);
  const noAuthority = d.instruments.filter((i) => i.levels.authority.state === "NO_RECORD");
  const bound = d.capsule_adapters.reduce((n, a) => n + a.capsules_binding_a_provision, 0);
  const capsules = d.capsule_adapters.reduce((n, a) => n + a.n_capsules, 0);
  const pred = d.predicates[0];
  const pagesCiting = d.jurisdictions.flatMap((j) => j.prose_pages).filter((p) => p.cites_frozen_provision_ids > 0).length;
  const pages = d.jurisdictions.flatMap((j) => j.prose_pages).length;

  return (
    <div className="min-h-screen bg-[#fafaf7] text-[#0c1a12]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Method</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">The open measurement mechanism</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-700">
          One route for anyone, anywhere, to have a public claim measured against published rules and to get back a signed
          record that a stranger can check without trusting us. It is open: the rules, the code, the records and the
          verifiers are public, and verification is free. This page says how it works, and how much of the world's rulebook it
          covers today, counted from the data.
        </p>

        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-[15px] leading-relaxed text-amber-950">
          <ul className="list-disc space-y-1 pl-5">
            {d.statements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>

        <Section id="steps" title="Five steps">
          <ol className="space-y-4">
            <li className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">1. A declared claim</h3>
              <p className="mt-1 text-[15px] text-slate-700">
                Something a party has said in public about its own system: a version it serves, a key that signs its agent
                card, a mark on a generated file, the supply of a token on a ledger. The claim is recorded as declared, next to
                what we observe.
              </p>
            </li>
            <li className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">2. Mapped to provision ids in the frozen corpus</h3>
              <p className="mt-1 text-[15px] text-slate-700">
                The corpus is a manifest of {c.provisions} provision ids from {c.instruments} instruments, each pinned by the
                SHA-256 of its frozen text, under one root that recomputes (<code className="break-all">{c.corpus_root.slice(0, 16)}…</code>).
                Today {bound} of {capsules} published capsules carry a provision id; the optional field that lets them is
                proposed below.
              </p>
            </li>
            <li className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">3. A deterministic predicate</h3>
              <p className="mt-1 text-[15px] text-slate-700">
                A check that returns the same answer for anyone who runs it on the same bytes: no model grades, no vote. How a
                provision is cut into one is on <L href="/statute-to-predicate/">statute to predicate</L>. Provisions in the
                corpus with one implemented today: {d.totals.PREDICATE}.
              </p>
            </li>
            <li className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">4. A signed capsule</h3>
              <p className="mt-1 text-[15px] text-slate-700">
                One small JSON record: declared, observed, the difference, digests of the evidence, a measurement state and
                its limitations. Capsules are batched under an RFC 6962 Merkle root and the batch is signed with Ed25519 under{" "}
                <code>did:web:csoai.org</code>. See <L href="/measurement-capsules/">measurement capsules</L>.
              </p>
            </li>
            <li className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="font-semibold">5. The daily index, verified free</h3>
              <p className="mt-1 text-[15px] text-slate-700">
                Each day's index binds every batch, chains to the previous day, is signed, and is stamped with OpenTimestamps.
                Anyone can recompute a capsule's id, its path to the root and the signature, in the browser or over MCP, with no
                account.
              </p>
            </li>
          </ol>
        </Section>

        <Section id="coverage" title="Coverage, counted">
          <p>
            Read from <A href={c.manifest}>{c.manifest}</A> (SHA-256 <code className="break-all">{c.manifest_sha256.slice(0, 16)}…</code>)
            and the files it is joined to. The same numbers are in <A href="/mechanism/coverage.json">/mechanism/coverage.json</A>.
          </p>
          <Table label="Recovered counts" head={["What", "Count", "Read from"]}>
            {d.recovered_counts.map((r) => (
              <tr key={r.what}>
                <Td>{r.what}</Td>
                <Td>{r.value}</Td>
                <Td mono>{r.derived_from}</Td>
              </tr>
            ))}
          </Table>
          <p className="text-[15px] text-slate-700">
            State of the manifest: <code>{c.state}</code>, frozen {c.frozen_at.slice(0, 10)}. Source text bytes:{" "}
            <code>{c.source_database_state}</code>. Watcher: {c.watcher}. {c.limitation}
          </p>

          <h3 className="pt-2 text-lg font-semibold">By instrument</h3>
          <Table
            label="Provisions by instrument"
            head={["Instrument", "Provisions", "Predicate", "Related measure", "Hash only", "Authority record"]}
          >
            {d.instruments.map((i) => (
              <tr key={i.celex}>
                <Td>
                  <A href={i.source_url}>{i.name}</A>
                  <span className="block text-sm text-slate-600">
                    {i.long} · CELEX {i.celex}
                  </span>
                </Td>
                <Td>{i.provisions}</Td>
                <Td>{i.by_status.PREDICATE}</Td>
                <Td>{i.by_status.RELATED_MEASURE}</Td>
                <Td>{i.by_status.HASH_ONLY}</Td>
                <Td>{i.levels.authority.record ?? "none"}</Td>
              </tr>
            ))}
          </Table>
          <p className="text-[15px] text-slate-700">
            All {eu.length} instruments are EU acts. Where an instrument's manifest ids include negative numbers (the AI Act
            has {d.instruments.find((i) => i.celex === "32024R1689")?.ids_negative} of them), the manifest does not say what
            they denote, so this report does not guess.
          </p>

          <h3 className="pt-2 text-lg font-semibold">Provisions anything points to</h3>
          <Table label="Provisions with a predicate or a pointer" head={["Provision id", "Status", "What points to it"]}>
            {d.provisions_touched.map((p) => (
              <tr key={p.provision_id}>
                <Td mono>{p.provision_id}</Td>
                <Td>{STATUS_LABEL[p.status]}</Td>
                <Td>
                  {p.predicates.length ? `check: ${p.predicates.join(", ")}; ` : ""}
                  {p.related_axes.length ? `axes: ${p.related_axes.join(", ")}` : "none"}
                </Td>
              </tr>
            ))}
          </Table>
          <p className="text-[15px] text-slate-700">
            Totals over all {c.provisions}: {d.totals.PREDICATE} predicate · {d.totals.RELATED_MEASURE} related measure ·{" "}
            {d.totals.CROSSWALK_ONLY} crosswalk only · {d.totals.HASH_ONLY} hash only. Pointers name articles in prose; the
            report resolves "Article N" to the manifest id. It cannot resolve{" "}
            {[...new Set(d.unresolved_references.map((u) => u.reference))].join(", ")}, which the pointers also name.
          </p>

          <h3 className="pt-2 text-lg font-semibold">By jurisdiction</h3>
          <Table
            label="Coverage by jurisdiction"
            head={["Jurisdiction", "State", "Frozen provisions", "Routing records", "Crosswalk rows", "Prose pages"]}
          >
            {d.jurisdictions.map((j) => (
              <tr key={j.id}>
                <Td>{j.label}</Td>
                <Td>{STATE_LABEL[j.state] ?? j.state}</Td>
                <Td>{j.frozen_provisions}</Td>
                <Td>{j.authority_records.length ? j.authority_records.map((a) => a.id).join(", ") : "none"}</Td>
                <Td>{j.east_west_rows}</Td>
                <Td>
                  {j.prose_pages.length
                    ? j.prose_pages.map((p, i) => (
                        <span key={p.path}>
                          {i ? ", " : ""}
                          <A href={p.path}>{p.path}</A>
                        </span>
                      ))
                    : "none"}
                </Td>
              </tr>
            ))}
          </Table>
          <p className="text-[15px] text-slate-700">
            A routing record names an authority and where its rules are published; it holds no provisions and confers no
            authority. The prose pages explain a regime in words; {pagesCiting} of those {pages} pages cite a frozen provision id.
          </p>

          <h3 className="pt-2 text-lg font-semibold">Frameworks mapped but not in the corpus</h3>
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-slate-700">
            {d.frameworks_outside_corpus.map((f) => (
              <li key={f.id}>
                <strong>{f.name}</strong>: {f.axis_pointers} axis pointers, 0 frozen provisions
                {f.authority_record ? `, routing record ${f.authority_record}` : ""}. <A href={f.page}>{f.page}</A>
              </li>
            ))}
          </ul>

          <h3 className="pt-2 text-lg font-semibold">Capsule adapters</h3>
          <Table label="Capsule adapters and what they test" head={["Batch", "Capsules", "Bind a provision", "OWASP items reached"]}>
            {d.capsule_adapters.map((a) => (
              <tr key={a.batch}>
                <Td mono>
                  <A href={a.record}>{a.batch}</A>
                </Td>
                <Td>{a.n_capsules}</Td>
                <Td>{a.capsules_binding_a_provision}</Td>
                <Td>{a.owasp_items.length ? a.owasp_items.join(", ") : "none"}</Td>
              </tr>
            ))}
          </Table>
          <p className="text-[15px] text-slate-700">
            The capsule adapters measure protocol and ledger claims. None of them tests a provision in the frozen corpus; the
            ones that reach a published security list are mapped on <L href="/crosswalks/owasp-asi/">the OWASP crosswalk</L>.
          </p>
        </Section>

        <Section id="gaps" title="The gaps, plainly">
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-slate-700">
            <li>
              No provisions from {noCorpus.length} of the {d.jurisdictions.length} jurisdictions listed: {noCorpus.map((j) => j.label).join(", ")}.
            </li>
            <li>
              {noAuthority.length} of the {d.instruments.length} corpus instruments have no authority routing record:{" "}
              {noAuthority.map((i) => i.name).join(", ")}.
            </li>
            <li>No obligation register, no applicability rules and no watcher exist for any instrument.</li>
            <li>
              Provisions with a deterministic predicate: {d.totals.PREDICATE}. Provisions that are hashes nothing tests:{" "}
              {d.totals.HASH_ONLY} of {c.provisions}.
            </li>
            <li>The source text behind the provision hashes was not recovered, so a hash cannot yet be regenerated from text.</li>
          </ul>
        </Section>

        <Section id="hierarchy" title="How a rule is modelled">
          <p className="text-[15px] text-slate-700">Each level, and what the data holds at it today.</p>
          <dl className="space-y-2 text-[15px]">
            {d.hierarchy.map((h, i) => (
              <div key={h.level}>
                <dt className="font-semibold">
                  {i + 1}. {h.label}
                </dt>
                <dd className="text-slate-700">{h.means}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="predicate" title="The predicate implemented today">
          {d.predicates.map((p) => (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-4 text-[15px] text-slate-700">
              <h3 className="text-base font-semibold text-slate-900">
                {p.name} (<code>{p.provision_id}</code>)
              </h3>
              <p className="mt-1">{p.scope}</p>
              <p className="mt-1">
                <strong>Deterministic:</strong> {p.deterministic}
              </p>
              <p className="mt-1">
                <strong>Not measured:</strong> {p.not_measured}
              </p>
              <p className="mt-1">
                <strong>Evidence it needs:</strong> {p.evidence_requirement}
              </p>
              <p className="mt-1">{p.result_wording}</p>
              <p className="mt-1">{p.binding_today}</p>
            </div>
          ))}
        </Section>

        <Section id="submit" title="How to have a claim measured today">
          <p className="text-[15px] text-slate-700">These routes exist and are free. There is no form beyond them.</p>
          <ul className="space-y-3">
            {d.routes_today.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-4 text-[15px] text-slate-700">
                <h3 className="text-base font-semibold text-slate-900">{r.name}</h3>
                <p className="mt-1">{r.how}</p>
                <p className="mt-1">
                  <A href={r.link}>{r.link}</A> · {r.is}. {r.is_not}
                </p>
              </li>
            ))}
          </ul>
          <h3 className="pt-2 text-lg font-semibold">Not open today</h3>
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-slate-700">
            {d.not_open_today.map((n) => (
              <li key={n.id}>
                {n.what} {n.why}
              </li>
            ))}
          </ul>
          <p className="text-[15px] text-slate-700">
            The {pred.name.toLowerCase()} check is the one route that measures a claim against a provision today:{" "}
            <A href={pred.free_route}>{pred.free_route}</A>.
          </p>
        </Section>

        <Section id="verify" title="How to verify">
          <ol className="list-decimal space-y-1 pl-5 text-[15px] text-slate-700">
            <li>
              Recompute the capsule id: SHA-256 of the capsule's canonical JSON (keys sorted, no whitespace, UTF-8) without its{" "}
              <code>capsule_id</code>.
            </li>
            <li>Recompute the batch Merkle root from its published leaves (RFC 6962, leaves sorted), or check an audit path.</li>
            <li>
              Check the Ed25519 signature on the batch or index payload against the key in{" "}
              <A href="https://csoai.org/.well-known/did.json">csoai.org/.well-known/did.json</A>.
            </li>
            <li>
              Check the OpenTimestamps proof with <code>ots verify</code>.
            </li>
          </ol>
          <p className="text-[15px] text-slate-700">
            Or let a tool do it: <L href="/verify-server/">verify a server</L> in the browser, or <code>verify_capsule</code> over
            MCP at <code>POST https://councilof.ai/mcp</code>.
          </p>
          <h3 className="pt-2 text-lg font-semibold">The same record as a W3C Verifiable Credential</h3>
          <p className="text-[15px] text-slate-700">
            For ecosystems that consume Verifiable Credentials, a capsule can be exported as a VCDM 2.0 credential. The example
            at <A href="/mechanism/vc.json">/mechanism/vc.json</A> is capsule{" "}
            <code className="break-all">{vc.credentialSubject.capsuleId.slice(0, 16)}…</code> ({vc.credentialSubject.kind},{" "}
            {vc.credentialSubject.measurementState}). It carries the capsule itself, its audit path to the batch root, the
            board-signed payload and the verification method <code>{vc.evidence[0].verificationMethod}</code>, and SRI digests
            of the batch files.
          </p>
          <p className="text-[15px] text-slate-700">
            <strong>The credential is an unsigned view.</strong> It has no <code>proof</code> of its own: our signer signs one
            canonical JSON object, which is neither a Data Integrity proof nor a JWS or COSE envelope, and we did not add a
            second signer to make it look otherwise. The signature to check is the batch signature it carries. The capsule is
            the source of truth; the credential is a view of it. On 27 September 2026 it passed Digital Bazaar{" "}
            <code>vc</code> 7.3.0 <code>_checkCredential</code> and a safe-mode <code>jsonld</code> 9.0.0 expansion, and{" "}
            <code>verifyCredential</code> reports no proof to verify, as it should. The transform and its tests are{" "}
            <code>scripts/mechanism/capsule-vc.mjs</code>.
          </p>
        </Section>

        <Section id="schema" title="Capsule schema and the standard">
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-slate-700">
            <li>
              Capsule <code>csoai.measurement-capsule/0.2</code>, batch <code>csoai.measurement-capsule-batch/0.2</code>, daily
              index <code>csoai.measurement-capsule-index/0.3</code> (hash-chained). Data:{" "}
              <A href="/measurement-capsules/latest.json">/measurement-capsules/latest.json</A>.
            </li>
            <li>
              IETF Internet-Draft{" "}
              <A href="https://datatracker.ietf.org/doc/draft-templeman-scitt-measurement-capsule/">
                draft-templeman-scitt-measurement-capsule-00
              </A>
              , an individual submission. It is not an IETF standard and has no working-group status.
            </li>
            <li>
              Proposed, not yet emitted: capsule <code>0.3</code> adds one optional field, <code>provisions</code>, a list of{" "}
              <code>{"{provision_id, provision_sha256, corpus_root, relation}"}</code> with relation <code>PREDICATE</code> or{" "}
              <code>RELEVANT_TO</code>, each pinned to this manifest. A capsule without it stays byte-for-byte a 0.2 capsule. The
              verifier already accepts both.
            </li>
          </ul>
        </Section>

        <Section id="not" title="What this is not">
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-slate-700">
            <li>Not certification. No mark, seal or label is issued, and a record is never described as one.</li>
            <li>Not a compliance determination. Whether anyone complies with a law is for the competent authority.</li>
            <li>Not an endorsement of any system measured, and not a ranking.</li>
            <li>
              Not a partnership. Naming a law, a framework, a registry or a standard body here implies no relationship with it.
            </li>
            <li>
              Independent: the party measured never holds the pen. Who runs us and who holds the keys is on{" "}
              <L href="/independence/">independence</L>.
            </li>
          </ul>
        </Section>

        <Section id="corrections" title="Corrections">
          <p className="text-[15px] text-slate-700">
            A wrong row is corrected in the source file and the producer re-run; the change is recorded in the{" "}
            <L href="/corrections/">corrections ledger</L>. To contest a published result, use the{" "}
            <L href="/dispute/">dispute route</L>. Or email{" "}
            <a href="mailto:nicholas@csoai.org" className="font-medium text-emerald-800 underline underline-offset-2">
              nicholas@csoai.org
            </a>
            .
          </p>
        </Section>

        <p className="mt-12 border-t border-slate-200 pt-4 text-sm text-slate-600">
          Edited {d.edited}. Generated from <code>{d.generated_from.path}</code> by <code>{d.generated_from.producer}</code>{" "}
          (source SHA-256 {d.generated_from.sha256.slice(0, 16)}…). See also <L href="/methodology/">methodology</L> and{" "}
          <L href="/crosswalks/">crosswalks</L>.
        </p>
      </div>
    </div>
  );
}
