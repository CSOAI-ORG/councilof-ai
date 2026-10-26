/** Navigation only. These URLs grant neither a session nor company-library access. */
export const COUNCIL_DEFAULT_LOGIN_RETURN = "/dashboard";
export const COMPANY_CASE_ID_MAX_LENGTH = 256;
const COMPANY_WORKSPACE = "/dashboard/?workspace=company";

function boundedCaseId(value: string): boolean {
  return value.length > 0 && value.length <= COMPANY_CASE_ID_MAX_LENGTH && value.trim() === value && !/[\u0000-\u001f\u007f-\u009f]/.test(value);
}

export function companyWorkspaceHref(caseId?: string): string {
  if (caseId === undefined) return COMPANY_WORKSPACE;
  if (!boundedCaseId(caseId)) throw new Error("The saved case identifier is invalid");
  const query = new URLSearchParams({ workspace: "company", case: caseId });
  return `/dashboard/?${query.toString()}`;
}

/** Only the company workspace's two navigation keys may survive a login return. */
export function safeCouncilLoginReturn(value: string | null | undefined): string {
  if (!value || value.length > 4096 || /[\\\u0000-\u0020\u007f]/.test(value)) return COUNCIL_DEFAULT_LOGIN_RETURN;
  const path = value.split("?")[0];
  if (path !== "/dashboard" && path !== "/dashboard/") return COUNCIL_DEFAULT_LOGIN_RETURN;
  let target: URL;
  try { target = new URL(value, "https://councilof.ai"); } catch { return COUNCIL_DEFAULT_LOGIN_RETURN; }
  if (target.origin !== "https://councilof.ai" || target.hash) return COUNCIL_DEFAULT_LOGIN_RETURN;
  const query = target.searchParams;
  for (const key of query.keys()) {
    if ((key !== "workspace" && key !== "case") || query.getAll(key).length !== 1) return COUNCIL_DEFAULT_LOGIN_RETURN;
  }
  if (!query.size) return COUNCIL_DEFAULT_LOGIN_RETURN;
  if (query.get("workspace") !== "company") return COUNCIL_DEFAULT_LOGIN_RETURN;
  const caseId = query.get("case");
  return caseId === null ? COMPANY_WORKSPACE : boundedCaseId(caseId) ? companyWorkspaceHref(caseId) : COUNCIL_DEFAULT_LOGIN_RETURN;
}

export function councilLoginReturnFromSearch(search: string): string {
  const query = new URLSearchParams(search);
  return query.getAll("next").length === 1 ? safeCouncilLoginReturn(query.get("next")) : COUNCIL_DEFAULT_LOGIN_RETURN;
}

export function councilLoginHref(returnTo?: string): string {
  const target = safeCouncilLoginReturn(returnTo);
  return target === COUNCIL_DEFAULT_LOGIN_RETURN ? "/login/" : `/login/?${new URLSearchParams({ next: target })}`;
}

/** Reserved/demo subjects never return to a private company workspace. */
export function councilLoginDestination(returnTo: string, email: string | null | undefined): string {
  const target = safeCouncilLoginReturn(returnTo);
  return target !== COUNCIL_DEFAULT_LOGIN_RETURN && (!email?.trim() || email.toLowerCase() === "demo@csoai.com")
    ? COUNCIL_DEFAULT_LOGIN_RETURN
    : target;
}
