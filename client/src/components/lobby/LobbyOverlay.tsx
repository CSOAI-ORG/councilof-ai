import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DEFAULT_TAB, LOBBY_TABS, tabById, type LobbyTab, type LobbyTabId } from "./tabs";
import LobbyHeader, { ColiseumGlyph } from "./LobbyHeader";
import LobbyPaneRail, { PANEL_ID, tabDomId } from "./LobbyPaneRail";
import LobbySideRail from "./LobbySideRail";
import LobbyComposer from "./LobbyComposer";
import LobbyThread from "./LobbyThread";
import LobbyWorkspace, { hubViewForTab } from "./LobbyWorkspace";
import { useLobbyChat } from "./useLobbyChat";
import { ALPHA_DEFAULT, ALPHA_MAX, ALPHA_MIN, FOCUS, SP, SURFACE_LIFTED, TYPE } from "./glass";
import type { LobbyIntent } from "@/lib/lobbyLink";
import { tabForPath } from "@/lib/embed";
import { setOsOpen, setOsDockWidth } from "@/lib/osChrome";
import { isWorkspaceTab } from "./lobbyNav";
import {
  LEFT_DEFAULT, LEFT_KEY, RIGHT_DEFAULT, RIGHT_KEY, readOpen, writeOpen,
} from "./rails";

export default function LobbyOverlay({ onClose, intent }: { onClose: () => void; intent?: LobbyIntent | null }) {
  return null;
}
