import { Link } from "wouter";
import { LogIn, LogOut, Settings, UserRound, Wrench } from "lucide-react";
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
import { cn } from "@/lib/utils";

function CouncilGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9a9 5 0 0 1 18 0" />
      <path d="M3 9v9" /><path d="M21 9v9" />
      <path d="M7.5 9.6v8.4" /><path d="M12 9.9v8.1" /><path d="M16.5 9.6v8.4" />
      <path d="M2.5 18h19" />
      <path d="M9.6 18v-3.2a2.4 2.4 0 0 1 4.8 0V18" />
    </svg>
  );
}

export default function DashboardAccountMenu({ placement = "header" }: { placement?: "header" | "dock" }) {
  const { user, logout } = useAuth();
  const workspace = readWorkspaceName();
  const identity = user?.name || user?.email || "Guest";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={placement === "dock" ? "Open Council account and workspace menu" : "Open account and workspace menu"}
          title={`${identity} · ${workspace}`}
          className={cn(
            "inline-flex items-center justify-center border border-border bg-background text-foreground shadow-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700",
            placement === "dock"
              ? "fixed bottom-5 right-5 z-[69] h-12 w-12 rounded-full bg-emerald-800 text-white shadow-lg hover:bg-emerald-700"
              : "h-8 gap-2 rounded-lg px-2.5 text-xs font-medium",
          )}
        >
          {placement === "dock" ? <CouncilGlyph className="h-6 w-6" /> : <UserRound className="h-4 w-4" />}
          {placement === "header" ? <span className="hidden max-w-32 truncate sm:inline">{identity}</span> : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={placement === "dock" ? "top" : "bottom"} className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate">{identity}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{workspace}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex cursor-pointer items-center gap-2">
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard?tab=tools" className="flex cursor-pointer items-center gap-2">
            <Wrench className="h-4 w-4" /> MCP tools
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user ? (
          <DropdownMenuItem onSelect={logout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/login" className="flex cursor-pointer items-center gap-2">
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
