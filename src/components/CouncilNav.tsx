"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const councilLinks = [
  { href: "/council", label: "Overview" },
  { href: "/council/dome", label: "Dome" },
  { href: "/council/maps", label: "Maps" },
  { href: "/council/compliance", label: "Compliance" },
  { href: "/council/law", label: "Law" },
  { href: "/council/sigil", label: "Sigil" },
];

const globalLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/article-50-kit", label: "Article 50 Kit" },
  { href: "/mcp-packs", label: "MCP Packs" },
  { href: "/hives", label: "Hives" },
  { href: "/switch", label: "Switch" },
  { href: "/transfer", label: "Transfer" },
  { href: "/os", label: "OS" },
  { href: "/intelligence", label: "Intelligence" },
  { href: "/town", label: "Town" },
  { href: "/simulation", label: "Simulation" },
  { href: "/sovereign-town", label: "Sovereign Town" },
  { href: "/kimi-bridge", label: "Kimi Bridge" },
  { href: "/compare", label: "Compare" },
  { href: "/verify", label: "Verify" },
  { href: "/data-catalog", label: "Data Catalog" },
  { href: "/case-studies", label: "Case Studies" },
  { href: "/connect", label: "Connectors" },
  { href: "/council-of-experts", label: "Experts" },
  { href: "/github-action", label: "GitHub Action" },
  { href: "/api-docs", label: "Docs" },
  { href: "/contact", label: "Contact" },
];

function NavLink({
  href,
  label,
  active,
  external,
  onClick,
}: {
  href: string;
  label: string;
  active?: boolean;
  external?: boolean;
  onClick?: () => void;
}) {
  const className = `rounded-lg px-3 py-1.5 text-sm transition whitespace-nowrap ${
    active
      ? "bg-emerald-500/20 text-emerald-300"
      : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {label}
    </Link>
  );
}

export default function CouncilNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-white">
          <span className="text-xl text-emerald-400">CSOAI</span>
          <span className="hidden text-xs uppercase tracking-widest text-slate-500 sm:inline">Council</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-1 text-sm md:flex">
          {councilLinks.map((l) => (
            <NavLink
              key={l.href}
              href={l.href}
              label={l.label}
              active={pathname === l.href || pathname.startsWith(`${l.href}/`)}
            />
          ))}
          <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
          {globalLinks.slice(0, 8).map((l) => (
            <NavLink
              key={l.href}
              href={l.href}
              label={l.label}
              active={pathname === l.href || pathname.startsWith(`${l.href}/`)}
            />
          ))}
          <NavLink href="https://app.csoai.org/opengridworks" label="Atlas →" external />
          <NavLink href="https://councilof.ai" label="Run a Council →" external />
          <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
          <NavLink href="https://app.csoai.org/login" label="Log In" external />
          <NavLink href="https://app.csoai.org/signup" label="Get Started" external />
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-white hover:bg-white/5 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="max-h-[80vh] overflow-y-auto border-t border-white/5 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <p className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Council</p>
            {councilLinks.map((l) => (
              <NavLink
                key={l.href}
                href={l.href}
                label={l.label}
                active={pathname === l.href || pathname.startsWith(`${l.href}/`)}
                onClick={() => setOpen(false)}
              />
            ))}
            <p className="mt-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Product</p>
            {globalLinks.map((l) => (
              <NavLink
                key={l.href}
                href={l.href}
                label={l.label}
                active={pathname === l.href || pathname.startsWith(`${l.href}/`)}
                onClick={() => setOpen(false)}
              />
            ))}
            <NavLink
              href="https://app.csoai.org/opengridworks"
              label="Atlas →"
              external
              onClick={() => setOpen(false)}
            />
            <NavLink
              href="https://councilof.ai"
              label="Run a Council →"
              external
              onClick={() => setOpen(false)}
            />
            <p className="mt-2 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Account</p>
            <NavLink
              href="https://app.csoai.org/login"
              label="Log In"
              external
              onClick={() => setOpen(false)}
            />
            <NavLink
              href="https://app.csoai.org/signup"
              label="Get Started"
              external
              onClick={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </nav>
  );
}
