import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Download,
  LogIn,
  LogOut,
  Settings,
  UserRound,
  Wrench,
} from "lucide-react";
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

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function DashboardAccountMenu() {
  const { user, logout } = useAuth();
  const workspace = readWorkspaceName();
  const identity = user?.name || user?.email || "Guest";
  const [installPrompt, setInstallPrompt] =
    useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

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
        <DropdownMenuItem asChild>
          <Link
            href={dashboardViewHref("/settings", "Settings")}
            className="flex cursor-pointer items-center gap-2"
          >
            <Settings className="h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard?tab=tools"
            className="flex cursor-pointer items-center gap-2"
          >
            <Wrench className="h-4 w-4" /> MCP tools
          </Link>
        </DropdownMenuItem>
        {installPrompt ? (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              void installApp();
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Install Council OS
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        {user ? (
          <DropdownMenuItem onSelect={logout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link
              href="/login"
              className="flex cursor-pointer items-center gap-2"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
