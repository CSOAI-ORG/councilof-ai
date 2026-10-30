/**
 * NpmMcpLiveBadge — live npm downloads for the MCP package, without freezing a count in HTML.
 * Shields reads npm's monthly download API when the browser requests the image. npm download
 * counts include automated installs and are not people, users or customers.
 */
export const NPM_MCP_BADGE_PACKAGE = "csoai-gspc-mcp";
export const NPM_MCP_BADGE_SRC = `https://img.shields.io/npm/dm/${NPM_MCP_BADGE_PACKAGE}?label=npm%2FMCP%20downloads%2C%20last%20month`;
export const NPM_MCP_BADGE_HREF = `https://www.npmjs.com/package/${NPM_MCP_BADGE_PACKAGE}`;
export const NPM_MCP_BADGE_ALT = `Reported monthly npm downloads of the ${NPM_MCP_BADGE_PACKAGE} MCP package, including automated installs, via Shields.io and npm`;

export default function NpmMcpLiveBadge({ className = "" }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-2 text-xs text-muted-foreground ${className}`} data-testid="npm-mcp-live-badge">
      <a href={NPM_MCP_BADGE_HREF} rel="noopener noreferrer" className="inline-flex min-h-11 items-center">
        <img src={NPM_MCP_BADGE_SRC} alt={NPM_MCP_BADGE_ALT} height={20} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
      </a>
      <span>{NPM_MCP_BADGE_PACKAGE} package on npm · MCP downloads, last month, including automated installs · reported downloads, not unique users</span>
    </p>
  );
}
