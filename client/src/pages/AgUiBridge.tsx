import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";

/**
 * AgUiBridge — AG-UI on the same brand domain, wired to the same chat contract.
 *
 * The static AG UI (15 axis tabs) lives in an iframe. This bridge:
 *   1. Keeps councilof.ai on /ag-ui (one domain, honest title).
 *   2. Proxies iframe chat → POST /api/chat (same contract as Council Lobby).
 *   3. Shows nav back to lobby, living board, and model registry.
 *
 * Doctrine: measurement, not certification. The bridge adds no claim.
 */
const IFRAME_SRC = "https://csoai-site.pages.dev/ag-ui";

type ChatReply = {
  answer?: string;
  reply?: string;
  state?: string;
  signature?: string;
};

export default function AgUiBridge() {
  const [wireOk, setWireOk] = useState<boolean | null>(null);

  useEffect(() => {
    document.title = "AG UI — Council of AI";
    return () => {
      document.title = "Council of AI — we measure, we sign, we re-attest";
    };
  }, []);

  // Probe AG-UI wire availability (optional power-user lane).
  useEffect(() => {
    fetch("/api/agui/session", { method: "GET" })
      .then((r) => setWireOk(r.ok))
      .catch(() => setWireOk(false));
  }, []);

  const proxyChat = useCallback(async (question: string): Promise<ChatReply> => {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
    });
    if (!r.ok) {
      return {
        answer:
          `The Council endpoint did not answer (HTTP ${r.status}). ` +
          `This is a local bridge message — no measurement was read.`,
        state: "deterministic",
        signature: "ag-ui bridge · endpoint unreachable",
      };
    }
    return (await r.json()) as ChatReply;
  }, []);

  // postMessage bridge: static ag-ui.html asks; we answer via /api/chat.
  useEffect(() => {
    const onMessage = async (e: MessageEvent) => {
      const data = e.data;
      if (!data || data.type !== "council-chat-ask" || typeof data.id !== "string") return;
      const question = String(data.question ?? "").trim();
      if (!question) return;

      const j = await proxyChat(question);
      const answer = j.answer ?? j.reply ?? "";
      e.source?.postMessage(
        {
          type: "council-chat-reply",
          id: data.id,
          answer,
          state: j.state,
          signature: j.signature,
        },
        { targetOrigin: "*" },
      );
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [proxyChat]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col bg-[#0b1020] text-white">
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            AG UI · measurement front door
          </p>
          <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">
            15 axes · chat · tools · same contract as the Lobby
          </h1>
        </div>
        <nav className="flex flex-wrap gap-2 text-xs font-semibold">
          <Link
            href="/?lobby=home"
            className="rounded-full border border-white/15 px-3 py-1.5 hover:border-emerald-400 hover:text-emerald-300"
          >
            Council Lobby
          </Link>
          <Link
            href="/gspc-scoreboard"
            className="rounded-full border border-white/15 px-3 py-1.5 hover:border-emerald-400 hover:text-emerald-300"
          >
            Living board
          </Link>
          <Link
            href="/models"
            className="rounded-full border border-white/15 px-3 py-1.5 hover:border-emerald-400 hover:text-emerald-300"
          >
            Models
          </Link>
          <Link
            href="/gspc-verify/"
            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-emerald-200"
          >
            Verify
          </Link>
        </nav>
        {wireOk === true ? (
          <span className="text-[10px] text-emerald-400">wire · live</span>
        ) : wireOk === false ? (
          <span className="text-[10px] text-amber-300/80" title="Set AGUI_WIRE_URL on Pages">
            wire · offline (chat still grounded)
          </span>
        ) : null}
      </header>

      <div className="min-h-0 flex-1">
        <iframe
          src={IFRAME_SRC}
          title="Council of AI — AG UI"
          className="block h-[calc(100vh-9rem)] w-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <footer className="border-t border-white/10 px-4 py-2 text-center text-[10px] text-white/50 sm:px-6">
        Chat in the window uses the same <code className="text-emerald-300">POST /api/chat</code> contract as
        Council Lobby · OpenRouter powers measurement runs, not public chat ·{" "}
        <Link href="/honesty/" className="text-emerald-400 hover:underline">
          honesty gate
        </Link>
      </footer>
    </div>
  );
}
