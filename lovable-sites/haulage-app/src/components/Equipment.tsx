import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mcps } from "@/data/mcps";

const Equipment = () => {
  return (
    <section id="mcps" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-primary font-display uppercase tracking-wider text-sm">The Nine MCPs</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            Compliance, as <span className="text-gradient">Callable Tools</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Each MCP is a tiny, focused server — install via pip, call from Claude or any MCP-aware agent, get signed attestations back. All MIT-licensed, all on PyPI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mcps.map((mcp) => {
            const Icon = mcp.icon;
            return (
              <div
                key={mcp.id}
                className="card-industrial p-6 group hover:border-primary transition-all duration-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                    {mcp.tools} tools
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold mb-2 break-all">
                  {mcp.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {mcp.tagline}
                </p>
                <code className="block text-xs bg-secondary/30 text-foreground px-3 py-2 rounded mb-4 break-all">
                  {mcp.install}
                </code>
                <div className="flex flex-wrap gap-2 mb-4">
                  {mcp.pairs.map((d) => (
                    <span key={d} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <a
                    href={mcp.pypi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-xs uppercase tracking-wider text-center py-2 border border-border rounded hover:border-primary hover:text-primary transition-colors"
                  >
                    PyPI
                  </a>
                  {mcp.starterStripe ? (
                    <a
                      href={mcp.starterStripe}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs uppercase tracking-wider text-center py-2 bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                    >
                      {mcp.starterPrice} <ExternalLink className="inline w-3 h-3 ml-1" />
                    </a>
                  ) : (
                    <a
                      href={`https://${mcp.pairs[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs uppercase tracking-wider text-center py-2 border border-primary/30 text-primary rounded hover:bg-primary/10 transition-colors"
                    >
                      Try {mcp.pairs[0]} <ExternalLink className="inline w-3 h-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Want all nine + the SaaS umbrella? Pro tier bundles them.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/mcps">
              See full MCP catalogue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Equipment;
