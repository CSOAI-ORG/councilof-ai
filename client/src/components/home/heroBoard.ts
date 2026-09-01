/**
 * Hero board math — derived from GET /api/gspc, never typed.
 *
 * The homepage first paint quotes slot/measured/empty from the payload.
 * An UNMEASURED cell is hollow and prints n as "—", never 0.
 */
import { boardCountFromPayload } from "@/lib/boardCount";
import { hasFigure, type GspcAxis, type GspcPayload } from "@/components/board/useGspcBoard";

export interface HeroStrip {
  text: string;
  live: boolean;
}

export interface HeroCell {
  axis: string;
  filled: boolean;
  nLabel: string;
  figureLabel: string;
}

export function heroStrip(payload: GspcPayload | null, unreachable = false): HeroStrip {
  if (unreachable) {
    return { text: "board unreachable — GET /api/gspc", live: false };
  }
  if (!payload) {
    return { text: "reading GET /api/gspc…", live: false };
  }
  const counts = boardCountFromPayload(payload);
  if (!counts) {
    return { text: "board unreachable — GET /api/gspc", live: false };
  }
  // public_count may already carry "· N empty" (fill-7 chrome honesty). Do not double-append.
  const alreadyEmpty = /\bempty\b/i.test(counts.public_count);
  const empty =
    !alreadyEmpty && typeof counts.unmeasured_axes === "number" && counts.unmeasured_axes > 0
      ? ` · ${counts.unmeasured_axes} empty`
      : "";
  return { text: `${counts.public_count}${empty}`, live: true };
}

function isUnmeasured(a: GspcAxis): boolean {
  const status = String(a.status || "").toUpperCase();
  if (status.includes("UNMEASURED")) return true;
  if (a.kind === "declared-slot") return true;
  return status !== "MEASURED";
}

export function heroCells(payload: GspcPayload | null): HeroCell[] {
  const axes = Array.isArray(payload?.axes) ? payload!.axes! : [];
  return axes.map((a) => {
    const hollow = isUnmeasured(a);
    const nLabel = hollow || a.n == null ? "—" : String(a.n);
    let figureLabel = "—";
    if (hasFigure(a)) {
      figureLabel = `${((a.accuracy as number) * 100).toFixed(1)}%`;
    } else if (!hollow && a.kind === "deterministic-facts") {
      figureLabel = a.coverage ? String(a.coverage) : "facts";
    }
    return {
      axis: String(a.axis || "?"),
      filled: !hollow,
      nLabel,
      figureLabel,
    };
  });
}
