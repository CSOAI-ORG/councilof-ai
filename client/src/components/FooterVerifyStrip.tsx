/**
 * FooterVerifyStrip — "Verify us everywhere" with real platform logos.
 *
 * Logos are self-hosted under /images/badges/verify/ (no third-party badge
 * CDN at render time). Every href was previously probed as a live listing —
 * see history in this file for exclusions (smithery/glama soft-404s, etc.).
 */

interface VerifyBadge {
  label: string;
  href: string;
  title: string;
  logo: string;
  /** Optional logo box sizing tweak for wide marks (HF). */
  wide?: boolean;
}

const BADGES: VerifyBadge[] = [
  {
    label: 'GitHub · CSOAI-ORG',
    href: 'https://github.com/CSOAI-ORG',
    title: 'CSOAI open-source organisation on GitHub',
    logo: '/images/badges/verify/github.svg',
  },
  {
    label: 'Hugging Face · csoai',
    href: 'https://huggingface.co/csoai',
    title: 'CSOAI organisation on Hugging Face',
    logo: '/images/badges/verify/huggingface.svg',
    wide: true,
  },
  {
    label: 'PyPI · inspect-signed-receipt',
    href: 'https://pypi.org/project/inspect-signed-receipt/',
    title: 'inspect-signed-receipt package on PyPI',
    logo: '/images/badges/verify/pypi.svg',
  },
  {
    label: 'PyPI · csoai',
    href: 'https://pypi.org/project/csoai/',
    title: 'csoai package on PyPI',
    logo: '/images/badges/verify/pypi.svg',
  },
  {
    label: 'PyPI · proofof-ai-mcp',
    href: 'https://pypi.org/project/proofof-ai-mcp/',
    title: 'proofof-ai-mcp package on PyPI',
    logo: '/images/badges/verify/pypi.svg',
  },
  {
    label: 'Kaggle',
    href: 'https://www.kaggle.com/nicktempleman',
    title: 'CSOAI datasets and notebooks on Kaggle',
    logo: '/images/badges/verify/kaggle.svg',
  },
  {
    label: 'Zenodo DOI 10.5281/zenodo.21991104',
    href: 'https://doi.org/10.5281/zenodo.21991104',
    title: 'Canonical concept DOI on Zenodo',
    logo: '/images/badges/verify/zenodo.svg',
  },
  {
    label: 'Wikidata · Q141128616',
    href: 'https://www.wikidata.org/wiki/Q141128616',
    title: 'CSOAI entity on Wikidata',
    logo: '/images/badges/verify/wikidata.svg',
  },
  {
    label: 'Companies House · 16939677',
    href: 'https://find-and-update.company-information.service.gov.uk/company/16939677',
    title: 'CSOAI LTD on the UK Companies House register',
    logo: '/images/badges/verify/companies-house.svg',
  },
  {
    label: 'ORCID 0009-0001-3869-1068',
    href: 'https://orcid.org/0009-0001-3869-1068',
    title:
      'ORCID iD of the author of record. It is what makes authorship on a deposited DOI machine-resolvable rather than a name string.',
    logo: '/images/badges/verify/orcid.svg',
  },
  {
    label: 'Software Heritage · archived',
    href: 'https://archive.softwareheritage.org/browse/origin/directory/?origin_url=https://github.com/CSOAI-ORG/councilof-ai',
    title:
      'The source of this site is permanently archived by Software Heritage (UNESCO). Archived 2 September 2026, visit status full, SWHID swh:1:ori:8725f4054f527b3abdd47868de7fac5c956069f0 — a third party holds a copy that does not depend on us or on GitHub.',
    logo: '/images/badges/verify/software-heritage.svg',
  },
  {
    label: 'Sigstore Rekor · root witnessed',
    href: 'https://councilof.ai/interop/root-witness-pointer.json',
    title:
      'Every published root is witnessed in the Sigstore Rekor public transparency log. This pointer carries the CURRENT entry URL and a MATCH/DRIFTED verdict — the log index changes on every publish, so it is not hard-coded here.',
    logo: '/images/badges/verify/sigstore.svg',
  },
  {
    label: 'did:web trust root',
    href: 'https://csoai.org/.well-known/did.json',
    title: 'did:web:csoai.org DID document — the signing trust root',
    logo: '/images/badges/verify/did-web.svg',
  },
];

export function FooterVerifyStrip() {
  return (
    <div className="border-t border-border pt-6 mb-6">
      <h3 className="text-muted-foreground text-xs text-center uppercase tracking-wider mb-4">
        Verify us everywhere
      </h3>
      <ul className="flex flex-wrap items-center justify-center gap-2.5 list-none p-0 m-0">
        {BADGES.map((badge) => (
          <li key={badge.href + badge.label}>
            <a
              href={badge.href}
              target="_blank"
              rel="noopener noreferrer"
              title={badge.title}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition hover:border-emerald-600/50 hover:bg-emerald-50/60"
            >
              <img
                src={badge.logo}
                alt=""
                width={badge.wide ? 22 : 18}
                height={18}
                className="h-[18px] w-auto shrink-0 object-contain"
                loading="lazy"
                decoding="async"
              />
              <span>{badge.label}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs text-center mt-3">
        Every listing above is a live, independently hosted record — follow any of them to check us.
      </p>
    </div>
  );
}

export default FooterVerifyStrip;
