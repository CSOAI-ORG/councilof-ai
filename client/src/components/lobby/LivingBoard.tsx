import CanonicalGspcBoard from "@/components/board/CanonicalGspcBoard";

/**
 * LivingBoard is the compact window onto the canonical board table. It keeps
 * the historic component name used by LobbyHome, but it no longer owns a
 * second fetch, snapshot fallback, row grammar, or board design.
 */

export default function LivingBoard({
  onOpenBoard,
  embedded,
}: {
  onOpenBoard: () => void;
  /** When true, hide the “open full board” CTA — already inside the board pane. */
  embedded?: boolean;
}) {
  return (
    <section aria-label="Living GSPC board" className="mb-8">
      <CanonicalGspcBoard
        compact={!embedded}
        onOpenBoard={embedded ? undefined : onOpenBoard}
      />
    </section>
  );
}
