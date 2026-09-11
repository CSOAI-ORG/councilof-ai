import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";

/**
 * /watch — Attestation Watch + Specimen Ledger (EP3).
 *
 * Renders /interop/watch/watch-latest.json, the snapshot written by
 * scripts/adapters/watch_gaps.py inside the hourly public-root run. Every gap
 * fact on this page is also a public.notice leaf in /root.json, signed by the
 * GHA publisher — the page never carries a number the signed root does not.
 *
 * Doctrine: claim:null is UNMEASURED and the empty cell stays visible.
 * Divergence is computed only inside one disclosed scope. A divergence is a
 * fact about two sourced numbers, never an accusation. Measurement, not
 * certification.
 */

type Claim = {
  type: string;
  text?: string;
  scope?: string;
  source_url?: string;
  archived_at?: string;
  archive_note?: string;
  tvl_usd_xrpl?: number;
  tvl_usd_total?: number;
  price_usd?: number;
  circulation_usd_all_chains?: number;
};

type AssetPanel = {
  symbol: string;
  issuer: string | null;
  status: string;
  claim: Claim | null;
  external_reference: {
    name: string;
    value: number;
    unit?: string;
    as_of?: string;
    source_url?: string;
    scope?: string;
    scope_note?: string;
  } | null;
  observable: {
    supply: number | null;
    holders: number | null;
    as_of: string | null;
    source: string;
    scope: string;
  } | null;
  divergence_pct: number | null;
  xrpl_share_of_tracker_pct?: number | null;
  scope_note?: string | null;
  unmeasured: string[];
};

type CalendarEvent = {
  date: string;
  name: string;
  why_it_matters: string;
  source: string;
  specimen_ref: string | null;
};

type SpecimenEntry = {
  id: string;
  archived_at: string;
  status: string;
  event: { name: string; scheduled: string | null; threshold: string | null; sources: string[]; incident_ref?: string };
  hype_claims_observed: { claim: string; circulating_on: string; numeric_checkable: boolean }[];
  incident_class_as_accounted?: Record<string, string>;
  reference_state_at_archive: Record<string, string>;
  measurement_plan: string;
  access_ask?: string;
  tags_public?: string[];
  outcome: unknown;
  outcome_due: string | null;
};

type Scoreboard = {
  generated_at: string;
  rwa_cite: {
    as_of: string;
    source_url: string;
    distributed_asset_value_usd: number;
    represented_asset_value_usd: number;
    xrpl_distributed_usd: number;
    xrpl_pct_distributed: number;
    xrpl_represented_usd: number;
    rule: string;
    license: string;
  } | null;
  sov_index: {
    value: { measured_axes: number; n_signal_rows: number; n_measured_rows: number };
    artifact_generated: string;
    artifact_content_id: string;
    weighted_form: string;
    source_url: string;
  } | null;
};

type Snapshot = {
  generated_at: string;
  metrics_ok: boolean;
  metrics_as_of: string | null;
  assets: AssetPanel[];
  calendar: CalendarEvent[];
  specimen_ledger: SpecimenEntry[];
};

const fmtUsd = (n: number) =>
  n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`;
const fmtNum = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

function DivergenceCell({ a }: { a: AssetPanel }) {
  if (a.divergence_pct == null) return <span className="text-slate-500">—</span>;
  const pct = a.divergence_pct;
  const cls =
    Math.abs(pct) < 1 ? "text-emerald-300" : Math.abs(pct) < 10 ? "text-amber-300" : "text-red-300";
  return (
    <span className={`font-mono ${cls}`}>
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

function AssetRow({ a }: { a: AssetPanel }) {
  return (
    <div className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="font-mono text-lg text-emerald-300">{a.symbol}</span>
          {a.issuer && <span className="ml-2 text-sm text-slate-300">{a.issuer}</span>}
        </div>
        <span
          className={`text-xs font-mono ${a.status === "PROBED" ? "text-emerald-400" : "text-slate-500"}`}
        >
          {a.status}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase text-slate-500">issuer claim (archived)</div>
          {a.claim ? (
            <div className="mt-1 text-sm text-slate-200">
              {a.claim.tvl_usd_xrpl != null && <div>XRPL TVL: {fmtUsd(a.claim.tvl_usd_xrpl)}</div>}
              {a.claim.circulation_usd_all_chains != null && (
                <div>Circulation (all chains): {fmtUsd(a.claim.circulation_usd_all_chains)}</div>
              )}
              {a.claim.text && <div className="italic text-slate-300">“{a.claim.text}”</div>}
              <div className="mt-1 text-xs text-slate-500">
                {a.claim.source_url && (
                  <a href={a.claim.source_url} className="underline" target="_blank" rel="noreferrer">
                    source
                  </a>
                )}{" "}
                · archived {a.claim.archived_at?.slice(0, 10)} · scope: {a.claim.scope}
              </div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-slate-500">— no archived claim</div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase text-slate-500">observable (xrpl.fi)</div>
          {a.observable && a.observable.supply != null ? (
            <div className="mt-1 text-sm text-slate-200">
              <div>
                supply: <span className="font-mono">{fmtNum(a.observable.supply)}</span>
              </div>
              {a.observable.holders != null && <div>holders: {fmtNum(a.observable.holders)}</div>}
              <div className="mt-1 text-xs text-slate-500">as of {a.observable.as_of?.slice(0, 10)}</div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-slate-500">—</div>
          )}
        </div>

        <div>
          <div className="text-xs uppercase text-slate-500">divergence (same scope)</div>
          <div className="mt-1 text-lg">
            <DivergenceCell a={a} />
          </div>
          {a.xrpl_share_of_tracker_pct != null && a.external_reference && (
            <div className="mt-1 text-xs text-slate-400">
              XRPL slice = {a.xrpl_share_of_tracker_pct}% of tracker’s all-chain figure (
              {fmtNum(a.external_reference.value)} {a.external_reference.unit ?? ""},{" "}
              {a.external_reference.as_of?.slice(0, 10)})
            </div>
          )}
          {a.scope_note && <div className="mt-1 text-xs text-slate-500">{a.scope_note}</div>}
        </div>
      </div>

      {a.unmeasured.length > 0 && (
        <div className="mt-2 text-xs text-slate-500">UNMEASURED: {a.unmeasured.join(" · ")}</div>
      )}
    </div>
  );
}

export default function Watch() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [score, setScore] = useState<Scoreboard | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Attestation Watch — issuer claims vs observable state | Council of AI";
    setMetaDescription(
      "Per-asset panels: what the issuer page claimed (archived, timestamped) beside what the public ledger shows. Signed gap-cards in the public root. Measurement, not certification.",
    );
    fetch("/interop/watch/watch-latest.json")
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("GET /interop/watch/watch-latest.json HTTP " + r.status)),
      )
      .then(setSnap)
      .catch((e) => setErr(String(e)));
    fetch("/interop/scoreboard/latest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setScore)
      .catch(() => setScore(null));
  }, []);

  const measured = snap ? snap.assets.filter((a) => a.status === "PROBED").length : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Attestation Watch</h1>
      <p className="mt-1 text-sm text-emerald-300/80">
        issuer claims vs observable state · signed gap-cards in the public root · measurement, not
        certification
      </p>
      <p className="mt-2 text-xs text-slate-400">
        Every panel below is also a signed public.notice leaf in <a className="underline" href="/root.json">/root.json</a>.
        A divergence is a fact about two sourced numbers — never an accusation, never a solvency
        statement. Where no claim is archived the cell stays empty: UNMEASURED is a first-class answer.
      </p>

      {err && (
        <div className="mt-6 rounded-lg border border-amber-500/40 p-4 text-sm text-amber-200">
          Snapshot not yet published ({err}). The first signed gap-cards land with the next
          public-root run after this page ships.
        </div>
      )}

      {snap && (
        <>
          <div className="mt-6 rounded-xl border border-gold-400/30 bg-[#0d241b] p-5">
            <div className="font-mono text-lg text-emerald-300">
              {measured}/{snap.assets.length} assets probed
            </div>
            <div className="mt-1 text-sm text-slate-300">
              observable feed as of <b>{snap.metrics_as_of?.slice(0, 10) ?? "—"}</b> · snapshot
              generated {snap.generated_at.slice(0, 16).replace("T", " ")}Z
            </div>
            {!snap.metrics_ok && (
              <div className="mt-1 text-xs text-amber-300">
                observable feed unreachable at generation time — panels show the claim side only
              </div>
            )}
          </div>

          <h2 className="mt-8 text-lg font-semibold">The 16 identity-verified XRPL assets</h2>
          <div className="mt-3 grid gap-3">
            {snap.assets.map((a) => (
              <AssetRow key={a.symbol} a={a} />
            ))}
          </div>

          <h2 className="mt-10 text-lg font-semibold">Hard-date rail</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {snap.calendar.map((e) => (
              <div key={e.name} className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-3">
                <div className="font-mono text-emerald-300">{e.date.slice(0, 10)}</div>
                <div className="text-sm text-slate-200">{e.name}</div>
                <div className="mt-1 text-xs text-slate-400">{e.why_it_matters}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {e.source.startsWith("http") ? (
                    <a href={e.source} className="underline" target="_blank" rel="noreferrer">
                      source
                    </a>
                  ) : (
                    e.source
                  )}
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-10 text-lg font-semibold">Specimen ledger</h2>
          <p className="mt-1 text-xs text-slate-400">
            Public predictions, archived before their outcome date, then measured against what
            happened. The timestamp is the product.
          </p>
          <div className="mt-3 grid gap-3">
            {snap.specimen_ledger.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="text-sm text-slate-200">{s.event.name}</div>
                  <span className="font-mono text-xs text-amber-300">{s.status}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  archived {s.archived_at.slice(0, 10)}
                  {s.event.scheduled && <> · event {s.event.scheduled.slice(0, 10)}</>}
                  {s.outcome_due && <> · outcome due {s.outcome_due}</>}
                </div>
                {s.hype_claims_observed.length > 0 && (
                  <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
                    {s.hype_claims_observed.map((c) => (
                      <li key={c.claim}>
                        “{c.claim}” <span className="text-xs text-slate-500">({c.circulating_on})</span>
                      </li>
                    ))}
                  </ul>
                )}
                {s.incident_class_as_accounted && (
                  <div className="mt-2 rounded border border-slate-700/60 p-2 text-xs text-slate-300">
                    <div className="text-slate-500">{s.incident_class_as_accounted.note}</div>
                    {s.incident_class_as_accounted.swarm_size && (
                      <div className="mt-1">· swarm: {s.incident_class_as_accounted.swarm_size}</div>
                    )}
                    {s.incident_class_as_accounted.escape && (
                      <div>· escape: {s.incident_class_as_accounted.escape}</div>
                    )}
                    {s.incident_class_as_accounted.log_integrity && (
                      <div>· log integrity: {s.incident_class_as_accounted.log_integrity}</div>
                    )}
                    <div className="mt-1 text-slate-500">{s.incident_class_as_accounted.attribution}</div>
                  </div>
                )}
                <div className="mt-2 text-xs text-slate-400">{s.measurement_plan}</div>
                {s.access_ask && (
                  <div className="mt-1 text-xs text-slate-500">access-ask: {s.access_ask}</div>
                )}
                {s.reference_state_at_archive?.polymarket_passage_odds_2026 && (
                  <div className="mt-2 text-xs text-slate-500">
                    reference at archive: Polymarket passage odds{" "}
                    {s.reference_state_at_archive.polymarket_passage_odds_2026}; Galaxy{" "}
                    {s.reference_state_at_archive.galaxy_research_estimate}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="mt-10 text-lg font-semibold">Daily scoreboard</h2>
      <p className="mt-1 text-xs text-slate-400">
        One signed number a day. Scoreboard, never a token — no trading, no issuance.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-4">
          <div className="text-xs uppercase text-slate-500">SOV Index v0</div>
          {score?.sov_index ? (
            <>
              <div className="mt-1 font-mono text-lg text-emerald-300">
                {score.sov_index.value.measured_axes} measured axes ·{" "}
                {score.sov_index.value.n_measured_rows} signed rows
              </div>
              <div className="mt-1 text-xs text-slate-400">
                artifact generated {score.sov_index.artifact_generated.slice(0, 10)} ·{" "}
                <a href={score.sov_index.source_url} className="underline" target="_blank" rel="noreferrer">
                  signed artifact
                </a>
              </div>
              <div className="mt-2 text-xs text-slate-500">{score.sov_index.weighted_form}</div>
            </>
          ) : (
            <div className="mt-1 text-sm text-slate-500">— artifact not yet published</div>
          )}
        </div>
        <div className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-4">
          <div className="text-xs uppercase text-slate-500">Public cite — rwa.xyz networks</div>
          {score?.rwa_cite ? (
            <>
              <div className="mt-1 text-sm text-slate-200">
                distributed <span className="font-mono text-emerald-300">{fmtUsd(score.rwa_cite.distributed_asset_value_usd)}</span>
                {" · "}represented {fmtUsd(score.rwa_cite.represented_asset_value_usd)}
              </div>
              <div className="mt-1 text-sm text-slate-200">
                XRPL distributed {fmtUsd(score.rwa_cite.xrpl_distributed_usd)} ({score.rwa_cite.xrpl_pct_distributed}%)
              </div>
              <div className="mt-1 text-xs text-slate-500">
                page figures as of {score.rwa_cite.as_of} ·{" "}
                <a href={score.rwa_cite.source_url} className="underline" target="_blank" rel="noreferrer">
                  source
                </a>{" "}
                · {score.rwa_cite.license}
              </div>
              <div className="mt-2 text-xs text-slate-500">{score.rwa_cite.rule}</div>
            </>
          ) : (
            <div className="mt-1 text-sm text-slate-500">— cite not yet published</div>
          )}
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Alerting tier (R3)</h2>
      <div className="mt-3 rounded-xl border border-gold-400/30 bg-[#0d241b] p-5">
        <div className="font-mono text-emerald-300">$199/mo — signed feed + alert webhooks</div>
        <p className="mt-2 text-sm text-slate-300">
          Every gap-card and specimen outcome as a signed webhook the hour it lands. The data on
          this page is free forever; what a subscription buys is the signed receipt and the push.
          Payment rides the existing x402 bundle path (<a className="underline" href="/.well-known/x402.json">/.well-known/x402.json</a>)
          — display scaffolding only until the first subscriber settles.
        </p>
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Method: claims enter the registry only when fetched and archived with a timestamp; the
        observable side is the locked-16 xrpl.fi reader already declared in the public root.
        Divergence is computed inside one disclosed scope or not at all. Measurement, not
        certification.
      </p>
    </div>
  );
}
