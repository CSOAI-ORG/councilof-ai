import { HOME_NAV } from '@/components/homeNav';
export { HOME_NAV };
export { XRPL_NAV_DESCRIPTION } from '@/data/xrplNavDescription';

/**
 * TEMP: do not merge this branch. Header.tsx was overwritten with PLACEHOLDER.
 * Restore from master blob bfe7a90a9e609a7733057a156a78f36ae9554072 then set Interop description to XRPL_NAV_DESCRIPTION.
 * Live leftover: JS bundle still has Devnet pointer. Homepage HTML already honest via #966.
 */
export function Header() {
  return null;
}
export const ARCHIVE_NAV: never[] = [];
