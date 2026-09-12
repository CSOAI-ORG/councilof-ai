import assert from "node:assert/strict";
import test from "node:test";

import { normalizeAtomicAmount } from "./evm-erc20-reader.mjs";

test("normalizes 18-decimal supplies without Number precision loss", () => {
  assert.equal(
    normalizeAtomicAmount("123456789012345678901234567890", 18),
    "123456789012.345678901234567890",
  );
});

test("normalizes zero-decimal tokens without a trailing point", () => {
  assert.equal(normalizeAtomicAmount("42", 0), "42");
});
