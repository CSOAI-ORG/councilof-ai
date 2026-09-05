import { generateKeyPairSync, sign, createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, "sign_mill_cards.py");
const temporary = [];
const ADJUDICATOR_KID = "did:web:adjudicator.example#measurement-1";
const BOARD_PUBLIC_KEY_HEX =
  "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const publicJwk = publicKey.export({ format: "jwk" });
const ADJUDICATOR_PUBLIC_KEY_HEX = Buffer.from(
  publicJwk.x,
  "base64url",
).toString("hex");

afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true });
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function admitted(body, overrides = {}) {
  const admission = {
    schema: "csoai.measurement-admission/0.1",
    body_sha256: sha256(canonical(body)),
    evidence_bundle_sha256: "1".repeat(64),
    reproduction_receipt_sha256: "2".repeat(64),
    method_sha256: "3".repeat(64),
    reviewer: "independent-reviewer@example.test",
    admitted_at: "2026-09-04T10:11:12Z",
    adjudicator: {
      kid: ADJUDICATOR_KID,
      alg: "Ed25519",
    },
    ...overrides,
  };
  const signature = sign(
    null,
    Buffer.from(canonical(admission)),
    privateKey,
  ).toString("hex");
  return {
    ...admission,
    adjudicator: { ...admission.adjudicator, signature },
  };
}

function runSigner(wrappers, envOverrides = {}) {
  const root = mkdtempSync(join(tmpdir(), "mill-admission-"));
  temporary.push(root);
  const source = join(root, "unsigned");
  const destination = join(root, "signed");
  mkdirSync(source, { recursive: true });
  wrappers.forEach((wrapper, index) => {
    writeFileSync(
      join(source, `unsigned-${String(index).padStart(2, "0")}.json`),
      `${JSON.stringify(wrapper, null, 2)}\n`,
    );
  });
  const harness = join(root, "run.py");
  writeFileSync(
    harness,
    String.raw`
import importlib.util
import json
import sys
from pathlib import Path

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("sign_mill_cards_under_test", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
module.SRC = Path(sys.argv[2])
module.DST = Path(sys.argv[3])
module.LEDGER = module.DST / "SUPERSEDED.jsonl"
calls = []
def fake_board_sign(body):
    calls.append(json.loads(json.dumps(body)))
    return "ab" * 64
module.sign_via_oidc = fake_board_sign
result = module.main()
print("BOARD_CALLS=" + str(len(calls)), file=sys.stderr)
raise SystemExit(result)
`,
  );

  const env = {
    ...process.env,
    MILL_ADJUDICATOR_KID: ADJUDICATOR_KID,
    MILL_ADJUDICATOR_PUBLIC_KEY_HEX: ADJUDICATOR_PUBLIC_KEY_HEX,
    ...envOverrides,
  };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete env[key];
  }
  const result = spawnSync("python3", [harness, SCRIPT, source, destination], {
    encoding: "utf8",
    env,
  });
  return { ...result, root, source, destination };
}

function baseBody(overrides = {}) {
  return {
    schema: "gspc.measurement-card/0.1",
    model: "fixture-model",
    axis: "fixture-axis",
    status: "MEASURED",
    n: 1,
    accuracy: 0.5,
    unmeasured: [],
    ...overrides,
  };
}

describe("mill measurement admission guard", () => {
  it("never promotes or signs an UNMEASURED body even when n is large", () => {
    const body = baseBody({
      status: "UNMEASURED",
      n: 999,
      unmeasured: ["not admitted"],
    });
    const result = runSigner([{ body }], {
      MILL_ADJUDICATOR_KID: undefined,
      MILL_ADJUDICATOR_PUBLIC_KEY_HEX: undefined,
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("UNMEASURED bodies are not board-signed");
    expect(result.stderr).toContain("BOARD_CALLS=0");
    expect(existsSync(result.destination)).toBe(false);
    expect(
      JSON.parse(readFileSync(join(result.source, "unsigned-00.json"), "utf8"))
        .body,
    ).toEqual(body);
  });

  it("fails closed before board signing or filesystem writes when config is absent", () => {
    const body = baseBody();
    const result = runSigner([{ body, admission: admitted(body) }], {
      MILL_ADJUDICATOR_KID: undefined,
      MILL_ADJUDICATOR_PUBLIC_KEY_HEX: undefined,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("set MILL_ADJUDICATOR_KID");
    expect(result.stderr).toContain("BOARD_CALLS=0");
    expect(existsSync(result.destination)).toBe(false);
  });

  it("signs an already-MEASURED body with a valid independent admission without changing it", () => {
    const body = baseBody({
      n: 1,
      note: "n is evidence metadata, never the admission rule",
    });
    const admission = admitted(body);
    const result = runSigner([{ body, admission }]);

    expect(result.status).toBe(0);
    expect(result.stderr).toContain("BOARD_CALLS=1");
    const files = readdirSync(result.destination).filter((name) =>
      name.endsWith(".json"),
    );
    expect(files).toHaveLength(1);
    const signed = JSON.parse(
      readFileSync(join(result.destination, files[0]), "utf8"),
    );
    expect(canonical(signed.body)).toBe(canonical(body));
    expect(signed.body.status).toBe("MEASURED");
    expect(signed.body.n).toBe(1);
    expect(signed.admission).toEqual(admission);
    expect(signed.quotable).toBe(true);
    expect(signed.id).toBe(sha256(canonical(body)));
  });

  it("rejects a bad admission signature and leaves the whole batch unwritten", () => {
    const validBody = baseBody({ model: "valid" });
    const invalidBody = baseBody({ model: "invalid" });
    const invalidAdmission = admitted(invalidBody);
    const firstByte = Number.parseInt(
      invalidAdmission.adjudicator.signature.slice(0, 2),
      16,
    );
    invalidAdmission.adjudicator.signature = `${(firstByte ^ 1)
      .toString(16)
      .padStart(2, "0")}${invalidAdmission.adjudicator.signature.slice(2)}`;
    const result = runSigner([
      { body: validBody, admission: admitted(validBody) },
      { body: invalidBody, admission: invalidAdmission },
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("signature is invalid");
    expect(result.stderr).toContain("BOARD_CALLS=0");
    expect(existsSync(result.destination)).toBe(false);
  });

  it("rejects a body changed after admission even when n still clears an old threshold", () => {
    const admittedBody = baseBody({ n: 30, accuracy: 0.5 });
    const changedBody = { ...admittedBody, accuracy: 0.99 };
    const result = runSigner([
      { body: changedBody, admission: admitted(admittedBody) },
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "body_sha256 does not bind the canonical body",
    );
    expect(result.stderr).toContain("BOARD_CALLS=0");
    expect(existsSync(result.destination)).toBe(false);
  });

  it("rejects reuse of the pinned board signer before admission verification", () => {
    const body = baseBody();
    const result = runSigner([{ body, admission: admitted(body) }], {
      MILL_ADJUDICATOR_PUBLIC_KEY_HEX: BOARD_PUBLIC_KEY_HEX,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("must not reuse the board signer");
    expect(result.stderr).toContain("BOARD_CALLS=0");
    expect(existsSync(result.destination)).toBe(false);
  });

  it("keeps the 3 KiB canonical-body limit ahead of either signature", () => {
    const body = baseBody({ payload: "x".repeat(4000) });
    const result = runSigner([{ body, admission: admitted(body) }]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("HALT unsigned-00.json");
    expect(result.stderr).toContain("BOARD_CALLS=0");
    expect(existsSync(result.destination)).toBe(false);
  });
});
