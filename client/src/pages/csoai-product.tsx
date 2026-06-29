// csoai-product.tsx - CSOAI is the AI governance platform
// The platform overview. 619 MCPs. 200+ regulators. 50+ frameworks. 33 Hives. 5 pilot kickoffs. Mavis-7 license.

export function CSOAIProduct() {
  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-12">
      <section>
        <h1 className="text-5xl font-bold">CSOAI is the AI Governance Platform</h1>
        <p className="text-xl text-muted-foreground mt-2">The 619 MCPs · The 200+ regulators · The 50+ frameworks · The 33 Hives · The 5 pilot kickoffs · The 1 Mavis-7 license</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "619 MCPs", desc: "9 categories. Open ecosystem. 100% MIT/Apache 2.0." },
          { title: "200+ Regulators", desc: "EU AI Office + EDPB + EBA + ENISA + ICO + FCA + NIST + FedRAMP + ..." },
          { title: "50+ Frameworks", desc: "EU AI Act + GDPR + DORA + NIS2 + CRA + ISO 42001 + NIST AI RMF + OWASP ASI 2026" },
          { title: "33 Hives", desc: "10 EU banks + 2 telecoms + 3 haulage + 5 optometry + 3 aquaculture + 7 COBOL + 2 healthcare" },
          { title: "5 Pilot Kickoffs", desc: "WCR + Templeman + UniCredit + MacLeod + iOK Farm. £54.7K → £75.4K (90d)." },
          { title: "Mavis-7 License", desc: "7 open layers + 2 closed layers + 5 commercial tiers + 30-day commitment window" },
        ].map((f) => (
          <div key={f.title} className="p-4 bg-black/50 border border-white/10 rounded">
            <h3 className="text-lg font-bold text-emerald-500">{f.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-3xl font-bold">The Platform Architecture</h2>
        <p className="mt-2">8 backend services on 7 ports + 1 unified data graph + 1 EAT endpoint + 1 public API + 1 WebSocket server + 1 iOK Farm SSE stream + 1 Mavis-7 SDK + 1 Admin API + 1 PWA + 1 iOS + Android mobile app + 1 5-year strategic roadmap.</p>
      </section>

      <section>
        <h2 className="text-3xl font-bold">The 1-line bottom line</h2>
        <p className="mt-2 text-emerald-500 font-bold">CSOAI is the AI governance platform. 619 MCPs. 200+ regulators. 50+ frameworks. 33 Hives. 5 pilot kickoffs. 1 Mavis-7 license. £1.44M Day 30 ARR. £200M Y5 ARR. IPO on LSE in Q16. ONE OS at another dimension.</p>
      </section>
    </div>
  )
}

export default CSOAIProduct
