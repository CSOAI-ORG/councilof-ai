# Dashboard consolidation register — 4 September 2026

Scope: the dashboard / Council workspace surfaces and their direct aliases. This is an implementation register, not a proposal for deleting public content.

## Evidence and disposition

| Surface | Current source evidence | Disposition |
|---|---|---|
| `/dashboard` | `Dashboard.tsx` inside `DashboardLayout.tsx`; query tabs resolve through `DashboardPane.tsx` | **Canonical in-shell surface.** The initial canvas is conversational; existing account metrics remain in an expandable overview. |
| Dashboard query panes | `DASHBOARD_TABS` + `DashboardPane.PANES` | **Canonical in-shell destinations.** A selection changes the centre canvas while the composer and right rail stay mounted. |
| GSPC board | Homepage and dashboard both render `HomeGspcBoard`, which reads `GET /api/gspc` | **Canonical shared data/view.** Dashboard label is `GSPC`; no second board or copied score set. |
| `/settings` and other pages already wrapping `DashboardLayout` | Page component supplies content to the same shell | **Canonical in-shell supporting surfaces.** Header and bottom-right account/workspace access come from the shared layout. |
| `/os` | `App.OsRoute` redirects ordinary loads to `/dashboard?tab=…` | **Merge/redirect candidate already merged.** Keep redirect compatibility. |
| `/os?embed=1` and `/os?legacy=1` | `OsRoute` intentionally retains `OsLauncher` for embedded AG-UI/harness consumers | **Supporting compatibility surface.** Do not market as a second dashboard; migrate remaining useful functions before retirement. |
| `CouncilLobby` / `LobbyOverlay` | Global launcher still opens a full competing workspace | **Retire candidate in product destinations, supporting launcher elsewhere.** Suppressed wherever `DashboardLayout` is mounted; content components are reused in-shell. |
| `OsHeader` + `OsLauncher` top control/status bar | Only used by the compatibility route above | **Merge candidate.** Do not mount in the dashboard. Keep until embedded consumers are audited. |
| `OsShell` | Used by the alternate `/home-v3` route, not `/dashboard` | **Supporting/retire candidate.** It is not the product shell; useful conversation behavior belongs in the canonical workspace. |
| `/gspc-scoreboard`, `/rankings`, `/leaderboard` | `App.tsx` redirects each into a dashboard query pane | **Redirect aliases.** Keep deep links; do not create standalone boards. |
| Hugging Face GSPC record | Linked from the board as the signed public mirror | **Supporting document/deep link.** It is not a second interactive board. |
| `/api/gspc` | Live board authority used by homepage and dashboard | **Canonical data source.** |
| `/mcp` | JSON-RPC `tools/list` returns the runtime's free and paid capability definitions | **Canonical capability source.** Dashboard fetches this list at runtime and shows no fallback tools when it is unreachable. |
| Long product/tool pages mounted by `DashboardPane` | Existing working React pages | **Supporting documentation inside the functional canvas.** Preserve them; progressively move explanation below functional controls rather than deleting it. |

## First vertical slice

- One persistent dashboard workspace now owns the conversation, centre canvas, bottom composer, live MCP tool picker, and right rail.
- Selecting a returned MCP tool opens its existing functional pane; unknown future tools open the Tools pane instead of receiving a fabricated workflow.
- The right rail exposes local workspace truth, session activity, live task checks, and session-only chat history.
- The existing dashboard metrics remain available under **Account overview and recent measurements**.
- The global Council overlay and marketing chrome no longer mount on top of any `DashboardLayout` destination, including Settings.

## Remaining consolidation work

- Replace the notification settings page's legacy tRPC dependency when the account API is consolidated; it now uses `DashboardLayout`, but its data layer remains legacy.
- Audit all older pages that wrap `DashboardLayout` for double `<main>` semantics and normalize them without rewriting their product content.
- Retire the `legacy=1` escape only after every embedded AG-UI consumer is identified and covered by tests.
- Replace route-page documentation-first tops with compact functional headers one pane at a time; do not bulk-delete content.
