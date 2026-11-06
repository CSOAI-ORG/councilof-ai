import { useMemo, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Github,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { publicSourceUrl, DARK_SOURCE_NOTE } from "@/lib/darkSource";
import registry from "@/data/mcpRegistry.json";

type Server = {
  slug: string;
  name: string;
  description: string;
  url: string;
  category: string;
  frameworks?: string[] | null;
  language?: string | null;
  builtInHouse: boolean;
  updatedAt: string | null;
};

const ALL = (registry.servers as Server[]) || [];

export default function MCPDetail() {
  const [, params] = useRoute<{ slug: string }>("/mcps/:slug");
  const slug = params?.slug || "";
  const server = useMemo(() => ALL.find((s) => s.slug === slug), [slug]);
  useEffect(() => {
    document.title = server
      ? `${server.name} MCP server | Council of AI`
      : "MCP server not found | Council of AI";
  }, [server]);

  const related = useMemo(() => {
    if (!server) return [];
    return ALL.filter(
      (s) => s.slug !== server.slug && s.category === server.category,
    ).slice(0, 6);
  }, [server]);

  if (!server) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="p-10 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">MCP not found</h1>
          <p className="text-gray-600 mb-6">No MCP server matches “{slug}”.</p>
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Link href="/mcps">Browse all MCPs</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const frameworks = Array.isArray(server.frameworks)
    ? server.frameworks
    : null;
  const language =
    typeof server.language === "string" && server.language.trim()
      ? server.language
      : null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${server.name} MCP`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    description: server.description,
    softwareHelp: server.url,
    // JSON-LD is machine-readable and syndicated: this block is what a search engine reads and can
    // render as a price beside the result. It said price "99" USD, category "subscription", on a
    // route that renders ONE PAGE PER MCP SERVER — so every server in the registry advertised a $99
    // subscription. These are free, permissively-licensed packages, and the owner ruling of
    // 6 Sep 2026 is that everything is free or pay-as-you-go x402 quoted at the 402 itself. There
    // is no subscription to sell and there never was one at this price.
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    publisher: {
      "@type": "Organization",
      name: "CSOAI LTD",
      url: "https://csoai.org",
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-4xl py-10">
        <Link href="/mcps">
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 cursor-pointer mb-6">
            <ArrowLeft className="h-4 w-4" /> All {ALL.length} catalogue entries
          </span>
        </Link>

        {registry.total !== ALL.length && (
          <p
            className="mb-6 text-sm text-gray-600"
            data-testid="mcp-catalogue-count-discrepancy"
          >
            Declared registry metadata total: {registry.total} entries. This
            differs from the published list; neither count demonstrates endpoint
            availability.
          </p>
        )}

        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold">{server.name}</h1>
          {server.builtInHouse && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              In-house Labs
            </Badge>
          )}
        </div>
        <p className="text-xl text-gray-600 leading-relaxed mb-5">
          {server.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          <Badge variant="outline">{server.category}</Badge>
          {frameworks?.map((fw) => (
            <Link key={fw} href={`/mcps?framework=${encodeURIComponent(fw)}`}>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 cursor-pointer">
                {fw}
              </Badge>
            </Link>
          ))}
          {frameworks === null && (
            <Badge variant="outline">Framework metadata not supplied</Badge>
          )}
          <Badge variant="outline">{language ?? "Language not supplied"}</Badge>
        </div>

        {/* Install options */}
        <h2 className="text-lg font-bold mb-3">Setup information</h2>
        <p className="mb-8 text-sm text-gray-600">
          Setup metadata has not been supplied for this catalogue entry. No
          installation command is confirmed here.
        </p>

        <div className="flex flex-wrap gap-3 mb-12">
          {publicSourceUrl(server.url) ? (
            <Button asChild variant="outline">
              <a
                href={publicSourceUrl(server.url)!}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4 mr-2" /> View source{" "}
                <ExternalLink className="h-3 w-3 ml-1.5" />
              </a>
            </Button>
          ) : (
            <span className="self-center text-sm text-gray-500">
              {DARK_SOURCE_NOTE}
            </span>
          )}
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Link href="/gspc-verify/">
              Verify a signed record <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>

        {frameworks && frameworks.length > 0 && (
          <Card className="p-6 bg-emerald-50/50 border-emerald-200 mb-12">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold mb-1">Framework-mapped evidence</h3>
                <p className="text-sm text-gray-600">
                  This registry entry maps the server to {frameworks.join(", ")}
                  . That mapping is not a compliance determination, and a signed
                  result must be verified from the specific response. See the
                  CSOAI Charter on the{" "}
                  <Link href="/crosswalks">
                    <span className="text-emerald-700 underline cursor-pointer">
                      Crosswalks
                    </span>
                  </Link>{" "}
                  page.
                </p>
              </div>
            </div>
          </Card>
        )}

        {related.length > 0 && (
          <>
            <h2 className="text-lg font-bold mb-4">
              Related tools in {server.category}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.slug} href={`/mcps/${r.slug}`}>
                  <Card className="p-4 h-full hover:border-emerald-400 transition-colors cursor-pointer">
                    <h3 className="font-semibold text-sm mb-1">{r.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {r.description}
                    </p>
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
