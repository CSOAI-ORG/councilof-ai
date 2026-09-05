import { useEffect, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";

/**
 * /products — the buyer's page, DERIVED.
 *
 * Everything a buyer can buy is read from GET /api/x402 at render time: the
 * lid, the one_line, the tiers themselves (name + resource door + free preview
 * URL). No SKU list is typed into this file, no price ever appears (prices are
 * quoted at the 402 — price-gate doctrine), every count comes from the API.
 * SKU docs live in docs/product/<sku>.md (repo), the human-verified
 * probe-before-write descriptions.
 */

const TIER_TO_DOC: Record<string, string> = {
  issuance: "commission-card",
  evidence_bundle: "evidence-bundle",
  data_feed: "signed-data-feed",
  rwa_evidence: "xrpl-asset-evidence",
  provider_diff_feed: "provider-diff-feed",
  receipts_batch: "receipts-batch",
};

const DOC_ROOT = "https://github.com/CSOAI-ORG/councilof-ai/blob/HEAD/docs/product";

const FREE_RAIL = [
  { name: "Verify a card", href: "/gspc-verify", what: "Check any signed verdict offline. Free forever, for anyone." },
  { name: "The live board", href: "/gspc-scoreboard", what: "Every quotable axis, measured or honestly UNMEASURED." },
  { name: "The API", href: "/api/gspc", what: "The same board, machine-readable. Agents welcome.", external: true },
  { name: "The method", href: "/methodology", what: "The frozen rules every number above is computed under." },
  { name: "Metered for agents", href: "/api/x402", what: "Artefacts an agent can buy over HTTP 402 (USDC on Base) — issuance, assembly, cadence. Never a grade.", external: true },
];

interface Tier {
  tier: number;
  id: string;
  name: string;
  resource: string;
  free_preview?: string;
  free_preview_note?: string;
  deliverable?: string;
}

export default function Products() {
  const [catalog, setCatalog] = useState<any>(null);

  useEffect(() => {
    document.title = "Products — Council of AI";
    setMetaDescription(
      "The measurement body's products: verify, board, method free forever; metered artefacts at the 402. Measurement, not certification.",
    );
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    fetch("/api/x402", { signal: ac.signal, headers: { accept: "application/json" } })
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => setCatalog(null));
    return () => ac.abort();
  }, []);

  const tiers: Tier[] = catalog?.tiers ?? [];
  const lid: string = catalog?.lid ?? "22 axes measured · not a certificate.";

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm text-emerald-700">{catalog?.one_line ?? "Verification is free forever."}</p>
      <h2 className="mt-2 text-3xl font-semibold text-zinc-900">{lid}</h2>

      <section className="mt-10">
        <h3 className="text-xl font-semibold text-zinc-900">Free forever</h3>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {FREE_RAIL.map((f) => (
            <li key={f.name} className="rounded-xl border border-zinc-200 p-4">
              <a
                href={f.href}
                className="font-medium text-emerald-700"
                {...(f.external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                {f.name}
              </a>
              <p className="mt-1 text-sm text-zinc-600">{f.what}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h3 className="text-xl font-semibold text-zinc-900">Metered artefacts</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Each artefact is quoted at the 402 — prices live in the door, never on this page. Verification of everything stays free.
        </p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {tiers.map((t) => {
            const doc = TIER_TO_DOC[t.id];
            return (
              <li key={t.id} className="rounded-xl border border-zinc-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-zinc-900">{t.name}</h4>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                    at the 402
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  {t.deliverable ? t.deliverable.slice(0, 160) : "Assembled server-side from already-signed cards."}
                </p>
                <div className="mt-2 text-xs text-zinc-500 break-all">
                  <code>{t.resource}</code>
                </div>
                {t.free_preview ? (
                  <p className="mt-2 text-xs text-zinc-500">
                    Free preview: <code>{t.free_preview}</code>
                  </p>
                ) : null}
                {doc ? (
                  <a
                    className="mt-2 inline-block text-sm text-emerald-700 underline"
                    href={`${DOC_ROOT}/${doc}.md`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    What a buyer receives — {doc}.md
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-zinc-500">
          Evidence packs (eu-ai-act-pack, swift-bank-pack) and the deliverability notes are described in
          docs/product/ in the repository, regenerated by probe-before-write tooling.
        </p>
      </section>

      <section className="mt-12 rounded-xl bg-zinc-50 p-4">
        <p className="text-sm text-zinc-700">
          <strong>Measurement, not certification.</strong> CSOAI issues measurements and signed attestations,
          never certificates of conformity. Unmeasured is published as UNMEASURED — absent is not zero.
          <Link className="ml-1 text-emerald-700 underline" to="/gspc-verify">
            Verify any card yourself, free.
          </Link>
        </p>
      </section>
    </div>
  );
}
