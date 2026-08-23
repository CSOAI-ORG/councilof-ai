/*
 * Council software (DSH) — same destinations as Council OS.
 *
 * Standalone /dashboard keeps this rail. When the OS frames this page
 * (?embed=1) the rail is dropped so there is only one tab list.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Settings,
  ChevronLeft,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { isEmbedded } from "@/lib/embed";
import { DASHBOARD_TABS } from "@/components/lobby/tabs";
import { LAYER0_LINKS, LAYER0_INFRA } from "@/lib/layer0Links";
import { openLobby } from "@/lib/lobbyLink";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const framed = isEmbedded();

  if (framed) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  const current = DASHBOARD_TABS.find((t) => t.path && location.startsWith(t.path));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 0 : 260 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden",
          sidebarCollapsed && "border-r-0",
        )}
      >
        <div className="flex items-center justify-between p-2 pt-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="flex items-center gap-2 w-full justify-start px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <img
                src="/csoai-icon.svg"
                alt=""
                className="w-8 h-8 rounded-lg"
              />
              <span className="font-semibold">Council software</span>
            </Button>
          </Link>
        </div>

        <nav
          aria-label="Council software destinations"
          className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
        >
          {DASHBOARD_TABS.map((tab) => {
            const isActive = !!tab.path && location.startsWith(tab.path);
            return (
              <Link key={tab.id} href={tab.path}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-accent text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="truncate">{tab.label}</span>
                </div>
              </Link>
            );
          })}
          <div className="my-3 border-t border-sidebar-border pt-3">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Eunomia
            </p>
            {LAYER0_LINKS.map((link) => {
              const isActive = location.startsWith(link.path);
              return (
                <Link key={link.path} href={link.path}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="my-3 border-t border-sidebar-border pt-3">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Trust floor
            </p>
            {LAYER0_INFRA.map((link) => {
              const isActive = location.startsWith(link.path);
              return (
                <Link key={link.path} href={link.path}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => openLobby({ pane: "home" })}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Open Council OS
          </button>
        </nav>
      </motion.aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Collapse or expand sidebar"
              className="h-8 w-8"
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  sidebarCollapsed && "rotate-180",
                )}
              />
            </Button>
            <span className="text-sm font-medium">
              {current?.label || "Council software"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle light/dark theme"
              className="h-8 w-8"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Link href="/settings">
              <Button aria-label="Settings" variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
