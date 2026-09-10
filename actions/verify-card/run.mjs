#!/usr/bin/env node
/**
 * Thin GitHub Action adapter around packages/gspc-card-verifier.
 *
 * Cryptographic and canonicalisation logic deliberately lives in the package;
 * this file only reads one local file, invokes verifyCard, maps its three-state
 * result to Action outputs, and chooses an exit status.
 */
import {
  appendFileSync,
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ownDir = dirname(fileURLToPath(import.meta.url));
const actionPath = resolve(process.env.CSOAI_ACTION_PATH || ownDir);
const verifierEntry = resolve(
  actionPath,
  "../../packages/gspc-card-verifier/src/index.mjs",
);
const MAX_CARD_BYTES = 1024 * 1024;

const oneLine = (value) =>
  String(value ?? "").replace(/[\r\n]+/g, " ").trim();

function emitOutputs(result, statedId = "") {
  const safeId = (value) =>
    typeof value === "string" && /^[0-9a-fA-F]{64}$/.test(value)
      ? value.toLowerCase()
      : "";
  const fixedReasons = {
    OK: "card id and signature verify under the pinned key",
    ID_MISMATCH: "the recomputed card id does not match the stated id",
    PUBKEY_NOT_PINNED: "the signing key is not the pinned profile key",
    SIGNATURE_MISMATCH: "the signature does not verify under the pinned key",
    OUT_OF_PROFILE_DOMAIN: "the card is outside the verifier's supported profile",
    INPUT_REQUIRED: "artifact is required",
    INVALID_ACTION_INPUT: "fail_on_mismatch must be exactly true or false",
    REMOTE_INPUT_UNSUPPORTED:
      "artifact must be a local path; retain remote evidence before verification",
    ARTIFACT_UNREADABLE: "artifact could not be read",
    ARTIFACT_NOT_REGULAR: "artifact must be a regular file",
    ARTIFACT_TOO_LARGE: "artifact exceeds the 1 MiB limit",
    MALFORMED_JSON: "artifact is not valid JSON",
    VERIFIER_UNAVAILABLE: "the bundled verifier could not be loaded",
    VERIFIER_ERROR: "the bundled verifier could not complete the check",
  };
  const values = {
    content_id: result.state === "VALID" ? "verified" : "unverified",
    verdict: result.state,
    id: safeId(result.id) || safeId(statedId),
    code: result.code,
    reason:
      fixedReasons[result.code] ||
      (result.state === "INVALID"
        ? "the card failed verification"
        : result.state === "UNCHECKABLE"
          ? "verification could not complete"
          : "card verification completed"),
  };
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    appendFileSync(
      outputPath,
      Object.entries(values)
        .map(([key, value]) => `${key}=${oneLine(value)}\n`)
        .join(""),
      "utf8",
    );
  }
  process.stdout.write(`${JSON.stringify(values)}\n`);
}

function unreadable(code, reason) {
  return { state: "UNCHECKABLE", code, reason };
}

function readBoundedRegularFile(path) {
  let metadata;
  try {
    metadata = lstatSync(path);
  } catch {
    throw Object.assign(new Error("artifact is not readable"), {
      code: "ARTIFACT_UNREADABLE",
    });
  }
  if (!metadata.isFile()) {
    throw Object.assign(new Error("artifact must be a regular file"), {
      code: "ARTIFACT_NOT_REGULAR",
    });
  }
  if (metadata.size > MAX_CARD_BYTES) {
    throw Object.assign(new Error("artifact exceeds the 1 MiB limit"), {
      code: "ARTIFACT_TOO_LARGE",
    });
  }

  let fd;
  try {
    const flags =
      constants.O_RDONLY |
      (constants.O_NONBLOCK || 0) |
      (constants.O_NOFOLLOW || 0);
    fd = openSync(path, flags);
    const opened = fstatSync(fd);
    if (!opened.isFile()) {
      throw Object.assign(new Error("artifact must be a regular file"), {
        code: "ARTIFACT_NOT_REGULAR",
      });
    }
    if (opened.size > MAX_CARD_BYTES) {
      throw Object.assign(new Error("artifact exceeds the 1 MiB limit"), {
        code: "ARTIFACT_TOO_LARGE",
      });
    }

    const buffer = Buffer.allocUnsafe(MAX_CARD_BYTES + 1);
    let used = 0;
    while (used <= MAX_CARD_BYTES) {
      const count = readSync(fd, buffer, used, buffer.length - used, null);
      if (count === 0) break;
      used += count;
    }
    if (used > MAX_CARD_BYTES) {
      throw Object.assign(new Error("artifact exceeds the 1 MiB limit"), {
        code: "ARTIFACT_TOO_LARGE",
      });
    }
    return buffer.subarray(0, used).toString("utf8");
  } catch (error) {
    if (error?.code?.startsWith?.("ARTIFACT_")) throw error;
    throw Object.assign(new Error("artifact is not readable"), {
      code: "ARTIFACT_UNREADABLE",
    });
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

const rawFail = (process.env.CSOAI_FAIL_ON_MISMATCH || "true").trim().toLowerCase();
if (rawFail !== "true" && rawFail !== "false") {
  const result = unreadable(
    "INVALID_ACTION_INPUT",
    "fail_on_mismatch must be exactly true or false",
  );
  emitOutputs(result);
  process.exitCode = 2;
} else {
  const failClosed = rawFail === "true";
  const artifact = process.env.CSOAI_ARTIFACT || "";
  let card;
  let result;

  if (!artifact) {
    result = unreadable("INPUT_REQUIRED", "artifact is required");
  } else if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(artifact)) {
    result = unreadable(
      "REMOTE_INPUT_UNSUPPORTED",
      "artifact must be a local path; download and retain remote evidence before verification",
    );
  } else {
    try {
      const text = readBoundedRegularFile(artifact);
      try {
        card = JSON.parse(text);
      } catch {
        throw Object.assign(new Error("artifact is not valid JSON"), {
          code: "MALFORMED_JSON",
        });
      }
    } catch (error) {
      result = unreadable(
        error?.code?.startsWith?.("ARTIFACT_") || error?.code === "MALFORMED_JSON"
          ? error.code
          : "ARTIFACT_UNREADABLE",
        error?.code === "ARTIFACT_TOO_LARGE"
          ? "artifact exceeds the 1 MiB limit"
          : error?.code === "ARTIFACT_NOT_REGULAR"
            ? "artifact must be a regular file"
            : error?.code === "MALFORMED_JSON"
              ? "artifact is not valid JSON"
              : "artifact could not be read",
      );
    }

    if (card !== undefined) {
      let verifier;
      try {
        verifier = await import(pathToFileURL(verifierEntry).href);
      } catch {
        result = unreadable(
          "VERIFIER_UNAVAILABLE",
          "the bundled verifier could not be loaded",
        );
      }
      if (verifier) {
        try {
          result = await verifier.verifyCard(card, verifier.defaultProfile());
        } catch {
          result = unreadable(
            "VERIFIER_ERROR",
            "the bundled verifier could not complete the check",
          );
        }
      }
    }
  }

  emitOutputs(result, card && typeof card.id === "string" ? card.id : "");
  if (failClosed && result.state !== "VALID") {
    process.exitCode = result.state === "INVALID" ? 1 : 2;
  }
}
