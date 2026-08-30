/**
 * OsHeader — the OpenRouter-style product header for Council OS.
 *
 * A compact utility bar that owns the /os product frame:
 * - The mark and Council OS name
 * - Inner nav doors: Board / Verify / Space / Assess / Harness
 * - User account controls (Sign in or user menu if authenticated)
 *
 * A harness panel (`?embed=1`) keeps the instrument tabs and drops Exit OS,
 * Sign in, and the marketing logo link so the pane is chrome, not a nested site.
 *
 * This header is mounted ONLY on /os and its hops (/ag-ui /chat /console /sov-os).
 * It replaces the marketing site header — one product frame, not marketing chrome.
 *
 * Navigation uses URL params (?lobby=board, etc.) which OsLauncher reads.
 * Door hops preserve embed=1 when already a panel.
 */

import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, Settings, BookOpen, BarChart3, Award, DoorOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FOCUS } from "@/components/lobby/glass";
import { DOORS, DOOR_TO_LOBBY, LOBBY_TO_DOOR, type DoorId } from "@/components/os/doors";
import { isEmbedded } from "@/lib/embed";
import { osDoorHref } from "@/lib/lobbyLink";

function ColiseumGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9a9 5 0 0 1 18 0" />
      <path d="M3 9v9" />
      <path d="M21 9v9" />
      <path d="M7.5 9.6v8.4" />
      <path d="M12 9.9v8.1" />
      <path d="M16.5 9.6v8.4" />
      <path d="M2.5 18h19" />
      <path d="M9.6 18v-3.2a2.4 2.4 0 0 1 4.8 0V18" />
    </svg>
  );
}

export default function OsHeader() {
  const [location, setLocation] = useLocation();
  const search = useSearch();
  const { user, logout } = useAuth();

  const params = new URLSearchParams(search);
  const lobby = params.get("lobby");
  const currentDoor =
    lobby && lobby !== "home" ? LOBBY_TO_DOOR[lobby] ?? null : null;
  const panel = isEmbedded();
  const atHome = location === "/" || location === "";

  const navigateToDoor = (doorId: DoorId) => {
    setLocation(osDoorHref(DOOR_TO_LOBBY[doorId], search, atHome ? "/" : "/os"));
  };

  const mark = (
    <>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
        <ColiseumGlyph className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold text-slate-900">Council OS</span>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
        {/* Logo + name. A harness panel must not break out to marketing /. */}
        <div className="flex items-center gap-6">
          {panel || atHome ? (
            <span className="flex items-center gap-2">{mark}</span>
          ) : (
            <Link href="/" className="flex items-center gap-2 transition hover:opacity-90">
              {mark}
            </Link>
          )}

          {/* Door tabs — desktop */}
          <nav
            aria-label="Council OS sections"
            className="hidden items-center gap-1 sm:flex"
          >
            {DOORS.map((door) => {
              const active = currentDoor === door.id;
              return (
                <button
                  key={door.id}
                  onClick={() => navigateToDoor(door.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${FOCUS} ${
                    active
                      ? "bg-emerald-100 text-emerald-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {door.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side — exit + verify + account. Hidden on a harness panel. */}
        <div className="flex items-center gap-2">
          {!panel && (
          <>
          <button
            type="button"
            onClick={() => document.getElementById("os-chat")?.focus()}
            className={`rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 ${FOCUS}`}
            title="Chat is Council OS — the AG UI"
          >
            Chat
          </button>
          {!atHome && (
          <Link
            href="/"
            aria-label="Council OS home"
            className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}
          >
            <DoorOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Home</span>
            <span className="sm:hidden">Home</span>
          </Link>
          )}

          {/* Play + Train + Verify — product doors inside the OS chrome */}
          <a
            href="/os?lobby=play"
            className={`hidden rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:inline-flex ${FOCUS}`}
          >
            Play
          </a>
          <a
            href="/compliance-training-world/catalog.html"
            className={`hidden rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:inline-flex ${FOCUS}`}
            title="Industry quests — training attestation, never certification"
          >
            Train
          </a>
          <a
            href="/gspc-verify"
            className={`hidden rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:inline-flex ${FOCUS}`}
          >
            Verify free
          </a>

          {/* User account */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name || "User"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/dashboard" className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/my-courses" className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4" />
                    My Courses
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/certificates" className="flex items-center">
                    <Award className="mr-2 h-4 w-4" />
                    Certificates
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Sign in
              </Button>
            </Link>
          )}
          </>
          )}
        </div>
      </nav>

      {/* Mobile door tabs */}
      <nav
        aria-label="Council OS sections (mobile)"
        className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:hidden"
      >
        {DOORS.map((door) => {
          const active = currentDoor === door.id;
          return (
            <button
              key={door.id}
              onClick={() => navigateToDoor(door.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${FOCUS} ${
                active
                  ? "bg-emerald-100 text-emerald-900"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {door.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
