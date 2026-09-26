/**
 * MembershipStrip — where Council of AI takes part, read from the committed manifest
 * public/interop/memberships.json (schema csoai.memberships/0.1).
 *
 * WHY A MANIFEST AND NOT A LOGO ROW. The owner asked for "badges" of the bodies we take part
 * in. A row of third-party logos would say "member" with no evidence and no date, and it would
 * keep saying it after a roster dropped us. So every pill here is text — organisation, standing,
 * date — and every pill is a link to the page that proves it (or, for rows whose only evidence is
 * a dated mailbox record, to the row on /memberships that says so). No third-party brand assets
 * are shipped. scripts/memberships-check.mjs re-fetches every public evidence URL and fails when
 * one stops naming us, so the strip cannot outlive its evidence quietly.
 *
 * The strip is a static import of committed data, not a live counter: the numbers that must be
 * read live (board totals, settlements) are not on it, and it prints no count of anything.
 *
 * Variants: `home` (grouped, wraps) for the routed home page; `footer` (one compact line ending
 * "Where we take part →") for the site footer.
 */
import { Link } from "wouter";
import manifest from "../../../public/interop/memberships.json";

export type MembershipKind = "member" | "participant" | "contributor" | "listed" | "registered" | "filed" | "applied";
export type MembershipState = "VERIFIED" | "UNVERIFIED" | "PENDING";
export type EvidenceKind = "public_url" | "private_email" | "account_page";

export interface MembershipRow {
  id: string;
  org: string;
  short: string;
  group: string;
  kind: MembershipKind;
  since: string | null;
  since_basis?: string;
  evidence: string;
  evidence_kind: EvidenceKind;
  public_evidence: boolean;
  what_it_proves: string;
  what_it_does_not_prove: string;
  state: MembershipState;
  verified_on?: string;
  deadline?: string;
  question?: string;
  answer?: string;
}

export interface MembershipsManifest {
  schema: string;
  as_of: string;
  signed: boolean;
  honesty_line: string;
  groups: { id: string; label: string }[];
  rows: MembershipRow[];
  /** Bodies a reader might expect in the table and will not find, each with the reason. */
  excluded_note?: string;
  excluded?: { org: string; why: string; reason?: string; evidence?: string }[];
}

export const MEMBERSHIPS = manifest as unknown as MembershipsManifest;

/** Verbatim. The manifest carries the same sentence; the test holds the two equal. */
export const HONESTY_LINE = "Participation is not endorsement, and a listing is not adoption. Every entry links to its evidence.";

export const KIND_LABEL: Record<MembershipKind, string> = {
  member: "member",
  participant: "participant",
  contributor: "contributor",
  listed: "listed",
  registered: "registered",
  filed: "filed",
  applied: "applied",
};

/** Where a pill sends the reader: the public evidence, or the manifest row that names the private record. */
export function evidenceHref(row: MembershipRow): string {
  return row.evidence_kind === "public_url" ? row.evidence : `/memberships#${row.id}`;
}

/**
 * badgeRows — the compact home row: one pill per body the owner asked to see on the first screen
 * (OSAIA, C2PA, DIF), plus W3C and IETF aggregated into one pill each, plus one
 * pill per remaining group so the hero shows the whole footprint rather than only the standards
 * bodies. Derived from the manifest by predicate, so a body that leaves the manifest leaves the
 * row, and every count is computed from the rows — none is typed.
 *
 * Filings are deliberately NOT given a hero pill. A consultation response is a submission, and a
 * submission beside a row of memberships reads as a standing. It stays on /memberships, where the
 * row says what it is.
 */
export function badgeRows(m: MembershipsManifest = MEMBERSHIPS): { label: string; kind: MembershipKind; href: string; count?: number }[] {
  const std = m.rows.filter((r) => r.group === "standards");
  const one = (re: RegExp, label: string) => {
    const r = std.find((x) => re.test(x.org));
    return r ? [{ label, kind: r.kind, href: evidenceHref(r) }] : [];
  };
  const w3c = std.filter((x) => /^W3C /.test(x.org));
  const ietf = std.filter((x) => /^IETF /.test(x.org));
  /** One pill for a whole group, labelled by the group and standing by its commonest kind. */
  const group = (id: string, label: string) => {
    const rows = m.rows.filter((r) => r.group === id);
    if (!rows.length) return [];
    const tally = new Map<MembershipKind, number>();
    for (const r of rows) tally.set(r.kind, (tally.get(r.kind) ?? 0) + 1);
    const kind = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return [{ label, kind, href: `/memberships#${id}`, count: rows.length }];
  };
  return [
    ...one(/^Open Secure AI Alliance/, "Open Secure AI Alliance"),
    ...one(/^C2PA/, "C2PA"),
    ...one(/^Decentralized Identity Foundation/, "DIF"),
    ...(w3c.length ? [{ label: "W3C Community Groups", kind: w3c[0].kind, href: "/memberships#standards", count: w3c.length }] : []),
    ...(ietf.length ? [{ label: "IETF", kind: "participant" as MembershipKind, href: "/memberships#standards", count: ietf.length }] : []),
    // Every other declared group gets one pill, derived. A group added to the manifest appears
    // here without anyone editing this file; `standards` is already covered by the named pills
    // above, and `filings` is excluded on purpose (see the note on this function).
    ...m.groups.filter((g) => g.id !== "standards" && g.id !== "filings").flatMap((g) => group(g.id, g.label)),
  ];
}

/** True when a pill's href leaves the site. wouter's Link pushes history and would break these. */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function groupedRows(m: MembershipsManifest = MEMBERSHIPS): { id: string; label: string; rows: MembershipRow[] }[] {
  return m.groups
    .map((g) => ({ ...g, rows: m.rows.filter((r) => r.group === g.id) }))
    .filter((g) => g.rows.length > 0);
}

function Pill({ row }: { row: MembershipRow }) {
  const href = evidenceHref(row);
  const external = row.evidence_kind === "public_url";
  const cls =
    "inline-flex flex-wrap items-center gap-x-1.5 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-800 transition hover:border-emerald-600/50 hover:bg-emerald-50";
  const body = (
    <>
      <span className="font-semibold">{row.short}</span>
      <span aria-hidden="true" className="text-slate-400">·</span>
      <span>{KIND_LABEL[row.kind]}</span>
      {row.since && (
        <>
          <span aria-hidden="true" className="text-slate-400">·</span>
          <time dateTime={row.since}>{row.since}</time>
        </>
      )}
      {row.state === "PENDING" && (
        <span className="rounded bg-amber-100 px-1 font-semibold uppercase tracking-wide text-amber-900" title="Not yet filed or not yet granted. Claims nothing.">
          pending
        </span>
      )}
      {!row.public_evidence && (
        <span className="rounded bg-slate-100 px-1 text-slate-600" title="The only evidence is a dated mailbox record; the row on /memberships names it.">
          private evidence
        </span>
      )}
    </>
  );
  return external ? (
    <a href={href} className={cls} rel="noopener noreferrer" title={`${row.org} — ${row.what_it_proves}`}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls} title={`${row.org} — ${row.what_it_proves}`}>
      {body}
    </Link>
  );
}

export default function MembershipStrip({ variant = "home" }: { variant?: "home" | "footer" | "badges" }) {
  const groups = groupedRows();

  if (variant === "badges") {
    const badges = badgeRows();
    const pill =
      "inline-flex max-w-full items-center gap-x-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1 text-foreground/80 transition hover:border-foreground/40 hover:text-foreground";
    return (
      <div data-testid="membership-strip-badges" className="mt-4">
        <ul className="flex list-none flex-wrap items-center justify-center gap-1.5 p-0 text-[12px] sm:gap-2">
          {badges.map((b) => {
            const label = (
              <>
                <span className="truncate font-medium">{b.label}</span>
                <span aria-hidden="true" className="text-foreground/40">·</span>
                <span className="text-foreground/70">{KIND_LABEL[b.kind]}</span>
                {b.count && b.count > 1 ? <span className="text-foreground/50">· {b.count}</span> : null}
              </>
            );
            return (
              <li key={b.label} className="max-w-full">
                {isExternalHref(b.href) ? (
                  <a href={b.href} rel="noopener noreferrer" className={pill}>
                    {label}
                  </a>
                ) : (
                  <Link href={b.href} className={pill}>
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
          <li>
            <Link href="/memberships" className="inline-block px-2 py-1 underline-offset-2 hover:underline">
              Where we take part →
            </Link>
          </li>
        </ul>
        <p className="mt-2 px-4 text-center text-[11px] leading-snug text-muted-foreground" data-testid="membership-strip-badges-honesty">
          {HONESTY_LINE}
        </p>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div data-testid="membership-strip-footer" className="border-t border-border pt-6 mb-6 text-center">
        <p className="text-muted-foreground text-xs">
          <Link href="/memberships" className="font-semibold text-foreground hover:text-primary hover:underline">
            Where we take part →
          </Link>{" "}
          {groups.map((g, gi) => (
            <span key={g.id}>
              {gi > 0 && <span aria-hidden="true"> · </span>}
              <span className="uppercase tracking-wider">{g.label}:</span>{" "}
              {g.rows.map((r, ri) => (
                <span key={r.id}>
                  {ri > 0 && ", "}
                  {r.evidence_kind === "public_url" ? (
                    <a href={r.evidence} rel="noopener noreferrer" className="hover:text-primary hover:underline" title={`${r.org} — ${KIND_LABEL[r.kind]}${r.since ? ` since ${r.since}` : ""}`}>
                      {r.short}
                    </a>
                  ) : (
                    <Link href={`/memberships#${r.id}`} className="hover:text-primary hover:underline" title={`${r.org} — ${KIND_LABEL[r.kind]}${r.since ? ` since ${r.since}` : ""} (private evidence)`}>
                      {r.short}
                    </Link>
                  )}
                  {r.state === "PENDING" ? " (pending)" : ""}
                </span>
              ))}
            </span>
          ))}
        </p>
        <p className="text-muted-foreground text-xs mt-2">{HONESTY_LINE}</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="memberships-strip-h" data-testid="membership-strip" className="mx-auto max-w-6xl px-4 pt-10 sm:pt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="memberships-strip-h" className="text-sm font-semibold uppercase tracking-wider text-slate-600">
          Where we take part
        </h2>
        <Link href="/memberships" className="text-sm font-semibold text-emerald-800 underline underline-offset-4">
          Every entry, its evidence, and what it does not mean →
        </Link>
      </div>
      {groups.map((g) => (
        <div key={g.id} className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">{g.label}</h3>
          <ul className="mt-2 flex list-none flex-wrap gap-2 p-0">
            {g.rows.map((r) => (
              <li key={r.id}>
                <Pill row={r} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="mt-4 text-xs text-slate-600" data-testid="membership-strip-honesty">
        {HONESTY_LINE}{" "}
        <span className="text-slate-600">Manifest as of <time dateTime={MEMBERSHIPS.as_of}>{MEMBERSHIPS.as_of}</time>, unsigned; re-checked by scripts/memberships-check.mjs.</span>
      </p>
    </section>
  );
}
