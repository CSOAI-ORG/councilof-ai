import {useMemo, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calendar, Boxes, ShieldCheck, FileText } from "lucide-react";
import { FRAMEWORKS, mcpTagForFramework } from "@/data/frameworks";
import registry from "@/data/mcpRegistry.json";

type Server = { slug: string; name: string; description: string; frameworks: string[]; category: string };
const ALL = (registry.servers as Server[]) || [];

export default function FrameworkDetail() {
  useEffect(() => { document.title = "Framework compliance — CSOAI Charter crosswalk | CSOAI"; }, []);
  const [, params] = useRoute("/frameworks/:slug");
  const slug = params?.slug || "";
  const fw = useMemo(() => FRAMEWORKS.find((f) => f.slug === slug), [slug]);

  const tag = fw ? mcpTagForFramework(fw.name) : null;
  const tools = useMemo(() => (tag ? ALL.filter((s) => s.frameworks.includes(tag)) : []), [tag]);

  if (!fw) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <Card className="p-10 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Framework not found</h1>
          <p className="text-gray-600 mb-6">No crosswalk matches “{slug}”.</p>
          <Link href="/crosswalks">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">All crosswalks</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `CSOAI Charter × ${fw.name} Crosswalk`,
    description: fw.description,
    about: fw.name,
    url: `https://csoai.org/frameworks/${fw.slug}`,
    publisher: { "@type": "Organization", name: "CSOAI LTD", url: "https://csoai.org" },
    license: "https://creativecommons.org/licenses/by/4.0/",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* EU AI Act-style urgency for binding frameworks */}
      {fw.binding && fw.effective && (
        <div className="bg-rose-600 text-white text-sm">
          <div className="container max-w-5xl py-2.5 flex flex-wrap items-center justify-center gap-x-3 text-center">
            <span className="font-semibold">⏱ {fw.name} is binding — effective {fw.effective}.</span>
            <a href="/contact" className="underline font-medium">
              Book a free diagnostic →
            </a>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 border-b">
        <div className="container max-w-5xl py-14">
          <Link href="/crosswalks">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 cursor-pointer mb-6">
              <ArrowLeft className="h-4 w-4" /> All crosswalks
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="outline">{fw.region}</Badge>
            <Badge className={fw.binding ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}>{fw.binding ? "Binding" : "Voluntary"}</Badge>
            <Badge variant="outline">Phase {fw.phase} · {fw.phaseLabel}</Badge>
          </div>
          <h1 className="text-4xl md:text-4xl font-bold mb-4">{fw.name}</h1>
          <p className="text-xl text-gray-700 leading-relaxed max-w-3xl">{fw.description}</p>
          {fw.effective && (
            <div className="flex items-center gap-1.5 text-sm text-rose-700 mt-4">
              <Calendar className="h-4 w-4" /> Effective: {fw.effective}
            </div>
          )}
          <p className="text-xs text-gray-500 font-mono mt-2">{fw.cite}</p>
        </div>
      </div>

      <div className="container max-w-5xl py-12">
        {/* Charter mapping */}
        <Card className="p-6 border-emerald-200 bg-emerald-50/40 mb-10">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-bold text-lg mb-1">Mapped to the CSOAI 52-Article Charter</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                This crosswalk shows how {fw.name}'s requirements map to the CSOAI Partnership Charter, where the gaps are,
                and which MEOK MCPs satisfy each clause. Free under CC BY 4.0. See the full{" "}
                <Link href="/crosswalks"><span className="text-emerald-700 underline cursor-pointer">crosswalk library</span></Link>{" "}
                or the <Link href="/charter"><span className="text-emerald-700 underline cursor-pointer">52-Article Charter</span></Link>.
              </p>
            </div>
          </div>
        </Card>

        {/* MCP tools that satisfy this */}
        {tag && tools.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Boxes className="h-6 w-6 text-emerald-600" /> {tools.length} MCP tools that satisfy {fw.name}</h2>
              <Link href={`/mcp?framework=${encodeURIComponent(tag)}`}>
                <Button variant="outline" size="sm">View all <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.slice(0, 9).map((t) => (
                <Link key={t.slug} href={`/mcp/${t.slug}`}>
                  <Card className="p-4 h-full hover:border-emerald-400 transition-colors cursor-pointer">
                    <h3 className="font-semibold text-sm mb-1">{t.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Card className="p-8 bg-gradient-to-br from-slate-900 to-emerald-900 text-white text-center">
          <h2 className="text-3xl font-bold mb-3">Get {fw.name}-ready</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Book a free 15-minute diagnostic and we'll map your AI systems to {fw.name} — then put the MCP fleet to work generating audit-ready evidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/contact">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">Book a free diagnostic <ArrowRight className="h-4 w-4 ml-2" /></Button>
            </a>
            {fw.pdfName && (
              <a href={`mailto:nicholas@csoai.org?subject=Request%20${encodeURIComponent(fw.name)}%20crosswalk%20PDF`}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10"><FileText className="h-4 w-4 mr-2" /> Request crosswalk PDF</Button>
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
