/** Registry claims are not proof of key custody, durable memory or authority. */
export function staffStoreState(registry: unknown): 'BOUND_REPORTED' | 'UNBOUND' | 'UNKNOWN' {
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) return 'UNKNOWN';
  const v = (registry as Record<string, unknown>).provisioned_store_bound;
  return v === true ? 'BOUND_REPORTED' : v === false ? 'UNBOUND' : 'UNKNOWN';
}
export function reportedStaffDid(record: unknown): string {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return '';
  const r = record as Record<string, unknown>;
  return r.signed === true && typeof r.did === 'string' && /^did:key:z[1-9A-HJ-NP-Za-km-z]+$/.test(r.did) ? r.did : '';
}
