import { describe, it } from "vitest";
import { registerCompanyCaseBytesContractCases } from "./companyCaseBytes.contractCases";

describe("Exact bounded company case bytes (synthetic unit cases)", () => {
  registerCompanyCaseBytesContractCases((name, body) => it(name, body));
});
