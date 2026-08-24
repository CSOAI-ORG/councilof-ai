/**
 * Shared mega-menu panel — header (master) and footer (full site map).
 */
import type { MouseEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { lobbyHref, openLobby, type LobbyTaskId } from "@/lib/lobbyLink";
import type { LobbyTabId } from "@/components/lobby/tabs";

export type MegaItem = {
  name: string;
  description: string;
  href: string;
  external?: boolean;
  onClick?: (e: MouseEvent) => void;
};

export function resolveLobbyItem(
  pane: LobbyTabId,
  task?: LobbyTaskId,
): { href: string; onClick: (e: MouseEvent) => void } {
  return {
    href: lobbyHref({ pane, task }),
    onClick: (e) => {
      e.preventDefault();
      openLobby({ pane, task });
    },
  };
}

export function MegaDropdown({
  groupName,
  groupDescription,
  icon: Icon,
  groupHref,
  groupOnClick,
  items,
  onNavigate,
  variant = "header",
}: {
  groupName: string;
  groupDescription: string;
  icon: LucideIcon;
  groupHref: string;
  groupOnClick?: (e: MouseEvent) => void;
  items: MegaItem[];
  onNavigate?: () => void;
  variant?: "header" | "footer";
}) {
  const isFooter = variant === "footer";

  return (
    <div
      className={
        isFooter
          ? "rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden"
          : "w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
      }
    >
      <div
        className={
          isFooter
            ? "px-4 py-3 border-b border-gray-200 bg-white"
            : "px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-100"
        }
      >
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm">{groupName}</div>
            <div className="text-xs text-gray-500 line-clamp-2">{groupDescription}</div>
          </div>
        </div>
      </div>
      <div className="py-1 max-h-64 overflow-y-auto">
        {items.map((sub) => (
          <a
            key={sub.name}
            href={sub.href}
            target={sub.external ? "_blank" : undefined}
            rel={sub.external ? "noreferrer" : undefined}
            className="block px-4 py-2 hover:bg-white/80 transition-colors group"
            onClick={(e) => {
              sub.onClick?.(e);
              onNavigate?.();
            }}
          >
            <div className="font-medium text-gray-800 group-hover:text-emerald-700 text-sm">
              {sub.name}
              {sub.external && (
                <span className="ml-1.5 text-[10px] uppercase tracking-wide text-gray-400">JSON</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{sub.description}</div>
          </a>
        ))}
      </div>
      <div className={isFooter ? "px-4 py-2 border-t border-gray-200 bg-white" : "px-4 py-2 bg-gray-50 border-t border-gray-100"}>
        <a
          href={groupHref}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          onClick={(e) => {
            groupOnClick?.(e);
            onNavigate?.();
          }}
        >
          View all {groupName.toLowerCase()} →
        </a>
      </div>
    </div>
  );
}
