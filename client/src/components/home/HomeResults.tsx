import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
import { separationRead } from "./LiveBoardGlance";
import { useGspcBoard, type GspcPayload } from "../board/useGspcBoard";
import { boardRunDates } from "@/lib/boardRunDates";

const GSPC_SPACE = "https://huggingface.co/spaces/csoai/gspc-board";
const GSPC_SPACE_EMBED = "https://csoai-gspc-board.static.hf.space/index.html";

/** One board, one count line. Figures remain coupled to their separation and source dates. */
export default function HomeResults({
  data: injected,
  error: injectedError = null,
}: {
  data?: GspcPayload | null;
  error?: string | null;
}) {
  const live = useGspcBoard();
  const data = injected === undefined ? live.data : injected;
  const error = injected === undefined ? live.error : injectedError;
  const separation = separationRead(data);
  const count =
    typeof data?.totals?.public_count === "string"
      ? data.totals.public_count
      : null;
  const dates = boardRunDates(data);
  // A retained response after a refresh failure is labelled; never present it as a fresh read.
  const readable = Boolean(data && !error && count && separation);
  return (
    <section
      id="board"
      className="hp-section hp-results"
      aria-labelledby="home-board-h"
      data-testid="home-results"
    >
      <div className="section-shell">
        <div className="hp-section-heading">
          <div>
            <p className="hp-eyebrow">Governance · Safety · Provenance · Continuity</p>
            <h2 id="home-board-h">
              GSPC Living Board
            </h2>
          </div>
          <div className="hp-heading-aside">
            <p>
              Read each result with its test, sample and date. A measured axis
              can still produce a tie or leave a comparison untested.
            </p>
            <Link href="/board" className="hp-text-link">
              Browse the Council site board <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        {readable ? (
          <div className="hp-board-summary" data-testid="home-board-summary">
            <div>
              <span className="hp-source-label">Published board totals</span>
              <p data-testid="board-public-count">{count}</p>
            </div>
            <div data-testid="board-separation">
              <strong>
                {separation!.separated} of {separation!.comparison}
              </strong>
              <span>model-comparison axes separated a leader</span>
              <span className="hp-separation-states">
                {separation!.ties} TIE <span aria-hidden="true">·</span>{" "}
                {separation!.untested} UNTESTED
              </span>
            </div>
          </div>
        ) : (
          <div className="hp-board-unavailable" role="status">
            {error
              ? "The live board could not be refreshed. No replacement figures are shown."
              : "Read the published results and their sources on the board."}{" "}
            <a href="/api/gspc">
              Read the public data <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        )}
        <div className="hp-board-context">
          <p>
            Search models, open an axis and follow its evidence in the Hugging Face
            Space below. The Space and Council site board read the same{" "}
            <a href="/api/gspc">public GSPC data</a>.
            {readable && dates ? <> Published run dates: {dates}.</> : null}
          </p>
          <a href={GSPC_SPACE} className="hp-text-link">
            Open on Hugging Face <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <Link href="/models-measured/" className="hp-text-link">
            Browse measured models <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link
            href="/notes/model-gaps-too-small-to-call/"
            className="hp-text-link"
            data-testid="results-why-no-leader"
          >
            Why no leader is shown <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <iframe
          className="hp-gspc-space"
          src={GSPC_SPACE_EMBED}
          title="Interactive GSPC Living Board on Hugging Face"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
        />
        <details className="hp-reading-guide">
          <summary>How to read the results</summary>
          <div className="hp-reading-grid">
            <p>
              <strong>Measured</strong>A run is published. This is separate from
              whether a model has a measured advantage.
            </p>
            <p>
              <strong>Tie / untested</strong>A tie is not a win. Untested means
              the separation was not established.
            </p>
            <p>
              <strong>Fact runs</strong>Read public records against a stated
              rule. These are separate from model comparisons.
            </p>
            <p>
              <strong>Unmeasured</strong>No admitted run is declared. Missing
              evidence is never filled with a zero.
            </p>
          </div>
          <p>
            Check the method, evidence state and corrections before relying on a
            result. A signature verifies bytes and signer; it does not establish
            that a measurement is correct.
          </p>
          <a href="/about/#numbers" className="hp-text-link">
            Counts, scope and limitations{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </details>
      </div>
    </section>
  );
}
