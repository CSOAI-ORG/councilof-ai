import type { RouterEntry } from "@/data/eunomia-router";
import { openLobby } from "@/lib/lobbyLink";

export type InstrumentView = "overview" | "api" | "mcp" | "agui" | "playground";

export function routerPath(item: RouterEntry): string {
  return `/instruments/${item.layer}/${item.slug}`;
}

export function instrumentViewHref(item: RouterEntry, view: InstrumentView): string {
  const base = routerPath(item);
  if (view === "overview") return base;
  return `${base}?view=${view}`;
}

export type InstrumentApiDoc = {
  endpoint: string;
  method: string;
  curl: string;
  aguiSession: string;
  aguiRun: string;
  mcpTool: string;
  mcpServer: string;
  eunomiaUri: string;
};

export function apiDocFor(item: RouterEntry): InstrumentApiDoc {
  const host = "https://councilof.ai";
  const tool = item.mcpSlug?.replace(/-mcp$/, "").replace(/-/g, ".") ?? item.id;

  if (item.endpoint?.includes("/api/gspc")) {
    return {
      eunomiaUri: item.eunomiaUri,
      endpoint: `${host}/api/gspc`,
      method: "GET",
      curl: `curl -sS ${host}/api/gspc | jq '.axes[] | select(.axis=="governance")'`,
      aguiSession: `curl -sS -X POST ${host}/api/agui/session?handle=lobby`,
      aguiRun: `curl -sS -N -X POST ${host}/api/agui/session/{session_id}/run`,
      mcpTool: "gspc.axes",
      mcpServer: `${host}/.well-known/mcp.json`,
    };
  }

  if (item.layer === "law" || item.id.includes("provenance")) {
    return {
      eunomiaUri: item.eunomiaUri,
      endpoint: `${host}/.well-known/did.json`,
      method: "GET",
      curl: `curl -sS ${host}/.well-known/did.json`,
      aguiSession: `curl -sS -X POST ${host}/api/agui/session?handle=verify`,
      aguiRun: `curl -sS -N -X POST ${host}/api/agui/session/{session_id}/run`,
      mcpTool: tool,
      mcpServer: `${host}/.well-known/mcp.json`,
    };
  }

  const ep = item.endpoint ?? "/api/chat";
  const isGet = ep.startsWith("GET ");
  const path = ep.replace(/^GET /, "");

  return {
    eunomiaUri: item.eunomiaUri,
    endpoint: `${host}${path.startsWith("/") ? path : `/${path}`}`,
    method: isGet ? "GET" : "POST",
    curl: isGet
      ? `curl -sS ${host}${path}`
      : `curl -sS -X POST ${host}/api/chat -H 'Content-Type: application/json' -d '{"messages":[{"role":"user","content":"..."}]}'`,
    aguiSession: `curl -sS -X POST ${host}/api/agui/session?handle=${item.slug}`,
    aguiRun: `curl -sS -N -X POST ${host}/api/agui/session/{session_id}/run`,
    mcpTool: tool,
    mcpServer: `${host}/.well-known/mcp.json`,
  };
}

/** Open Council OS with instrument slug as AG-UI handle — consent lock on prompt. */
export function openInstrumentInLobby(item: RouterEntry) {
  openLobby({
    pane: "tools",
    prompt:
      item.runPrompt ??
      `Route through ${item.name} (${item.eunomiaUri}) — what does each capability return?`,
    ctx: item.name,
    aguiHandle: item.slug,
  });
}
