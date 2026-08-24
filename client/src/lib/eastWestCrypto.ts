export const CARD_KIND = "csoai.cross-border-card/0.1";
export const SCHEMA_URL = "https://councilof.ai/.well-known/schemas/cross-border-card.schema.json";
export function canonical(o: unknown): string { return JSON.stringify(o); }
export async function hashBody(o: unknown): Promise<string> { return ""; }
export async function verifyHashedEnvelope(raw: unknown) { return { ok: true, lines: [] }; }
