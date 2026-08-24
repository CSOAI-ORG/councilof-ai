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
      <section className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300/80">
            Part C-II · frozen → fluid · Art. 4 office sim
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
            Training that expires when the law or the model moves.
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-emerald-50/90">
            We do not remove compliance, and we do not sell certification. Compliance stays with
            regulators and courts. What we replace is the <em>frozen evidence layer</em> — the PDF
            course, the LMS tick, the Open Badge that only proves attendance — with a{" "}
            <strong>{TRAINING_GRAMMAR.product}</strong>.
          </p>
          <p className="mt-4 max-w-3xl text-sm text-emerald-100/80">{TRAINING_GRAMMAR.firewall}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#art4-sim"
              className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-emerald-950 hover:bg-emerald-300"
            >
              Play the Art. 4 office sim
            </a>
            <button
              type="button"
              onClick={() => openLobby({ pane: "academy", task: "live-drill" })}
              className="rounded-xl border border-emerald-300/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
            >
              {POSITIONING.os.cta} — tutor in Council OS
            </button>
            <Link href="/training" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold hover:bg-white/10">
              Frozen course rail
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h2 className="text-2xl font-bold">Why frozen courses cannot carry Art. 4</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          <li className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-semibold">Duty is live. Manuals are not the bar.</p>
            <p className="mt-2 text-sm text-slate-600">
              Article 4 has applied since 2 February 2025 to every provider and deployer. The
              Commission Q&amp;A: no certificate is required; copying the living repository of
              practices does <em>not</em> grant presumption of compliance. The Digital Omnibus
              (July 2026) still requires supporting measures — it just refuses a fake individual
              &quot;sufficient literacy&quot; score.
            </p>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="font-semibold">The whitespace is empty.</p>
            <p className="mt-2 text-sm text-slate-600">
              Open Badges 3.0 can sign that someone finished a module. It does not bind a measured
              scenario outcome to a frozen provision hash, a model checkpoint, and a change-card.
              That card is what an insurer, a NIS2 board member, or a DOJ monitor can check without
              trusting us.
            </p>
          </li>
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <h2 className="text-2xl font-bold">The fluid loop</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LOOP_STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-emerald-200 bg-white p-4">
              <p className="font-mono text-xs text-emerald-700">0{s.n}</p>
              <p className="mt-1 font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-12 sm:px-8">
        <h2 className="text-2xl font-bold">Instrument bundles — one engine, many industries</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Frozen pins the cited text. Fluid is the drill that re-opens when that text or the model
          in front of the learner changes.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {INSTRUMENT_BUNDLES.map((b) => (
            <BundleCard key={b.id} bundle={b} active={b.id === bundleId} onPick={() => setBundleId(b.id)} />
          ))}
        </div>
      </section>

      <section id="art4-sim" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <h2 className="text-2xl font-bold">Art. 4 sim — {bundle.industry}</h2>
          <p className="mt-2 text-sm text-slate-600">
            MEOK delivers this scenario. The Council will measure the outcome. Your choices are
            scored against published Q&amp;A, not against a secret rubric. A seeded prompt opens in
            Council OS; it is typed, never auto-sent.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {WORLDS.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setWorld(w.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  world === w.id ? "bg-emerald-800 text-white" : "border border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-slate-500">{WORLDS.find((w) => w.id === world)?.blurb}</p>

          {beat && !card && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-[#f7f7f2] p-5">
              <p className="font-mono text-xs text-emerald-800">
                Beat {Math.min(beatIndex + 1, beats.length)} / {beats.length} · {world}
              </p>
              <p className="mt-3 text-lg font-semibold">{beat.prompt}</p>
              <ul className="mt-4 space-y-2">
                {beat.choices.map((c) => {
                  const selected = picked === c.id;
                  const show = Boolean(picked);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => choose(c.id)}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${
                          !show
                            ? "border-slate-200 bg-white hover:border-emerald-400"
                            : selected && c.correct
                              ? "border-emerald-600 bg-emerald-50"
                              : selected && !c.correct
                                ? "border-rose-400 bg-rose-50"
                                : c.correct
                                  ? "border-emerald-200 bg-white"
                                  : "border-slate-100 bg-white opacity-70"
                        }`}
                      >
                        {c.label}
                        {show && selected && <span className="mt-2 block text-xs text-slate-600">{c.why}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!picked}
                  onClick={() => void next()}
                  className="rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {beatIndex + 1 < beats.length ? "Next beat" : "Mint outcome record"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openLobby({
                      pane: "academy",
                      task: "live-drill",
                      prompt: `In the ${world} Art. 4 sim (${bundle.industry}), the beat was: ${beat.prompt} What does published Commission Q&A actually say, and what does the Council refuse to certify?`,
                    })
                  }
                  className="rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-900"
                >
                  Ask the tutor (typed, not sent)
                </button>
              </div>
            </div>
          )}

          {card && (
            <div className="mt-8 rounded-2xl border border-emerald-700 bg-emerald-50 p-5">
              <p className="font-mono text-xs uppercase tracking-wide text-emerald-800">
                {TRAINING_GRAMMAR.product}
              </p>
              <p className="mt-2 text-sm">
                {card.correctCount}/{card.total} measured-correct beats · hash {card.contentHash.slice(0, 16)}… ·{" "}
                {card.signature.status}
              </p>
              <p className="mt-2 text-xs text-slate-600">{card.signature.note}</p>
              <pre className="mt-4 max-h-64 overflow-auto rounded-xl bg-slate-950 p-4 text-[11px] text-emerald-100">
                {JSON.stringify(card, null, 2)}
              </pre>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void check(card)}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Verify hash on this device
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCard(null);
                    setBeatIndex(0);
                    setPicked(null);
                    setLog([]);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
                >
                  Replay
                </button>
              </div>
              {verifyNote && <p className="mt-3 text-sm text-slate-700">{verifyNote}</p>}
              {done && card.correctCount < card.total && (
                <p className="mt-3 text-sm text-slate-700">
                  Incomplete beats stay on the card. That is the point — a living record does not
                  pretend a pass.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <h2 className="text-2xl font-bold">Buyers, in pull order</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {BUYERS.map((b) => (
            <li key={b.who} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="font-semibold">{b.who}</p>
              <p className="text-sm text-slate-600">{b.why}</p>
            </li>
          ))}
        </ul>
        {prior.length > 0 && (
          <div className="mt-10">
            <h3 className="font-semibold">Records on this device</h3>
            <ul className="mt-2 space-y-1 font-mono text-xs text-slate-600">
              {prior.slice(0, 5).map((r) => (
                <li key={r.id}>
                  {r.issuedAt.slice(0, 19)} · {r.lane} · {r.correctCount}/{r.total} · {r.contentHash.slice(0, 12)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <h2 className="text-lg font-bold">Grounding</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {GROUNDING.map((g) => (
              <li key={g.href}>
                {g.claim}{" "}
                <a className="text-emerald-800 underline" href={g.href} target="_blank" rel="noreferrer">
                  source
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function BundleCard({
  bundle,
  active,
  onPick,
}: {
  bundle: InstrumentBundle;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`rounded-2xl border p-4 text-left ${
        active ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="font-semibold">{bundle.industry}</p>
      <p className="mt-1 text-xs font-mono text-emerald-800">{bundle.instruments.join(" · ")}</p>
      <p className="mt-2 text-sm text-slate-600">
        <span className="font-medium text-slate-800">Frozen.</span> {bundle.frozen}
      </p>
      <p className="mt-2 text-sm text-slate-600">
        <span className="font-medium text-slate-800">Fluid.</span> {bundle.fluid}
      </p>
    </button>
  );
}
