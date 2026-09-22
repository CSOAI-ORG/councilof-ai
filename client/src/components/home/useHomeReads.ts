/**
 * useHomeReads — the fetches behind the rebuilt home page.
 *
 * ONE MODULE-LEVEL PROMISE PER ENDPOINT. Several bands read the same payload (the corrections
 * ledger appears in the strengths band and again in the lower stages), so the request is shared
 * rather than repeated. There is no cached fallback and no seeded sample: a failed read is
 * reported as a failure with its reason, because a placeholder number is a lie with a nice font.
 *
 * NOTHING HERE PARSES A NUMBER OUT OF PROSE. Each hook returns the payload; the pure readers in
 * ./homeReads.ts turn it into what the page prints, and every component takes the payload as an
 * injected prop so a test can pin the sentence without a network.
 */
import { useEffect, useState } from "react";
import type { FootprintPayload } from "@/components/liveCountersFormat";
import {
  POPULATION_DOORS,
  type CorrectionsPayload,
  type PopPreview,
  type ReadState,
  type RootPayload,
  type StatePayload,
  type X402Manifest,
} from "./homeReads";

async function readJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${url} answered HTTP ${r.status}`);
  const text = (await r.text()).trim();
  if (!text || text.startsWith("<")) throw new Error(`${url} returned HTML, not JSON`);
  return JSON.parse(text) as T;
}

const shared = new Map<string, Promise<unknown>>();

function once<T>(url: string): Promise<T> {
  const hit = shared.get(url);
  if (hit) return hit as Promise<T>;
  const p = readJson<T>(url);
  shared.set(url, p);
  return p;
}

/** Test seam: drop every shared promise so a suite can re-drive a hook. */
export function resetHomeReads(): void {
  shared.clear();
}

function useEndpoint<T>(url: string, injected?: ReadState<T>): ReadState<T> {
  const [state, setState] = useState<ReadState<T>>({ kind: "loading" });
  useEffect(() => {
    if (injected) return;
    let alive = true;
    once<T>(url)
      .then((payload) => {
        if (alive) setState({ kind: "ready", payload });
      })
      .catch((e: unknown) => {
        if (alive) setState({ kind: "failed", reason: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      alive = false;
    };
  }, [url, injected]);
  return injected ?? state;
}

export function useEstateState(injected?: ReadState<StatePayload>) {
  return useEndpoint<StatePayload>("/api/state", injected);
}

export function usePublicRoot(injected?: ReadState<RootPayload>) {
  return useEndpoint<RootPayload>("/root.json", injected);
}

export function useCorrections(injected?: ReadState<CorrectionsPayload>) {
  return useEndpoint<CorrectionsPayload>("/api/corrections", injected);
}

export type DoorReads = Record<string, { payload: PopPreview | null; reason?: string }>;

/**
 * The ten population doors, read in parallel from their FREE previews. Each door settles on its
 * own: one door failing never removes another door's line, and no door's figure is ever added to
 * another's — they are ten different populations that happen to be listed together.
 */
export function usePopulationDoors(injected?: DoorReads): DoorReads {
  const [reads, setReads] = useState<DoorReads>({});
  useEffect(() => {
    if (injected) return;
    let alive = true;
    Promise.allSettled(
      POPULATION_DOORS.map((id) =>
        once<PopPreview>(`/api/pop/${id}?preview=1`).then((payload) => ({ id, payload })),
      ),
    ).then((settled) => {
      if (!alive) return;
      const next: DoorReads = {};
      settled.forEach((r, i) => {
        const id = POPULATION_DOORS[i];
        if (r.status === "fulfilled") next[id] = { payload: r.value.payload };
        else next[id] = { payload: null, reason: r.reason instanceof Error ? r.reason.message : String(r.reason) };
      });
      setReads(next);
    });
    return () => {
      alive = false;
    };
  }, [injected]);
  return injected ?? reads;
}

/**
 * The distribution funnel payload, for the surfaces that need the per-stage REASONS rather than
 * the pills. LiveCounters reads the same endpoint for the pills themselves; this is the shared
 * promise, so the funnel page makes one request, not two.
 */
export function useFootprintPayload(injected?: ReadState<FootprintPayload>) {
  return useEndpoint<FootprintPayload>("/api/footprint", injected);
}

/** The published x402 manifest: the door list and the MCP tool split, straight off the wire. */
export function useX402Manifest(injected?: ReadState<X402Manifest>) {
  return useEndpoint<X402Manifest>("/.well-known/x402.json", injected);
}
