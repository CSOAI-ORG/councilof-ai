import {useMemo, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Github, ExternalLink, Terminal, Plug, Cloud, ShieldCheck, ArrowRight } from "lucide-react";
import registry from "@/data/mcpRegistry.json";

type Server = {
  slug: string;
  name: string;
  description: string;
  url: string;
  category: string;
  frameworks: string[];
  language: string;
  builtInHouse: boolean;
  updatedAt: string | null;
};

const ALL = (registry.servers as Server[]) || [];

export default function MCPDetail() {
  useEffect(() => { document.title = "MCP server — CSOAI | CSOAI"; }, []);
  const [, params] = useRoute("/mcp/:slug");
  const slug = params?.slug || "";
  const server = useMemo(() => ALL.find((s) => s.slug === slug), [slug]);

  const related = useMemo(() => {
    if (!server) return [];
    return ALL.filter((s) => s.slug !== server.slug && s.category === server.category).slice(0, 6);
  }, [server]);

  if (!server) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="p-10 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">MCP not found</h1>
          <p className="text-gray-600 mb-6">No MCP server matches “{slug}”.</p>
          <Link href="/mcp">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Browse all MCPs</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const pip = server.slug.replace(/-/g, "_");
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${server.name} MCP`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    description: server.description,
    softwareHelp: server.url,
    offers: { "@type": "Offer", price: "99", priceCurrency: "USD", category: "subscription" },
    publisher: { "@type": "Organization", name: "CSOAI LTD", url: "https://csoai.org" },
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-4xl py-10">
        <Link href="/mcp">
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 cursor-pointer mb-6">
            <ArrowLeft className="h-4 w-4" /> All {registry.total} MCPs
          </span>
        </Link>

        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold">{server.name}</h1>
          {server.builtInHouse && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">In-house Labs</Badge>}
        </div>
        <p className="text-xl text-gray-600 leading-relaxed mb-5">{server.description}</p>

        <div className="flex flex-wrap gap-2 mb-8">
          <Badge variant="outline">{server.category}</Badge>
          {server.frameworks.map((fw) => (
            <Link key={fw} href={`/mcp?framework=${encodeURIComponent(fw)}`}>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer">{fw}</Badge>
            </Link>
          ))}
          <Badge variant="outline">{server.language}</Badge>
        </div>

        {/* Install options */}
        <h2 className="text-lg font-bold mb-3">Run it</h2>
        <div className="space-y-3 mb-8">
          <InstallRow icon={<Terminal className="h-4 w-4 text-emerald-600" />} label="PyPI (local / stdio)" cmd={`pip install ${pip}`} />
          <InstallRow icon={<Plug className="h-4 w-4 text-emerald-600" />} label="Smithery" cmd={`npx -y @smithery/cli@latest install ${server.slug} --client claude`} />
          <InstallRow icon={<Cloud className="h-4 w-4 text-emerald-600" />} label="Hosted gateway (bearer token)" cmd={`POST https://api.meok.ai/v1/${server.slug}/<tool>`} />
        </div>

        <div className="flex flex-wrap gap-3 mb-12">
          <a href={server.url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline"><Github className="h-4 w-4 mr-2" /> View source <ExternalLink className="h-3 w-3 ml-1.5" /></Button>
          </a>
          <a href="/contact">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Book a free diagnostic <ArrowRight className="h-4 w-4 ml-2" /></Button>
          </a>
        </div>

        {server.frameworks.length > 0 && (
          <Card className="p-6 bg-emerald-50/50 border-emerald-200 mb-12">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">Framework-mapped evidence</h3>
                <p className="text-sm text-gray-600">
                  Every call emits signed, auditable evidence mapped to {server.frameworks.join(", ")}. See how this maps to
                  the CSOAI Charter on the <Link href="/crosswalks"><span className="text-emerald-700 underline cursor-pointer">Crosswalks</span></Link> page.
                </p>
              </div>
            </div>
          </Card>
        )}

        {related.length > 0 && (
          <>
            <h2 className="text-lg font-bold mb-4">Related tools in {server.category}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.slug} href={`/mcp/${r.slug}`}>
                  <Card className="p-4 h-full hover:border-emerald-400 transition-colors cursor-pointer">
                    <h3 className="font-semibold text-sm mb-1">{r.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InstallRow({ icon, label, cmd }: { icon: React.ReactNode; label: string; cmd: string }) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-700">{icon} {label}</div>
      <code className="text-xs text-gray-800 break-all">{cmd}</code>
    </div>
  );
}
