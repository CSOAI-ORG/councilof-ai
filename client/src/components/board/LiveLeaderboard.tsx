import CanonicalGspcBoard from "./CanonicalGspcBoard";

/**
 * Historic homepage name for the canonical living board.
 *
 * Keeping this adapter avoids a homepage/layout rewrite while removing the
 * independent leaderboard implementation. The board door, lobby preview and
 * homepage now share one reader, one table grammar and one evidence-state
 * renderer. Carded records carry a published verification path; uncarded fleet
 * aggregates remain explicitly labelled. Empty means not measured, never zero.
 */
export default function LiveLeaderboard({
  className = "",
  showHumanPanel = true,
  heading = "The live board",
  defaultExpanded: _defaultExpanded = false,
  highlight = null,
  onSelect,
}: {
  className?: string;
  showHumanPanel?: boolean;
  heading?: string;
  /** Retained for caller compatibility; the canonical table always shows every filtered row. */
  defaultExpanded?: boolean;
  highlight?: string | null;
  onSelect?: (axis: string) => void;
}) {
  void _defaultExpanded;
  return (
    <CanonicalGspcBoard
      className={className}
      heading={heading}
      highlight={highlight}
      onSelect={onSelect}
      showHumanPanel={showHumanPanel}
    />
  );
}
