import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight, Sparkles, BookOpen, Building2, Scale, FileText, LayoutGrid } from "lucide-react";
import { Link } from "wouter";
import { openLobby } from "@/lib/openLobby";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  href: string;
  category: "page" | "tool" | "doc" | "action";
  icon?: React.ReactNode;
}

const SEARCH_INDEX: SearchResult[] = [
  { id: "home", title: "Home", description: "Council of AI homepage", href: "/", category: "page", icon: <Building2 className="w-4 h-4" /> },
  { id: "welcome", title: "Welcome", description: "Start here — orientation for new visitors", href: "/welcome", category: "page", icon: <Sparkles className="w-4 h-4" /> },
  { id: "platform", title: "Platform", description: "Multi-model AI council orchestration", href: "/platform", category: "page" },
  { id: "pricing", title: "Pricing", description: "Plans and pricing for Council of AI", href: "/pricing", category: "page" },
  { id: "docs", title: "Documentation", description: "API docs, guides, and references", href: "/docs", category: "page", icon: <BookOpen className="w-4 h-4" /> },
  { id: "academy", title: "Academy", description: "Learning hub for AI governance", href: "/academy", category: "page", icon: <BookOpen className="w-4 h-4" /> },
  { id: "sovereign-academy", title: "Sovereign Academy", description: "Enterprise AI training curriculum", href: "/sovereign-academy", category: "page" },
  { id: "blog", title: "Blog", description: "Insights and updates from Council of AI", href: "/blog", category: "page", icon: <FileText className="w-4 h-4" /> },
  { id: "about", title: "About", description: "Our mission and team", href: "/about", category: "page" },
  { id: "contact", title: "Contact", description: "Get in touch with us", href: "/contact", category: "page" },
  { id: "demo", title: "Live Demo", description: "Try Council of AI in action", href: "/demo", category: "tool", icon: <Sparkles className="w-4 h-4" /> },
  { id: "council-os", title: "Council OS", description: "Open the Council OS workspace", href: "/os", category: "tool", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "instruments", title: "Instruments Catalog", description: "Browse AI instruments and tools", href: "/instruments", category: "tool" },
  { id: "trust-center", title: "Trust Center", description: "Security, compliance, and trust", href: "/trust", category: "page", icon: <Scale className="w-4 h-4" /> },
  { id: "eu-ai-act", title: "EU AI Act Hub", description: "EU AI Act compliance resources", href: "/eu-ai-act", category: "doc" },
  { id: "governance", title: "Governance", description: "AI governance frameworks", href: "/governance", category: "page" },
  { id: "partners", title: "Partners", description: "Partner program and ecosystem", href: "/partners", category: "page" },
  { id: "careers", title: "Careers", description: "Join the Council of AI team", href: "/careers", category: "page" },
  { id: "press", title: "Press", description: "Press kit and media resources", href: "/press", category: "page" },
  { id: "legal", title: "Legal", description: "Terms, privacy, and legal docs", href: "/legal", category: "doc" },
  { id: "action-demo", title: "Start a Demo", description: "Launch the interactive demo", href: "/demo", category: "action", icon: <ArrowRight className="w-4 h-4" /> },
  { id: "action-pricing", title: "View Pricing", description: "See plans and get started", href: "/pricing", category: "action", icon: <ArrowRight className="w-4 h-4" /> },
  { id: "action-docs", title: "Read the Docs", description: "Browse documentation", href: "/docs", category: "action", icon: <ArrowRight className="w-4 h-4" /> },
  { id: "action-council-os", title: "Open Council OS", description: "Launch the Council OS workspace", href: "/os", category: "action", icon: <ArrowRight className="w-4 h-4" /> },
];

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? SEARCH_INDEX.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.includes(q)
        );
      })
    : SEARCH_INDEX.slice(0, 8);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, filtered, selectedIndex, onClose]);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  function handleSelect(item: SearchResult) {
    if (item.id === "council-os" || item.id === "action-council-os") {
      onClose();
      openLobby({ pane: "home" });
      return;
    }
    onClose();
  }

  if (!open) return null;

  const categoryLabel: Record<string, string> = {
    page: "Page",
    tool: "Tool",
    doc: "Docs",
    action: "Action",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, tools, docs..."
            className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-white/30"
            data-testid="global-search-input"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close search">
            <X className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2" data-testid="global-search-results">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-white/40 text-sm">No results for &quot;{query}&quot;</div>
          ) : (
            filtered.map((item, i) => {
              const isSelected = i === selectedIndex;
              const isLobby = item.id === "council-os" || item.id === "action-council-os";
              const inner = (
                <>
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-white/50">
                    {item.icon || <FileText className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{item.title}</div>
                    <div className="text-xs text-white/40 truncate">{item.description}</div>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-white/30 font-medium">{categoryLabel[item.category]}</span>
                </>
              );

              if (isLobby) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isSelected ? "bg-violet-500/20 text-white" : "hover:bg-white/5"
                    }`}
                    data-testid={`search-result-${item.id}`}
                  >
                    {inner}
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => handleSelect(item)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isSelected ? "bg-violet-500/20 text-white" : "hover:bg-white/5"
                  }`}
                  data-testid={`search-result-${item.id}`}
                >
                  {inner}
                </Link>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-[10px] text-white/30">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">↵</kbd> select</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
