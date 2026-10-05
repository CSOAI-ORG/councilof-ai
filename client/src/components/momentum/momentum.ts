/**
 * momentum.ts — the client half of GET /api/momentum (schema csoai.momentum/0.1).
 *
 * ONE READ PER PAGE LOAD, SHARED. The strip, the footer row and the proof blocks read the same
 * payload, so the request is made once. The live endpoint is tried first; if it does not answer
 * with the schema, the build-time snapshot (/interop/momentum-snapshot.json, written by
 * scripts/momentum-snapshot.mjs from the SAME producer, functions/api/_momentum.ts) is read
 * instead and every surface says it is a snapshot and prints its date. The prerender bakes that
 * snapshot into the HTML, so the page is not empty without JavaScript.
 *
 * NOTHING HERE HOLDS A NUMBER. If neither read answers, the surfaces render nothing at all: a
 * placeholder figure is a lie with a nice font.
 */
import { useEffect, useState } from "react";

export const MOMENTUM_SCHEMA = "csoai.momentum/0.1";
export const MOMENTUM_URL = "/api/momentum";
export const MOMENTUM_SNAPSHOT_URL = "/interop/momentum-snapshot.json";

export interface MomentumFigure {
  id: string;
  group: string;
  label: string;
  value: number;
  display: string;
  display_sr: string;
  unit: string;
  as_of: string;
  as_of_basis: "source" | "read";
  source_url: string;
  source_label: string;
  detail?: string;
  detail_url?: string;
  trend?: { delta: number; window: string; text: string };
  lower_bound?: boolean;
  /** Parts of what the figure counts that are not measured; never printed as a number. */
  unmeasured?: { field: string; state: "UNMEASURED"; reason: string }[];
}

export interface MomentumListing {
  id: string;
  name: string;
  /** Older build snapshots may not carry this additive field; absence is treated as a plain listing. */
  signal_class?: "listing" | "independent_observation" | "independent_assessment" | "independent_reproduction";
  url: string;
  evidence: string;
  verified_at: string;
}

export interface MomentumAnchor {
  id: string;
  label: string;
  value: string;
  url: string;
  detail?: string;
  as_of?: string;
  links?: { text: string; url: string }[];
}

export interface MomentumRecent {
  id: string;
  title: string;
  href: string;
  date: string;
  date_basis: string;
  note?: string;
}

export interface MomentumPayload {
  schema: string;
  generated_at: string;
  ttl_seconds: number;
  rules: string[];
  methodology_url: string;
  listing_line: string;
  figures: MomentumFigure[];
  listings: MomentumListing[];
  anchors: MomentumAnchor[];
  recent: MomentumRecent[];
  omitted: { id: string; reason: string }[];
}

export type MomentumRead =
  | { kind: "loading" }
  | { kind: "ready"; payload: MomentumPayload; origin: "live" | "snapshot" }
  | { kind: "failed" };

/** Shape check: a payload is used only if its schema and every figure's required fields are present. */
export function isMomentum(p: unknown): p is MomentumPayload {
  const m = p as MomentumPayload;
  return (
    !!m &&
    m.schema === MOMENTUM_SCHEMA &&
    Array.isArray(m.figures) &&
    m.figures.every(
      (f) =>
        f &&
        typeof f.id === "string" &&
        typeof f.display === "string" &&
        typeof f.label === "string" &&
        typeof f.source_url === "string" &&
        typeof f.as_of === "string" &&
        Number.isFinite(Date.parse(f.as_of)) &&
        typeof f.value === "number" &&
        f.value > 0,
    ) &&
    Array.isArray(m.listings) &&
    Array.isArray(m.anchors) &&
    Array.isArray(m.recent)
  );
}

async function readOne(url: string): Promise<MomentumPayload | null> {
  try {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) return null;
    const t = (await r.text()).trim();
    if (!t || t.startsWith("<")) return null;
    const p = JSON.parse(t);
    return isMomentum(p) ? p : null;
  } catch {
    return null;
  }
}

let shared: Promise<MomentumRead> | null = null;

export function loadMomentum(): Promise<MomentumRead> {
  if (!shared) {
    shared = (async (): Promise<MomentumRead> => {
      const live = await readOne(MOMENTUM_URL);
      if (live) return { kind: "ready", payload: live, origin: "live" };
      const snap = await readOne(MOMENTUM_SNAPSHOT_URL);
      if (snap) return { kind: "ready", payload: snap, origin: "snapshot" };
      return { kind: "failed" };
    })();
  }
  return shared;
}

/** Test seam. */
export function resetMomentum(): void {
  shared = null;
}

export function useMomentum(injected?: MomentumRead): MomentumRead {
  const [state, setState] = useState<MomentumRead>(injected ?? { kind: "loading" });
  useEffect(() => {
    if (injected) return;
    let alive = true;
    loadMomentum().then((r) => {
      if (alive) setState(r);
    });
    return () => {
      alive = false;
    };
  }, [injected]);
  return state;
}

/** Figures in the order asked for; an id with no figure (omitted upstream) is simply absent. */
export function pick(p: MomentumPayload, ids?: string[]): MomentumFigure[] {
  if (!ids) return p.figures;
  const by = new Map(p.figures.map((f) => [f.id, f]));
  return ids.map((id) => by.get(id)).filter((f): f is MomentumFigure => !!f);
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });

/** "26 Sep 2026" */
export function fmtDay(iso: string): string {
  const t = Date.parse(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  return Number.isFinite(t) ? dayFmt.format(new Date(t)) : iso;
}

/** "27 Sep 2026, 03:14 UTC" */
export function fmtStamp(iso: string): string {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? `${dayFmt.format(new Date(t))}, ${timeFmt.format(new Date(t))} UTC` : iso;
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
