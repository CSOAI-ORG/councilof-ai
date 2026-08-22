import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_TAB, LOBBY_TABS, tabById, type LobbyTab, type LobbyTabId } from "./tabs";
import LobbyHeader, { ColiseumGlyph } from "./LobbyHeader";
import LobbyPaneRail, { PANEL_ID, tabDomId } from "./LobbyPaneRail";
import LobbySideRail from "./LobbySideRail";
import LobbyComposer from "./LobbyComposer";
import LobbyThread from "./LobbyThread";
import LobbyBoardPane from "./LobbyBoardPane";
import LobbyPlay from "./LobbyPlay";
import LobbyHome from "./LobbyHome";
import { useLobbyChat } from "./useLobbyChat";
import { useFocusTrap } from "./useFocusTrap";
import {
  ALPHA_DEFAULT, ALPHA_MAX, ALPHA_MIN, FOCUS, SP, SURFACE, SURFACE_LIFTED, TYPE,
  panelStyle, scrimStyle,
} from "./glass";
import type { LobbyIntent } from "@/lib/lobbyLink";
import { isEmbedNav, tabForPath, withEmbed } from "@/lib/embed";
import {
  LEFT_DEFAULT, LEFT_KEY, RIGHT_DEFAULT, RIGHT_KEY, readOpen, writeOpen,
} from "./rails";

export default function LobbyOverlay({ onClose, intent }: { onClose: () => void; intent?: LobbyIntent | null }) {
  return null;
}
