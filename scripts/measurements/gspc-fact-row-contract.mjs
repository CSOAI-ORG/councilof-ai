/**
 * One source-of-truth boolean-normalisation contract for the public GSPC
 * mill-item fact table. This is not the model's safety grader and MUST NOT
 * infer grades from model text, expected labels, or missing observations.
 *
 * Mirrors the frozen source projection semantics:
 *   r.ok when explicitly present, otherwise r.grade;
 *   only true/false, and the exact strings "true"/"false", are grades.
 */
export const asSourceBoolean = value =>
  value === true || value === "true" ? true :
  value === false || value === "false" ? false : null;

export function sourceFactGrade(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw))
    throw new TypeError("source fact grade requires a raw object");
  return asSourceBoolean(raw.ok !== undefined ? raw.ok : raw.grade);
}
