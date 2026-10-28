import { test } from "vitest";
import { createCompanyCaseClient } from "./companyCaseClient";
import { registerCompanyCaseClientContractCases } from "./companyCaseClient.contractCases";

registerCompanyCaseClientContractCases(test, createCompanyCaseClient);
