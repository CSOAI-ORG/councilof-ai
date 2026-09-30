import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { onRequestGet } from "./certificate-schema";

describe("/api/certificate-schema — withdrawn, renamed to csoai.completion-record/0.1", () => {
  it("answers the retired-endpoint shape and names the replacement", async () => {
    const res = await (onRequestGet as unknown as Function)({ env: {} });
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.schema).toBe("csoai.retired-endpoint/0.1");
    expect(body.code).toBe("RETIRED");
    expect(body.replaced_by.record).toBe("csoai.completion-record/0.1");
    expect(body.replaced_by.schema).toBe("https://councilof.ai/schemas/csoai-completion-record-0.1.schema.json");
  });

  it("the replacement schema is published and is the completion-record profile", () => {
    const s = JSON.parse(readFileSync(resolve(__dirname, "../../public/schemas/csoai-completion-record-0.1.schema.json"), "utf8"));
    expect(s.$id).toBe("https://councilof.ai/schemas/csoai-completion-record-0.1.schema.json");
    expect(s.properties.csoaiRecord.properties.schema.const).toBe("csoai.completion-record/0.1");
    expect(s.properties.csoaiRecord.properties.non_certification.const).toBe(true);
    expect(s.properties.credentialSubject.properties.achievement.properties.achievementType.const).toBe("Assignment");
  });
});
