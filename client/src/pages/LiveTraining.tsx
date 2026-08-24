/**
 * /live-training — frozen → fluid training bridge (Part C-II).
 *
 * First commercial occupant of the arena/cities layer: Art. 4 office sim,
 * instrument bundles per industry, living outcome records (never certificates).
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { openLobby } from "@/lib/lobbyLink";
import { POSITIONING } from "@/lib/positioning";
import {
  ART4_DRILL,
  BUYERS,
  GROUNDING,
  INSTRUMENT_BUNDLES,
  LOOP_STEPS,
  TRAINING_GRAMMAR,
  WORLDS,
  type InstrumentBundle,
  type TrainingWorld,
} from "@/data/liveTraining";
import { loadOutcomes, mintOutcome, verifyOutcome, type TrainingOutcome } from "@/lib/trainingOutcome";

export default function LiveTraining() {
  const [world, setWorld] = useState<TrainingWorld>("dublin-office");
  const [bundleId, setBundleId] = useState(INSTRUMENT_BUNDLES[0].id);
  const [beatIndex, setBeatIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [log, setLog] = useState<{ beatId: string; choiceId: string; correct: boolean }[]>([]);
  const [card, setCard] = useState<TrainingOutcome | null>(null);
  const [verifyNote, setVerifyNote] = useState<string | null>(null);
  const [prior, setPrior] = useState<TrainingOutcome[]>([]);

  const bundle = INSTRUMENT_BUNDLES.find((b) => b.id === bundleId) ?? INSTRUMENT_BUNDLES[0];
  const beats = useMemo(() => ART4_DRILL.filter((b) => b.world === world), [world]);
  const beat = beats[Math.min(beatIndex, Math.max(beats.length - 1, 0))];
  const done = log.length >= beats.length && beats.length > 0;

  useEffect(() => {
    document.title = "Live training — verified training-outcome records | CSOAI";
    setPrior(loadOutcomes());
  }, []);

  useEffect(() => {
    setBeatIndex(0);
    setPicked(null);
    setLog([]);
    setCard(null);
    setVerifyNote(null);
  }, [world, bundleId]);

  const choose = (choiceId: string) => {
    if (!beat || picked) return;
    const choice = beat.choices.find((c) => c.id === choiceId);
    if (!choice) return;
    setPicked(choiceId);
    setLog((prev) => [...prev, { beatId: beat.id, choiceId, correct: choice.correct }]);
  };

  const next = async () => {
    if (!picked) return;
    if (beatIndex + 1 < beats.length) {
      setBeatIndex((i) => i + 1);
      setPicked(null);
      return;
    }
    const minted = await mintOutcome({
      lane: bundle.id,
      world,
      industry: bundle.industry,
      changeCardId: "cc_omnibus_art4_2026-07-27",
      frozenRef: "eu-ai-act-art-4+omnibus-2026-1744",
      beats: log,
    });
    setCard(minted);
    setPrior(loadOutcomes());
  };

  const check = async (row: TrainingOutcome) => {
    const v = await verifyOutcome(row);
    setVerifyNote(v.reason);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f2] text-slate-900">
      PLACEHOLDER_REMOVED
    </div>
  );
}
