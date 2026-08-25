/**
 * Bottom estate bar — the OLD header mega-menu (Workspace, Software, Measure,
 * Agents, Surfaces), moved down so the top can be OpenRouter-style SaaS chrome
 * without dropping a page.
 *
 * Menus open upward. Hover (150ms) matches the old header so e2e still works;
 * click and keyboard also work. Not hover-only.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import { MASTER_NAVIGATION } from "@/data/masterMenu";
import type { MasterNavAction, MasterNavItem } from "@/data/masterMenu";
import { MegaDropdown, resolveLobbyItem } from "@/components/nav/NavMegaPanel";
import { lobbyHref, openLobby } from "@/lib/lobbyLink";
import { useSiteChromeHidden } from "@/lib/osChrome";

const HOVER_MS = 150;

/** Always-visible estate shortcuts (NEXT_300 #206). */
const ESTATE_QUICK = [
  { href: "/indices", label: "Indices" },
  { href: "/products", label: "Products" },
  { href: "/powered-by", label: "Powered-by" },
] as const;

function resolveMasterAction(action: MasterNavAction) {
  if (action.kind === "lobby") return resolveLobbyItem(action.pane, action.task);
  return { href: action.href, external: action.external };
}

function megaItemsFromMaster(submenu: MasterNavItem[]) {
  return submenu.map((sub) => {
    const resolved = resolveMasterAction(sub.action);
    return {
      name: sub.name,
      description: sub.description,
      href: resolved.href,
      external: "external" in resolved ? resolved.external : undefined,
      onClick: "onClick" in resolved ? resolved.onClick : undefined,
    };
  });
}

export function BottomEstateNav() {
  const hideChrome = useSiteChromeHidden();
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), HOVER_MS);
  };

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setSheet(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
      cancelClose();
    };
  }, []);

  if (hideChrome) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-200 bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-md"
    >
      <nav className="mx-auto flex h-12 max-w-[90rem] items-center gap-1 px-2 sm:px-4" aria-label="Site pages">
        <span className="hidden shrink-0 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:inline">
          Pages
        </span>

        <div className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex">
          {MASTER_NAVIGATION.map((item) => {
            const isOpen = open === item.name;
            return (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => {
                  cancelClose();
                  setOpen(item.name);
                }}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  className={`inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    isOpen ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={() => setOpen(isOpen ? null : item.name)}
                >
                  {item.name}
                  <ChevronUp className={`h-3.5 w-3.5 transition ${isOpen ? "" : "rotate-180"}`} />
                </button>
                {isOpen && (
                  <div className="absolute bottom-full left-0 z-[100] mb-2">
                    <MegaDropdown
                      groupName={item.name}
                      groupDescription={item.description}
                      icon={item.icon}
                      groupHref={item.groupLobby ? lobbyHref(item.groupLobby) : item.href}
                      groupOnClick={
                        item.groupLobby
                          ? (e) => {
                              e.preventDefault();
                              openLobby(item.groupLobby!);
                              setOpen(null);
                            }
                          : undefined
                      }
                      items={megaItemsFromMaster(item.submenu)}
                      onNavigate={() => setOpen(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="ml-auto hidden items-center gap-0.5 sm:flex" aria-label="Estate shortcuts">
          {ESTATE_QUICK.map((q) => (
            <a
              key={q.href}
              href={q.href}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
            >
              {q.label}
            </a>
          ))}
        </div>

        <button
          type="button"
          className="ml-auto rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 md:hidden sm:ml-0"
          aria-expanded={sheet}
          onClick={() => setSheet((v) => !v)}
        >
          {sheet ? "Close pages" : "All pages"}
        </button>

        <a
          href="#footer-site-map-heading"
          className="hidden shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 sm:inline"
        >
          Full map
        </a>
      </nav>

      {sheet && (
        <div className="max-h-[55vh] overflow-y-auto border-t border-slate-100 bg-white px-3 py-3 md:hidden">
          <div className="mb-3">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Estate</p>
            <ul className="mt-1">
              {ESTATE_QUICK.map((q) => (
                <li key={q.href}>
                  <a
                    href={q.href}
                    className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-emerald-50"
                    onClick={() => setSheet(false)}
                  >
                    {q.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {MASTER_NAVIGATION.map((item) => (
            <div key={item.name} className="mb-3">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wide text-emerald-700">{item.name}</p>
              <ul className="mt-1">
                {item.submenu.map((sub) => {
                  const resolved = resolveMasterAction(sub.action);
                  return (
                    <li key={sub.name}>
                      <a
                        href={resolved.href}
                        className="block rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-emerald-50"
                        onClick={(e) => {
                          if ("onClick" in resolved && resolved.onClick) resolved.onClick(e);
                          setSheet(false);
                        }}
                      >
                        {sub.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
