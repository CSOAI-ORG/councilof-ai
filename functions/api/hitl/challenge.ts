/**
 * POST /api/hitl/challenge — raise a challenge for a human to decide.
 *
 * A challenge is a consequential act that a staff member would not perform on its own: publish,
 * release, send, approve. Raising one is not deciding it. The challenge names the subject, the
 * act proposed, the axis it concerns and the competency module the decider must first answer;
 * it carries no credential, because the door refuses one.
 *
 * WHY THIS FILE EXISTS. See `functions/api/hitl/modules/index.ts`: the dispatch in
 * `functions/api/hitl.ts` was correct, but Pages routes by FILE, so `/api/hitl/challenge`
 * answered 404 from the platform. The human-in-the-loop path published its own challenge
 * machinery and could not use it.
 */

export { onRequestPost, onRequestOptions } from "../hitl";
