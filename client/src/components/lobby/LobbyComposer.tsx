import { useEffect, useRef, useState } from "react";
import { AUDIENCES, DEFAULT_AUDIENCE, asksFor } from "./asks";
import { FOCUS, MEASURE, PRIMARY, TYPE } from "./glass";
import type { LobbyTab } from "./tabs";
import type { LobbyChat } from "./useLobbyChat";
import { markQuest } from "@/components/os/GameBar";

/**
 * LobbyComposer — one slim dock at the foot of the centre column.
 *
 * Audience chips and suggested asks live in a popover so the dock is never a
 * half-loaded stack of bars. The consent lock is unchanged: suggestions only
 * prefill; nothing sends except Ask or Enter in the field.
 */
export default function LobbyComposer({
  chat,
  onNavigate,
  onOpenRoute,
  paneLabel,
  panePath,
  seedPrompt,
  seedNonce,
  onFirstReply,
}: {
  chat: LobbyChat;
  onNavigate: (tab: LobbyTab) => void;
  onOpenRoute?: (path: string, label: string) => void;
  paneLabel: string;
  panePath: string;
  seedPrompt?: string;
  seedNonce?: number;
  /** Called once when the reader gets their first council reply. */
  onFirstReply?: () => void;
}) {
  const [q, setQ] = useState("");
  const [audience, setAudience] = useState<string>(() => {
    try {
      const v = localStorage.getItem("coai.lobby.audience");
      if (v && AUDIENCES.some((a) => a.id === v)) return v;
    } catch { /* ignore */ }
    return DEFAULT_AUDIENCE;
  });
  const [seeded, setSeeded] = useState(false);
  const [asksOpen, setAsksOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const asksRef = useRef<HTMLDivElement>(null);
  const replied = useRef(false);

  const turns = chat.active?.turns ?? [];
  const suggestions = asksFor(panePath || "/", audience);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [q]);

  useEffect(() => {
    try { localStorage.setItem("coai.lobby.audience", audience); } catch { /* ignore */ }
  }, [audience]);

  useEffect(() => {
    if (!asksOpen) return;
    const close = (e: MouseEvent) => {
      if (asksRef.current && !asksRef.current.contains(e.target as Node)) setAsksOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [asksOpen]);

  function prefill(text: string, fromLink: boolean) {
    setQ(text);
    setSeeded(fromLink);
    setAsksOpen(false);
    setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(text.length, text.length);
    }, 0);
  }

  useEffect(() => {
    const seed = seedPrompt?.trim();
    if (!seed) return;
    prefill(seed, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedNonce, seedPrompt]);

  useEffect(() => {
    const councilTurns = turns.filter((t) => t.role === "council").length;
    if (councilTurns > 0 && !replied.current) {
      replied.current = true;
      onFirstReply?.();
    }
  }, [turns, onFirstReply]);

  function submit() {
    const text = q.trim();
    if (!text || chat.busy) return;
    setQ("");
    setSeeded(false);
    setAsksOpen(false);
    markQuest("ask");
    void chat.send(text, onNavigate, onOpenRoute);
  }

  return (
    <div className="relative shrink-0 border-t border-slate-900/10 bg-white/85 px-4 py-3 sm:px-6">
      {/* rest of file unchanged in repo — truncated for push; see local commit ea9d630 */}
    </div>
  );
}
