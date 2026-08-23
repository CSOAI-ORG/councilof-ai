import { useEffect } from "react";
import { openLobby } from "@/lib/lobbyLink";

/**
 * /ag-ui — legacy URL that now opens Council OS (native AG-UI wire in the lobby).
 *
 * The old iframe to csoai-site.pages.dev is retired. Lane 2 SSE runs through
 * `/api/agui` → `AGUI_WIRE_URL` inside the lobby composer — not a separate surface.
 */
export default function AgUiBridge() {
  useEffect(() => {
    document.title = "Council OS — Council of AI";
    openLobby({
      pane: "home",
      prompt:
        "Walk the AG-UI wire — which instrument handles are live, and what does streaming return before consent?",
      aguiHandle: "lobby",
    });
    return () => {
      document.title = "Council of AI — we measure, we sign, we re-attest";
    };
  }, []);

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Opening Council OS…</h1>
      <p className="mt-3 text-sm text-slate-600 leading-relaxed">
        AG-UI now runs inside the lobby — streaming via <code className="text-xs">/api/agui</code> when the wire is
        configured. If the workspace did not open, use the Council badge in the header.
      </p>
      <button
        type="button"
        onClick={() =>
          openLobby({
            pane: "home",
            aguiHandle: "lobby",
          })
        }
        className="mt-6 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        Open Council OS
      </button>
    </div>
  );
}
