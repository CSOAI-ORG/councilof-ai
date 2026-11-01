/**
 * PypiLiveBadge — the only way a page shows a PyPI download count (surface inspection, 12 Oct 2026).
 * The number lives inside an image the browser fetches from shields.io (reading pepy.tech) on view,
 * so no count is typed, prerendered or frozen into HTML. pepy counts include mirrors and automated
 * installs; the alt text and caption say so. Scope: the `csoai` package only, not every package.
 */
export const PYPI_BADGE_PACKAGE = "csoai";
export const PYPI_BADGE_SRC = `https://img.shields.io/pepy/dt/${PYPI_BADGE_PACKAGE}?label=PyPI%20downloads%2C%20including%20mirrors`;
export const PYPI_BADGE_HREF = `https://pepy.tech/projects/${PYPI_BADGE_PACKAGE}`;
export const PYPI_BADGE_ALT = `Reported PyPI downloads of the ${PYPI_BADGE_PACKAGE} package, including mirrors and automated installs, via Shields.io and pepy.tech`;

export default function PypiLiveBadge({ className = "" }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-2 text-xs text-muted-foreground ${className}`} data-testid="pypi-live-badge">
      <a href={PYPI_BADGE_HREF} rel="noopener noreferrer" className="inline-flex min-h-11 items-center">
        <img src={PYPI_BADGE_SRC} alt={PYPI_BADGE_ALT} height={20} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      </a>
      <span>{PYPI_BADGE_PACKAGE} package on PyPI, including mirrors and automated installs · reported downloads, not unique users</span>
    </p>
  );
}
