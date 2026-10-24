/** Runtime checks at JSON boundaries. Unknown is never converted to an assumed record. */
export type JsonRecord = Record<string, unknown>;
export function objectOrNull(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord : null;
}
export function objectArrayOrNull(value: unknown): JsonRecord[] | null {
  if (!Array.isArray(value)) return null;
  return value.every((item): item is JsonRecord => objectOrNull(item) !== null) ? value : null;
}
export function stringArrayOrNull(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item): item is string => typeof item === 'string') ? value : null;
}
export async function readObjectResponse(response: Response): Promise<JsonRecord | null> {
  if (!response.ok) return null;
  const type = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!type.includes('application/json') && !type.includes('+json')) return null;
  try { return objectOrNull(await response.json()); } catch { return null; }
}
