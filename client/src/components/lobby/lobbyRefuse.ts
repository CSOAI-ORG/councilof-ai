/**
 * Lobby chat refusals. The UI never signs, fills cells, tokenises, or certifies.
 * Logged as a product event in the thread (state: ungrounded).
 */
export type Refusal = { id: string; text: string };

const RULES: { id: string; re: RegExp; text: string }[] = [
  {
    id: "certify",
    re: /\b(make me certified|get certified|certify (us|me|this)|notified body)\b/i,
    text:
      "Refuse. We measure; we do not certify. A notified body is a legal designation we do not hold. Verify a card at /gspc-verify.",
  },
  {
    id: "fortune",
    re: /\b(fill the fortune|fortune (100|500|list)|invent vendors|invent (a |the )?compan)/i,
    text: "Refuse. Recon-only. Unknown stays unknown. We do not invent vendors.",
  },
  {
    id: "token",
    re: /\b(tokeni[sz]e|tokenise this score|consortium cut|bond token)\b/i,
    text: "Refuse. A GSPC card is not a token, a bond, or a cut. Financial status comes from live GET /api/gspc — we do not invent cells.",
  },
  {
    id: "autocompile",
    re: /\b(auto-?comply|auto comply|comply from now on|make us compliant)\b/i,
    text:
      "Refuse. Continuity is a new run and a new card. Compliance is counsel’s job. We will not rewrite your system from chat.",
  },
  {
    id: "sov",
    re: /\b(sov33|sov-33|show sovos|merge defoneos)\b/i,
    text: "Refuse. Internal codenames are not a public surface. Brand-gate.",
  },
  {
    id: "autosign",
    re: /\b(sign in the background|auto-?sign|agent sign without)\b/i,
    text: "Refuse. A human confirm is required before any sign. The UI never calls the signer directly.",
  },
  {
    id: "scrape",
    re: /\b(scrape behind login|bypass login|steal (the )?session)\b/i,
    text: "Refuse. No scrape behind login.",
  },
];

export function matchRefusal(question: string): Refusal | null {
  const t = question.trim();
  for (const r of RULES) {
    if (r.re.test(t)) return { id: r.id, text: r.text };
  }
  return null;
}

export function looksLikeCardJson(question: string): boolean {
  const t = question.trim();
  if (!t.startsWith("{")) return false;
  return /"signature"\s*:/.test(t) && (/"id"\s*:/.test(t) || /"content_id"\s*:/.test(t));
}

export function wantsBoardTotals(question: string): boolean {
  return /\b(walk me through the live (gspc )?board|board totals|how many axis|22\s*[·.]\s*15|which axis carry a measured)\b/i.test(
    question,
  );
}
