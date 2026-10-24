#!/usr/bin/env python3
"""Offline, bounded failure projection. Never retain provider bodies, URLs or errors."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import stat
from pathlib import Path

from build_stablecoin_promotion_queue import (
    INDEX_REL, READINESS_REL, DEEP_REL, SOURCES_REL, COHORT1_REL, REPLAY_RELS, OUTPUT_REL,
)

SCHEMA = "csoai.stablecoin-failure-snapshot/0.1"
INDEX_BLOB = "25a5353e58678e36595135d5eb30b0adcf29dbe6"
INPUTS = (INDEX_REL, READINESS_REL, DEEP_REL, SOURCES_REL, COHORT1_REL, *REPLAY_RELS, OUTPUT_REL)
FROZEN_IDS = frozenset("1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 37 38 39 40 41 42 43 44 45 46 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 70 71 72 73 74 75 76 78 79 81 82 83 84 85 87 88 89 90 91 92 93 94 96 97 98 99 100 101 102 103 104 105 106 107 108 109 110 111 112 113 114 115 116 117 118 119 120 121 122 123 124 125 126 127 128 129 130 131 132 133 134 135 137 138 139 140 142 143 144 145 146 147 148 149 150 151 152 153 154 155 157 158 159 160 161 162 163 164 165 166 167 168 169 170 171 172 173 174 175 176 177 178 179 180 181 182 183 184 185 186 187 188 189 190 191 192 193 195 196 197 198 199 200 201 202 203 204 205 206 207 208 209 210 211 212 213 214 215 216 217 218 219 220 221 222 223 224 225 226 227 228 229 230 231 232 233 234 235 236 237 238 239 240 241 242 243 244 245 246 247 248 250 251 252 253 254 255 256 258 259 260 261 262 263 264 265 266 267 268 269 271 272 273 274 275 276 277 278 279 280 281 282 283 284 285 286 287 288 289 290 291 292 293 294 295 296 297 298 299 300 301 302 303 304 305 306 307 308 309 310 311 312 313 314 315 316 317 318 319 320 321 322 323 324 325 326 327 328 329 330 331 332 333 334 335 336 337 338 339 340 341 342 343 344 345 346 347 348 349 350 351 352 353 354 355 356 357 358 359 360 361 362 363 364 365 366 367 368 369 370 371 372 373 374 375 376 377 378 379 380 381 382 383 384 385 386 387 388 389 390 391 392 393 394 395 396 397 398 399 400 401 402 403 404 405 406 407 408 409 410 411 412 413 414 415 416 417 418 419 420 421 422 423 424 425 426 427 428 429 430 431 432 433 434 435 436 437 438 439 440".split())
MAX_INPUT = 8 * 1024 * 1024
MAX_REPORT = 2 * 1024 * 1024
STATES = {"OK", "MISSING", "UNREADABLE", "OVERSIZE", "INVALID_JSON", "INVALID_SHAPE", "SYMLINK", "NON_REGULAR", "UNKNOWN"}
ACTIONS = {
    "PUBLISH_ASSET_SPECIFIC_PROTOCOL_DOORS", "SIGN_ROOT_WITNESS_ANCHOR",
    "STAGE_REPLAYED_MEASUREMENT", "RECONCILE_REPLAY_IDENTITY",
    "REPLAY_EXISTING_MEASUREMENT_AT_RECORDED_HEIGHT",
    "BUILD_REPRODUCIBLE_CHAIN_MEASUREMENT", "RUN_PRIMARY_SOURCE_DEEP_PROBE",
    "REVIEW_ISSUER_SITE_FOR_ATTESTATION", "REGISTER_PRIMARY_SOURCES",
}
BOOL_FIELDS = ("source_registered", "issuer_registered", "queue_measured",
               "queue_replay_ready", "queue_replay_hold")
HEX64 = re.compile(r"[0-9a-f]{64}\Z")
HEX40 = re.compile(r"[0-9a-f]{40}\Z")
IDENTITY = re.compile(r"[0-9]{1,6}\Z")


def enum(value, allowed, default="UNKNOWN"):
    return value if isinstance(value, str) and value in allowed else default


def digest(value):
    return value if isinstance(value, str) and HEX64.fullmatch(value) else None


def identity(value):
    if type(value) not in (str, int):
        return None
    value = str(value)
    return value if IDENTITY.fullmatch(value) else None


def read_json(path: Path, limit: int = MAX_INPUT):
    """No exception text escapes. Read at most limit+1 bytes; reject symlink paths."""
    descriptor = None
    try:
        if any(p.is_symlink() for p in (path, *path.parents)):
            return {}, {"state": "SYMLINK", "sha256": None}, None
        descriptor = os.open(path, os.O_RDONLY | os.O_NONBLOCK | getattr(os, "O_NOFOLLOW", 0))
        if not stat.S_ISREG(os.fstat(descriptor).st_mode):
            return {}, {"state": "NON_REGULAR", "sha256": None}, None
        with os.fdopen(descriptor, "rb") as stream:
            descriptor = None
            raw = stream.read(limit + 1)
    except FileNotFoundError:
        return {}, {"state": "MISSING", "sha256": None}, None
    except OSError:
        return {}, {"state": "UNREADABLE", "sha256": None}, None
    finally:
        if descriptor is not None:
            os.close(descriptor)
    if len(raw) > limit:
        return {}, {"state": "OVERSIZE", "sha256": None}, None
    sha = hashlib.sha256(raw).hexdigest()
    try:
        data = json.loads(raw)
    except (ValueError, UnicodeError, RecursionError):
        return {}, {"state": "INVALID_JSON", "sha256": sha}, raw
    if not isinstance(data, dict):
        return {}, {"state": "INVALID_SHAPE", "sha256": sha}, raw
    return data, {"state": "OK", "sha256": sha}, raw


def records(data, key, complete=False):
    rows = data.get(key)
    if not isinstance(rows, list) or len(rows) > 425:
        return None
    out = {}
    for row in rows:
        if not isinstance(row, dict):
            return None
        asset_id = identity(row.get("id"))
        if asset_id not in FROZEN_IDS or asset_id in out:
            return None
        out[asset_id] = row
    if complete and set(out) != FROZEN_IDS:
        return None
    return out


def clean_snapshot(data):
    """Reproject even our own baseline; unknown keys/strings can never be forwarded."""
    if not isinstance(data, dict) or data.get("schema") != SCHEMA:
        return None
    revision = data.get("source_revision")
    inputs = data.get("inputs")
    rows = data.get("rows")
    if not isinstance(inputs, list) or len(inputs) != len(INPUTS):
        return None
    if not isinstance(rows, list) or len(rows) > 425:
        return None
    cleaned_inputs = []
    for expected, item in zip(INPUTS, inputs):
        if not isinstance(item, dict) or item.get("path") != str(expected):
            return None
        cleaned_inputs.append({"path": str(expected), "state": enum(item.get("state"), STATES),
                               "sha256": digest(item.get("sha256"))})
    cleaned_rows, seen = [], set()
    for row in rows:
        if not isinstance(row, dict):
            return None
        key = identity(row.get("id"))
        if key is None or key in seen:
            return None
        seen.add(key)
        item = {"id": key}
        for field in BOOL_FIELDS:
            item[field] = row.get(field) if type(row.get(field)) is bool else None
        item["deep_state"] = enum(row.get("deep_state"), {"DEEP_PROBED", "UNMEASURED", "NOT_SCHEDULED"})
        item["measurement_state"] = enum(row.get("measurement_state"), {"MEASURED", "UNMEASURED"})
        item["queue_action"] = enum(row.get("queue_action"), ACTIONS)
        item["deep_sha256"] = digest(row.get("deep_sha256"))
        item["mirror_sha256"] = digest(row.get("mirror_sha256"))
        item["mirror_metadata_state"] = enum(row.get("mirror_metadata_state"), STATES)
        status = row.get("mirror_http")
        item["mirror_http"] = status if type(status) is int and 100 <= status <= 599 else None
        cleaned_rows.append(item)
    index_state = enum(data.get("index_state"), {"PINNED_425", "UNVERIFIED"})
    if index_state == "PINNED_425" and (
        seen != FROZEN_IDS or cleaned_inputs[0]["state"] != "OK"
        or cleaned_inputs[0]["sha256"] is None
    ):
        return None
    if index_state != "PINNED_425" and cleaned_rows:
        return None
    return {
        "schema": SCHEMA,
        "source_revision": revision if isinstance(revision, str) and HEX40.fullmatch(revision) else None,
        "index_state": index_state,
        "inputs": cleaned_inputs,
        "rows": sorted(cleaned_rows, key=lambda row: int(row["id"])),
    }


def snapshot(repo: Path, source_revision: str | None = None):
    documents, inputs, index_raw = {}, [], None
    for rel in INPUTS:
        data, receipt, raw = read_json(repo / rel)
        documents[rel] = data
        inputs.append({"path": str(rel), **receipt})
        if rel == INDEX_REL:
            index_raw = raw
    collections = {}
    for rel, key, complete in (
        (INDEX_REL, "assets", True), (READINESS_REL, "assets", True),
        (SOURCES_REL, "sources", True), (DEEP_REL, "rows", False),
        (OUTPUT_REL, "rows", True),
    ):
        receipt = next(item for item in inputs if item["path"] == str(rel))
        collection = records(documents[rel], key, complete) if receipt["state"] == "OK" else None
        if receipt["state"] == "OK" and collection is None:
            receipt["state"] = "INVALID_SHAPE"
        collections[rel] = collection
    index = collections[INDEX_REL]
    blob = (hashlib.sha1(b"blob " + str(len(index_raw)).encode() + b"\0" + index_raw).hexdigest()
            if index_raw is not None else None)
    pinned = blob == INDEX_BLOB and index is not None
    sources = collections[SOURCES_REL]
    readiness = collections[READINESS_REL]
    deep = collections[DEEP_REL]
    queue = collections[OUTPUT_REL]
    rows = []
    # Unverified index bytes never define the identifiers of the diagnostic.
    for key in sorted(index if pinned else [], key=int):
        d = (deep or {}).get(key, {})
        q = (queue or {}).get(key, {}).get("states")
        q = q if isinstance(q, dict) else {}
        measurement = (readiness or {}).get(key, {}).get("measurement")
        measurement = measurement if isinstance(measurement, dict) else {}
        meta, receipt, _ = read_json(repo / DEEP_REL.parent / "mirrors" / (key + ".meta.json"), 65536) if key in (deep or {}) else ({}, {"state": "MISSING"}, None)
        rows.append({
            "id": key,
            "source_registered": bool(sources[key].get("attestation_page")) if sources is not None else None,
            "issuer_registered": bool(sources[key].get("issuer_site")) if sources is not None else None,
            "deep_state": d.get("measurement_state", "NOT_SCHEDULED") if deep is not None else "UNKNOWN",
            "measurement_state": measurement.get("state"),
            "queue_measured": q.get("measured"),
            "queue_replay_ready": q.get("replay_stage_ready"),
            "queue_replay_hold": q.get("replay_identity_hold"),
            "queue_action": (queue or {}).get(key, {}).get("next_action"),
            "deep_sha256": d.get("mirror_sha256"),
            "mirror_sha256": meta.get("sha256"),
            "mirror_http": meta.get("http"),
            "mirror_metadata_state": receipt["state"],
        })
    return clean_snapshot({"schema": SCHEMA, "source_revision": source_revision,
                           "index_state": "PINNED_425" if pinned else "UNVERIFIED",
                           "inputs": inputs, "rows": rows})


def failure_report(current, baseline):
    before = clean_snapshot(baseline)
    after = clean_snapshot(current)
    if after is None:
        raise ValueError("INVALID_CURRENT_SNAPSHOT")
    old = {r["id"]: r for r in before["rows"]} if before else {}
    new = {r["id"]: r for r in after["rows"]}
    comparable = (before is not None and before["index_state"] == after["index_state"] == "PINNED_425"
                  and old.keys() == new.keys() and before["inputs"][0]["sha256"] == after["inputs"][0]["sha256"])
    changed = [key for key in sorted(old, key=int) if old[key] != new[key]] if comparable else []
    return {
        "schema": "csoai.stablecoin-failure-diagnostics/0.1",
        "baseline_state": "AVAILABLE" if before else "UNAVAILABLE",
        "comparison_state": "AVAILABLE" if comparable else "UNAVAILABLE",
        "before": before, "after": after, "changed_ids": changed,
        "boundary": "Offline projections only. Queue bytes may predate current inputs; compare input hashes. No root-cause or measurement claim.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--source-revision")
    parser.add_argument("--baseline", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    current = snapshot(args.repo_root, args.source_revision)
    data = failure_report(current, read_json(args.baseline, MAX_REPORT)[0]) if args.baseline else current
    rendered = (json.dumps(data, sort_keys=True, indent=2) + "\n").encode()
    if len(rendered) > MAX_REPORT:
        raise SystemExit("DIAGNOSTIC_SIZE_LIMIT")
    # Caller provides a dedicated runner-temp file, never a production input path.
    args.output.write_bytes(rendered)
    print("STABLECOIN_DIAGNOSTIC_WRITTEN")


if __name__ == "__main__":
    main()
