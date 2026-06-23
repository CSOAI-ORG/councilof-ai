import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "🐉 Keystone — Sovereign Secrets Management | MEOK",
  description: "",
  alternates: { canonical: "/keystone" },
  openGraph: {
    title: "🐉 Keystone — Sovereign Secrets Management | MEOK",
    description: "",
    type: "website",
    
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "🐉 Keystone — Sovereign Secrets Management | MEOK", item: "https://csoai.org/keystone" },
  ],
};

export default function KeystonePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <style>{`
.legacy-content body{background:#050709;color:#fff;font-family:-apple-system,sans-serif;margin:0}
.legacy-content .cmd{background:#0f1419;border:1px solid#1a2230;border-radius:8px;padding:12px 16px;font-family:monospace;font-size:13px;color:#00E5FF;margin:6px 0}
.legacy-content .desc{color:#94a3b8;font-size:14px;line-height:1.6}
.legacy-content h2{color:#00E5FF;font-weight:700;font-size:20px;margin:32px 0 16px}

      `}</style>
      <div
        className="legacy-content"
        dangerouslySetInnerHTML={{ __html: `<main class="max-4xl mx-auto p-6 pt-8">
<section>
  <h2>What It Is</h2>
  <p class="desc">Keystone is a CLI that reads all secrets from <strong>GCP Secret Manager</strong> and mirrors them to <strong>macOS Keychain</strong> for offline sovereignty. Secrets <em>never touch disk, git, argv, or shell history</em>. One canonical store, injected as environment variables at runtime. No more 53 scattered .env files.</p>
</section>
<section>
  <h2>8 Commands</h2>
  <div class="cmd">keystone list</div><p class="desc">List every secret (GCP) + offline-mirror status</p>
  <div class="cmd">keystone get NAME</div><p class="desc">Print a secret to stdout (Keychain first, GCP fallback). Shows length only, never value.</p>
  <div class="cmd">keystone set NAME</div><p class="desc">Read value from STDIN → store in GCP + Keychain. Usage: pbpaste | keystone set STRIPE_SECRET_KEY</p>
  <div class="cmd">keystone run [N1,N2,..] -- CMD</div><p class="desc">Run CMD with secrets injected as env vars. Replaces .env files entirely.</p>
  <div class="cmd">keystone sync-vercel PROJ N1 N2..</div><p class="desc">Push named secrets to a Vercel project's prod env. Kills the manual re-paste blocker.</p>
  <div class="cmd">keystone mirror</div><p class="desc">Pull ALL GCP secrets into macOS Keychain (offline/sovereign mode).</p>
  <div class="cmd">keystone rotate NAME</div><p class="desc">Set a new value (stdin) + re-sync everywhere.</p>
  <div class="cmd">keystone install-guard</div><p class="desc">Install a global git pre-commit secret-scanner. Prevents the next public-key leak.</p>
</section>
<section>
  <h2>Sovereign Architecture</h2>
  <p class="desc">GCP Secret Manager (canonical) ↔ macOS Keychain (offline mirror) → Runtime injection (env, never disk). A global pre-commit hook scans every commit for real-length API keys and <strong>blocks the commit</strong> if detected. The incident that exposed 5 keys on GitHub <em>cannot happen again</em>.</p>
</section>

</main>` }}
      />
    </div>
  );
}
