import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

/**
 * /alliance-map — what the public record says about membership of the Open Secure AI Alliance.
 *
 * THIS PAGE IS NOT A MEMBER LIST, AND THAT IS THE DESIGN, NOT A DISCLAIMER.
 * The alliance publishes no member list: on the read recorded in the registry its own site named
 * no organisation as a member and /members and /about both returned 404. Press coverage names
 * organisations and prints counts that disagree with one another. So a page that said "these are
 * the members" would be asserting facts about a hundred other companies from no primary source —
 * which is the defect this organisation exists to catch in other people. Instead this renders,
 * per organisation, WHAT THAT ORGANISATION'S OWN PUBLIC RECORD SAYS, with a state, a source URL,
 * the date we read it and the digest of what we read.
 *
 * ONE SET OF BYTES. Everything below is rendered from public/claims/osaia-membership-2026-09-23.json,
 * the exact file served at /claims/osaia-membership-2026-09-23.json and indexed at
 * /api/claims/register. There are no hand-typed rows on this page and no number here is typed:
 * every count is the length of something a reader can scroll to.
 *
 * NO LOGOS. Organisation names are text. Each links to that organisation's own record rather than
 * to ours. A trademark shown beside a state reads as a mark we issued, and we issue none.
 */
import registry from "../../../public/claims/osaia-membership-2026-09-23.json";

type Row = {
  name_as_printed: string;
  evidence_class: string;
  identifier: string | null;
  identifier_kind: string;
  identifier_note?: string;
  stack_layer: string;
  stack_layer_note?: string;
  contribution_quote?: string;
  contribution_source_url?: string;
  says_it_itself?: boolean | null;
  is_the_maintainer?: boolean;
  claim_id?: string;
  source_url?: string;
  quote?: string;
  access_date?: string;
  source_content_sha256?: string;
  extracted_chars?: number | null;
  quote_present_at_this_read?: boolean;
  read_outcome?: string;
  http_status?: number | null;
  attempts?: string[];
  read_note?: string;
  search_note?: string;
  named_in?: { source_url: string; claim_id: string };
};

const ROWS = registry.organisations as Row[];
const CLASSES = ["CORROBORATED", "ANNOUNCED", "REPORTED", "NOT_FOUND", "UNCHECKABLE"] as const;

/**
 * Five states, five treatments, and the difference between them has to be visible without
 * reading the legend — "their own newsroom says it" and "somebody said it about them" are not
 * the same evidence and must not look the same. None of these is a pass, a fail, a tick or a
 * cross: they describe the EVIDENCE that exists, never the organisation.
 */
const CLASS_STYLE: Record<string, { chip: string; bar: string; label: string; means: string }> = {
  CORROBORATED: {
    chip: "bg-emerald-100 text-emerald-900 ring-emerald-400 dark:bg-emerald-950 dark:text-emerald-100 dark:ring-emerald-700",
    bar: "bg-emerald-500 dark:bg-emerald-400",
    label: "CORROBORATED",
    means:
      "That organisation's own site, blog, newsroom or filing carries the statement. We quote the sentence and link to their page, not ours.",
  },
  ANNOUNCED: {
    chip: "bg-sky-100 text-sky-900 ring-sky-400 dark:bg-sky-950 dark:text-sky-100 dark:ring-sky-700",
    bar: "bg-sky-500 dark:bg-sky-400",
    label: "ANNOUNCED",
    means:
      "The founding vendor, the alliance or the Linux Foundation named the organisation in a public announcement, and we found no page of the organisation's own that does. This is weaker than the organisation saying it itself.",
  },
  REPORTED: {
    chip: "bg-amber-100 text-amber-900 ring-amber-400 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-700",
    bar: "bg-amber-500 dark:bg-amber-400",
    label: "REPORTED",
    means: "Only press coverage names the organisation, and no primary source confirms it.",
  },
  NOT_FOUND: {
    chip: "bg-slate-200 text-slate-900 ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600",
    bar: "bg-slate-400 dark:bg-slate-500",
    label: "NOT_FOUND",
    means:
      "We looked and found nothing. This means we did not find it. It never means it is not so, and nothing about an organisation may be read from it.",
  },
  UNCHECKABLE: {
    chip: "bg-violet-100 text-violet-900 ring-violet-400 dark:bg-violet-950 dark:text-violet-100 dark:ring-violet-700",
    bar: "bg-violet-500 dark:bg-violet-400",
    label: "UNCHECKABLE",
    means:
      "That organisation's own surface refused our reader, so we could not determine what its own record says. The status code is recorded. This is a fact about a server, not about the organisation.",
  },
};

const styleFor = (c: string) =>
  CLASS_STYLE[c] ?? {
    chip: "bg-slate-100 text-slate-900 ring-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600",
    bar: "bg-slate-300 dark:bg-slate-600",
    label: c,
    means:
      "This class appears on a row but is not one of the five the registry declares. It renders anyway — a row is never dropped for wearing a label the page did not expect.",
  };

function ClassChip({ c }: { c: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide ring-1 ${styleFor(c).chip}`}
    >
      {styleFor(c).label}
    </span>
  );
}

function Digest({ hex }: { hex?: string | null }) {
  if (!hex) return null;
  return (
    <span
      className="font-mono text-[10px] text-slate-500 dark:text-slate-400"
      title={`sha256 of the extracted visible text: ${hex}`}
    >
      sha256 {hex.slice(0, 12)}…
    </span>
  );
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="break-words text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900 dark:text-emerald-300 dark:decoration-emerald-700 dark:hover:text-emerald-200"
      href={href}
      target="_blank"
      rel="noopener nofollow"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function OrgRow({ r }: { r: Row }) {
  return (
    <li className="border-t border-slate-200 py-4 first:border-t-0 dark:border-slate-800">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <h3 className="text-[15px] font-bold tracking-tight">
          {r.source_url && !r.is_the_maintainer ? (
            <Ext href={r.source_url}>{r.name_as_printed}</Ext>
          ) : (
            r.name_as_printed
          )}
        </h3>
        <ClassChip c={r.evidence_class} />
        {r.is_the_maintainer ? (
          <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-white dark:text-slate-900">
            THIS IS US
          </span>
        ) : null}
        {r.stack_layer !== "NOT_STATED" ? (
          <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {r.stack_layer}
          </span>
        ) : null}
      </div>

      {r.quote ? (
        <blockquote className="mt-2 border-l-2 border-slate-300 pl-3 text-[13px] leading-relaxed text-slate-700 dark:border-slate-700 dark:text-slate-300">
          “{r.quote}”
        </blockquote>
      ) : null}

      {r.contribution_quote ? (
        <p className="mt-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">
          <span className="font-mono text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-500">
            Contribution named in a public source ·{" "}
          </span>
          “{r.contribution_quote}” —{" "}
          {r.contribution_source_url ? <Ext href={r.contribution_source_url}>source</Ext> : null}
        </p>
      ) : null}

      {r.read_outcome ? (
        <p className="mt-2 text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">
          {/* Two sentences, not one template: "answered no HTTP status: timed out to our reader"
              is not English, and a server that never answered did not answer anything. */}
          {typeof r.http_status === "number" ? (
            <>
              Their own page answered <span className="font-mono">HTTP {r.http_status}</span> to our
              reader.
            </>
          ) : (
            <>Their own page did not answer our reader: {r.read_outcome.replace(/^no HTTP status: /, "")}.</>
          )}{" "}
          {r.read_note ? `${r.read_note[0].toUpperCase()}${r.read_note.slice(1)}.` : ""}
          {r.attempts?.length ? ` Attempts: ${r.attempts.join("; ")}.` : ""}
        </p>
      ) : null}

      {r.search_note ? (
        <p className="mt-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{r.search_note}</p>
      ) : null}

      {r.read_note && !r.read_outcome ? (
        <p className="mt-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{r.read_note}</p>
      ) : null}

      {r.identifier_note ? (
        <p className="mt-2 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{r.identifier_note}</p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
        {r.source_url ? (
          <span className="min-w-0 break-all font-mono">
            {r.is_the_maintainer ? r.source_url : <Ext href={r.source_url}>{r.source_url}</Ext>}
          </span>
        ) : null}
        {r.access_date ? <span className="font-mono">read {r.access_date}</span> : null}
        <Digest hex={r.source_content_sha256} />
        {typeof r.extracted_chars === "number" ? (
          <span className="font-mono" title="characters of visible text the extractor obtained from that page">
            {r.extracted_chars.toLocaleString("en-GB")} chars
          </span>
        ) : null}
        {r.quote_present_at_this_read === false ? (
          <span className="font-mono text-amber-700 dark:text-amber-400">
            quoted sentence not found in the extracted text at the latest read — observed change requiring review
          </span>
        ) : null}
        {r.claim_id ? <span className="font-mono">{r.claim_id}</span> : null}
      </div>

      {r.named_in && r.evidence_class !== "CORROBORATED" ? (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          Named in <Ext href={r.named_in.source_url}>the founding vendor&rsquo;s announcement</Ext> (
          {r.named_in.claim_id}).
        </p>
      ) : null}
    </li>
  );
}

export default function AllianceMap() {
  useEffect(() => {
    document.title =
      "Open Secure AI Alliance — what each organisation's own record says | Council of AI";
  }, []);

  const [groupBy, setGroupBy] = useState<"class" | "layer">("class");
  const [sortBy, setSortBy] = useState<"announced" | "name">("announced");
  const [only, setOnly] = useState<string>("ALL");

  const filtered = useMemo(
    () => (only === "ALL" ? ROWS : ROWS.filter((r) => r.evidence_class === only)),
    [only],
  );

  const groups = useMemo(() => {
    const keyOf = (r: Row) => (groupBy === "class" ? r.evidence_class : r.stack_layer);
    const order =
      groupBy === "class"
        ? [...CLASSES]
        : [...new Set(ROWS.map((r) => r.stack_layer))].sort((a, b) =>
            a === "NOT_STATED" ? 1 : b === "NOT_STATED" ? -1 : a.localeCompare(b),
          );
    const seen = new Set<string>(order);
    for (const r of filtered) if (!seen.has(keyOf(r))) { order.push(keyOf(r)); seen.add(keyOf(r)); }
    return order
      .map((k) => {
        const rows = filtered.filter((r) => keyOf(r) === k);
        return {
          k,
          rows:
            sortBy === "name"
              ? [...rows].sort((a, b) =>
                  a.name_as_printed.replace(/^the /i, "").localeCompare(b.name_as_printed.replace(/^the /i, "")),
                )
              : rows,
        };
      })
      .filter((g) => g.rows.length > 0);
  }, [filtered, groupBy, sortBy]);

  // Every number on this page is the length of something rendered below it.
  const rendered = groups.flatMap((g) => g.rows);
  const dropped = filtered.filter((r) => !rendered.includes(r));
  const barCounts = CLASSES.map((c) => ({ c, n: ROWS.filter((r) => r.evidence_class === c).length }));
  const probe = registry.alliance_surface_probe;
  const nots = registry.this_is_not_a_member_list;

  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* ── Header ─────────────────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 pt-12 pb-9 sm:px-6 sm:pt-14">
          <p className="font-mono text-[10px] uppercase tracking-[3px] text-emerald-700 dark:text-emerald-400">
            Claim maintenance · {ROWS.length} organisations · read {registry.created_utc}
          </p>
          <h1 className="mt-3 text-[28px] font-black leading-[1.1] tracking-tight sm:text-4xl">
            The Open Secure AI Alliance publishes no member list.
            <span className="mt-1 block bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-sky-400">
              So this is not one.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
            {nots.what_it_is}
          </p>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate-600 dark:text-slate-400">
            {nots.we_speak_for_nobody}
          </p>

          {/* Honest at a glance: the proportions, before any row is read. */}
          <div className="mt-7">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              {barCounts
                .filter((b) => b.n > 0)
                .map((b) => (
                  <div
                    key={b.c}
                    className={styleFor(b.c).bar}
                    style={{ width: `${(b.n / ROWS.length) * 100}%` }}
                    title={`${styleFor(b.c).label}: ${b.n} of ${ROWS.length}`}
                  />
                ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {barCounts.map((b) => (
                <li key={b.c} className="flex items-center gap-2">
                  <ClassChip c={b.c} />
                  <span className="text-[13px] text-slate-600 dark:text-slate-400">
                    {b.n}
                    <span className="sr-only"> organisations in state {styleFor(b.c).label}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              {registry.totals.organisations_whose_own_record_we_read_and_found_the_statement} of the{" "}
              {registry.totals.organisations_named_in_the_founding_announcement} organisations named in the
              founding vendor&rsquo;s announcement have published a statement of their own that we could read.
              The rest are on this map because <em>somebody else</em> named them, and that difference is the
              point of it. These five counts and the four specification states count different things over
              different populations and are never added together.
            </p>
          </div>
        </div>
      </section>

      {/* ── What this is not ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto grid max-w-4xl gap-4 px-4 py-9 sm:grid-cols-2 sm:px-6">
          {[
            ["Why there is no roster here", nots.why],
            ["No logos, no marks", nots.no_logos],
            ["The alliance has not seen this", nots.not_reviewed_by_the_alliance],
            [
              "We are a member, and it changes nothing",
              "Council of AI is a member of the Open Secure AI Alliance and of the Linux Foundation, both since 21 September 2026, on private evidence: the confirmations are in our mailbox and neither body names us publicly. Membership is not endorsement — not theirs of us, and not ours of anyone on this page. Our own row sits in NOT_FOUND, by the same rule as everybody else's.",
            ],
          ].map(([h, b]) => (
            <div
              key={h}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="font-mono text-[10px] uppercase tracking-[2px] text-slate-500 dark:text-slate-400">
                {h}
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What the alliance's own surface returned ───────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-9 sm:px-6">
          <h2 className="text-lg font-black tracking-tight">What the alliance&rsquo;s own site returned</h2>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
            {probe.note} Of the {registry.totals.organisations_named_in_the_founding_announcement}{" "}
            organisations named in the founding announcement, its home page named{" "}
            {probe.organisations_named.length}
            {probe.organisations_named.length ? ` — ${probe.organisations_named.join(", ")}` : ""}.{" "}
            {probe.organisations_named_note}
          </p>
          <div className="mt-4 overflow-x-auto">
            {/* 320px, not 420: at a 390px viewport the third column was clipped off the end of
                the scroll container and a reader saw two of three columns with no hint of a third. */}
            <table className="w-full min-w-[320px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-300 font-mono text-[10px] uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th scope="col" className="py-2 pr-3">URL</th>
                  <th scope="col" className="py-2 pr-3">HTTP</th>
                  <th scope="col" className="py-2 whitespace-nowrap">Chars read</th>
                </tr>
              </thead>
              <tbody>
                {probe.read.map((p) => (
                  <tr key={p.url} className="border-b border-slate-200 dark:border-slate-800">
                    <td className="py-2 pr-3 font-mono text-[11px] break-all">
                      <Ext href={p.url}>{p.url}</Ext>
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11px]">{p.http_status ?? "—"}</td>
                    <td className="py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {typeof p.extracted_chars === "number"
                        ? p.extracted_chars.toLocaleString("en-GB")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── The published counts disagree ──────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-4xl px-4 py-9 sm:px-6">
          <h2 className="text-lg font-black tracking-tight">
            How many organisations are in it? The published answers differ.
          </h2>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
            {registry.published_counts_of_the_membership.note}
          </p>
          <ul className="mt-4 space-y-3">
            <li className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="font-mono text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                The alliance itself
              </p>
              <p className="mt-1 text-[13px] text-slate-700 dark:text-slate-300">
                {registry.published_counts_of_the_membership.the_alliance_itself}
              </p>
            </li>
            {registry.published_counts_of_the_membership.as_published_elsewhere.map((p) => (
              <li key={p.url} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="font-mono text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {p.publisher}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
                  &ldquo;{p.quote}&rdquo;
                </p>
                <p className="mt-1 break-all font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  <Ext href={p.url}>{p.url}</Ext>
                </p>
              </li>
            ))}
            <li className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950">
              <p className="font-mono text-[10px] uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                Our own count
              </p>
              <p className="mt-1 text-[13px] text-slate-700 dark:text-slate-200">
                {registry.published_counts_of_the_membership.our_own_count_of_the_founding_announcement.n} —{" "}
                {registry.published_counts_of_the_membership.our_own_count_of_the_founding_announcement.basis}. We take no view
                on which of the numbers above is right. They are other people&rsquo;s counts of other
                people&rsquo;s membership, and we publish them because a map that printed one number would
                hide that the published numbers differ.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* ── The map ────────────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-lg font-black tracking-tight">
            The map · {rendered.length} of {ROWS.length}
          </h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["Group", groupBy, setGroupBy as (v: string) => void, [["class", "By state"], ["layer", "By layer of the stack"]]],
                ["Sort", sortBy, setSortBy as (v: string) => void, [["announced", "As announced"], ["name", "A–Z"]]],
              ] as const
            ).map(([label, value, set, opts]) => (
              <div key={label} className="flex items-center gap-1">
                <span className="sr-only">{label}</span>
                {opts.map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set(v)}
                    aria-pressed={value === v}
                    className={`min-h-[36px] rounded-full px-3 font-mono text-[11px] ring-1 transition ${
                      value === v
                        ? "bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white"
                        : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["ALL", ...CLASSES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setOnly(c)}
              aria-pressed={only === c}
              className={`min-h-[36px] rounded-full px-3 font-mono text-[11px] ring-1 transition ${
                only === c
                  ? "bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white"
                  : "bg-white text-slate-600 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              {c === "ALL" ? `All ${ROWS.length}` : `${c} ${ROWS.filter((r) => r.evidence_class === c).length}`}
            </button>
          ))}
        </div>

        {/* Structurally unreachable: rows are grouped by their own key and unknown keys are
            appended. Rendered anyway — if this page ever drops a row, it says so on the page. */}
        {dropped.length > 0 ? (
          <p className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 font-mono text-[12px] text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
            RENDER DEFECT: {dropped.length} row(s) in the registry are not shown —{" "}
            {dropped.map((r) => r.name_as_printed).join(", ")}. The file, not this page, is the record.
          </p>
        ) : null}

        {groups.map((g) => (
          <div key={g.k} className="mt-8">
            <div className="flex flex-wrap items-baseline gap-3 border-b-2 border-slate-900 pb-2 dark:border-slate-100">
              {groupBy === "class" ? <ClassChip c={g.k} /> : null}
              <h3 className="text-[15px] font-black tracking-tight">
                {groupBy === "class" ? styleFor(g.k).label : g.k === "NOT_STATED" ? "No contribution named in any source we read" : g.k}
              </h3>
              <span className="font-mono text-[12px] text-slate-500 dark:text-slate-400">{g.rows.length}</span>
            </div>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              {groupBy === "class"
                ? styleFor(g.k).means
                : g.k === "NOT_STATED"
                  ? "No source we read names a contribution by these organisations to the alliance, so no layer is assigned. That is a statement about the documents we read, not about the organisations."
                  : "The layer names are the alliance's own, from the “Beyond the Model” section of its home page. Placing an organisation at a layer is our reading of the quoted sentence, not the alliance's assignment and not the organisation's — the sentence is printed beside each row so a reader can disagree."}
            </p>
            <ul className="mt-2">
              {g.rows.map((r) => (
                <OrgRow key={r.name_as_printed} r={r} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* ── Method, reply, machine-readable ─────────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
          <div>
            <h2 className="text-lg font-black tracking-tight">How each row was decided</h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              {registry.claims.find((c) => c.claim_id === "OSAIA-2")?.method?.description}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">How often it is re-read</h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              {registry.re_read}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">What this does not prove</h2>
            <ul className="mt-2 max-w-3xl list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              {registry.does_not_prove.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">If a row here is wrong about you</h2>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
              {registry.right_of_reply}
            </p>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">The same bytes, machine-readable</h2>
            <ul className="mt-2 space-y-1 font-mono text-[12px]">
              <li>
                <Ext href="/claims/osaia-membership-2026-09-23.json">
                  /claims/osaia-membership-2026-09-23.json
                </Ext>{" "}
                <span className="text-slate-500 dark:text-slate-400">— the registry this page renders</span>
              </li>
              <li>
                <Ext href="/claims/osaia-membership-2026-09-23.json.ots">
                  /claims/osaia-membership-2026-09-23.json.ots
                </Ext>{" "}
                <span className="text-slate-500 dark:text-slate-400">— {registry.timestamp_state}</span>
              </li>
              <li>
                <Ext href="/api/claims/register">/api/claims/register</Ext>{" "}
                <span className="text-slate-500 dark:text-slate-400">
                  — the register of every subject we maintain claims on
                </span>
              </li>
              <li>
                <Link
                  className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 dark:text-emerald-300 dark:decoration-emerald-700"
                  href="/spec/claim-maintenance/v0.1/"
                >
                  /spec/claim-maintenance/v0.1/
                </Link>{" "}
                <span className="text-slate-500 dark:text-slate-400">
                  — the specification this obeys, CC0
                </span>
              </li>
            </ul>
            <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
              Merkle root {registry.merkle.root.slice(0, 16)}… over {registry.merkle.n_leaves} artifacts,{" "}
              {registry.merkle.algorithm}. {registry.merkle.not_the_public_card_root}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
