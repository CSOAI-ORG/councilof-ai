import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Bot,
  Building2,
  FileText,
  Globe2,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { lobbyHref } from "@/lib/lobbyLink";

const DOCK_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
  { id: "agents", label: "Agents", icon: Bot, href: "/agents" },
  { id: "industry", label: "Industry", icon: Building2, href: lobbyHref("industry") },
  { id: "atlas", label: "Atlas", icon: Globe2, href: lobbyHref("atlas") },
  { id: "governance", label: "Governance", icon: ShieldCheck, href: lobbyHref("governance") },
  { id: "system", label: "System Card", icon: FileText, href: lobbyHref("system") },
] as const;

type DockItemId = (typeof DOCK_ITEMS)[number]["id"];

const HINTS: Record<DockItemId, string> = {
  dashboard: "Live ops overview and next actions",
  chat: "Talk with Council agents",
  agents: "Browse and launch agent packs",
  industry: "Industry packs and vertical playbooks",
  atlas: "Standards and regulatory atlas",
  governance: "Approvals, policy, and oversight",
  system: "Model cards and system documentation",
};

function pathMatches(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

export default function SovereignDock() {
  const [location] = useLocation();
  const pathname = location.split("?")[0] || "/";
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState<DockItemId | null>(null);
  const [pulse, setPulse] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ id: string; text: string; tone: "info" | "success" | "warn" }>
  >([]);
  const lastPath = useRef(pathname);

  const activeId = useMemo(() => {
    const match = DOCK_ITEMS.find((item) => pathMatches(pathname, item.href));
    return match?.id ?? null;
  }, [pathname]);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    setPulse(true);
    const t = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; text?: string; tone?: string } | null;
      if (!data || data.type !== "sovereign-dock:toast" || typeof data.text !== "string") return;
      const tone =
        data.tone === "success" || data.tone === "warn" || data.tone === "info"
          ? data.tone
          : "info";
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setMessages((prev) => [{ id, text: data.text!, tone }, ...prev].slice(0, 3));
      window.setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, 4200);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const hint = hovered ? HINTS[hovered] : activeId ? HINTS[activeId] : "Sovereign OS dock";

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "transition-opacity duration-300",
          collapsed && "opacity-40 hover:opacity-100"
        )}
        data-testid="sovereign-dock"
      >
        <div className="pointer-events-auto w-full max-w-3xl">
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-emerald-400/25",
              "bg-[linear-gradient(180deg,rgba(6,24,18,0.92),rgba(4,14,12,0.96))]",
              "shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(16,185,129,0.08)]",
              "backdrop-blur-xl"
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 opacity-60",
                "bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.18),transparent_55%)]",
                pulse && "animate-pulse"
              )}
            />
            <div className="relative flex items-center gap-1 px-2 py-2 sm:gap-1.5 sm:px-3">
              <button
                type="button"
                onClick={() => setCollapsed((v) => !v)}
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-200 transition hover:bg-emerald-500/20 sm:inline-flex"
                aria-label={collapsed ? "Expand dock" : "Collapse dock"}
                data-testid="sovereign-dock-toggle"
              >
                <Sparkles className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-between gap-1 overflow-x-auto",
                  collapsed && "justify-center"
                )}
              >
                {DOCK_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = item.id === activeId;
                  return (
                    <Link key={item.id} href={item.href}>
                      <a
                        className={cn(
                          "group flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition sm:min-w-[4.25rem]",
                          active
                            ? "bg-emerald-400/15 text-emerald-100"
                            : "text-emerald-100/70 hover:bg-white/5 hover:text-emerald-50",
                          collapsed && !active && "opacity-50"
                        )}
                        onMouseEnter={() => setHovered(item.id)}
                        onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(item.id)}
                        onBlur={() => setHovered(null)}
                        data-testid={`sovereign-dock-${item.id}`}
                      >
                        <span
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-lg border transition",
                            active
                              ? "border-emerald-300/40 bg-emerald-400/20 shadow-[0_0_18px_rgba(52,211,153,0.35)]"
                              : "border-transparent bg-transparent group-hover:border-emerald-400/20"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        {!collapsed && (
                          <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                        )}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </div>

            {!collapsed && (
              <div className="border-t border-emerald-400/10 px-3 py-1.5">
                <p
                  className="truncate text-center text-[11px] text-emerald-100/65"
                  data-testid="sovereign-dock-hint"
                >
                  {hint}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="pointer-events-none fixed bottom-[5.5rem] right-3 z-[61] flex w-[min(20rem,calc(100vw-1.5rem))] flex-col gap-2 sm:bottom-24">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur-md",
                m.tone === "success" &&
                  "border-emerald-400/30 bg-emerald-950/85 text-emerald-50",
                m.tone === "warn" && "border-amber-400/30 bg-amber-950/85 text-amber-50",
                m.tone === "info" && "border-sky-400/30 bg-slate-950/85 text-sky-50"
              )}
              data-testid="sovereign-dock-toast"
            >
              <div className="flex items-start justify-between gap-2">
                <span>{m.text}</span>
                <button
                  type="button"
                  className="rounded p-0.5 text-current/70 hover:bg-white/10 hover:text-current"
                  onClick={() => setMessages((prev) => prev.filter((x) => x.id !== m.id))}
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
