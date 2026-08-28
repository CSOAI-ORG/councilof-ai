/**
 * HOME_FAQ — the 21 questions from the homepage FAQ section.
 * 
 * These are honest answers that describe what Council of AI measures and what
 * it refuses to claim. The answers are grouped into sections for the /faq page
 * but kept in original order for compatibility with the homepage.
 */

export type FaqItem = { q: string; a: string };

export interface FaqSection {
  id: string;
  title: string;
  items: FaqItem[];
}

/**
 * The 21 homepage FAQ items in their original order.
 * Used by the homepage link and as the source of truth.
 */
export const HOME_FAQ: FaqItem[] = [
  {
    q: "What is Council of AI?",
    a: "Council of AI (legally CSOAI Ltd, UK Companies House 16939677) is an independent measurement body for AI behaviour. We run AI systems against frozen, published tests drawn from real statute, grade the answers with deterministic code, sign the result with an Ed25519 key, and publish it — including the parts we could not measure. We are the instrument, not the referee: we produce evidence, and regulators, insurers and buyers decide what to do with it.",
  },
  {
    q: "What is a measurement card?",
    a: "A measurement card is the output: a small signed record — under a kilobyte of JSON — holding the axis measured, the exact model, the accuracy, who issued it, when it was created, the hash of the card before it in the chain, and the Ed25519 signature over all of that. That is the whole of it. Sample sizes, confidence intervals and separation determinations live on the board at GET councilof.ai/api/gspc, not inside the card; a card tells you a specific measurement happened and has not been altered since, and the board tells you how much weight it carries. It is small enough to email, attach to a tender, or keep in a compliance folder, and it is yours to hold — it does not live on our server for us to quietly amend later.",
  },
  {
    q: "How do I verify a measurement card myself?",
    a: "Three steps, and none of them involve us. First, fetch our public key from /.well-known/did.json and check the card carries that exact key — a card verified against the key it ships with proves only that the file is self-consistent, not that we issued it. Second, canonicalise the card's body — every key sorted, no whitespace — and take the SHA-256; that hash must equal the card's id. Third, verify the Ed25519 signature over those same bytes. One warning that matters if you implement this outside Python: the bytes were produced by CPython, which writes a float of integral value as 0.0 where JavaScript and Go write 0, so a naive verifier reports a false failure on a large minority of the set. We publish a zero-dependency JavaScript verifier that handles it at /signed/verify-card.mjs, and the exact rule at /signed/HOW-TO-VERIFY.md. The whole check runs offline, with no CSOAI code, no account and no permission — or in your browser at councilof.ai/gspc-verify. Note what is not in that chain: there is no RFC-3161 timestamp authority and no OpenTimestamps or blockchain anchoring, and our records say so with timestamp_authority: none. The anchor is the signature over the hash chain — a smaller claim you can check in seconds rather than a larger one you have to take on faith.",
  },
  {
    q: 'What does a "measured of N" figure on the board mean?',
    a: "It is a coverage statement, not a grade: how many slots on the current stamp carry a measured result, versus how many are described honestly or left empty. We do not type that fraction into this page — read totals.public_count from GET councilof.ai/api/gspc, which is also where the stamp date lives.",
  },
  {
    q: "Why is a slot ever left UNMEASURED?",
    a: "Because measuring it properly is not possible yet, and inventing a number would be worse than an empty cell. A slot stays UNMEASURED when the sample is too small to quote — we do not publish a score below thirty graded items — or when the instrument has not been frozen and published, or when the legal gold labels are still with counsel. UNMEASURED is not a failing grade for the AI system; it is a disclosure about us. Silently filling that gap is the exact behaviour this whole instrument exists to catch.",
  },
  {
    q: "What is jail, or containment?",
    a: "Jail asks a blunt question: can this model be talked out of its own guardrails and made to act outside its sandbox? It is a measured floor, not a ranking. It was measured on a smaller fleet than the main board and on its own set of gold cells, and its separation has now been tested and came back a TIE — meaning no model on it is separated from the others at p<0.05, so we name no winner. All of that is printed on the axis rather than hidden behind it, and the current separation counts live in the totals block of GET /api/gspc. The best detector we measured still misses most escapes, and we publish that too.",
  },
  {
    q: "Why do you report a tie instead of naming a winner?",
    a: "Because most leads on a leaderboard are noise. When one model scores a little higher than another, we run a McNemar test on the items where the two actually disagreed. If the difference is not statistically separated, we call it a tie and we do not count it as a win — even when the model in front is one of ours. On the current board most axis are ties, and the exact split of separated leads to ties is published in the totals block of GET /api/gspc. A ranking that promotes every point-estimate lead to a victory is selling you a decimal point.",
  },
  {
    q: "Who pays Council of AI, and who never pays?",
    a: "No company we measure pays for its place on the board, its score, or its removal from either. Members of the public never pay us anything. Verification is free forever and needs no account. We fund ourselves by selling signed evidence artefacts — an attested report, a published dataset, a scheduled re-attestation — which are published whether the result flatters the buyer or not, and never as a fee for a ranking or a placement. If you can verify it, it is not behind a paywall.",
  },
  {
    q: "What does Council of AI NOT do?",
    a: "We do not certify. We do not accredit, and there is no accreditation chain behind us; we are not a notified body under the EU AI Act or anything else. We do not enforce — we cannot approve, ban, fine or clear any system. We issue no conformity mark, no badge and no seal for anyone to put in a footer. And a measurement card is not legal advice: it describes what a system did on published tests on a stated date, which is a narrower and more useful thing than a compliance verdict.",
  },
  {
    q: "Which regulations and frameworks do you cover?",
    a: "Two different things, and they are worth separating. The frozen provision bank is anchored by a published corpus hash inside the signed Article 50 pack at /packs/eu-article-50/provbench.json — that anchor, not a number on this page, is what fixes how many provisions were in the bank when it was signed. The published crosswalk is narrower than the bank: /crosswalk/east-west-v1.json maps one signed measurement across four regimes — the EU AI Act, the UK DRCF alignment, Illinois SB 315 and the Chinese TC260 alignment. Mappings to NIST AI RMF and ISO/IEC 42001 are described on our framework pages but are not in that published crosswalk, so treat them as described rather than as verified. New instruments are added as regulation actually lands, not when it is announced.",
  },
  {
    q: "What happens when the law changes?",
    a: "We watch the primary sources — EUR-Lex, legislation.gov.uk and the national registers — by hash, and we publish a dated deadline feed at councilof.ai/api/regulation. When a provision genuinely changes, we re-measure the affected systems and issue a delta card. The old card is not withdrawn, expired or overwritten: history here is append-only, so the record of what was true in August still reads correctly next year. Where the effective date of an obligation is genuinely disputed, we record the dispute rather than resolve it silently.",
  },
  {
    q: "How does a company get measured?",
    a: "Today there are two different things behind that question and we will not blur them. The free self-serve tool at /assess is a deterministic EU AI Act classifier: you describe the system in text, and a keyword decision table returns the Annex III tier and the gaps against a fixed Article 9–15/50 control set. It never contacts your endpoint and it is not a bench run, so it cannot tell you how your model behaves. A GSPC bench run — your system answering a frozen, published bank, graded deterministically, ending in a card that joins the chain — is not yet self-serve; it is arranged with us directly, and the honest reason is capacity, not policy. Both use the same items, the same grader and the same thresholds every other subject faced, so results stay comparable, and you get back what we could not fill as well as what we could.",
  },
  {
    q: "What do regulators get from a measurement card?",
    a: "A behavioural record they can re-compute themselves, rather than a supplier's assurance about its own product. Each provision in our bank is traceable from the statute text through to the specific items that test it, so a supervisor can see exactly what was asked and how the answer was graded. The card is signed, so its provenance survives being forwarded, and the empty slots tell a regulator where evidence does not yet exist — which is often the more actionable half.",
  },
  {
    q: "What do insurers get from a measurement card?",
    a: "Something to price against. Underwriting AI deployment risk currently means reading a questionnaire the applicant filled in about itself. A measurement card is instead an observed behavioural sample, with its sample size and interval published beside it on the board, so exposure can be reasoned about from behaviour rather than from a self-declaration. Scheduled automatic re-attestation is not yet available — re-measurement today is arranged run by run — so track drift by comparing dated cards rather than by expecting a subscription feed. We are the rail, not the referee: we do not tell an insurer what to charge, and we take no share of anything written on the back of a card.",
  },
  {
    q: "How does the arena work?",
    a: "Two systems face the same frozen items. Each match is a subject, an instrument and a fixed rule — never an opinion. The verdict is a predicate: the answer either satisfies the provision or it does not, and ties are reported as ties. Any round can be promoted into a signed card; practice runs stay practice and are never quoted. We do not publish an uptime figure for the arena and we are not going to imply one — how continuously it has actually run is unmeasured, and /api/state says so rather than us calling it round-the-clock.",
  },
  {
    q: "Why does no model ever judge another model?",
    a: "Because an AI grading an AI is a correlated error, not an audit — the judge shares the blind spots of the thing it is judging, and the score becomes a measure of family resemblance. Every verdict we publish comes from deterministic code against pre-written gold labels, so the same input always produces the same grade and you can read the grader yourself. Where a response cannot be parsed into a label at all, it is counted as unmeasured rather than silently scored as a wrong answer.",
  },
  {
    q: "What happens when Council of AI gets something wrong?",
    a: "It goes in the public corrections ledger at councilof.ai/api/corrections, which is appended and never edited or deleted. Each entry records what was wrong, how it was caught, and what changed. The hardest example is on that record: we had published a consensus guarantee for our council architecture, then measured how independent those seats actually were and found the effective number was n_eff 1.21 out of a nominal 3. The guarantee did not hold, so we retracted it (DR-0007) instead of rewording it. The council remains a designed 33-seat structure with a designed 23-of-33 threshold, and it is labelled as a design figure everywhere it appears.",
  },
  {
    q: "Can I see the actual tests and the scoring code?",
    a: "Yes, and you should. The instrument banks are published as open datasets, the grading harness is public, and the per-item rows behind every published score are the same rows we scored. That is the point of freezing an instrument: a benchmark you cannot re-run is a press release. If you re-run it and get a different answer to ours, that is a correction we want, and it goes in the ledger under your name.",
  },
  {
    q: "Is my result published, or is it mine to share?",
    a: "Yours. The card is signed but disclosure is your decision — hand it to a customer, attach it to a regulatory filing, or keep it entirely private. The signing key is public, so whoever you do show it to can verify it without contacting us and without us learning that they did. What we publish on the open board is our own model fleet and the systems whose owners chose publication.",
  },
  {
    q: "What is the difference between MEASURED, UNMEASURED and REPORTED?",
    a: "They are three different kinds of claim and we never merge them. MEASURED means we ran it on our own frozen instruments and signed the result; that is the only state that goes on the board. UNMEASURED means the cell is honestly empty — too small a sample, no separation test, or an instrument not yet frozen. REPORTED means a figure published by somebody else, cited and dated, carried for context and left unsigned; the human-performance baselines you see beside our AI figures are REPORTED aggregates from other people's studies, not our own collection. A REPORTED number never enters our board and is never averaged with a MEASURED one.",
  },
  {
    q: "How does an AI agent or an answer engine read all of this?",
    a: "The same way you do, only faster. The board is machine-readable at GET councilof.ai/api/gspc, third-party figures at /api/reported, the corrections ledger at /api/corrections, the signing keys at /.well-known/did.json and the dated deadline feed at /api/regulation. There is a summary for language models at /llms.txt and the endpoints are documented at /api-docs. Everything an agent needs to verify a claim is served without an account, because a trust layer that requires a login is not a trust layer.",
  },
];

/**
 * The 21 questions grouped into 5 sections for the /faq page.
 * Section order: What we are · What we are not · How to verify · Money · Law and fronts.
 */
export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "what-we-are",
    title: "What we are",
    items: [
      HOME_FAQ[0],  // What is Council of AI?
      HOME_FAQ[1],  // What is a measurement card?
      HOME_FAQ[3],  // What does a "measured of N" figure mean?
      HOME_FAQ[4],  // Why is a slot ever left UNMEASURED?
      HOME_FAQ[19], // What is the difference between MEASURED, UNMEASURED and REPORTED?
      HOME_FAQ[5],  // What is jail, or containment?
      HOME_FAQ[6],  // Why do you report a tie instead of naming a winner?
      HOME_FAQ[14], // How does the arena work?
    ],
  },
  {
    id: "what-we-are-not",
    title: "What we are not",
    items: [
      HOME_FAQ[8],  // What does Council of AI NOT do?
      HOME_FAQ[15], // Why does no model ever judge another model?
      HOME_FAQ[16], // What happens when Council of AI gets something wrong?
    ],
  },
  {
    id: "how-to-verify",
    title: "How to verify",
    items: [
      HOME_FAQ[2],  // How do I verify a measurement card myself?
      HOME_FAQ[17], // Can I see the actual tests and the scoring code?
      HOME_FAQ[18], // Is my result published, or is it mine to share?
      HOME_FAQ[20], // How does an AI agent or an answer engine read all of this?
    ],
  },
  {
    id: "money",
    title: "Money",
    items: [
      HOME_FAQ[7],  // Who pays Council of AI, and who never pays?
      HOME_FAQ[11], // How does a company get measured?
      HOME_FAQ[13], // What do insurers get from a measurement card?
    ],
  },
  {
    id: "law-and-fronts",
    title: "Law and fronts",
    items: [
      HOME_FAQ[9],  // Which regulations and frameworks do you cover?
      HOME_FAQ[10], // What happens when the law changes?
      HOME_FAQ[12], // What do regulators get from a measurement card?
    ],
  },
];
