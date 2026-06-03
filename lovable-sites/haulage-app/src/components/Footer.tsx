import { ArrowRight, Github, Globe, Mail, Package } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const trades = [
    { label: "Plant Hire", href: "https://planthire.ai", external: true },
    { label: "Grab Hire", href: "https://grabhire.ai", external: true },
    { label: "Muckaway", href: "https://muckaway.ai", external: true },
    { label: "All 9 MCPs", href: "/mcps", external: false },
  ];

  const stack = [
    { label: "MEOK AI Labs", href: "https://meok.ai" },
    { label: "Council of AI", href: "https://councilof.ai" },
    { label: "MEOK Compliance", href: "https://meok-compliance.vercel.app" },
    { label: "Attestation API", href: "https://meok-attestation-api.vercel.app" },
  ];

  const links = [
    { label: "Home", href: "/" },
    { label: "MCPs", href: "/mcps" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <footer className="bg-tr8-charcoal border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-7 h-7 text-primary" />
              <div className="font-display text-2xl font-bold">
                <span className="text-foreground">Haulage</span>
                <span className="text-primary">.app</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              The umbrella platform for UK trade logistics + compliance. Built solo by MEOK AI Labs in London.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/CSOAI-ORG"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary transition-colors group"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground" />
              </a>
              <a
                href="https://meok.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary transition-colors group"
                aria-label="MEOK AI Labs"
              >
                <Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground" />
              </a>
            </div>
          </div>

          {/* Trade verticals */}
          <div>
            <h3 className="font-display text-lg font-bold mb-6 text-foreground">Trade Verticals</h3>
            <ul className="space-y-3">
              {trades.map((link) =>
                link.external ? (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* MEOK stack */}
          <div>
            <h3 className="font-display text-lg font-bold mb-6 text-foreground">MEOK Stack</h3>
            <ul className="space-y-3">
              {stack.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links + contact */}
          <div>
            <h3 className="font-display text-lg font-bold mb-6 text-foreground">Site</h3>
            <ul className="space-y-3 mb-6">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href="mailto:nicholas@meok.ai"
              className="flex items-center gap-3 text-primary font-display hover:text-accent transition-colors"
            >
              <Mail className="w-5 h-5" />
              nicholas@meok.ai
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm text-center md:text-left">
              © {new Date().getFullYear()} MEOK AI Labs · CSOAI LTD · Companies House 16939677.
            </p>
            <p className="text-muted-foreground text-xs">
              MIT-licensed · Plant · Grab · Muckaway · 9 MCPs
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
