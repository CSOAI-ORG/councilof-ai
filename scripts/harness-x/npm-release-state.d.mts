/**
 * Types for scripts/harness-x/npm-release-state.mjs.
 *
 * The module is plain ESM JavaScript on purpose: the Node generators (render.mjs, llms-txt.mjs,
 * check.mjs) import it directly, and a Pages Function and the site bundle import the SAME file, so
 * there is one sentence in the estate rather than five copies of it. TypeScript resolves a `.mjs`
 * import to this declaration; the runtime still loads the .mjs.
 */

export declare const CAPTURE_SCHEMA: "csoai.npm-publish-check/1";
export declare const CAPTURE_PATH: "distribution/npm/npm-publish-check.json";

export interface NpmReleaseState {
  version: string;
  publishedAt: string;
  deprecated: boolean;
  deprecatedReason: string | null;
  publishedTools: number;
  publishedFree: number | null;
  publishedMetered: number | null;
  capturedDoorTools: number;
  measuredGap: number;
  liveOnly: string[];
  publishedOnly: string[];
  checkedAt: string;
  measuredDay: string;
  deprecationPhrase: string;
}

export interface StdioAdvertisement {
  advertise: boolean;
  pinMatchesPublished: boolean;
  notDeprecated: boolean;
  matchesServed: boolean;
  versionMismatch: string | null;
}

export interface SurfaceContext {
  npmId?: string;
  freeDoor: string;
  doorTools: number;
  preparedVersion?: string;
  stdioLiteLine?: string;
}

export declare function npmReleaseState(capture: unknown): NpmReleaseState;
export declare function stdioAdvertisement(
  state: NpmReleaseState,
  ctx: { preparedVersion: string; doorTools: number },
): StdioAdvertisement;
export declare function missingNamesPhrase(state: NpmReleaseState): string;
export declare function toolClause(state: NpmReleaseState, doorTools: number): string;
export declare function cardNote(state: NpmReleaseState, ctx: SurfaceContext): string;
export declare function doorInstallLine(state: NpmReleaseState, ctx: SurfaceContext): string;
export declare function llmsStdioSentence(state: NpmReleaseState, ctx: SurfaceContext): string;
export declare function llmsStdioShort(state: NpmReleaseState, ctx: SurfaceContext): string;
export declare function clientNote(state: NpmReleaseState, ctx: SurfaceContext): string;
