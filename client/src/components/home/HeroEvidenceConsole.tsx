import { useGspcBoard } from "@/components/board/useGspcBoard";
import { boardTiles, type Tile, type TileState } from "@/components/home/LiveBoardGlance";
import { axisHref } from "@/lib/axisHref";

const STATE_LABEL: Record<TileState, string> = {
  SEPARATED: "Separated",
  TIE: "Tie",
  UNTESTED: "Untested",
  FACT_RUN: "Fact run",
  UNMEASURED: "Unmeasured",
};

const STATE_CLASS: Record<TileState, string> = {
  SEPARATED: "is-separated",
  TIE: "is-tie",
  UNTESTED: "is-untested",
  FACT_RUN: "is-fact",
  UNMEASURED: "is-unmeasured",
};

function AxisRow({ tile }: { tile: Tile }) {
  const href = axisHref({ axis: tile.axis, kind: tile.kind });
  const name = tile.axis.replace(/-/g, " ");
  return (
    <li className="hp-console-row" data-axis={tile.axis} data-state={tile.state}>
      <span className="hp-console-axis">
        {href ? <a href={href}>{name}</a> : <span>{name}</span>}
        {tile.bench ? <small>{tile.bench}</small> : null}
      </span>
      <span className={`hp-console-state ${STATE_CLASS[tile.state]}`}>
        {STATE_LABEL[tile.state]}
      </span>
    </li>
  );
}

/**
 * A live, deliberately small window into the public board.
 * It reads the shared GET /api/gspc feed; it has no seeded metrics or fallback scores.
 */
export default function HeroEvidenceConsole() {
  const { data, error, loading } = useGspcBoard();
  const tiles = boardTiles(data).slice(0, 3);
  const unavailable = Boolean(error && !data);

  return (
    <aside className="hp-evidence-console" aria-label="Live public evidence preview" data-testid="hero-evidence-console">
      <div className="hp-console-head">
        <span className="hp-console-mark" aria-hidden="true"><i /></span>
        <span className="hp-console-heading">
          <strong>Public evidence feed</strong>
          <small>GSPC · live board</small>
        </span>
        <span className="hp-console-live">{unavailable ? "UNAVAILABLE" : loading && !data ? "CONNECTING" : "LIVE"}</span>
      </div>
      {tiles.length > 0 ? (
        <ul className="hp-console-list" aria-label="Latest visible measurement axes">
          {tiles.map((tile) => <AxisRow key={tile.axis} tile={tile} />)}
        </ul>
      ) : (
        <div className="hp-console-empty" role="status" aria-live="polite">
          {unavailable
            ? "The public board could not be read. No substitute figures are shown."
            : "Connecting to the public measurement board…"}
        </div>
      )}
      <div className="hp-console-foot">
        <span>Ties stay ties. Missing evidence stays visible.</span>
        <a href="/board/">Inspect board ↗</a>
      </div>
    </aside>
  );
}
