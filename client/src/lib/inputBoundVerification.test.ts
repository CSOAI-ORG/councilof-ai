import { describe, expect, it } from "vitest";
import { InputBoundVerifier, sha256Text } from "./inputBoundVerification";

type Verdict = { valid: boolean; reason: string };

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("InputBoundVerifier", () => {
  it("binds a valid verdict to the exact input SHA-256", async () => {
    const controller = new InputBoundVerifier<Verdict>();
    const input = JSON.stringify({ payload: "valid", key: "key-a" });
    const bound = await controller.run(input, async () => ({ valid: true, reason: "signature valid" }));

    expect(bound).toEqual({
      inputHash: await sha256Text(input),
      result: { valid: true, reason: "signature valid" },
    });
  });

  it("discards a verdict when the payload or embedded key is edited", async () => {
    const controller = new InputBoundVerifier<Verdict>();
    const pending = deferred<Verdict>();
    const run = controller.run('{"key":"key-a"}', () => pending.promise);

    controller.invalidate();
    pending.resolve({ valid: true, reason: "old input" });

    await expect(run).resolves.toBeNull();
  });

  it("binds a malformed-input failure instead of retaining an earlier success", async () => {
    const controller = new InputBoundVerifier<Verdict>();
    await controller.run('{"valid":true}', async () => ({ valid: true, reason: "valid" }));
    controller.invalidate();

    const malformed = "{";
    const bound = await controller.run(malformed, async () => ({ valid: false, reason: "parse error" }));
    expect(bound?.inputHash).toBe(await sha256Text(malformed));
    expect(bound?.result).toEqual({ valid: false, reason: "parse error" });
  });

  it("accepts a successful re-verification after an edit", async () => {
    const controller = new InputBoundVerifier<Verdict>();
    const first = await controller.run("first", async () => ({ valid: true, reason: "first" }));
    controller.invalidate();
    const second = await controller.run("second", async () => ({ valid: true, reason: "second" }));

    expect(first?.inputHash).not.toBe(second?.inputHash);
    expect(second).toEqual({
      inputHash: await sha256Text("second"),
      result: { valid: true, reason: "second" },
    });
  });

  it("prevents an older async response from overwriting a newer result", async () => {
    const controller = new InputBoundVerifier<Verdict>();
    const oldResponse = deferred<Verdict>();
    const newResponse = deferred<Verdict>();
    const oldRun = controller.run("old", () => oldResponse.promise);
    const newRun = controller.run("new", () => newResponse.promise);

    newResponse.resolve({ valid: true, reason: "new" });
    const accepted = await newRun;
    oldResponse.resolve({ valid: false, reason: "old" });

    expect(accepted?.inputHash).toBe(await sha256Text("new"));
    await expect(oldRun).resolves.toBeNull();
  });
});
