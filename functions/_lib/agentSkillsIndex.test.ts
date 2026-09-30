/**
 * /.well-known/agent-skills/index.json (Agent Skills Discovery RFC v0.2.0) is derived from the agent card:
 * the same skill ids the card declares and SKILL_IDS routes, every digest is the sha256 of the served SKILL.md,
 * and each entry carries the fields the RFC requires. Produced by scripts/build-agent-skills.mjs.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SKILL_IDS } from "../api/a2a";

const ROOT = join(__dirname, "..", "..");
const WK = join(ROOT, "public", ".well-known");
const card = JSON.parse(readFileSync(join(WK, "agent-card.json"), "utf8"));
const index = JSON.parse(readFileSync(join(WK, "agent-skills", "index.json"), "utf8"));

describe("agent-skills index", () => {
  it("declares the v0.2.0 schema and a skills array", () => {
    expect(index.$schema).toBe("https://schemas.agentskills.io/discovery/0.2.0/schema.json");
    expect(Array.isArray(index.skills)).toBe(true);
  });

  it("lists exactly the agent card's skills, which are exactly the router's SKILL_IDS", () => {
    const names = index.skills.map((s: { name: string }) => s.name).sort();
    expect(names).toEqual(card.skills.map((s: { id: string }) => s.id).sort());
    expect(names).toEqual([...SKILL_IDS].sort());
  });

  it("every entry is complete and its digest is the sha256 of the served SKILL.md", () => {
    for (const s of index.skills) {
      expect(s.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(s.type).toBe("skill-md");
      expect(typeof s.description === "string" && s.description.length > 0).toBe(true);
      expect(s.url).toBe(`/.well-known/agent-skills/${s.name}/SKILL.md`);
      const file = join(ROOT, "public", s.url);
      expect(existsSync(file), s.url).toBe(true);
      const body = readFileSync(file);
      expect(s.digest).toBe(`sha256:${createHash("sha256").update(body).digest("hex")}`);
      expect(body.toString("utf8")).toMatch(new RegExp(`^---\\nname: ${s.name}\\ndescription: `));
    }
  });
});
