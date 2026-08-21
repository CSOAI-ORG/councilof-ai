// Vercel Edge Middleware — per-page social cards for the SPA.
// The site serves one index.html for every route, so crawlers get the same OG meta.
// This rewrites <meta og:*/twitter:*> in the served HTML per path, pointing og:image
// at the dynamic /api/og function. DEFENSIVE BY DESIGN: any error → fall through
// (return undefined) so pages always serve. Only runs on HTML page routes.

export const config = {
  // Skip API, hashed assets, well-known, and anything with a file extension.
  matcher: ["/((?!api/|assets/|.well-known/|legacy/|.*\\.[a-zA-Z0-9]+$).*)"],
};

const META: Record<string, { t: string; d: string }> = {
  "/": { t: "CSOAI — AI governance, cybersecurity & safety", d: "Signed to Layer 0 · deterministic measurement harnesses · open source · aligned to 13 frameworks" },
  "/os": { t: "The Council OS — 370+ governed AI tools", d: "An operating system for AI governance, not a dashboard. Run live governed tools, sealed to Layer 0." },
  "/workbench": { t: "Council Governance Workbench", d: "Every output signed, reproducible, council-reviewed — the governance floor under any AI agent." },
  "/crosswalk": { t: "The AI governance framework crosswalk", d: "13 frameworks × 8 controls. Comply once, evidence everywhere. Open and citable." },
  "/agent-governance": { t: "AI agent governance — the agentic era", d: "Signed agent cards, deterministic grading, Ed25519 attestations. Mapped to Art. 14 & 50." },
  "/agent-registry": { t: "Agent Registry — signed, governed AI agents", d: "Every agent identified, purpose-bound and Ed25519-signed. Shadow AI has nowhere to hide." },
  "/article-50": { t: "EU AI Act Article 50 — the transparency cliff", d: "2 Aug + 2 Dec 2026. Disclosure + content marking, €15M/3% fines. Get ready with CSOAI." },
  "/dora": { t: "DORA compliance for financial services", d: "Five pillars, ~65% NIS2 overlap, RoI + TLPT, signed evidence — governed and evidenced." },
  "/nis2": { t: "NIS2 Directive — cybersecurity compliance", d: "Transposition Oct 2026 · 24/72h reporting · personal management accountability." },
  "/cra": { t: "EU Cyber Resilience Act — deadlines & compliance", d: "Reporting 11 Sep 2026, main obligations 11 Dec 2027. Secure-by-design, SBOM, signed evidence." },
  "/global-ai-regulation": { t: "Global AI regulation tracker 2026", d: "Every regime, current — EU, US, UK, Canada, China, Singapore, South Korea. One map." },
  "/classifier": { t: "Is your AI high-risk? — EU AI Act classifier", d: "Describe any AI system → its risk tier, obligations, and every framework that applies." },
  "/compare": { t: "CSOAI vs Vanta vs Drata vs Credo AI vs OneTrust", d: "Agentic-native, verifiable Ed25519 proof, 13-framework crosswalk — and no per-seat rent." },
  "/pricing": { t: "CSOAI pricing — open, accessible AI governance", d: "Governance shouldn't cost more than the AI it governs. Open-source core, free to start." },
  "/report": { t: "Report an AI incident — Global AI Watchdog", d: "File an incident, get a real Ed25519 Layer-0 receipt. Public, verifiable accountability." },
  "/intel": { t: "The market is nameable — CSOAI Distribution Hive", d: "Governments, regulators, Fortune 500 — under 10,000 public accounts, one living dataset." },
  "/us-ai-regulation": { t: "US federal AI policy", d: "No omnibus law — executive-led, state-led. The current US AI picture, verified." },
  "/south-korea-ai-act": { t: "South Korea Basic AI Act", d: "In force Jan 2026, extraterritorial. Duties for high-impact and generative AI." },
  "/vulnerability-disclosure": { t: "Coordinated vulnerability disclosure — CSOAI", d: "Report privately, safe harbor, coordinated fix. An AI-governance company should be the safest system you run." },
};

function esc(s: string) { return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }
function titleCase(s: string) { return s.replace(/[-/]+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase()); }

export default async function middleware(req: Request): Promise<Response | undefined> {
  try {
    const url = new URL(req.url);
    const path = (url.pathname.replace(/\/+$/, "") || "/");
    const m = META[path];
    const title = m ? m.t : (path === "/" ? "CSOAI" : "CSOAI · " + titleCase(path.split("/").pop() || "AI governance"));
    const desc = m ? m.d : "AI governance, cybersecurity & safety — signed to Layer 0 · open source · aligned to 13 frameworks";

    const res = await fetch(new URL("/index.html", url.origin));
    if (!res.ok) return; // fall through — serve normally
    let html = await res.text();

    const og = url.origin + "/api/og?title=" + encodeURIComponent(title) + "&desc=" + encodeURIComponent(desc);
    html = html
      .replace(/(<meta property="og:image" content=")[^"]*(")/i, `$1${og}$2`)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/i, `$1${og}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/i, `$1${esc(title)}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/i, `$1${esc(title)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/i, `$1${esc(desc)}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/i, `$1${esc(desc)}$2`);

    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=120, must-revalidate" } });
  } catch (e) {
    return; // any failure → serve the page normally
  }
}
