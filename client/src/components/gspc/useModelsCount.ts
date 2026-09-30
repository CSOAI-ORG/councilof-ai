/** The third-party model count from /interop/models-measured.json (derived from the signed cards at
 *  build time by scripts/build-models-measured.mjs). Null until read, and null if the headline does
 *  not agree with its own rows (modelsHeadline refuses it). */
import { modelsHeadline } from "@/components/home/LiveBoardGlance";
import { useLiveJson } from "./useLiveJson";

export function useModelsCount(): number | null {
  const read = useLiveJson("/interop/models-measured.json");
  if (read.state !== "ok") return null;
  return modelsHeadline(read.data)?.third_party_models ?? null;
}
