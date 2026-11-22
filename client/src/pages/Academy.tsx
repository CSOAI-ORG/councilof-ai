import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  ACADEMY_READING_KEY, MAX_READING_BACKUP_BYTES, changeReadingMark,
  emptyReadingProgress, fingerprintAcademyTrack, parseReadingProgress,
  readReadingProgress, requestedAcademyTrack, reviewedStepsFor, saveReadingProgress,
  type AcademyReadingProgress, type AcademyTrack,
} from "@/lib/academyReadingProgress";

// Academy - training + demo distribution surface. Turns the OS into courses anyone can
// learn from and share. Each track is a short, sharable path through the live OS.
// Every href must be a page that serves 200 as written: no 308 hops into the OS lobby and
// no withdrawn pages (2026-09-28: /gspc-scoreboard, /towns and /legacy all dead-ended).
export const TRACKS: AcademyTrack[] = [
  { id: "practice", name: "Practise beside published AI results", level: "Beginner", mins: 20, blurb: "Read a measured result, make your own choices in THE RULER, and review the published evidence. This is local practice, not live MEOK play or measured human learning.", steps: [
    { t: "Read the living board and its limits", href: "/dashboard/?tab=board" },
    { t: "THE RULER — local practice with published AI answers", href: "/games/ruler/" },
    { t: "Check a published card", href: "/gspc-verify/" },
    { t: "What a completion record would mean — issuance is closed", href: "/academy/#completion-records" },
  ]},
  { id: "board", name: "Read the living board", level: "Beginner", mins: 15, blurb: "What is measured, what is empty, how to check a card. Finishing a track certifies nothing; a completion record needs a reproduced measurement.", steps: [
    { t: "Open Council OS", href: "/dashboard/?tab=home" },
    { t: "The living board — empty cells stay empty", href: "/dashboard/?tab=board" },
    { t: "Verify a card in your browser", href: "/gspc-verify/" },
    { t: "Ask as the reader you are", href: "/dashboard/?tab=home&ask=" + encodeURIComponent("In plain words, what does the Council of AI actually measure?") },
  ]},
  { id: "found", name: "Foundations of AI Governance", level: "Beginner", mins: 20, blurb: "Why governance, where it comes from, and how the OS decides.", steps: [
    { t: "Rediscovered, Not Invented - 4,000 years", href: "/lineage" },
    { t: "The Hive - how consensus works", href: "/hive" },
    { t: "The 4-Wing Model", href: "/dragonfly" },
    { t: "Try the Council yourself", href: "/try" },
  ]},
  { id: "law", name: "Know Your Jurisdiction", level: "Beginner", mins: 15, blurb: "Read the cross-layer law stack for any place.", steps: [
    { t: "Law by jurisdiction", href: "/law" },
    { t: "Framework Temples", href: "/temples" },
    { t: "Relevance Map", href: "/map" },
  ]},
  { id: "sector", name: "Govern Your Sector", level: "Practitioner", mins: 25, blurb: "Find your industry, its frameworks, and the next steps.", steps: [
    { t: "Sector Atlas - find your sector", href: "/sectors" },
    { t: "Industry Playbooks", href: "/playbooks" },
    { t: "Ask the Council about your system", href: "/try" },
  ]},
  { id: "build", name: "Build on the OS", level: "Advanced", mins: 30, blurb: "Signed records you can re-check, the evidence doors, and how a completion record is earned.", steps: [
    { t: "Measurement capsules — signed, checkable records", href: "/measurement-capsules/" },
    { t: "Services — supported feeds and evidence doors", href: "/services/" },
    { t: "Completion records — how they work", href: "/academy/#completion-records" },
  ]},
];

export default function Academy() {
  useEffect(() => { document.title = "CSOAI Academy — learn the living board"; }, []);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [reading, setReading] = useState(emptyReadingProgress);
  const [fingerprints, setFingerprints] = useState<Record<string, string>>({});
  const [writable, setWritable] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const mounted = useRef(false);
  const restoreRevision = useRef(0);
  const unsaved = useRef(false);
  const requested = requestedAcademyTrack(search, TRACKS);
  const selectedId = requested.id ?? (requested.unknown ? "board" : reading.selectedTrack);
  const track = TRACKS.find((x) => x.id === selectedId) || TRACKS.find((x) => x.id === "board")!;
  const fingerprint = fingerprints[track.id];
  const reviewed = reviewedStepsFor(reading, track, fingerprint);
  const nextStep = track.steps.findIndex((_, index) => !reviewed.includes(index));
  const changedSource = Boolean(fingerprint && reading.versions.some((version) => version.trackId === track.id && version.sourceSha256 !== fingerprint));

  useEffect(() => {
    let active = true;
    mounted.current = true;
    try {
      const loaded = readReadingProgress(window.localStorage);
      setReading(loaded.state); setWritable(loaded.writable); setNotice(loaded.notice);
    } catch {
      setNotice("Browser storage is unavailable. New reading marks stay in this tab; download them before leaving.");
    }
    Promise.all(TRACKS.map(async (entry) => [entry.id, await fingerprintAcademyTrack(entry)] as const))
      .then((entries) => { if (active) setFingerprints(Object.fromEntries(entries)); })
      .catch(() => { if (active) setNotice("This browser could not check the track version. Reading links remain available, but new marks cannot be recorded."); });
    const onStorage = (event: StorageEvent) => {
      if (event.key !== ACADEMY_READING_KEY && event.key !== null) return;
      if (unsaved.current) {
        setWritable(false);
        setNotice("Another tab changed saved reading marks. Your unsaved marks remain in this tab; download them before restoring a saved copy.");
        return;
      }
      try {
        const loaded = readReadingProgress(window.localStorage);
        // Keep the current tab's marks when a newer or unreadable format appears.
        if (loaded.writable) setReading(loaded.state);
        setWritable(loaded.writable); setNotice(loaded.notice);
      } catch { setWritable(false); setNotice("Browser storage is unavailable. Download your reading marks before leaving."); }
    };
    window.addEventListener("storage", onStorage);
    return () => { active = false; mounted.current = false; restoreRevision.current += 1; window.removeEventListener("storage", onStorage); };
  }, []);

  function updateReading(update: (previous: AcademyReadingProgress) => AcademyReadingProgress) {
    let previous = reading;
    let canWrite = writable;
    if (canWrite) {
      try {
        const latest = readReadingProgress(window.localStorage);
        if (latest.writable) previous = latest.state;
        else { canWrite = false; setWritable(false); setNotice(latest.notice); }
      } catch {
        canWrite = false; setWritable(false);
        setNotice("Browser storage is unavailable. New reading marks stay in this tab; download them before leaving.");
      }
    }
    let next: AcademyReadingProgress;
    try { next = update(previous); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Reading marks could not be updated."); return; }
    setReading(next);
    unsaved.current = true;
    if (canWrite) {
      try {
        saveReadingProgress(window.localStorage, next);
        unsaved.current = false;
        setNotice(null);
      } catch {
        setWritable(false);
        setNotice("Reading marks could not be saved. They remain in this tab; download them before leaving.");
      }
    }
  }

  /** Only an explicit restore or clear replaces unreadable/externally changed saved data. */
  function replaceReading(next: AcademyReadingProgress) {
    setReading(next); unsaved.current = true;
    try {
      saveReadingProgress(window.localStorage, next);
      setWritable(true); unsaved.current = false; setNotice(null);
    } catch {
      setWritable(false);
      setNotice("Reading marks could not be saved. They remain in this tab; download them before leaving.");
    }
  }

  function selectTrack(id: string) {
    restoreRevision.current += 1; setRestoring(false);
    updateReading((previous) => ({ ...previous, selectedTrack: id }));
    setLocation(`/learn?track=${encodeURIComponent(id)}`);
  }

  function downloadMarks() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(reading, null, 2) + "\n"], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "academy-reading-marks.json";
    document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restoreMarks(file: File | undefined) {
    if (!file || restoring) return;
    const revision = ++restoreRevision.current;
    setRestoring(true);
    try {
      if (file.size > MAX_READING_BACKUP_BYTES) throw new Error("Reading marks file is too large.");
      const raw = await file.text();
      if (!mounted.current || revision !== restoreRevision.current) return;
      const restored = parseReadingProgress(raw);
      replaceReading(restored);
      const id = TRACKS.some((entry) => entry.id === restored.selectedTrack) ? restored.selectedTrack : "board";
      setLocation(`/learn?track=${encodeURIComponent(id)}`);
    } catch (error) {
      if (mounted.current && revision === restoreRevision.current) setNotice(error instanceof Error ? error.message : "Reading marks could not be restored. Existing marks have been kept.");
    } finally { if (mounted.current && revision === restoreRevision.current) setRestoring(false); }
  }
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.22), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">CSOAI - academy</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Learn the board in an afternoon</h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-50/90">Short tracks through the live site and local game practice. Reading pages or getting a game score does not issue a completion record. Pick a track and follow the steps.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-10 grid gap-8 lg:grid-cols-[300px_1fr] items-start">
        <div className="space-y-2">
          {TRACKS.map((x) => (
            <button key={x.id} onClick={() => selectTrack(x.id)} aria-pressed={track.id === x.id} className={"w-full rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 " + (track.id === x.id ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:bg-gray-50")}>
              <div className="font-bold text-gray-900">{x.name}</div>
              <div className="text-xs text-gray-500">{x.level} - {x.mins} min</div>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-200 p-6">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">{track.level} - {track.mins} min</div>
          <div className="mt-1 text-2xl font-black text-gray-900">{track.name}</div>
          <p className="mt-1 text-gray-600">{track.blurb}</p>
          {requested.unknown && <p role="status" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">That track link is not recognized. Showing Read the living board.</p>}
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
            <p className="font-semibold" data-testid="reading-progress">{reviewed.length} of {track.steps.length} steps marked read</p>
            <p className="mt-2">Reading marks are your own checklist, saved only in this browser. They are not an assessment or a completion record.</p>
            {nextStep >= 0 ? <a className="mt-3 inline-block font-semibold underline underline-offset-4" href={track.steps[nextStep].href}>{reviewed.length ? "Resume" : "Open"} at step {nextStep + 1}: {track.steps[nextStep].t}</a> : <p className="mt-3">All steps are marked read. You can revisit any step below or <a className="font-semibold underline underline-offset-4" href="/academy/exercises/">try a reproducibility exercise</a>.</p>}
            {changedSource && <p className="mt-3 text-amber-900">This track has changed since an earlier saved version. Earlier marks are retained in your download and do not count toward this version.</p>}
          </div>
          <ol className="mt-5 space-y-3">
            {track.steps.map((s, i) => (
              <li key={s.href}>
                <a href={s.href} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 hover:border-emerald-300 hover:bg-emerald-50/40">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">{i + 1}</span>
                  <span className="font-semibold text-gray-800">{s.t}</span>
                  <span className="ml-auto text-emerald-700 font-bold">-&gt;</span>
                </a>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 px-2 text-sm text-gray-700">
                  <input type="checkbox" checked={reviewed.includes(i)} disabled={!fingerprint || restoring}
                    aria-label={`I have read: ${s.t}`}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;
                      if (fingerprint) updateReading((previous) => changeReadingMark(previous, track, fingerprint, i, checked));
                    }}
                    className="h-4 w-4 accent-emerald-700" />
                  I have read this step
                </label>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <a href={`/learn?track=${encodeURIComponent(track.id)}`} className="font-semibold underline underline-offset-4">Share this track</a>: copy this link to open the same track. Reading marks are private to your browser and are not included in the link.
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <button type="button" onClick={downloadMarks} className="rounded-lg border border-gray-300 px-3 py-2 font-semibold hover:bg-gray-50">Download reading marks</button>
            <label className="rounded-lg border border-gray-300 px-3 py-2 font-semibold">
              Restore reading marks (replaces saved marks)
              <input type="file" accept="application/json,.json" disabled={restoring} className="mt-2 block max-w-full text-xs font-normal"
                onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; void restoreMarks(file); }} />
            </label>
            <button type="button" onClick={() => replaceReading(emptyReadingProgress(track.id))} disabled={reading.versions.length === 0 || restoring} className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50 disabled:opacity-50">Clear reading marks</button>
          </div>
          {notice && <p role="status" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{notice}</p>}
        </div>
      </section>
    </div>
  );
}
