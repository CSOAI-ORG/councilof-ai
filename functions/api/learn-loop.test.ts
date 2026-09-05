import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { onRequestGet, onRequestPost } from "./learn-loop";

const ctx = (method: "GET" | "POST") =>
  ({
    request: new Request("https://councilof.ai/api/learn-loop", {
      method,
      ...(method === "POST"
        ? { headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "chat", payload: { message: "hello" } }) }
        : {}),
    }),
    env: {},
    params: {},
  }) as never;

describe("/api/learn-loop quarantine", () => {
  it.each([
    ["GET", onRequestGet],
    ["POST", onRequestPost],
  ] as const)("%s fails closed without manufacturing evidence", async (method, handler) => {
    const response = await handler(ctx(method));
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("86400");
    const body = await response.json();
    expect(body).toMatchObject({
      status: "UNAVAILABLE",
      lifecycle: "QUARANTINED_PRE_RELEASE",
      measurement_not_certification: true,
    });
    const encoded = JSON.stringify(body);
    expect(encoded).not.toMatch(/sig_ed25519|entry_uuid|attestation_uid|yes_count|quorum_reached/);
  });

  it("is marked unavailable in the checked-in OpenAPI document", () => {
    const openapi = JSON.parse(
      readFileSync(resolve(process.cwd(), "public/openapi.json"), "utf8"),
    );
    const path = openapi.paths["/api/learn-loop"];
    expect(path).toBeTruthy();
    for (const method of ["get", "post"]) {
      expect(path[method]["x-csoai-lifecycle"]).toBe("QUARANTINED_PRE_RELEASE");
      expect(Object.keys(path[method].responses)).toEqual(["503"]);
    }
  });
});
