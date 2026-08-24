/**
 * Site navigation — the full estate IA (formerly the header mega menu).
 */
import type { LucideIcon } from "lucide-react";
import { POSITIONING } from "@/lib/positioning";
import type { LobbyTabId } from "@/components/lobby/tabs";
import type { LobbyTaskId } from "@/lib/lobbyLink";
import { BarChart2, BookMarked, Building2, GraduationCap, Landmark, ShieldCheck } from "lucide-react";

export interface SiteNavItem {
  name: string;
  href: string;
  description: string;
  external?: boolean;
  lobby?: { pane: LobbyTabId; task?: LobbyTaskId };
}

export interface SiteNavGroup {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  submenu: SiteNavItem[];
}

export const SITE_NAVIGATION: SiteNavGroup[] = [
  {
    name: "Measure",
    href: "/gspc-scoreboard",
    icon: BarChart2,
    description: "The instrument and its board",
    submenu: [
      { name: "East-West", href: "/east-west", description: "One signed measurement, four regimes mapped. Mapping is not a determination." },
      { name: "The GSPC board", href: "/gspc-scoreboard", description: "The living board — measured axes, empty cells empty. Counts from GET /api/gspc" },
    ],
  },
];
