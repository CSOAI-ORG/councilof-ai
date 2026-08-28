/**
 * LivingPagesMenu — mini-menu linking to all living pages + news.
 *
 * Living pages are routes that fetch data at render time from /api/gspc
 * or other live endpoints. No invented pages. No second door.
 *
 * Used by the public header and the OS shell.
 */

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Activity, ChevronDown, Newspaper, BarChart2, Shield, Swords, Database, Wrench, Eye, FileCheck } from "lucide-react";
import { FOCUS } from "@/components/lobby/glass";

interface LivingPage {
  name: string;
  href: string;
  icon: typeof Activity;
  note: string;
  badge?: "live" | "fetch";
}

const LIVING_PAGES: LivingPage[] = [
  { name: "The GSPC board", href: "/gspc-scoreboard", icon: BarChart2, note: "22·15·7 from GET /api/gspc", badge: "live" },
  { name: "Verify a card", href: "/gspc-verify", icon: Shield, note: "Ed25519 · SHA-256 · client-side", badge: "live" },
  { name: "The arena", href: "/gspc-arena", icon: Swords, note: "model vs model", badge: "live" },
  { name: "Measured models", href: "/models", icon: Database, note: "ranked by signed scores", badge: "fetch" },
  { name: "Measured results", href: "/benchmarks", icon: FileCheck, note: "every artefact-bound figure", badge: "fetch" },
  { name: "Published tools", href: "/tools", icon: Wrench, note: "MCP servers you can run", badge: "fetch" },
  { name: "Honesty gate", href: "/honesty", icon: Eye, note: "what we cannot yet measure", badge: "live" },
];

const NEWS_PAGES = [
  { name: "Blog", href: "/blog", note: "findings, corrections and notes" },
  { name: "Corrections (JSON)", href: "/api/corrections", note: "append-only ledger", external: true },
  { name: "Refutation ledger", href: "/refutation-ledger", note: "experiments that killed our theses" },
];

interface LivingPagesMenuProps {
  variant?: "header" | "inline";
  className?: string;
}

export default function LivingPagesMenu({ variant = "header", className = "" }: LivingPagesMenuProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = LIVING_PAGES.some((p) => location === p.href || location.startsWith(p.href + "/")) ||
    NEWS_PAGES.some((p) => !p.external && (location === p.href || location.startsWith(p.href + "/")));

  if (variant === "inline") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
            <Activity className="h-3.5 w-3.5" />
            Living pages
          </div>
          <div className="grid gap-1 sm:grid-cols-2">
            {LIVING_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className={`flex items-start gap-2 rounded-lg p-2 text-sm transition hover:bg-emerald-50 ${FOCUS} ${
                  location === page.href ? "bg-emerald-50 text-emerald-800" : "text-slate-700"
                }`}
              >
                <page.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">{page.name}</span>
                    {page.badge && (
                      <span className={`rounded px-1 py-0.5 text-[9px] font-bold uppercase ${
                        page.badge === "live"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {page.badge}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-slate-500">{page.note}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
            <Newspaper className="h-3.5 w-3.5" />
            News
          </div>
          <div className="grid gap-1 sm:grid-cols-2">
            {NEWS_PAGES.map((page) => (
              <a
                key={page.href}
                href={page.href}
                target={page.external ? "_blank" : undefined}
                rel={page.external ? "noreferrer" : undefined}
                className={`flex items-start gap-2 rounded-lg p-2 text-sm transition hover:bg-emerald-50 ${FOCUS} ${
                  !page.external && location === page.href ? "bg-emerald-50 text-emerald-800" : "text-slate-700"
                }`}
              >
                <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium">{page.name}</span>
                  {page.external && (
                    <span className="ml-1 text-[9px] font-bold uppercase text-slate-400">JSON</span>
                  )}
                  <div className="truncate text-[11px] text-slate-500">{page.note}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium transition ${FOCUS} ${
          isActive || open
            ? "bg-emerald-50 text-emerald-700"
            : "text-muted-foreground hover:bg-muted hover:text-emerald-700"
        }`}
      >
        <Activity className="h-4 w-4" />
        <span className="hidden sm:inline">Living</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-border bg-popover shadow-xl">
          {/* Living Pages */}
          <div className="border-b border-border px-3 py-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              <Activity className="h-3 w-3" />
              Living pages · fetch at render
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {LIVING_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-2.5 px-3 py-2 transition hover:bg-muted ${FOCUS} ${
                  location === page.href ? "bg-emerald-50" : ""
                }`}
              >
                <page.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{page.name}</span>
                    {page.badge && (
                      <span className={`rounded px-1 py-0.5 text-[8px] font-bold uppercase ${
                        page.badge === "live"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {page.badge}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{page.note}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* News */}
          <div className="border-t border-border">
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                <Newspaper className="h-3 w-3" />
                News
              </div>
            </div>
            <div className="pb-1">
              {NEWS_PAGES.map((page) => (
                <a
                  key={page.href}
                  href={page.href}
                  target={page.external ? "_blank" : undefined}
                  rel={page.external ? "noreferrer" : undefined}
                  onClick={() => !page.external && setOpen(false)}
                  className={`flex items-start gap-2.5 px-3 py-2 transition hover:bg-muted ${FOCUS}`}
                >
                  <Newspaper className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground">{page.name}</span>
                    {page.external && (
                      <span className="ml-1 text-[9px] font-bold uppercase text-muted-foreground">JSON</span>
                    )}
                    <div className="truncate text-[11px] text-muted-foreground">{page.note}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted px-3 py-2">
            <Link
              href="/os"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Open Council OS →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
