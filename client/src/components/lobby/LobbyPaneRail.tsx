import LobbyPaneTabs, { NAV_ID } from "./LobbyPaneTabs";
import { type LobbyTab, type LobbyTabId } from "./tabs";
import { CONTROL, SP, SURFACE, TYPE, panelStyle } from "./glass";

/**
 * LobbyPaneRail — the LEFT rail: the pane / destination list.
 *
 * A real WAI-ARIA vertical tablist via LobbyPaneTabs. ROVING TABINDEX, ↑/↓
 * between panes, Home/End jump. id="navigation" satisfies skip-to-nav.
 */

export { PANEL_ID, tabDomId } from "./LobbyPaneTabs";

export default function LobbyPaneRail({
  tabId,
  onSelect,
  onMinimise,
  override = false,
}: {
  tabId: LobbyTabId;
  onSelect: (t: LobbyTab) => void;
  onMinimise?: () => void;
  override?: boolean;
}) {
  return (
    <nav
      id={NAV_ID}
      aria-label="Council OS destinations"
      className={`${SURFACE} ${SP.rail} hidden w-52 shrink-0 flex-col sm:flex lg:w-60`}
      style={panelStyle}
      tabIndex={-1}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2 px-1">
        <h2 className={TYPE.section}>Destinations</h2>
        {onMinimise && (
          <button
            type="button"
            onClick={onMinimise}
            aria-label="Hide the destinations pane"
            className={`${CONTROL} ${SP.chip} text-[11px] font-semibold`}
          >
            Hide
          </button>
        )}
      </div>

      <LobbyPaneTabs
        tabId={tabId}
        onSelect={onSelect}
        orientation="vertical"
        override={override}
        variant="rail"
      />

      <p className={`shrink-0 pt-4 ${TYPE.fine}`} title="Nothing here is a copy of a page, so nothing here can drift from one.">
        Each pane frames the real route — never a copy of it.
      </p>
    </nav>
  );
}
