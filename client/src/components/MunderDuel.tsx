import { useEffect, useRef, useState } from "react";
import {
  MUNDER_KEY, MEOK_SOURCE, makeMunderSession, decodeMunder, saveMunder,
  chooseMunder, beginMeok, receiveMeok, holdMunder, approveMunder, nextMunder,
  fetchMeokMove, parseModelMove, munderSummary, munderReport, type MunderSession,
  beginMunderLesson, retryMunderLesson, munderCaseLesson, MAX_MUNDER_LOCAL_RETRIES,
} from "@/lib/munderDuel";
import { generatePracticeRounds, type PracticeDecision } from "@/lib/munderPractice";

type Props = { fetchImpl?: typeof fetch; sourceRevision?: string };
const button = "min-h-11 rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40";
const source = import.meta.env.VITE_SOURCE_REVISION || "development-unpublished";
export default function MunderDuel({ fetchImpl, sourceRevision = source }: Props) {
  const [game, setGame] = useState<MunderSession | null>(null);
  const current = useRef<MunderSession | null>(null);
  const mounted = useRef(false), busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const [loaded, setLoaded] = useState(false), [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("Reading this browser's Munder game…");
  const [confirmNew, setConfirmNew] = useState(false);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    mounted.current = true;
    try {
      const raw = window.sessionStorage.getItem(MUNDER_KEY);
      const restored = decodeMunder(raw);
      current.current = restored; setGame(restored);
      setNotice(restored
        ? restored.rounds.at(-1)?.hold || "Game restored in this browser. No model request was repeated."
        : raw ? "The saved game does not match this version. It has not been overwritten."
          : "Start a game when you are ready. Nothing has been sent.");
    } catch { setNotice("Browser storage is unavailable. Live requests stay held until this game can save its request intent."); }
    setLoaded(true);
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);

  function show(message: string) { if (mounted.current) setNotice(message.slice(0, 300)); }
  function retain(next: MunderSession, message: string): boolean {
    let saved = false;
    try { saved = saveMunder(next, window.sessionStorage); } catch { /* storage getter can refuse */ }
    if (!saved) { show("This game could not be saved. No new model request or move was started."); return false; }
    current.current = next;
    if (mounted.current) { setGame(next); setNotice(message); }
    return true;
  }
  function start(expectedSession: string | null) {
    if (!loaded || busy.current || (current.current?.id ?? null) !== expectedSession) return;
    try {
      const id = "munder_" + crypto.randomUUID();
      const seed = current.current ? (current.current.seed + 1) >>> 0 : 42;
      if (retain(makeMunderSession(id, seed, new Date().toISOString(), sourceRevision), "Game started. Choose your move before asking MEOK.")) setConfirmNew(false);
    } catch { show("This browser cannot create and save a game identifier."); }
  }
  function change(sessionId: string, caseId: number, kind: "human" | "approve" | "next", choice?: PracticeDecision) {
    const s = current.current;
    if (!s || s.id !== sessionId || busy.current) return;
    try {
      const next = kind === "human" ? chooseMunder(s, caseId, choice!)
        : kind === "approve" ? approveMunder(s, caseId) : nextMunder(s, caseId);
      retain(next, kind === "human" ? "Your move is saved. MEOK receives only the fictional case."
        : kind === "approve" ? "MEOK's move was applied to this browser game once." : "Next case ready. Choose your move first.");
    } catch (e) { show(e instanceof Error ? e.message : "This game view has changed."); }
  }
  async function ask(sessionId: string, caseId: number) {
    if (busy.current || !current.current || current.current.id !== sessionId) return;
    let next: MunderSession;
    try { next = beginMeok(current.current, caseId); }
    catch (e) { show(e instanceof Error ? e.message : "This request cannot start."); return; }
    // Persist intent before touching the network. A remount never retries this intent.
    if (!retain(next, "MEOK is choosing a move…")) return;
    const intent = next.rounds.at(-1)!.intent!;
    busy.current = true; setPending(true);
    const ownController = new AbortController(); controller.current = ownController;
    try {
      const raw = await fetchMeokMove(intent, { fetchImpl, signal: ownController.signal });
      const latest = current.current;
      if (!mounted.current || !latest || latest.id !== next.id) return;
      const answered = receiveMeok(latest, intent.requestId, raw);
      if (!retain(answered, "MEOK proposed a legal move. Review it before applying it.")) {
        const held = holdMunder(answered, intent.requestId, "The response arrived but could not be saved. No MEOK move was applied.");
        current.current = held; setGame(held); show(held.rounds.at(-1)!.hold!);
      }
    } catch (e) {
      const latest = current.current;
      if (mounted.current && latest?.id === next.id) {
        const reason = e instanceof Error ? e.message : "The model request outcome is unresolved.";
        const held = holdMunder(latest, intent.requestId, reason + " No automatic retry or fallback.");
        // Preserve the best retained state, including the unresolved intent.
        try { saveMunder(held, window.sessionStorage); } catch { /* original intent stays held */ }
        current.current = held; setGame(held); show(held.rounds.at(-1)!.hold!);
      }
    } finally {
      busy.current = false;
      if (controller.current === ownController) controller.current = null;
      if (mounted.current) setPending(false);
    }
  }

  function learningChange(sessionId: string, caseId: number, kind: "open" | "retry", choice?: PracticeDecision) {
    const s = current.current;
    if (!s || s.id !== sessionId || busy.current) return;
    try {
      const next = kind === "open" ? beginMunderLesson(s, caseId)
        : retryMunderLesson(s, caseId, choice!);
      retain(next, kind === "open"
        ? "The case lesson is open. Original moves, response and approval are preserved."
        : "Exact local retry recorded. Known-case practice is not an independent learning assessment.");
    } catch (error) { show(error instanceof Error ? error.message : "This lesson view has changed."); }
  }

  async function download(kind: "json" | "markdown") {
    if (!current.current || exporting) return;
    const snapshot = current.current;
    setExporting(true);
    try {
      const report = await munderReport(snapshot, sourceRevision);
      const text = kind === "json" ? JSON.stringify(report.data, null, 2) : report.markdown;
      const blob = new Blob([text], { type: kind === "json" ? "application/json" : "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      link.href = url; link.download = snapshot.id + (kind === "json" ? ".json" : ".md");
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      show("Download prepared. It is an unsigned practice record; nothing was uploaded.");
    } catch { show("The report could not be prepared. The saved game was preserved."); }
    finally { if (mounted.current) setExporting(false); }
  }

  const row = game?.rounds.at(-1);
  const cases = game ? generatePracticeRounds(game.seed) : [];
  const round = game ? cases[game.rounds.length - 1] : null;
  const summary = game ? munderSummary(game) : null;
  const proposal = row?.proof ? parseModelMove(row.proof.body) : null;
  return (
    <section id="munder-duel" data-testid="munder-live-duel" aria-labelledby="munder-title"
      className="mt-6 rounded-3xl border border-emerald-400/40 bg-slate-950 p-5 text-slate-100 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Coliseum · browser practice · real MEOK endpoint</p>
      <h2 id="munder-title" className="mt-2 text-2xl font-semibold">Munder — The Boss&apos;s Chair</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-300">
        Face the same fictional requests as MEOK. Choose first, ask for its move, then approve that move in this game.
        Only the public case is sent to the existing MEOK service. Your answers stay in this browser.
      </p>
      <p role="status" aria-live="polite" data-testid="munder-status" className="mt-3 text-sm text-emerald-200">{notice}</p>

      {!game ? <button type="button" className={button + " mt-5 bg-emerald-400 text-slate-950"}
        disabled={!loaded} onClick={() => start(null)}>Start Munder with MEOK</button> : null}

      {game && row && round && summary ? <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,1fr)]">
        <div className="rounded-2xl border border-slate-700 p-4">
          <p data-testid="munder-round" className="text-xs text-slate-400">seed {game.seed} · case {game.rounds.length}/{cases.length}</p>
          {!summary.finished ? <>
            <h3 className="mt-3 text-lg font-semibold">{round.subject}</h3>
            <p className="mt-2 text-slate-200">{round.body}</p>
            {!row.human && !row.hold ? <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className={button} onClick={() => change(game.id, row.caseId, "human", "resolve")}>Choose resolve</button>
              <button type="button" className={button} onClick={() => change(game.id, row.caseId, "human", "escalate")}>Choose escalate</button>
            </div> : null}
            {row.human ? <p className="mt-4 text-sm">Your move: <strong>{row.human}</strong></p> : null}
            {row.human && !row.intent && !row.hold ? <button type="button" className={button + " mt-4 bg-emerald-300 text-slate-950"}
              onClick={() => ask(game.id, row.caseId)}>Ask MEOK for its move</button> : null}
            {pending ? <p className="mt-4 text-sm">Waiting for the existing MEOK endpoint…</p> : null}
            {proposal ? <div className="mt-4 rounded-xl border border-emerald-500/50 p-4">
              <p>MEOK proposes: <strong data-testid="munder-proposal">{proposal.action}</strong></p>
              {!row.approvedAt && !row.hold ? <button type="button" className={button + " mt-3"}
                onClick={() => change(game.id, row.caseId, "approve")}>Approve MEOK move in this game</button> : null}
            </div> : null}
            {row.approvedAt ? <div className="mt-4">
              <p>Case rule: <strong>{round.critical ? "escalate" : "resolve"}</strong>. Both moves are now recorded.</p>
              <button type="button" className={button + " mt-3"} onClick={() => change(game.id, row.caseId, "next")}>Next Munder case</button>
            </div> : null}
            {row.hold ? <p role="alert" className="mt-4 rounded-xl border border-amber-400/50 p-3 text-amber-200">
              This request is held. Export its record before starting a separate game. Reopening this pane will not repeat it.
            </p> : null}
          </> : <div data-testid="munder-complete">
            <h3 className="mt-3 text-2xl font-semibold">Munder game complete</h3>
            <p className="mt-3">Game points on these known fictional cases: you {summary.human}/{summary.total}; MEOK {summary.meok}/{summary.total}.</p>
            <p className="mt-2 text-lg">{summary.human > summary.meok ? "You win this practice game." : summary.human < summary.meok ? "MEOK wins this practice game." : "This practice game is a tie."}</p>
          </div>}
        </div>
        <aside className="rounded-2xl border border-slate-700 p-4 text-sm">
          <h3 className="font-semibold">Keep the result and learn from it</h3>
          <p className="mt-2 text-slate-300">{summary.completed} cases completed. Saved for this browser session; download a copy to keep it.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={button} disabled={exporting} onClick={() => download("json")}>Download session data</button>
            <button type="button" className={button} disabled={exporting} onClick={() => download("markdown")}>Download report and study draft</button>
          </div>
          <a className="mt-4 block text-emerald-300 underline" href="https://councilof.ai/dashboard?tab=evidence-learning">Open the existing evidence and learning review</a>
          <details className="mt-4 text-xs text-slate-300">
            <summary className="cursor-pointer">What this game establishes</summary>
            <p className="mt-2">A browser participant and a remote MEOK response can play these public cases. Local approval applies only to this game.
              Browser-held records are editable, unsigned and unadmitted. No independently measured human learning, authenticated R3 task, native world action or training reuse is asserted.</p>
            <a className="mt-2 block underline" href={MEOK_SOURCE} target="_blank" rel="noreferrer">Existing opponent source: Qwen 1.5B with the MEOK overlay</a>
          </details>
          {!confirmNew ? <button type="button" className={button + " mt-5"} disabled={pending}
            onClick={() => setConfirmNew(true)}>Start a separate Munder game</button> :
            <div role="alertdialog" aria-label="Start a separate Munder game" className="mt-5">
              <p>This replaces the browser&apos;s active game. Download the current record first if you want to keep it.</p>
              <button type="button" className={button + " mt-2"} onClick={() => setConfirmNew(false)}>Keep current game</button>
              <button type="button" className={button + " mt-2"} onClick={() => start(game.id)}>Start separate game</button>
            </div>}
        </aside>

        {summary.completed > 0 ? <section className="rounded-2xl border border-slate-700 p-4 lg:col-span-2"
          aria-labelledby="munder-lessons-title" data-testid="munder-lessons">
          <h3 id="munder-lessons-title" className="font-semibold">Review and retry the same cases</h3>
          <p className="mt-2 text-sm text-slate-300">Each approved case keeps its original choices and response.
            Lessons and retries stay in this game and its download. Local retries do not change game points or call MEOK.</p>
          {game.rounds.filter(item => item.approvedAt).map(item => {
            const lesson = munderCaseLesson(game, item.caseId), learning = item.learning;
            const matched = learning?.attempts.at(-1)?.choice === lesson.expected;
            const canRetry = !!learning && !matched && learning.attempts.length < MAX_MUNDER_LOCAL_RETRIES;
            return <details key={item.caseId} className="mt-3 rounded-xl border border-slate-700 p-3"
              data-testid={"munder-lesson-case-" + item.caseId}>
              <summary className="cursor-pointer font-semibold">Case {item.caseId}: {lesson.subject}
                {" · "}{lesson.originalParticipantMatched ? "your initial choice matched" : "review your initial choice"}</summary>
              <p className="mt-3 text-sm">{lesson.body}</p>
              {!learning ? <button type="button" className={button + " mt-3"} disabled={pending}
                onClick={() => learningChange(game.id, item.caseId, "open")}>Open local lesson for case {item.caseId}</button> : <>
                <p className="mt-3 text-sm">{lesson.explanation}</p>
                <p className="mt-2 text-sm">Known case rule: <strong>{lesson.expected}</strong>.
                  Initial participant and MEOK moves remain recorded.</p>
                <ol className="mt-2 list-decimal pl-5 text-sm" aria-label={"Local retry history for case " + item.caseId}>
                  {learning.attempts.map((attempt, index) => <li key={index}>{attempt.choice}
                    {" · "}{attempt.choice === lesson.expected ? "matches known rule" : "review rule"}
                    {" · "}{attempt.at}</li>)}
                </ol>
                {canRetry ? <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className={button} disabled={pending}
                    onClick={() => learningChange(game.id, item.caseId, "retry", "resolve")}>Retry case {item.caseId} as resolve</button>
                  <button type="button" className={button} disabled={pending}
                    onClick={() => learningChange(game.id, item.caseId, "retry", "escalate")}>Retry case {item.caseId} as escalate</button>
                </div> : <p className="mt-3 text-sm">{matched
                  ? "Exact retry matched the known case rule. This is local practice."
                  : "The local retry limit is reached. Existing history is preserved."}</p>}
                <p className="mt-3 text-xs text-slate-400">Independent held-out assessment: not established.
                  Graph admission: not submitted. No learning gain, credential or execution authority is claimed.</p>
              </>}
            </details>;
          })}
        </section> : null}
      </div> : null}
    </section>
  );
}
