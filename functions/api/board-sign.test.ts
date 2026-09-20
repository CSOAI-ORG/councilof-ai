import { describe, expect, it } from "vitest";
import { validateOidcClaims } from "./board-sign";

const aud = "https://councilof.ai/api/board-sign";
const future = Math.floor(Date.now() / 1000) + 300;

describe("board-sign OIDC policy", () => {
  it("keeps the existing GitHub repository/workflow trust boundary", () => {
    const r = validateOidcClaims({
      iss: "https://token.actions.githubusercontent.com",
      aud,
      exp: future,
      repository: "CSOAI-ORG/council-of-ai",
      job_workflow_ref: "CSOAI-ORG/council-of-ai/.github/workflows/public-root.yml@refs/heads/master",
    });
    expect(r.issuer).toBe("github");
  });

  it("rejects a different GitHub repository", () => {
    expect(() => validateOidcClaims({
      iss: "https://token.actions.githubusercontent.com",
      aud,
      exp: future,
      repository: "someone/else",
      workflow: "public-root",
    })).toThrow(/repo/);
  });

  it("keeps GitLab disabled until an exact project path is configured", () => {
    expect(() => validateOidcClaims({
      iss: "https://gitlab.com", aud, exp: future,
      project_path: "csoai/council-of-ai", ref: "master", ref_type: "branch", ref_protected: true,
    }, {})).toThrow(/gitlab_disabled/);
  });

  it("accepts only the configured protected GitLab project/ref", () => {
    const env = {
      BOARD_SIGN_GITLAB_PROJECT_PATH: "csoai/council-of-ai",
      BOARD_SIGN_GITLAB_ALLOWED_REFS: "master",
    };
    const r = validateOidcClaims({
      iss: "https://gitlab.com", aud, exp: future,
      project_path: "csoai/council-of-ai", ref: "master", ref_type: "branch", ref_protected: "true",
    }, env);
    expect(r.issuer).toBe("gitlab");
    expect(r.principal).toBe("csoai/council-of-ai:master");
  });

  it("rejects unprotected or wrong-ref GitLab identities", () => {
    const env = {
      BOARD_SIGN_GITLAB_PROJECT_PATH: "csoai/council-of-ai",
      BOARD_SIGN_GITLAB_ALLOWED_REFS: "master",
    };
    expect(() => validateOidcClaims({
      iss: "https://gitlab.com", aud, exp: future,
      project_path: "csoai/council-of-ai", ref: "master", ref_type: "branch", ref_protected: false,
    }, env)).toThrow(/ref_protected/);
    expect(() => validateOidcClaims({
      iss: "https://gitlab.com", aud, exp: future,
      project_path: "csoai/council-of-ai", ref: "dev", ref_type: "branch", ref_protected: true,
    }, env)).toThrow(/ref/);
  });
});
