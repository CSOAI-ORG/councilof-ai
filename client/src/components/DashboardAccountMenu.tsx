import { Link } from "wouter";
import { LogOut, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { readWorkspaceName } from "@/components/lobby/workspace";
import { dashboardViewHref } from "@/lib/dashboardView";

/**
 * Tools audit, 6 Oct 2026: for a guest, "Settings" framed a login wall, "Sign in" offered an
 * account nothing needs, and "MCP tools" meant nothing (it lives under For developers). A guest
 * now reads one plain line; Settings and Sign out appear only for a signed-in user.
 */
export const GUEST_ACCOUNT_LINE =
  "No account needed: your look-ups stay in this browser.";

export default function DashboardAccountMenu() {
  const { user, logout } = useAuth();
  const workspace = readWorkspaceName();
  const identity = user?.name || user?.email || "Guest";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open account and workspace menu"
          title={`${identity} · ${workspace}`}
          className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          <UserRound className="h-4 w-4" />
          <span className="hidden max-w-32 truncate sm:inline">{identity}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate">{identity}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {workspace}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user ? (
          <>
            <DropdownMenuItem asChild>
              <Link
                href={dashboardViewHref("/settings", "Settings")}
                className="flex cursor-pointer items-center gap-2"
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <p
            className="px-2 py-1.5 text-xs leading-relaxed text-muted-foreground"
            data-testid="account-guest-line"
          >
            {GUEST_ACCOUNT_LINE}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
