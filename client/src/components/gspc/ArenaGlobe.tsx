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
      <p className="mt-1 text-[13px] text-emerald-100/60">
        Click a match below — or a jurisdiction on the globe — to light it everywhere:
        globe, signed C-space branches, and J-space records are one connected surface.
        Polygons, not pins. No IP geolocation. Keyless basemap.
      </p>

      <div className="mt-4">
        <Globe highlight={active} onSelect={handleGlobeSelect} showStats />
      </div>

      {/* Quick-match selector */}
      <div className="mt-3 flex flex-wrap gap-2">
        {ARENA_MATCHES.map((m) => (
          <button
            key={m.id}
            onClick={() => handleMatchClick(m.id)}
            className={`rounded border px-2 py-1 font-mono text-[11px] transition-colors cursor-pointer ${
              selectedMatch === m.id
                ? "border-amber-400/50 bg-[#03110b] text-amber-300"
                : "border-emerald-500/25 text-emerald-100/70 hover:border-emerald-400/50 hover:text-emerald-200"
            }`}
          >
            {m.id}: {m.subject_a.id} vs {m.subject_b.id}
          </button>
        ))}
        <button
          onClick={clear}
          className="rounded border border-emerald-500/25 px-2 py-1 font-mono text-[11px] text-emerald-100/45 transition-colors cursor-pointer hover:border-emerald-400/40 hover:text-emerald-100/70"
        >
          Clear
        </button>
      </div>

      <p className="mt-2 text-[11px] text-emerald-100/45">
        {active
          ? `${active} is lit${source ? ` (via ${source})` : ""} — matching C-space branches and J-space records carry the amber ring below.`
          : "The globe, the branches, and the J-space replay are connected — light one, light them all."}
      </p>
    </section>
  );
}
