/** Schedule execution states are separate from a claim's four evidence states. */
export function claimScheduleLabel(row: {
  next_scheduled_read_state?: string | null;
  next_scheduled_read?: string | null;
}): string {
  const state = row.next_scheduled_read_state?.trim() || "UNVERIFIED";
  const date = row.next_scheduled_read?.slice(0, 10);
  return date ? `${state} · ${date}` : state;
}
