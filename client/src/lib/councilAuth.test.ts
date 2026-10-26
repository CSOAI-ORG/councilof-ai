import { describe, it } from "vitest";
import { registerCouncilAuthContractCases } from "./councilAuth.contractCases";

describe("Council verified session and safe company-workspace login return", () => {
  registerCouncilAuthContractCases((name, body) => it(name, body));
});
