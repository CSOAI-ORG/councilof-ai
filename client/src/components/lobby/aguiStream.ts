/**
 * aguiStream — consume AG-UI SSE from /api/agui (RunPod wire proxy).
 *
 * Lane 2 in the lobby: streaming TEXT_MESSAGE_*, TOOL_CALL_*, HITL, CUSTOM.
 * Returns null when the wire is unconfigured (503) or unreachable — caller
 * falls back to POST /api/chat.
 */

export type AguiHitl = {
  reason: string;
  options: string[];
  sessionId: string;
};

export type AguiResult = {
  text: string;
  state: string;
  signature: string;
  sessionId: string;
  hitl?: AguiHitl;
};

export type AguiStreamHandlers = {
  onDelta?: (delta: string) => void;
  onToolResult?: (result: Record<string, unknown>) => void;
  onHitl?: (hitl: AguiHitl) => void;
  onFinished?: (ledgerLen: number) => void;
};

/** Probe whether the AG-UI proxy is configured (not 503 agui_wire_unconfigured). */
export async function aguiAvailable(): Promise<boolean> {
  try {
    const r = await fetch("/api/agui/session?handle=probe", { method: "POST" });
    if (r.status === 503) return false;
    return r.ok;
  } catch {
    return false;
  }
}

export function parseSseFrame(frame: string): { event: string; data: unknown } | null {
  const ev = frame.match(/^event: (\S+)/m);
  const dt = frame.match(/^data: (.+)$/m);
  if (!ev || !dt) return null;
  try {
    return { event: ev[1], data: JSON.parse(dt[1]) };
  } catch {
    return { event: ev[1], data: dt[1] };
  }
}

async function consumeSseBody(
  res: Response,
  sessionId: string,
  handlers: AguiStreamHandlers,
): Promise<{ parts: string[]; hitl?: AguiHitl; ledgerLen: number }> {
  if (!res.body) throw new Error("no SSE body");

  const parts: string[] = [];
  let hitl: AguiHitl | undefined;
  let ledgerLen = 0;

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";

    for (const frame of frames) {
      const parsed = parseSseFrame(frame);
      if (!parsed) continue;
      const { event, data } = parsed;
      const d = data as Record<string, unknown>;

      if (event === "TEXT_MESSAGE_CONTENT" && typeof d.delta === "string") {
        parts.push(d.delta);
        handlers.onDelta?.(d.delta);
      }
      if (event === "TOOL_CALL_RESULT" && d.result) {
        const live = d.result as Record<string, unknown>;
        handlers.onToolResult?.(live);
        if (live.accuracy != null) {
          const line = `\n\nLive GSPC ${String(live.axis ?? "axis")}: accuracy ${live.accuracy} (n=${live.n ?? "?"})`;
          parts.push(line);
          handlers.onDelta?.(line);
        }
      }
      if (event === "HITL") {
        hitl = {
          reason: String(d.reason ?? "consent required"),
          options: Array.isArray(d.options) ? (d.options as string[]) : ["approve", "deny"],
          sessionId,
        };
        const line = `\n\n⏸ Consent checkpoint: ${hitl.reason}`;
        parts.push(line);
        handlers.onDelta?.(line);
        handlers.onHitl?.(hitl);
      }
      if (event === "CUSTOM" && d.cell) {
        const cell = d.cell as Record<string, unknown>;
        const line = `\n\nSigned evidence cell: ${JSON.stringify(cell)}`;
        parts.push(line);
        handlers.onDelta?.(line);
      }
      if (event === "STATE_DELTA" && d.patch) {
        handlers.onDelta?.("");
      }
      if (event === "RUN_FINISHED" && d.ledger_len != null) {
        ledgerLen = Number(d.ledger_len);
        handlers.onFinished?.(ledgerLen);
      }
    }
  }

  return { parts, hitl, ledgerLen };
}

/** Open session → run wire stream. Question is forwarded; handle selects AG-UI lane. */
export async function runAguiSession(
  question: string,
  handlers: AguiStreamHandlers = {},
  handle = "lobby",
): Promise<AguiResult | null> {
  let sessionId: string;
  try {
    const open = await fetch(`/api/agui/session?handle=${encodeURIComponent(handle)}`, {
      method: "POST",
    });
    if (!open.ok) return null;
    const j = await open.json();
    sessionId = j?.session_id;
    if (!sessionId) return null;
  } catch {
    return null;
  }

  let res: Response;
  try {
    res = await fetch(`/api/agui/session/${sessionId}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, messages: [{ role: "user", content: question }] }),
    });
    if (!res.ok || !res.body) return null;
  } catch {
    return null;
  }

  const { parts, hitl, ledgerLen } = await consumeSseBody(res, sessionId, handlers);
  const text = parts.join("").trim();
  if (!text) return null;

  const sig = `agui · ${sessionId.slice(0, 8)}…`;
  return {
    text,
    state: hitl ? "agui-hitl" : "agui",
    signature: ledgerLen ? `${sig} · ${ledgerLen} ledger entries` : sig,
    sessionId,
    hitl,
  };
}

/** POST consent after HITL checkpoint — approve or deny. */
export async function submitAguiConsent(
  sessionId: string,
  decision: "approve" | "deny",
): Promise<boolean> {
  try {
    const r = await fetch(
      `/api/agui/session/${sessionId}/consent?decision=${decision}`,
      { method: "POST" },
    );
    return r.ok;
  } catch {
    return false;
  }
}

/** Resume run after consent (wire may emit remaining events). */
export async function resumeAguiAfterConsent(
  sessionId: string,
  handlers: AguiStreamHandlers = {},
): Promise<string> {
  try {
    const res = await fetch(`/api/agui/session/${sessionId}/run`, { method: "POST" });
    if (!res.ok || !res.body) return "";
    const { parts } = await consumeSseBody(res, sessionId, handlers);
    return parts.join("").trim();
  } catch {
    return "";
  }
}
