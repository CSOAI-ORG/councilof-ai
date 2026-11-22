import { sha256Text } from "./inputBoundVerification";

/** Browser-local reading marks. These are not assessment or evidence events. */
export type AcademyTrack = {
  id: string;
  name: string;
  level: string;
  mins: number;
  blurb: string;
  steps: { t: string; href: string }[];
};

export const ACADEMY_READING_KEY = "csoai.academy-reading-progress.v1";
export const ACADEMY_READING_SCHEMA = "csoai.academy-reading-progress/0.1";
const MAX_VERSIONS = 120;
export const MAX_READING_BACKUP_BYTES = 200_000;

export type ReadingVersion = {
  trackId: string;
  sourceSha256: string;
  reviewedSteps: number[];
};
export type AcademyReadingProgress = {
  schema: typeof ACADEMY_READING_SCHEMA;
  selectedTrack: string;
  versions: ReadingVersion[];
};

type ReadingStorage = Pick<Storage, "getItem" | "setItem">;

export function emptyReadingProgress(selectedTrack = "board"): AcademyReadingProgress {
  return { schema: ACADEMY_READING_SCHEMA, selectedTrack, versions: [] };
}

/** Bind marks to the actual track content, including step order and destinations. */
export async function fingerprintAcademyTrack(track: AcademyTrack): Promise<string> {
  return sha256Text(JSON.stringify({
    id: track.id, name: track.name, level: track.level, mins: track.mins,
    blurb: track.blurb, steps: track.steps.map(({ t, href }) => ({ t, href })),
  }));
}

export function requestedAcademyTrack(search: string, tracks: readonly AcademyTrack[]) {
  const params = new URLSearchParams(search);
  const value = params.get("track");
  const known = tracks.some((track) => track.id === value);
  return { id: known ? value : null, unknown: value !== null && !known };
}

export function parseReadingProgress(raw: string): AcademyReadingProgress {
  if (raw.length > MAX_READING_BACKUP_BYTES) throw new Error("Reading marks file is too large.");
  let value: any;
  try { value = JSON.parse(raw); } catch { throw new Error("Reading marks file is not valid JSON."); }
  const validId = (id: unknown) => typeof id === "string" && /^[a-z0-9-]{1,80}$/.test(id);
  if (!value || value.schema !== ACADEMY_READING_SCHEMA || !validId(value.selectedTrack)
    || !Array.isArray(value.versions) || value.versions.length > MAX_VERSIONS) {
    throw new Error("This reading marks format is not supported. Existing marks have been kept.");
  }
  const seen = new Set<string>();
  const versions: ReadingVersion[] = value.versions.map((version: any) => {
    if (!version || !validId(version.trackId) || typeof version.sourceSha256 !== "string"
      || !/^[a-f0-9]{64}$/.test(version.sourceSha256) || !Array.isArray(version.reviewedSteps)
      || version.reviewedSteps.length > 100
      || !version.reviewedSteps.every((step: unknown) => Number.isInteger(step) && (step as number) >= 0 && (step as number) < 100)) {
      throw new Error("Reading marks contain an invalid track record. Existing marks have been kept.");
    }
    const key = `${version.trackId}:${version.sourceSha256}`;
    if (seen.has(key)) throw new Error("Reading marks contain a repeated track version. Existing marks have been kept.");
    seen.add(key);
    return { trackId: version.trackId, sourceSha256: version.sourceSha256,
      reviewedSteps: [...new Set<number>(version.reviewedSteps)].sort((a, b) => a - b) };
  });
  return { schema: ACADEMY_READING_SCHEMA, selectedTrack: value.selectedTrack, versions };
}

export function readReadingProgress(storage: ReadingStorage): {
  state: AcademyReadingProgress; writable: boolean; notice: string | null;
} {
  try {
    const raw = storage.getItem(ACADEMY_READING_KEY);
    return { state: raw === null ? emptyReadingProgress() : parseReadingProgress(raw), writable: true, notice: null };
  } catch {
    return { state: emptyReadingProgress(), writable: false,
      notice: "Saved reading marks could not be read. Existing saved data has been kept; new marks stay in this tab." };
  }
}

export function saveReadingProgress(storage: ReadingStorage, state: AcademyReadingProgress): void {
  const raw = JSON.stringify(parseReadingProgress(JSON.stringify(state)));
  storage.setItem(ACADEMY_READING_KEY, raw);
  if (storage.getItem(ACADEMY_READING_KEY) !== raw) {
    throw new Error("Reading marks could not be confirmed in browser storage.");
  }
}

export function reviewedStepsFor(state: AcademyReadingProgress, track: AcademyTrack, fingerprint: string | undefined): number[] {
  if (!fingerprint) return [];
  return state.versions.find((version) => version.trackId === track.id && version.sourceSha256 === fingerprint)
    ?.reviewedSteps.filter((step) => step < track.steps.length) ?? [];
}

export function changeReadingMark(
  state: AcademyReadingProgress, track: AcademyTrack, fingerprint: string, step: number, reviewed: boolean,
): AcademyReadingProgress {
  if (!Number.isInteger(step) || step < 0 || step >= track.steps.length) throw new Error("Unknown reading step.");
  const current = reviewedStepsFor(state, track, fingerprint);
  const steps = reviewed ? [...new Set([...current, step])].sort((a, b) => a - b) : current.filter((index) => index !== step);
  const other = state.versions.filter((version) => version.trackId !== track.id || version.sourceSha256 !== fingerprint);
  if (other.length >= MAX_VERSIONS) throw new Error("Saved track history is full. Download your reading marks before clearing them.");
  return { schema: ACADEMY_READING_SCHEMA, selectedTrack: track.id,
    versions: [...other, { trackId: track.id, sourceSha256: fingerprint, reviewedSteps: steps }] };
}
