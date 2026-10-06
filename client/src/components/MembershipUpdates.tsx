/**
 * MembershipUpdates — the dated record of what changed in the memberships manifest, read from
 * the committed artifact public/interop/memberships-updates.json (schema
 * csoai.memberships-updates/0.1).
 *
 * WHY A LOG AND NOT A NEWS PAGE. /memberships shows the current state of every row. A table that
 * only ever shows its current state cannot be audited: a row that quietly changed standing, or
 * moved its evidence, leaves no trace. This component is the trace. Every entry is dated, names
 * the manifest row it touches (or null when it touches the manifest as a whole), and carries the
 * same kind of evidence the rows carry — a public URL, a dated mailbox record, or the command
 * that produced the result.
 *
 * Nothing here is a count and nothing here is typed. The component renders whatever the artifact
 * holds, so an entry that is removed from the artifact disappears from the page, and an entry
 * cannot be added to the page without being added to the committed bytes first.
 *
 * An update is a record of a change, not an announcement of an achievement: nothing in this list
 * upgrades a row. The rows say what they prove.
 */
import { Link } from "wouter";
import updates from "../../../public/interop/memberships-updates.json";
import { MEMBERSHIPS } from "./MembershipStrip";

export type UpdateKind = "added" | "corrected" | "verified" | "recorded";
export type UpdateEvidenceKind = "public_url" | "private_email" | "account_page" | "command";

export interface MembershipUpdate {
  date: string;
  kind: UpdateKind;
  row: string | null;
  headline: string;
  detail: string;
  evidence: string;
  evidence_kind: UpdateEvidenceKind;
}

export interface MembershipUpdatesManifest {
  schema: string;
  as_of: string;
  signed: boolean;
  honesty_line: string;
  kinds: { id: UpdateKind; label: string }[];
  entries: MembershipUpdate[];
}

export const UPDATES = updates as unknown as MembershipUpdatesManifest;

/** Verbatim. The artifact carries the same sentence; the test holds the two equal. */
export const UPDATES_HONESTY_LINE =
  "An update is a record of a change, not an announcement of an achievement. Nothing here upgrades a row; the rows say what they prove.";

export const UPDATE_KIND_LABEL: Record<UpdateKind, string> = {
  added: "Row added",
  corrected: "Row corrected",
  verified: "Evidence re-checked",
  recorded: "Recorded",
};

/** Newest first, then stable by the order the artifact committed them within a date. */
export function orderedUpdates(u: MembershipUpdatesManifest = UPDATES): MembershipUpdate[] {
  return u.entries.map((e, i) => ({ e, i })).sort((a, b) => (a.e.date === b.e.date ? a.i - b.i : a.e.date < b.e.date ? 1 : -1)).map((x) => x.e);
}

/** Every entry that names a row must name one the manifest actually has. The test holds this. */
export function danglingRowRefs(u: MembershipUpdatesManifest = UPDATES, ids?: Set<string>): string[] {
  const known = ids ?? new Set(MEMBERSHIPS.rows.map((r) => r.id));
  return u.entries.filter((e) => e.row !== null && !known.has(e.row)).map((e) => e.row as string);
}

function Evidence({ update }: { update: MembershipUpdate }) {
  if (update.evidence_kind === "public_url") {
    return (
      <a href={update.evidence} rel="noopener noreferrer" className="break-all text-emerald-800 underline underline-offset-4">
        {update.evidence}
      </a>
    );
  }
  if (update.evidence_kind === "command") {
    return (
      <span>
        <span className="rounded bg-slate-100 px-1 text-xs text-slate-700">command</span>{" "}
        <code className="text-slate-800">{update.evidence}</code>
      </span>
    );
  }
  return (
    <span>
      <span className="rounded bg-slate-100 px-1 text-xs text-slate-700">
        {update.evidence_kind === "account_page" ? "private account evidence" : "private evidence"}
      </span>{" "}
      <span className="text-slate-700">{update.evidence}</span>
    </span>
  );
}

export default function MembershipUpdates() {
  const entries = orderedUpdates();
  if (entries.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16" aria-labelledby="memberships-updates-h" data-testid="membership-updates">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="memberships-updates-h" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          What changed, and when
        </h2>
        <a className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/interop/memberships-updates.json">
          /interop/memberships-updates.json
        </a>
      </div>
      <p className="mt-3 max-w-3xl text-sm text-slate-700">{UPDATES_HONESTY_LINE}</p>

      <ol className="mt-6 list-none space-y-4 p-0">
        {entries.map((u, i) => (
          <li key={`${u.date}-${i}`} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <time dateTime={u.date} className="font-semibold text-slate-900">
                {u.date}
              </time>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-slate-700">
                {UPDATE_KIND_LABEL[u.kind]}
              </span>
              {u.row && (
                // The separator travels with the link. Left loose, a long row id wraps to the
                // next line at 390px and strands the dot at the end of the line above.
                <span className="inline-flex items-center gap-x-2">
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <Link href={`/memberships#${u.row}`} className="text-emerald-800 underline underline-offset-4">
                    {u.row}
                  </Link>
                </span>
              )}
            </div>
            <h3 className="mt-2 text-base font-bold leading-snug text-slate-900">{u.headline}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{u.detail}</p>
            <p className="mt-2 text-xs text-slate-600">
              <Evidence update={u} />
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-5 max-w-3xl text-xs text-slate-600">
        This log is the committed artifact rendered, as of <time dateTime={UPDATES.as_of}>{UPDATES.as_of}</time>, unsigned
        and saying so. An entry cannot appear here without being in the bytes first, and every entry that names a row
        names one the manifest actually has — <code>scripts/memberships-check.mjs</code> fails when it does not.
      </p>
    </section>
  );
}
