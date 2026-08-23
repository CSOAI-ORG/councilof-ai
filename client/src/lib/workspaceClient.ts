/**
 * workspaceClient — thin client for /api/workspace + batch assess + re-attest.
 * Token stored in localStorage (opaque workspace id). No auth wall for MVP.
 */

const TOKEN_KEY = "coai.workspace.token";

export function getWorkspaceToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setWorkspaceToken(id: string) {
  try {
    localStorage.setItem(TOKEN_KEY, id);
  } catch {
    /* ignore */
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getWorkspaceToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("X-Workspace-Token", token);
  const res = await fetch(path, { ...init, headers });
  return res.json() as Promise<T>;
}

export type WorkspaceSystem = {
  id: string;
  name: string;
  description: string;
  domain?: string;
  frameworks: string[];
  last_assess_at?: string;
  last_report_id?: string;
  last_tier?: string;
  next_reattest_at?: string;
  created_at: string;
};

export type Workspace = {
  id: string;
  created_at: string;
  org: {
    name: string;
    sector?: string;
    jurisdictions: string[];
    size?: string;
  };
  systems: WorkspaceSystem[];
  doctrine: string;
};

export async function ensureWorkspace(orgName?: string): Promise<Workspace> {
  const existing = getWorkspaceToken();
  if (existing) {
    const got = await api<{ workspace?: Workspace; bound?: boolean }>(`/api/workspace?id=${existing}`);
    if (got.workspace) return got.workspace;
  }
  const created = await api<{ workspace: Workspace; token: string }>("/api/workspace", {
    method: "POST",
    body: JSON.stringify({ action: "create", org_name: orgName || "My organisation", size: "smb" }),
  });
  setWorkspaceToken(created.token || created.workspace.id);
  return created.workspace;
}

export async function addSystem(
  workspaceId: string,
  system: { name: string; description: string; domain?: string; frameworks?: string[] },
) {
  return api<{ system: WorkspaceSystem }>("/api/workspace", {
    method: "POST",
    body: JSON.stringify({ action: "add_system", id: workspaceId, system }),
  });
}

export async function batchAssess(systems: WorkspaceSystem[], orgName: string, frameworks: string[]) {
  return api<{
    systems: Array<Record<string, unknown>>;
    portfolio: Record<string, number>;
  }>("/api/assess/batch", {
    method: "POST",
    body: JSON.stringify({
      org_name: orgName,
      frameworks_in_scope: frameworks,
      systems: systems.map((s) => ({
        id: s.id,
        name: s.name,
        system: s.description,
        domain: s.domain,
        frameworks: s.frameworks,
      })),
    }),
  });
}

export async function scheduleReattest(workspaceId: string, systemId: string, systemName: string, days = 30) {
  return api("/api/reattest", {
    method: "POST",
    body: JSON.stringify({
      action: "schedule",
      workspace: workspaceId,
      system_id: systemId,
      system_name: systemName,
      schedule_days: days,
    }),
  });
}
