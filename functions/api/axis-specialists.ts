/**
 * GET /api/axis-specialists — unsigned MEOK Hive audit index for every GSPC axis.
 * Each specialist has an isolated logical cluster, distinct checks and proposals,
 * and a MEOK H.I.M.-compatible HOLD gate. No apply operation or new measurement.
 */
import { headFromGet } from "./_head";
import { specialistIndex, specialistJson } from "./_axisSpecialists";

export function onRequestGet(): Response {
  return specialistJson(specialistIndex());
}

export const onRequestHead = headFromGet(onRequestGet);
