/**
 * ArenaGlobe — Globe plus the match selector, wired through jurisdiction-link.
 *
 * Links match selections and probe results to globe highlights. Selection
 * state lives in jurisdiction-link, so a match lit here also lights the
 * matching C-space branches and J-space records — the three surfaces are one
 * instrument.
 */

import { useState } from "react";
import { Globe } from "./Globe";
import { useJurisdiction } from "./jurisdiction-link";
import { ARENA_MATCHES, ARENA_PROVISIONS } from "@/data/arena";

export function ArenaGlobe() {
  const { active, source, select } = useJurisdiction();
  const [selectedMatch, setSelectedMatch] = useState<string | undefined>();

  function handleMatchClick(matchId: string) {
    if (selectedMatch === matchId) {
      setSelectedMatch(undefined);
      select(undefined);
      return;
    }
    const match = ARENA_MATCHES.find((m) => m.id === matchId);
    if (!match) return;

    setSelectedMatch(matchId);

    // Map provision to jurisdiction for globe highlight
    const provision = ARENA_PROVISIONS.find((p) =>
      match.provision.section.includes(p.section.split(" — ")[0])
    );
    if (provision) {
      if (provision.id.startsWith("EU")) select("EU", matchId);
      else if (provision.id.startsWith("UK")) select("UK", matchId);
      else if (provision.id.startsWith("US")) select("US", matchId);
    }
  }

  function handleGlobeSelect(id: string) {
    setSelectedMatch(undefined);
    select(id, "globe");
  }

  function clear() {
    setSelectedMatch(undefined);
    select(undefined);
  }

  return (
    <section>
      <h2 className="text-2xl font-bold text-emerald-50">Jurisdiction globe</h2>
      <p className="mt-1 text-[13px] text-emerald-100/50">
        Click a match below — or a jurisdiction on the globe — to light it everywhere:
        globe, signed C-space branches, and J-space records are one connected surface.
      </p>

      {/* Currently lit indicator */}
      {active && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono text-[11px] text-amber-300">
            {active} lit
          </span>
          {source && (
            <span className="text-[11px] text-amber-300/60">
              via {source}
            </span>
          )}
          <span className="flex-1" />
          <button
            onClick={clear}
            className="font-mono text-[10px] text-amber-300/50 hover:text-amber-200 transition-colors cursor-pointer"
          >
            clear
          </button>
        </div>
      )}

      <div className="mt-4">
        <Globe highlight={active} onSelect={handleGlobeSelect} showStats />
      </div>

      {/* Quick-match selector — horizontal scrollable chip strip */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
        {ARENA_MATCHES.map((m) => {
          const isSelected = selectedMatch === m.id;
          return (
            <button
              key={m.id}
              onClick={() => handleMatchClick(m.id)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[11px] transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-200 shadow-sm shadow-amber-500/10"
                  : "border-emerald-500/20 text-emerald-100/60 hover:border-emerald-400/40 hover:text-emerald-200 hover:bg-emerald-500/5"
              }`}
            >
              {m.id}: {m.subject_a.id} vs {m.subject_b.id}
            </button>
          );
        })}
        {!active && !selectedMatch && (
          <button
            onClick={clear}
            className="whitespace-nowrap rounded-full border border-emerald-500/15 px-3 py-1.5 font-mono text-[11px] text-emerald-100/30 transition-colors cursor-pointer shrink-0 hover:border-emerald-400/30 hover:text-emerald-100/50"
          >
            Clear
          </button>
        )}
      </div>

      {!active && (
        <p className="mt-2 text-[11px] text-emerald-100/35 font-mono">
          Polygons, not pins. No IP geolocation. Keyless basemap.
        </p>
      )}
    </section>
  );
}
