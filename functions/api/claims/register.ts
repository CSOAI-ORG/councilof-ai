/**
 * GET /api/claims/register — the register of every subject we maintain public claims on.
 *
 * Specification: https://councilof.ai/spec/claim-maintenance/v0.1/ (CC0 1.0), §7.5.
 *
 * ONE SET OF BYTES. The register is generated from the registry files on disk by
 * scripts/claim-maintenance-register.mjs, committed to public/spec/claim-maintenance/register.json,
 * and served from those exact bytes here. This endpoint computes nothing of its own: a second
 * engine producing its own copy of a register is a second register, and the two drift.
 *
 * WHAT THIS IS NOT. Not fact-checking, not certification, not auditing, not reputation scoring,
 * not adversarial journalism. No entry states or implies that any claim is false. A listing is
 * not an endorsement and it is not an accusation. No score, rank or index may be derived from
 * the state counts — the states describe the EVIDENCE available, never the claimant.
 *
 *   ?subject=<identifier or name>   one subject's row
 *   ?state=CLAIM_CAPTURED|CLAIM_MEASURED|UNMEASURED|UNCHECKABLE
 *                                   subjects holding at least one claim in that state
 */
import register from "../../../public/spec/claim-maintenance/register.json";

const STATES = ["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"] as const;
type State = (typeof STATES)[number];

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "public, max-age=300",
  "access-control-allow-origin": "*",
  link: '<https://councilof.ai/spec/claim-maintenance/v0.1/>; rel="describedby"; type="text/html"',
  "x-claim-maintenance-spec": "https://councilof.ai/spec/claim-maintenance/v0.1/",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const wantSubject = url.searchParams.get("subject");
  const wantState = url.searchParams.get("state");

  if (wantState && !STATES.includes(wantState as State)) {
    return json(
      {
        error: "unknown_state",
        // There are four states and only four. A filter for a fifth is answered with the four,
        // not with an empty list that would read as "no such claims".
        states: STATES,
        specification: register.specification,
      },
      400,
    );
  }

  let subjects = register.subjects;
  if (wantSubject) {
    const needle = wantSubject.toLowerCase();
    subjects = subjects.filter(
      (s) =>
        String(s.identifier).toLowerCase() === needle ||
        String(s.subject).toLowerCase() === needle ||
        String(s.subject_key).toLowerCase() === needle,
    );
  }
  if (wantState) {
    subjects = subjects.filter((s) => ((s.states as Record<string, number>)[wantState] ?? 0) > 0);
  }

  if (!wantSubject && !wantState) return json(register);

  // A filtered view reports the filter and the population it was taken from, so a partial read
  // can never be mistaken for the whole register.
  return json({
    ...register,
    view: {
      filter: { subject: wantSubject, state: wantState },
      subjects_returned: subjects.length,
      subjects_in_register: register.subjects.length,
      note: "A filtered view. totals[] below describe the whole register, not this filter.",
    },
    subjects,
  });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: { ...HEADERS, "access-control-allow-methods": "GET, OPTIONS", "access-control-allow-headers": "*" },
  });
