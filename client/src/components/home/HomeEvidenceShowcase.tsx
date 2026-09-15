import { ArrowUpRight, BookOpen, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import reading from "@/data/recommended-reading.json";
import { isWithdrawnPath } from "@/lib/publicationState";

/**
 * HomeEvidenceShowcase — participation records and recommended reading.
 *
 * READING IS DRIVEN BY A REVIEWED MANIFEST, NOT BY URL EXISTENCE. On 2026-09-15
 * this module promoted nine "field notes" whose every link resolved to the
 * withdrawal notice (App.tsx routes /blog and /blog/:slug to ContentReviewNotice).
 * A 200 withdrawal notice is not an article. The list now comes from
 * client/src/data/recommended-reading.json; a "published" entry is promoted only
 * if publicationState says it is not withdrawn, and a "withdrawn" entry renders
 * as a labelled withdrawal record. scripts/content-promise-gate.mjs fails the
 * build if the manifest and App.tsx disagree or if a promoted link is withdrawn.
 *
 * PARTICIPATION CARDS NAME THEIR CATEGORY AND THEIR RECORD. Membership,
 * technical contribution, framework mapping, public hosting and independent
 * test are visibly different things. A card says whether its record is public,
 * self-published or a private confirmation — a self-published API description
 * is never shown as independent evidence.
 */

export type ReadingState = "published" | "withdrawn";

export interface ReadingEntry {
  href: string;
  state: ReadingState;
  title: string;
  excerpt: string;
  topic: string;
}

const ENTRIES = reading.entries as ReadingEntry[];

/** Ready reading only: reviewed, routed to its own page, not withdrawn. */
export function featuredEvidencePosts(): ReadingEntry[] {
  return ENTRIES.filter((e) => e.state === "published" && !isWithdrawnPath(e.href));
}

/** Withdrawal records, shown as such — never as ready reading. */
export function withdrawnReadingRecords(): ReadingEntry[] {
  return ENTRIES.filter((e) => e.state === "withdrawn");
}

export type RecordCategory =
  | "Membership"
  | "Technical contribution"
  | "Framework mapping"
  | "Public hosting"
  | "Independent test"
  | "Self-published description";

export type RecordProof =
  | { kind: "public"; note: string }
  | { kind: "self-published"; note: string }
  | { kind: "private"; note: string };

export interface PublicRecord {
  name: string;
  category: RecordCategory;
  status: string;
  detail: string;
  href: string;
  /** What the link actually opens, in the reader's words. */
  linkLabel: string;
  proof: RecordProof;
}

export const PUBLIC_RECORDS: readonly PublicRecord[] = [
  {
    name: "EU AI Pact",
    category: "Membership",
    status: "Pillar I community participant",
    detail: "Direct European Commission invitation received 20 Aug 2026. Participation is not endorsement or certification.",
    href: "https://digital-strategy.ec.europa.eu/en/policies/ai-pact",
    linkLabel: "Programme page (not our entry)",
    proof: { kind: "private", note: "The invitation email is held privately; no public participant entry is linked here." },
  },
  {
    name: "IETF",
    category: "Technical contribution",
    status: "Public technical contributor",
    detail: "Public discussion across AUDIT, AgentProto and SCITT; contributions remain proposals until working-group consensus.",
    href: "https://datatracker.ietf.org/",
    linkLabel: "Datatracker (organisation page, not a thread)",
    proof: { kind: "public", note: "Mailing-list posts are public; the exact thread links are not yet catalogued on this card." },
  },
  {
    name: "C2PA",
    category: "Membership",
    status: "Contributor member",
    detail: "Contributor membership approved by the C2PA Steering Committee in August 2026; conformance is planned, not shipped. No endorsement is implied.",
    href: "/claims-register",
    linkLabel: "Our claims register, CR-012 (self-published record)",
    proof: { kind: "private", note: "The approval is held privately; the public record is our own claims-register entry, which says conformance is planned." },
  },
  {
    name: "Decentralized Identity Foundation",
    category: "Membership",
    status: "Member",
    detail: "Membership onboarding confirmed in August 2026, with access to DIF working groups and public technical work.",
    href: "https://identity.foundation/",
    linkLabel: "Organisation page (not our entry)",
    proof: { kind: "private", note: "The onboarding confirmation is held privately; no public member entry is linked here." },
  },
  {
    name: "LOT Network",
    category: "Membership",
    status: "Member",
    detail: "CSOAI Ltd joined the defensive patent network in August 2026.",
    href: "https://lotnet.com/",
    linkLabel: "Organisation page (not our entry)",
    proof: { kind: "private", note: "The membership confirmation is held privately; no public member entry is linked here." },
  },
  {
    name: "Open Invention Network",
    category: "Membership",
    status: "Community member",
    detail: "Membership confirmation received in August 2026 for the open-source patent non-aggression community.",
    href: "https://openinventionnetwork.com/",
    linkLabel: "Organisation page (not our entry)",
    proof: { kind: "private", note: "The confirmation is held privately; no public member entry is linked here." },
  },
  {
    name: "x402 List",
    category: "Independent test",
    status: "Independently monitored listing",
    detail: "A third-party directory runs its own protocol checks against our x402 doors and publishes the result on its own site.",
    href: "https://www.x402-list.com/services/council-of-ai",
    linkLabel: "Our listing on x402-list.com (their record)",
    proof: { kind: "public", note: "The check count and uptime figures are theirs; read them there, they are not typed here." },
  },
  {
    name: "OpenAPI description",
    category: "Self-published description",
    status: "Self-published API description",
    detail: "Our own OpenAPI document for the public and x402 endpoints. Directory confirmations are not linked from this card, so it is not independent evidence of anything.",
    href: "https://councilof.ai/openapi.json",
    linkLabel: "openapi.json (ours)",
    proof: { kind: "self-published", note: "Written and served by us. Self-published metadata is labelled as such." },
  },
  {
    name: "Open infrastructure",
    category: "Public hosting",
    status: "Source and datasets public",
    detail: "The site source is on GitHub and the frozen banks and hub cards are on Hugging Face under the csoai organisation.",
    href: "https://github.com/CSOAI-ORG/councilof-ai",
    linkLabel: "GitHub repository (the exact source)",
    proof: { kind: "public", note: "Hosting is public; hosting is not adoption, review or endorsement." },
  },
] as const;

const PROOF_LABEL: Record<RecordProof["kind"], string> = {
  public: "Public record",
  "self-published": "Self-published",
  private: "Private confirmation",
};

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function HomeEvidenceShowcase() {
  const posts = featuredEvidencePosts();
  const withdrawn = withdrawnReadingRecords();

  return (
    <>
      <section aria-labelledby="public-records-h" className="mt-20 sm:mt-24" data-testid="home-public-records">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Public record</p>
          <h2 id="public-records-h" className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Public contributions, memberships and independent checks
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Each entry names its exact category, scope, date and supporting record. Hosted code and
            self-published descriptions are shown separately from independent checks. None of these
            claims approval, partnership, certification or regulatory status.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_RECORDS.map((record) => {
            const id = `record-${slug(record.name)}`;
            const external = /^https?:\/\//.test(record.href);
            return (
              <article key={record.name} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" data-category={record.category} data-proof={record.proof.kind}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{record.category}</p>
                    <p id={id} className="mt-1 font-black text-slate-900">{record.name}</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-700">{record.status}</p>
                  </div>
                  {record.proof.kind === "public" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{record.detail}</p>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  <span className="font-semibold text-slate-700">{PROOF_LABEL[record.proof.kind]}.</span> {record.proof.note}
                </p>
                {external ? (
                  <a
                    href={record.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-labelledby={`${id}-link ${id}`}
                    className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-emerald-800 underline underline-offset-4"
                  >
                    <span id={`${id}-link`}>{record.linkLabel}</span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <Link
                    href={record.href}
                    aria-labelledby={`${id}-link ${id}`}
                    className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-emerald-800 underline underline-offset-4"
                  >
                    <span id={`${id}-link`}>{record.linkLabel}</span>
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="field-notes-h" className="mt-20 sm:mt-24" data-testid="home-featured-posts">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Reviewed reading</p>
            <h2 id="field-notes-h" className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Read the method behind the board.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Method, corrections, independence and verification — each link opens the reviewed page
              it names. Nothing here is promoted on the strength of a URL existing.
            </p>
          </div>
          <Link href="/methodology" className="inline-flex min-h-11 items-center gap-2 font-bold text-emerald-800 hover:text-emerald-950">
            Methodology <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => {
            const id = `reading-${slug(post.href)}`;
            return (
              <Link
                key={post.href}
                href={post.href}
                aria-labelledby={id}
                className="group flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <BookOpen className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                </div>
                <h3 id={id} className="mt-5 text-xl font-black leading-tight text-slate-900 group-hover:text-emerald-800">{post.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs font-semibold text-slate-500">
                  <span>{post.topic}</span>
                  <span>Open page</span>
                </div>
              </Link>
            );
          })}
        </div>

        {withdrawn.length ? (
          <aside
            aria-labelledby="withdrawn-reading-h"
            data-testid="home-withdrawn-reading"
            data-publication-state="withdrawn"
            className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-5"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900">Withdrawal record</p>
            <h3 id="withdrawn-reading-h" className="mt-1 text-base font-black text-slate-900">
              This material is under review
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {withdrawn.map((w) => (
                <li key={w.href}>
                  <span className="font-semibold">{w.title}</span> — the previous version is withdrawn.{" "}
                  <Link href={w.href} className="font-semibold text-amber-900 underline underline-offset-4">
                    Read the withdrawal record
                  </Link>
                  , or the currently reviewed explanation at{" "}
                  <Link href="/methodology" className="font-semibold text-amber-900 underline underline-offset-4">
                    /methodology
                  </Link>
                  .
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </section>
    </>
  );
}
