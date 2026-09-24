/**
 * rulerAdmission — the path by which a consented, pseudonymous human result from THE RULER
 * could one day reach operator review. IT IS OFF.
 *
 * RULER_HUMAN_ADMISSION_ENABLED is false and stays false until the owner completes the data
 * protection review (council-os/DPIA_CSOAI_Aug2026.md is an unsigned draft: no controller
 * sign-off, no DPO, no ICO registration). While it is false, submitRulerAdmission returns
 * before it touches any network primitive — the unit tests hold that line.
 *
 * Even with the flag flipped, this is not yet enough on its own: /api/evidence-intake today
 * accepts only the quest practice-receipt shape and answers 503 to browsers because no public
 * writer is configured. RULER_ADMISSION_PRECONDITIONS lists what has to be true first.
 * Flipping the flag is an owner decision recorded in a commit, never a runtime switch.
 */
import type { RulerLabel, RoundAnswer, Seat } from "./ruler";

export const RULER_HUMAN_ADMISSION_ENABLED: boolean = false;

export const RULER_ADMISSION_ENDPOINT = "/api/evidence-intake";

export const RULER_ADMISSION_PRECONDITIONS: readonly string[] = [
  "The controller signs off the data protection impact assessment, which is still an unsigned draft.",
  "A data protection officer is appointed and ICO registration is complete, as that assessment requires before any collection.",
  "The evidence intake accepts a human-labelling observation. Today it accepts only the quest practice-receipt shape and has no public writer.",
  "Consent is asked for each session, is separate from play, and can be withdrawn.",
];

export const RULER_NOTHING_SENT_LINE =
  "Nothing you do here is sent anywhere. Human results are not collected until our data-protection review is complete.";

/** Drafted consent screen. Rendered today only as a disabled preview. */
export const RULER_CONSENT_COPY = {
  title: "Contribute this round to the human arm (not yet open)",
  lead:
    "When this opens, you will be able to offer the labels and bets from one finished round for operator review. " +
    "It is separate from playing: you can play every round without ever contributing.",
  paragraphs: [
    "You are labelling the same frozen items that published model answers were measured on. If you contribute, your labels are kept as a human result reported beside the model results, never merged into one number.",
    "You are identified only by a random pseudonymous id made in this browser for this round. It is not linked to your name, email, account or device, and we cannot work out who you are from it.",
    "No inference is made about you personally. Your result is not used to train any model and is not published on its own.",
    "You can withdraw a contribution at any time by quoting its pseudonymous id.",
  ],
  sends: [
    "the pseudonymous id for this round",
    "the bank name and its SHA-256 digest",
    "for each item: its id, your label and your bet",
    "the date of the round",
  ],
  neverSends: [
    "your name, email or any account",
    "free text (there is none in this game)",
    "age, country or any other personal detail",
    "your IP address or device details (they are not part of a contribution)",
  ],
  checkbox: "I have read this and want to contribute this one round.",
  offNotice:
    "Contributing is switched off. The data-protection review is not complete, so this screen is a draft and its button does nothing.",
} as const;

export interface RulerAdmissionObservation {
  item_id: string;
  human_label: RulerLabel;
  bet: Seat | null;
}

export interface RulerAdmissionRequest {
  schema: "csoai.ruler-human-observation-request/0.1-draft";
  consent: {
    network_submission: true;
    purpose: "independent-measurement-intake";
    model_training: false;
    public_release: false;
  };
  participant: { pseudonymous_id: string };
  instrument: { dataset: string; sha256: string; round_seed: string };
  observed_on: string;
  observations: RulerAdmissionObservation[];
  reported_beside_model_answers_never_merged: true;
}

export const PSEUDONYMOUS_ID_PATTERN = /^ps-[0-9a-f]{32}$/;

/** A random id with no input: nothing about the person can go into it. */
export function newPseudonymousId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `ps-${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Builds the draft request. Pure; it sends nothing. Only allow-listed fields can appear. */
export function buildRulerAdmissionRequest(input: {
  pseudonymousId: string;
  dataset: string;
  bankSha256: string;
  seed: string;
  observedOn: string;
  answers: Readonly<Record<string, RoundAnswer>>;
}): RulerAdmissionRequest {
  if (!PSEUDONYMOUS_ID_PATTERN.test(input.pseudonymousId)) throw new Error("pseudonymous id has the wrong shape");
  if (!/^[0-9a-f]{64}$/.test(input.bankSha256)) throw new Error("bank digest has the wrong shape");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.observedOn)) throw new Error("observed_on must be a date, nothing finer");
  return {
    schema: "csoai.ruler-human-observation-request/0.1-draft",
    consent: {
      network_submission: true,
      purpose: "independent-measurement-intake",
      model_training: false,
      public_release: false,
    },
    participant: { pseudonymous_id: input.pseudonymousId },
    instrument: { dataset: input.dataset, sha256: input.bankSha256, round_seed: input.seed },
    observed_on: input.observedOn,
    observations: Object.keys(input.answers)
      .sort()
      .map((id) => ({ item_id: id, human_label: input.answers[id].label, bet: input.answers[id].bet })),
    reported_beside_model_answers_never_merged: true,
  };
}

export type RulerAdmissionResult =
  | { sent: false; reason: "ADMISSION_OFF" | "NO_CONSENT" }
  | { sent: true; status: number };

/**
 * The only function in THE RULER that could reach the network. With the flag false it returns
 * before reading `deps.fetch` at all, whatever the caller passes, including consent.
 */
export async function submitRulerAdmission(
  request: RulerAdmissionRequest,
  deps: { consentGiven: boolean; fetch?: typeof fetch },
): Promise<RulerAdmissionResult> {
  if (!RULER_HUMAN_ADMISSION_ENABLED) return { sent: false, reason: "ADMISSION_OFF" };
  if (deps.consentGiven !== true) return { sent: false, reason: "NO_CONSENT" };
  const send = deps.fetch ?? globalThis.fetch;
  const response = await send(RULER_ADMISSION_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });
  return { sent: true, status: response.status };
}
