/**
 * Business standing and public-record work, with the relationship spelled out.
 *
 * A regulator is not a member body, a source is not a client, and a draft is not
 * a filing. Keep these groups separate: the names are useful only when a reader
 * can tell exactly what each link proves.
 */

export interface AuthorityLink {
  label: string;
  relationship: string;
  href: string;
  title: string;
}

export const AUTHORITY_GROUPS: { title: string; links: AuthorityLink[] }[] = [
  {
    title: "Registered business",
    links: [
      {
        label: "Companies House",
        relationship: "CSOAI LTD · 16939677",
        href: "https://find-and-update.company-information.service.gov.uk/company/16939677",
        title: "CSOAI LTD on the UK Companies House register",
      },
    ],
  },
  {
    title: "Memberships & standards",
    links: [
      {
        label: "C2PA",
        relationship: "contributor member",
        href: "https://c2pa.org/membership/",
        title: "C2PA membership record; participation is not endorsement",
      },
      {
        label: "Open Invention Network",
        relationship: "member and licensee",
        href: "https://openinventionnetwork.com/community-of-licensees/",
        title: "Open Invention Network community of licensees",
      },
      {
        label: "LOT Network",
        relationship: "member",
        href: "https://lotnet.com/members/?dir=1&name_directory_startswith=C",
        title: "LOT Network public member directory",
      },
      {
        label: "W3C Community Groups",
        relationship: "participant, not W3C Member",
        href: "/memberships/#standards",
        title: "Our W3C Community Group participation records and their limits",
      },
      {
        label: "IETF Datatracker",
        relationship: "Internet-Draft",
        href: "https://datatracker.ietf.org/doc/draft-templeman-scitt-framing-space/",
        title: "draft-templeman-scitt-framing-space on the IETF Datatracker",
      },
    ],
  },
  {
    title: "Independent & public listings",
    links: [
      {
        label: "OpenSSF Best Practices",
        relationship: "registered project 14391",
        href: "https://www.bestpractices.dev/en/projects/14391",
        title: "Council of AI project entry; registration is not a passing badge",
      },
      {
        label: "MCP Registry",
        relationship: "ai.councilof/gspc listed",
        href: "https://registry.modelcontextprotocol.io/v0/servers?search=ai.councilof",
        title: "Council of AI server in the public MCP Registry",
      },
      {
        label: "SAILResearch, Queen’s University",
        relationship: "independent leaderboard listing",
        href: "https://github.com/SAILResearch/awesome-ai-leaderboard#safety",
        title: "GovBench and GSPC listed in the Safety section of Awesome AI Leaderboard",
      },
    ],
  },
  {
    title: "Official records in our work",
    links: [
      {
        label: "SEC EDGAR",
        relationship: "official public filings mirrored",
        href: "/interop/rwa-reconciliation-2026-09/mirrors/sec-submissions-cik1786958.json.meta.json",
        title: "Dated SEC source URL, HTTP result, byte count and SHA-256 for our public mirror",
      },
      {
        label: "FDIC",
        relationship: "consultation research · no submission claimed",
        href: "https://www.fdic.gov/news/financial-institution-letters/2026/genius-act-proposed-reporting-forms-and-instructions-fdic",
        title: "The official FDIC consultation we researched; our document remained a draft and was not submitted",
      },
    ],
  },
];

export default function AuthoritySignals() {
  return (
    <section
      aria-labelledby="authority-signals-heading"
      className="mb-6 border-t border-border pt-6"
      data-testid="authority-signals"
    >
      <h2 id="authority-signals-heading" className="mb-2 text-center text-xs uppercase tracking-wider text-muted-foreground">
        Business standing & public-record work
      </h2>
      <p className="mx-auto mb-5 max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
        Check the legal entity, our participation and the public-record work separately. Each link names the relationship it evidences.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {AUTHORITY_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-xs font-semibold text-foreground">{group.title}</h3>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    title={link.title}
                    {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-xs leading-relaxed text-muted-foreground transition-colors hover:text-primary"
                  >
                    <span className="font-semibold text-foreground">{link.label}</span>
                    <span aria-hidden="true"> · </span>
                    <span>{link.relationship}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-5 max-w-4xl text-center text-xs leading-relaxed text-muted-foreground">
        Participation is not endorsement, and a listing is not adoption. SEC links are public-data mirrors.
        The FDIC link is a consultation we researched; our FDIC and SEC consultation documents remained drafts and were not submitted.
        These links do not mean that either regulator endorses, insures, registers or accredits CSOAI Ltd.
      </p>
    </section>
  );
}
