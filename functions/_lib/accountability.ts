/**
 * Who answers for a record, and how to object to it: one unsigned block, one source.
 *
 * Outward gate, 7 Oct 2026: the NPL supplement and the Kaggle follow-up both cite
 * GET /api/claims/register and GET /api/corrections. The gate read neither as stating an
 * objection route, and /api/corrections carried no plain contact address at all. Both now carry
 * the facts below, from this one object, so the two cannot drift apart.
 *
 * UNSIGNED, and added by the handler at request time. It is not part of the register's
 * register_digest, and not part of the corrections ledger's signed body, so adding it moves no
 * digest and breaks no signature. Each endpoint says in its own header how the block is served.
 *
 * Every field was checked on 2026-10-07:
 *   - Companies House, company 16939677: CSOAI LTD, private limited company, active, registered
 *     office in London, England (an unprefixed number is an England and Wales registration);
 *   - the one mailbox, CONTACT_MAILBOX in functions/api/_buying.ts (also the footer's address);
 *   - https://councilof.ai/dispute/ answers 200 and states the objection and correction route.
 */
import { CONTACT_MAILBOX } from "../api/_buying";

export const OBJECTION_ROUTE = "https://councilof.ai/dispute/";
export const CORRECTIONS_LEDGER_URL = "https://councilof.ai/api/corrections";
export const COMPANY_NUMBER = "16939677";

const HOW_TO_OBJECT =
  `To object to, dispute or request a correction of anything in this record, write to ${CONTACT_MAILBOX} ` +
  `or follow ${OBJECTION_ROUTE}. Corrections are published, dated, at ${CORRECTIONS_LEDGER_URL}.`;

export const ACCOUNTABILITY_ENVELOPE = {
  schema: "csoai.accountability-envelope/0.1",
  signed: false,
  entity: "CSOAI Ltd",
  registration: `registered in England and Wales, company no. ${COMPANY_NUMBER}`,
  company_register_url: `https://find-and-update.company-information.service.gov.uk/company/${COMPANY_NUMBER}`,
  contact_email: CONTACT_MAILBOX,
  objection_route: OBJECTION_ROUTE,
  corrections_ledger: CORRECTIONS_LEDGER_URL,
  how_to_object: HOW_TO_OBJECT,
  scope: "Added by this endpoint when it answers. No digest or signature in this response covers this block.",
} as const;

/**
 * The same facts as one sentence, for a response that can only carry them as text: the
 * corrections ledger's signed content_id_rule names the unsigned top-level keys, so a new key
 * there would make the signed rule wrong about the served bytes (see functions/api/corrections.ts).
 */
export const ACCOUNTABILITY_SENTENCE =
  `Accountable entity: ${ACCOUNTABILITY_ENVELOPE.entity}, ${ACCOUNTABILITY_ENVELOPE.registration}. ${HOW_TO_OBJECT}`;
