/**
 * An intake receipt proves storage only when the named endpoint explicitly
 * acknowledges it. An arbitrary HTTP 2xx body is not lead delivery, a human
 * notification, a booking or a promise to email a report.
 */
export function acknowledgedLeadStorage(httpStatus: number, value: unknown): boolean {
  return httpStatus === 200
    && value !== null
    && typeof value === "object"
    && !Array.isArray(value)
    && (value as Record<string, unknown>).ok === true
    && (value as Record<string, unknown>).stored === true;
}
