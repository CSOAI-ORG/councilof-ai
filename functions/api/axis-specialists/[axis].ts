import { headFromGet } from "../_head";
import { specialistByAxis, specialistJson, specialistNotFound } from "../_axisSpecialists";

type Context = { request: Request; params: { axis?: string } };

export function onRequestGet(context: Context): Response {
  const axis = String(context.params?.axis ?? "");
  const audit = specialistByAxis(axis);
  return audit ? specialistJson(audit) : specialistNotFound(axis);
}

export const onRequestHead = headFromGet(onRequestGet);
