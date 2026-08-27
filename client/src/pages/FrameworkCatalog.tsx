import { useMemo, useState } from "react";

// CSOAI Framework Catalog — breadth across the regimes buyers ask for.
// Closes HUNT_24 Tier-1 #5 (framework breadth: missing frameworks = lost deals).
// Searchable/filterable catalog; "Supported" = deep guide + control mapping,
// "Mapped" = control crosswalk available, "Planned" = on the roadmap.

type Status = "Supported" | "Mapped" | "Planned";

type Framework = {
  name: string;
  category: string;
  region: string;
  status: Status;
};

const FRAMEWORKS: Framework[] = [
  { name: "EU AI Act", category: "AI", region: "EU", status: "Supported" },
  { name: "NIST AI RMF", category: "AI", region: "US", status: "Supported" },
  { name: "ISO/IEC 42001", category: "AI", region: "Global", status: "Supported" },
  { name: "TC260 (Gen-AI Measures)", category: "AI", region: "China", status: "Supported" },
  { name: "NYC Local Law 144", category: "AI", region: "US", status: "Mapped" },
  { name: "Colorado AI Act (SB 205)", category: "AI", region: "US", status: "Planned" },
  { name: "Korea AI Basic Act", category: "AI", region: "Korea", status: "Mapped" },
  { name: "Canada AIDA", category: "AI", region: "Canada", status: "Planned" },
  { name: "OECD AI Principles", category: "AI", region: "Global", status: "Mapped" },
  { name: "SOC 2", category: "Security", region: "US", status: "Supported" },
  { name: "ISO/IEC 27001", category: "Security", region: "Global", status: "Supported" },
  { name: "ISO/IEC 27701", category: "Privacy", region: "Global", status: "Mapped" },
  { name: "NIST CSF 2.0", category: "Security", region: "US", status: "Mapped" },
  { name: "NIST 800-53", category: "Security", region: "US", status: "Mapped" },
  { name: "PCI DSS 4.0", category: "Security", region: "Global", status: "Mapped" },
  { name: "HIPAA", category: "Healthcare", region: "US", status: "Supported" },
  { name: "GDPR", category: "Privacy", region: "EU", status: "Supported" },
  { name: "CCPA / CPRA", category: "Privacy", region: "US", status: "Mapped" },
  { name: "DORA", category: "Financial", region: "EU", status: "Supported" },
  { name: "NIS2", category: "Security", region: "EU", status: "Mapped" },
  { name: "FedRAMP (20x / OSCAL)", category: "Security", region: "US", status: "Mapped" },
  { name: "CMMC 2.0", category: "Security", region: "US", status: "Planned" },
  { name: "ISO 9001", category: "Quality", region: "Global", status: "Planned" },
  { name: "SOX (ITGC)", category: "Financial", region: "US", status: "Mapped" },
  { name: "CIS Controls v8", category: "Security", region: "Global", status: "Mapped" },
  { name: "MAS TRM", category: "Financial", region: "Singapore", status: "Planned" },
  { name: "UK GDPR / DPA 2018", category: "Privacy", region: "UK", status: "Mapped" },
  { name: "ISO 23894 (AI risk)", category: "AI", region: "Global", status: "Mapped" },
];

// Acknowledged gaps — handled via CSOAI's specialist partner network (honesty signal).
const PARTNER_GAPS = [
  "HITRUST", "FedRAMP", "EUCS", "APPI (Japan)", "PIPL (China)", "PDPA (Singapore)",
  "DPDPA (India)", "LGPD (Brazil)", "Privacy Act (AU)", "PIPEDA (CA)", "GLBA / SOX",
  "NERC CIP", "GxP / 21 CFR Part 11", "ISO 21434 / UN R155",
];

const statusColor: Record<Status, string> = {
  Supported: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Mapped: "bg-blue-100 text-blue-700 border-blue-200",
  Planned: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function FrameworkCatalog() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const cats = ["All", ...Array.from(new Set(FRAMEWORKS.map((f) => f.category)))];

  const list = useMemo(() => {
    return FRAMEWORKS.filter(
      (f) =>
        (cat === "All" || f.category === cat) &&
        (q.trim() === "" || (f.name + f.region).toLowerCase().includes(q.toLowerCase()))
    );
  }, [q, cat]);

  const counts = {
    total: FRAMEWORKS.length,
    supported: FRAMEWORKS.filter((f) => f.status === "Supported").length,
    mapped: FRAMEWORKS.filter((f) => f.status === "Mapped").length,
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">Coverage</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Framework Catalog</h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            {counts.total} frameworks across AI, security, privacy, financial and healthcare regimes —
            {" "}{counts.supported} deeply supported, {counts.mapped} control-mapped, the rest on the roadmap.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search frameworks…"
            className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${cat === c ? "bg-emerald-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((f) => (
            <div key={f.name} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-gray-900">{f.name}</div>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusColor[f.status]}`}>{f.status}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">{f.category} · {f.region}</div>
            </div>
          ))}
        </div>
        {list.length === 0 && <p className="mt-6 text-sm text-gray-500">No frameworks match.</p>}

        <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Acknowledged gaps — partner network</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            We don&rsquo;t pretend to cover everything. These regimes are handled through CSOAI&rsquo;s specialist
            partner network rather than claimed directly &mdash; an honesty signal that builds trust, and a
            revenue channel for certified partners.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PARTNER_GAPS.map((g) => (
              <span key={g} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500">{g}</span>
            ))}
          </div>
          <a href="mailto:nicholas@csoai.org?subject=CSOAI%20framework%20partner" className="mt-5 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            Become a framework partner →
          </a>
        </div>
      </section>
    </div>
  );
}
