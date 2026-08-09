// useCivic — the SOV City gamification store.
// Holds the learner's civic state: district levels (each district = a framework
// the learner has trained on), the civic score (derived from completed modules +
// passed attestations), resilience, and the signed credential wallet.
//
// Persisted to localStorage so the city survives reloads. When the live Micropolis
// sim is reachable (/api/sov-town/state.jsonl) the page may overlay it, but this
// store is self-contained: it must not depend on a backend to render.

import { useCallback, useEffect, useMemo, useState } from "react";

export type District = {
  id: string;
  framework: string;
  modules: number;
  modulesDone: number;
  attestations: number;
  trained: boolean; // at least one module complete
  certified: boolean; // passed the attestation
};

export type Credential = {
  id: string;
  kind: "sov-training-attestation";
  framework: string;
  level: string;
  issuedAt: number;
  seal: string; // SOV:/sha256 fingerprint from sealArtifact
  signature?: string;
};

export type CivicState = {
  districts: District[];
  credentials: Credential[];
  lastTick: number;
};

const KEY = "sov-city.civic.v1";
const LEVELS = ["Entry", "Practitioner", "Professional", "Expert"];

const FRAMEWORKS = [
  { id: "eu-ai-act", framework: "EU AI Act", modules: 8 },
  { id: "nist-ai-rmf", framework: "NIST AI RMF", modules: 8 },
  { id: "iso-42001", framework: "ISO 42001", modules: 8 },
  { id: "jsp-936", framework: "UK JSP 936", modules: 6 },
] as const;

const emptyState = (): CivicState => ({
  districts: FRAMEWORKS.map((f) => ({
    id: f.id,
    framework: f.framework,
    modules: f.modules,
    modulesDone: 0,
    attestations: 0,
    trained: false,
    certified: false,
  })),
  credentials: [],
  lastTick: Date.now(),
});

function load(): CivicState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as CivicState;
    // merge so new frameworks appear even if a stored state predates them
    const merged = emptyState();
    merged.districts = merged.districts.map((d) => {
      const prev = parsed.districts.find((p) => p.id === d.id);
      return prev ? { ...d, ...prev } : d;
    });
    merged.credentials = parsed.credentials ?? [];
    merged.lastTick = parsed.lastTick ?? Date.now();
    return merged;
  } catch {
    return emptyState();
  }
}

function levelFor(pct: number): string {
  if (pct >= 0.99) return LEVELS[3];
  if (pct >= 0.7) return LEVELS[2];
  if (pct >= 0.35) return LEVELS[1];
  return LEVELS[0];
}

export function useCivic() {
  const [state, setState] = useState<CivicState>(load);

  // persist on change
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage may be unavailable; city still renders in-memory */
    }
  }, [state]);

  // deterministic local ticker — a gentle heartbeat so the city feels alive
  // even with no backend. Does not change scores, only stamps time.
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => ({ ...s, lastTick: Date.now() }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const completeModule = useCallback((districtId: string) => {
    setState((s) => ({
      ...s,
      districts: s.districts.map((d) =>
        d.id === districtId
          ? { ...d, modulesDone: Math.min(d.modules, d.modulesDone + 1), trained: true }
          : d
      ),
    }));
  }, []);

  // issue a signed credential wallet entry (student-side record; independent of
  // any conforming-body claim — a learning attestation, not regulatory cert)
  const issueCredential = useCallback(
    (districtId: string, seal: string, signature?: string) => {
      setState((s) => {
        const d = s.districts.find((x) => x.id === districtId);
        const framework = d ? d.framework : districtId;
        const pct = d ? d.modulesDone / d.modules : 0;
        const id = `SOV-${districtId.toUpperCase()}-${Date.now().toString(36)}`;
        const cred: Credential = {
          id,
          kind: "sov-training-attestation",
          framework,
          level: levelFor(pct),
          issuedAt: Date.now(),
          seal,
          signature,
        };
        return {
          ...s,
          credentials: [cred, ...s.credentials],
          districts: s.districts.map((x) =>
            x.id === districtId ? { ...x, attestations: x.attestations + 1, certified: true } : x
          ),
        };
      });
    },
    []
  );

  // derived civic score: training completeness weighted 60%, attestation 40%
  const civicScore = useMemo(() => {
    const total = state.districts.reduce((a, d) => a + d.modules, 0);
    const done = state.districts.reduce((a, d) => a + d.modulesDone, 0);
    const certified = state.districts.filter((d) => d.certified).length;
    const trained = state.districts.filter((d) => d.trained).length;
    const trainScore = total ? (done / total) * 100 : 0;
    const attScore = (certified / state.districts.length) * 100;
    return Math.round(trainScore * 0.6 + attScore * 0.4);
  }, [state.districts]);

  const resilience = useMemo(() => {
    // even a fully certified city can degrade if nothing is fresh; here we keep
    // it simple and bind resilience to breadth of attestation + recency
    const certified = state.districts.filter((d) => d.certified).length;
    const base = (certified / state.districts.length) * 100;
    return Math.max(10, Math.round(base * 0.8 + 20));
  }, [state.districts]);

  const reset = useCallback(() => {
    setState(emptyState());
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

  return { state, civicScore, resilience, completeModule, issueCredential, reset };
}
