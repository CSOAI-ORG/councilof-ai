import { useEffect, useState } from "react";

/**
 * A thin CouncilOS consumer of Council's existing read-only AUTO-EAT gateway.
 * Discovery is neither independent assessment nor permission to copy/run a
 * third party's code. No paid RAS request or agent tool is invoked.
 */
type Repo = {
  repository: string;
  observed_source_revision: string | null;
  source_declared_license: string | null;
  status: "SOURCE_METADATA_OBSERVED" | "SOURCE_UNCHECKABLE";
  project_role: string;
  candidate_experiment: string;
  licence_review: "REQUIRED";
  human_reviewer_state: "UNASSIGNED";
  independent_validation: "NOT_PERFORMED";
};
type Paper = {
  doi: string;
  title_metadata: string;
  published_parts_source_declared: number[] | null;
  reproducibility: "NOT_TESTED";
};
type Topic = {
  topic: string;
  status: string;
  bibliographic_candidates: Paper[];
};
type Response = {
  schema: "csoai.councilos-eat-research-commons/0.1";
  state: "FREE_DISCOVERY_ONLY";
  source: {
    observed_at: string;
    source_sha256: string;
    signature_verification: "NOT_PERFORMED";
    independent_source_verification: false;
  };
  coverage: {
    repositories_checked: number;
    repositories_observed: number;
    repositories_uncheckable: number;
    crossref_topics_observed: number;
    papers_shortlisted: number;
  };
  repositories: Repo[];
  papers: Topic[];
};
type State =
  | { status: "loading" }
  | { status: "held" }
  | { status: "ready"; data: Response };

function isReady(value: unknown): value is Response {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const d = value as Record<string, unknown>;
  const source = d.source as Record<string, unknown> | null;
  const coverage = d.coverage as Record<string, unknown> | null;
  return d.schema === "csoai.councilos-eat-research-commons/0.1" &&
    d.state === "FREE_DISCOVERY_ONLY" &&
    source?.signature_verification === "NOT_PERFORMED" &&
    source?.independent_source_verification === false &&
    typeof source?.observed_at === "string" &&
    typeof source?.source_sha256 === "string" &&
    Array.isArray(d.repositories) && d.repositories.length <= 18 &&
    Array.isArray(d.papers) && d.papers.length <= 3 &&
    !!coverage && typeof coverage.repositories_observed === "number" &&
    typeof coverage.repositories_uncheckable === "number";
}

const readable = (text: string) =>
  text.toLowerCase().replace(/_/g, " ").replace(/(?:^|\s)\S/g, (s) => s.toUpperCase());

export default function EatResearchCommonsPanel() {
  const [state, setState] = useState<State>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    (async () => {
      try {
        const response = await fetch("/api/research-commons", {
          method: "GET", credentials: "omit", signal: controller.signal,
          headers: { accept: "application/json" },
        });
        if (!response.ok) throw new Error("not a fresh qualified public source");
        const data: unknown = await response.json();
        if (!isReady(data)) throw new Error("invalid source projection");
        if (alive) setState({ status: "ready", data });
      } catch {
        if (alive) setState({ status: "held" });
      }
    })();
    return () => { alive = false; controller.abort(); };
  }, []);

  return (
    <section aria-label="Open research commons source discoveries" className="mx-auto max-w-6xl px-6 py-9">
      <div className="rounded-2xl border border-emerald-400/30 bg-white/[0.04] p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Public research · AUTO-EAT to H.I.M.</p>
            <h2 className="mt-2 text-2xl font-bold text-emerald-50">Open research commons</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-100/75">
              Source-linked software revisions and paper references for Council research. Discovery is free.
              A source listing is not our measurement, not a vendor partnership, not licence clearance and not independent verification.
            </p>
          </div>
          <a href="/api/research-plan" className="rounded-lg border border-emerald-400/40 px-3 py-2 text-sm text-emerald-200 hover:bg-white/10">
            View measured GSPC research
          </a>
        </div>

        <div className="mt-5" aria-live="polite">
          {state.status === "loading" && <p className="text-sm text-emerald-100/70">Checking the source revision and access controls…</p>}
          {state.status === "held" && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-300/5 p-4">
              <p className="font-semibold text-amber-100">Research feed currently uncheckable or not freshly published</p>
              <p className="mt-1 text-sm text-emerald-100/70">
                No cached source is presented as current. Existing measured GSPC records and the Watchdog source inventory remain available separately.
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm">
                <a className="text-emerald-200 underline" href="/api/research-plan">GSPC research plan</a>
                <a className="text-emerald-200 underline" href="/api/watchdog-sources">Watchdog source status</a>
              </div>
            </div>
          )}
          {state.status === "ready" && (
            <>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-emerald-100/80">
                <span><strong className="text-emerald-50">{state.data.coverage.repositories_observed}</strong> observed source revisions</span>
                <span><strong className="text-emerald-50">{state.data.coverage.repositories_uncheckable}</strong> source identities uncheckable</span>
                <span><strong className="text-emerald-50">{state.data.coverage.papers_shortlisted}</strong> bibliographic candidates, not papers reproduced</span>
              </div>
              <p className="mt-2 text-xs text-emerald-100/60">
                Source observed {state.data.source.observed_at} · exact source readback identified by SHA-256; no external signature or independent endorsement
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {state.data.repositories.map((r) => (
                  <div key={r.repository} className="min-w-0 rounded-xl border border-emerald-400/15 bg-[#052116]/70 p-3">
                    <a href={"https://github.com/" + r.repository} target="_blank" rel="noopener noreferrer"
                       className="break-words font-semibold text-emerald-100 underline decoration-emerald-400/40 hover:decoration-emerald-100">
                      {r.repository}
                    </a>
                    <p className="mt-1 text-xs text-emerald-100/70">
                      {r.status === "SOURCE_METADATA_OBSERVED" ? "Public source revision observed" : "Source uncheckable"}
                      {" · "}
                      {r.source_declared_license ? "Declared licence: " + r.source_declared_license : "Licence not established"}
                    </p>
                    <p className="mt-1 text-xs text-emerald-100/60">Research candidate: {readable(r.candidate_experiment)} · human review required</p>
                  </div>
                ))}
              </div>
              <details className="mt-5 border-t border-emerald-400/15 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-emerald-200">View candidate research papers (metadata only)</summary>
                <div className="mt-3 space-y-4">
                  {state.data.papers.map((topic) => (
                    <div key={topic.topic}>
                      <p className="text-sm font-semibold text-emerald-50">{topic.topic}</p>
                      {topic.status !== "SOURCE_METADATA_OBSERVED" && <p className="text-xs text-amber-200">Source uncheckable, not zero papers</p>}
                      {topic.bibliographic_candidates.map((paper) => (
                        <p key={paper.doi} className="mt-1 text-sm">
                          <a href={"https://doi.org/" + paper.doi} target="_blank" rel="noopener noreferrer"
                             className="text-emerald-200 underline">{paper.title_metadata}</a>
                          <span className="ml-2 text-xs text-emerald-100/60">(not reproduced)</span>
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </details>
            </>
          )}
        </div>

        <p className="mt-5 border-t border-emerald-400/15 pt-4 text-xs text-emerald-100/65">
          Need an experiment? Use the existing <a href="/him" className="text-emerald-200 underline">H.I.M. journey</a> to discuss scope.
          A paid RAS test, genuine reviewer approval or recipient effect is a separate authorised process—not a consequence of appearing here.
        </p>
      </div>
    </section>
  );
}
