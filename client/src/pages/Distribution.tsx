import { useEffect } from "react";

// Distribution & Layer 0 Coverage — the full map of every endpoint CSOAI ships to
// (source, package registries, MCP directories, edge deploys) and how far each is
// governed by Layer 0. Conformance: L0-0 none -> L0-5 A2A-ready.

type Channel = { name: string; kind: string; reach: string; l0: string; note: string };

const CHANNELS: Channel[] = [
  { name: "GitHub", kind: "Source", reach: "300+ repos", l0: "L0-3", note: "Signed commits + branch protection as evidence" },
  { name: "npm", kind: "JS packages", reach: "@csoai/layer0", l0: "L0-5", note: "Ships the Layer 0 + A2A adapter itself" },
  { name: "PyPI", kind: "Python packages", reach: "MCP servers", l0: "L0-1", note: "Auth middleware live; gateway wrap rolling out" },
  { name: "MCP Registry", kind: "Registry", reach: "216 servers", l0: "L0-3", note: "Manifest-driven; every server conformance-badged" },
  { name: "Smithery", kind: "MCP host", reach: "deployable", l0: "L0-1", note: "smithery.yaml present across the fleet" },
  { name: "glama.ai", kind: "MCP directory", reach: "listed", l0: "L0-1", note: "Directory listing; gateway wrap pending" },
  { name: "mcp.so / mcpize", kind: "MCP directory", reach: "listed", l0: "L0-1", note: "Directory listing; gateway wrap pending" },
  { name: "Vercel", kind: "Edge deploy", reach: "40+ surfaces", l0: "L0-3", note: "The OS + every ecosystem front-end" },
];

const LEVELS = [
  { id: "L0-0", label: "Ungoverned" },
  { id: "L0-1", label: "Identity / auth" },
  { id: "L0-2", label: "Policy gate" },
  { id: "L0-3", label: "Attested (signed)" },
  { id: "L0-4", label: "Human-in-loop" },
  { id: "L0-5", label: "A2A-ready" },
];

const l0Color: Record<string, string> = {
  "L0-0": "bg-gray-200 text-gray-600",
  "L0-1": "bg-sky-100 text-sky-700",
  "L0-2": "bg-blue-100 text-blue-700",
  "L0-3": "bg-emerald-100 text-emerald-700",
  "L0-4": "bg-amber-100 text-amber-800",
  "L0-5": "bg-violet-100 text-violet-700",
};

export default function Distribution() {
  useEffect(() => { document.title = "Distribution & Layer 0 Coverage — CSOAI"; }, []);
  const governed = CHANNELS.filter((c) => c.l0 !== "L0-0").length;
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">The distribution surface</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Governed everywhere we ship</h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            Every endpoint CSOAI distributes to — source, package registries, MCP directories and edge deploys —
            mapped to its Layer 0 conformance. One signed floor, reaching every channel.
          </p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            <Stat v={String(CHANNELS.length)} l="Channels" />
            <Stat v={governed + "/" + CHANNELS.length} l="Layer 0 governed" />
            <Stat v="216" l="MCP servers" />
            <Stat v="L0-5" l="A2A peak" />
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900">Channels</h2>
        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Channel</th>
                <th className="text-left font-semibold px-4 py-3 hidden sm:table-cell">Kind</th>
                <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Reach</th>
                <th className="text-left font-semibold px-4 py-3">Layer 0</th>
                <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {CHANNELS.map((c) => (
                <tr key={c.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{c.kind}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.reach}</td>
                  <td className="px-4 py-3">
                    <span className={"inline-block rounded-full px-2 py-0.5 text-xs font-bold " + (l0Color[c.l0] || l0Color["L0-0"])}>{c.l0}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-12 text-xl font-bold text-gray-900">Conformance ladder</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {LEVELS.map((lv) => (
            <span key={lv.id} className={"rounded-full px-3 py-1 text-xs font-semibold " + (l0Color[lv.id] || l0Color["L0-0"])}>
              {lv.id} · {lv.label}
            </span>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          Every governed channel carries <b>@csoai/layer0</b> — Council Gate on each call, Ed25519 attestation, and an
          A2A envelope other governed agents verify offline. Channels at L0-1 are identity-checked today; the gateway
          deploy lifts the whole fleet to L0-3+ and the directories to A2A.
        </div>
      </section>
    </div>
  );
}

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-4 text-center">
      <div className="text-3xl font-extrabold text-emerald-300">{v}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-emerald-100/70">{l}</div>
    </div>
  );
}
