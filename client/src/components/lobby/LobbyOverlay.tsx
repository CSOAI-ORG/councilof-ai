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

const ALPHA_KEY = "coai.lobby.alpha";
const TAB_KEY = "coai.lobby.tab";
const SIZE_KEY = "coai.lobby.size";
const TITLE_ID = "coai-lobby-title";

function readAlpha(): number {
  try {
    const v = Number(localStorage.getItem(ALPHA_KEY));
    if (Number.isFinite(v) && v >= ALPHA_MIN && v <= ALPHA_MAX) return v;
  } catch {}
  return ALPHA_DEFAULT;
}

function readTab(): LobbyTabId {
  try {
    const v = localStorage.getItem(TAB_KEY);
    if (v && LOBBY_TABS.some((t) => t.id === v)) return v as LobbyTabId;
  } catch {}
  return DEFAULT_TAB;
}

function readSize(): "comfortable" | "full" {
  try {
    const v = localStorage.getItem(SIZE_KEY);
    if (v === "comfortable" || v === "full") return v;
  } catch {}
  return "full";
}

function FocusSentinel({ onFocus }: { onFocus: () => void }) {
  return <div data-focus-sentinel tabIndex={0} aria-hidden="true" onFocus={onFocus} className="sr-only" />;
}

export default function LobbyOverlay({ onClose, intent }: { onClose: () => void; intent?: LobbyIntent | null }) {
  return null;
}

export { ColiseumGlyph };
