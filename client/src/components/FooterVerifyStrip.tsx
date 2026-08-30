/**
 * FooterVerifyStrip — "Verify us everywhere" badge chips.
 *
 * Every entry below was probed live on 2026-08-20 and returned a REAL page
 * (HTTP 200, content-checked — not a soft-404). Text chips only: no external
 * badge images, nothing loads from a third party.
 *
 * Probed and EXCLUDED as dead/unverifiable on 2026-08-20 — do not re-add
 * without a fresh probe:
 *   - smithery.ai/server/proofof-ai and /cobol-bridge (HTTP 200 but soft-404
 *     "Not Found" body, all slug variants)
 *   - glama.ai listing (direct server URL 404; search page is not a listing)
 *   - mcpmarket.com (429 rate-limited, unverifiable)
 *   - openrouter.ai/csoai (soft-404; no public app/profile page exists)
 *   - kaggle.com/organizations/csoai (real 404; the live Kaggle presence is
 *     the nicktempleman profile linked below)
 */

import { ExternalLink } from 'lucide-react';

interface VerifyBadge {
  label: string;
  href: string;
  title: string;
}

const BADGES: VerifyBadge[] = [
  {
    label: 'councilof.ai',
    href: 'https://councilof.ai',
    title: 'The public instrument — living board at GET /api/gspc',
  },
  {
    label: 'GitHub · CSOAI-ORG',
    href: 'https://github.com/CSOAI-ORG',
    title: 'CSOAI open-source organisation on GitHub',
  },
  {
    label: 'GitHub · councilof-ai',
    href: 'https://github.com/CSOAI-ORG/councilof-ai',
    title: 'This site’s source repository',
  },
  {
    label: 'Hugging Face · csoai',
    href: 'https://huggingface.co/csoai',
    title: 'CSOAI organisation on Hugging Face',
  },
  {
    label: 'PyPI · inspect-signed-receipt',
    href: 'https://pypi.org/project/inspect-signed-receipt/',
    title: 'inspect-signed-receipt package on PyPI',
  },
  {
    label: 'PyPI · csoai',
    href: 'https://pypi.org/project/csoai/',
    title: 'csoai package on PyPI',
  },
  {
    label: 'PyPI · proofof-ai-mcp',
    href: 'https://pypi.org/project/proofof-ai-mcp/',
    title: 'proofof-ai-mcp package on PyPI',
  },
  {
    label: 'Kaggle',
    href: 'https://www.kaggle.com/nicktempleman',
    title: 'CSOAI datasets and notebooks on Kaggle',
  },
  {
    label: 'Zenodo DOI 10.5281/zenodo.21991104',
    href: 'https://doi.org/10.5281/zenodo.21991104',
    title: 'Canonical concept DOI on Zenodo',
  },
  {
    label: 'Wikidata · Q141128616',
    href: 'https://www.wikidata.org/wiki/Q141128616',
    title: 'CSOAI entity on Wikidata',
  },
  {
    label: 'Companies House · 16939677',
    href: 'https://find-and-update.company-information.service.gov.uk/company/16939677',
    title: 'CSOAI LTD on the UK Companies House register',
  },
  {
    label: 'did:web trust root',
    href: 'https://csoai.org/.well-known/did.json',
    title: 'did:web:csoai.org DID document — the signing trust root',
  },
];

export function FooterVerifyStrip() {
  return (
    <div className="border-t border-gray-200 mt-8 pt-8">
      <h3 className="text-gray-500 text-xs text-center uppercase tracking-wider mb-4">
        Verify us everywhere
      </h3>
      <ul className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0">
        {BADGES.map((badge) => (
          <li key={badge.href}>
            <a
              href={badge.href}
              target="_blank"
              rel="noopener noreferrer"
              title={badge.title}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm hover:border-emerald-600 hover:text-emerald-800 transition-colors"
            >
              <span>{badge.label}</span>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <p className="text-gray-500 text-xs text-center mt-3">
        Every listing above is a live, independently hosted record — follow any of them to check us.
      </p>
    </div>
  );
}

export default FooterVerifyStrip;
