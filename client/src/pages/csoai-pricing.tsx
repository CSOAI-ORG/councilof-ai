// csoai-pricing.tsx - CSOAI is the AI governance platform. The 5 SKUs in 1 ladder.

export function CSOAIPricing() {
  const skus = [
    { sku: "PAYG", price: "£0.05", recurring: "per call", desc: "1,000 free calls/day. All 619 MCPs. 100 req/min rate limit. Ed25519 attestations. Email support." },
    { sku: "Article 50 Kit", price: "£999", recurring: "one-time", desc: "5-day done-with-you. C2PA watermark. EU AI-Generated icon. Annex IV docs. Audit-ready evidence folder. 1-on-1 expert session." },
    { sku: "Certification", price: "£199", recurring: "per site per month", desc: "Monthly signed attestation. Public /verify URL. Audit-ready evidence folder. Priority support. Quarterly compliance review." },
    { sku: "Bespoke", price: "£4,950", recurring: "one-time", desc: "14-day gap analysis. 60-90 page readiness report. 6-month follow-up. Named CSOAI contact. Quarterly business review." },
    { sku: "Enterprise On-Prem", price: "£4,990", recurring: "per firm per month", desc: "Full OS in your data centre. FedRAMP/OSCAL artefacts. Dedicated engineer. Multi-region. 99.99% SLA. 24/7 priority support." },
  ]
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-12">
      <section>
        <h1 className="text-5xl font-bold">Pricing</h1>
        <p className="text-xl text-muted-foreground mt-2">The 5 SKUs in 1 ladder. Start free. Scale to enterprise.</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {skus.map((s) => (
          <div key={s.sku} className="p-4 bg-black/50 border border-white/10 rounded">
            <h3 className="text-lg font-bold text-emerald-500">{s.sku}</h3>
            <div className="text-2xl font-bold mt-2">{s.price}</div>
            <div className="text-xs text-muted-foreground">{s.recurring}</div>
            <p className="text-sm text-muted-foreground mt-2">{s.desc}</p>
          </div>
        ))}
      </section>
      <section>
        <h2 className="text-3xl font-bold">The 1-line bottom line</h2>
        <p className="mt-2 text-emerald-500 font-bold">£1.44M Day 30 ARR → £9M Day 100 ARR → £43.75M Y3 ARR → £200M Y5 ARR. The 7-stage revenue funnel. ONE OS at another dimension.</p>
      </section>
    </div>
  )
}

export default CSOAIPricing
