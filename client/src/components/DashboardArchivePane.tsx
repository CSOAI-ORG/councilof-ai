import { useEffect, useState } from "react";

/**
 * Council OS · Provable archive — the hourly signed history of permission-state
 * leaves, quoted from GET /archive/index.json at runtime. Nothing here is typed:
 * subjects, counts, latest block and witness refs are all read on load, because
 * the roster and the roots change every hour and a typed list would rot.
 *
 * Loader grammar: LOADING → skeleton, no fake numbers. UNREACHABLE → that word,
 * never a cached list rendered as live. Every row links to the subject index
 * (append-only JSON) and, where present, the Rekor entry for its latest root.
 *
 * Vocabulary: point-in-time facts. Not a rate, not a grade, never MEASURED.
 * Method: docs/PROVABLE-ARCHIVE-METHOD.md.
 */

type Latest = {
  as_of?: string;
  block?: number | null;
  block_hash?: string | null;
  sha256?: string;
  eip1186_proof_sha256?: string | null;
  root_merkle?: string;
  rekor_logIndex?: number | null;
  ots_path?: string | null;
  root_signed?: boolean;
};

type Subject = {
  subject: string;
  dir: string;
  surface: string;
  n: number;
  first_as_of?: string | null;
  last_as_of?: string | null;
  latest?: Latest | null;
  url: string;
};

type ArchiveIndex = {
  kind?: string;
  as_of?: string;
  method?: string;
  root?: string;
  roots_indexed?: number;
  roots_witnessed?: number;
  subjects?: Subject[];
};

type Wire =
  | { state: "loading" }
  | { state: "unreachable"; detail: string }
  | { state: "live"; doc: ArchiveIndex };

const METHOD_URL =
  "https://github.com/CSOAI-ORG/councilof-ai/blob/master/docs/PROVABLE-ARCHIVE-METHOD.md";

function short(h?: string | null, n = 10): string {
  return h ? `${h.slice(0, n)}…` : "—";
}

function groupOf(subject: string): string {
  if (subject.startsWith("xrpl:")) return "XRPL asset state";
  if (subject.startsWith("evm-events:scan")) return "EVM event scan coverage";
  if (subject.startsWith("evm-events:")) return "EVM permission events";
  if (subject.startsWith("evm:")) return "EVM permission state";
  return "Other";
}

export default function DashboardArchivePane() {
  const [wire, setWire] = useState<Wire>({ state: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    fetch("/archive/index.json", { signal: ac.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`GET /archive/index.json HTTP ${r.status}`);
        if (!(r.headers.get("content-type") || "").toLowerCase().includes("json"))
          throw new Error("GET /archive/index.json answered HTML, not JSON");
        const doc = (await r.json()) as ArchiveIndex;
        if (!Array.isArray(doc.subjects)) throw new Error("GET /archive/index.json: no subjects[]");
        setWire({ state: "live", doc });
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setWire({ state: "unreachable", detail: String(e?.message || e) });
      });
    return () => ac.abort();
  }, []);

  return (
    <div className="space-y-6" data-testid="dashboard-pane-archive-body">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Provable archive</h2>
        <p className="text-sm text-muted-foreground">
          The hourly signed history of on-chain permission-state leaves under the one public root.
          Each entry names its root (merkle, sha256, signature) and the third-party witnesses (Rekor
          log index, OpenTimestamps path) so a stranger can recompute it. Point-in-time facts. Not a
          rate, not a grade, not a certificate.{" "}
          <a className="underline" href={METHOD_URL} target="_blank" rel="noreferrer">
            Method
          </a>
          {" · "}
          <a className="underline" href="/archive/index.json" target="_blank" rel="noreferrer">
            /archive/index.json
          </a>
        </p>
      </div>

      {wire.state === "loading" && (
        <div className="space-y-2" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      )}

      {wire.state === "unreachable" && (
        <div className="rounded border border-destructive/40 p-3 text-sm">
          <div className="font-semibold">UNREACHABLE</div>
          <div className="text-muted-foreground">{wire.detail}</div>
          <div className="mt-1 text-muted-foreground">
            The archive index is generated at publish time by the public-root workflow. If it has
            not run since this build, there is nothing to show yet — nothing is printed from memory.
          </div>
        </div>
      )}

      {wire.state === "live" && (
        <ArchiveTable doc={wire.doc} />
      )}
    </div>
  );
}

function ArchiveTable({ doc }: { doc: ArchiveIndex }) {
  const subjects = [...(doc.subjects || [])].sort((a, b) => a.subject.localeCompare(b.subject));
  const groups = new Map<string, Subject[]>();
  for (const s of subjects) {
    const g = groupOf(s.subject);
    groups.set(g, [...(groups.get(g) || []), s]);
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>index as of {doc.as_of || "—"}</span>
        <span>{subjects.length} subjects</span>
        <span>{doc.roots_indexed ?? "—"} roots indexed</span>
        <span>{doc.roots_witnessed ?? "—"} roots witnessed</span>
      </div>
      {[...groups.entries()].map(([g, rows]) => (
        <div key={g} className="space-y-1">
          <h3 className="text-sm font-semibold">{g}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-1 pr-3">subject</th>
                  <th className="py-1 pr-3">entries</th>
                  <th className="py-1 pr-3">first</th>
                  <th className="py-1 pr-3">latest</th>
                  <th className="py-1 pr-3">block</th>
                  <th className="py-1 pr-3">EIP-1186</th>
                  <th className="py-1 pr-3">root</th>
                  <th className="py-1 pr-3">Rekor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const l = s.latest || {};
                  return (
                    <tr key={s.subject} className="border-t border-border/40">
                      <td className="py-1 pr-3 font-mono">
                        <a className="underline" href={s.url} target="_blank" rel="noreferrer">
                          {s.subject}
                        </a>
                      </td>
                      <td className="py-1 pr-3">{s.n}</td>
                      <td className="py-1 pr-3">{s.first_as_of || "—"}</td>
                      <td className="py-1 pr-3">{s.last_as_of || "—"}</td>
                      <td className="py-1 pr-3 font-mono">{l.block ?? "—"}</td>
                      <td className="py-1 pr-3 font-mono">
                        {l.eip1186_proof_sha256 ? (
                          <a
                            className="underline"
                            href={`/archive/proofs/eip1186/${l.eip1186_proof_sha256.slice(0, 16)}.json`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {short(l.eip1186_proof_sha256)}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-1 pr-3 font-mono" title={l.root_merkle || ""}>
                        {short(l.root_merkle)} {l.root_signed ? "signed" : "unsigned"}
                      </td>
                      <td className="py-1 pr-3 font-mono">
                        {l.rekor_logIndex != null ? (
                          <a
                            className="underline"
                            href={`https://rekor.sigstore.dev/api/v1/log/entries?logIndex=${l.rekor_logIndex}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {l.rekor_logIndex}
                          </a>
                        ) : (
                          "not witnessed"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
