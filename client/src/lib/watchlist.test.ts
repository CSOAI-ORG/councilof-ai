import { describe, expect, it } from "vitest";
import {
  applyDigest,
  digestFromHubModel,
  dropWatch,
  emptyWatchlist,
  parseWatchIds,
  upsertWatch,
  WATCHLIST_CAP,
  WATCHLIST_RULING,
} from "./watchlist";

describe("vendor watchlist", () => {
  it("caps at fifty and never stamps MEASURED", () => {
    expect(WATCHLIST_RULING).toMatch(/Not MEASURED/);
    expect(WATCHLIST_CAP).toBe(50);
    const ids = parseWatchIds("Qwen/Qwen3.8-27B, gpt2; openai/whisper-tiny");
    expect(ids).toEqual(["Qwen/Qwen3.8-27B", "openai/whisper-tiny"]);
    const list = upsertWatch(emptyWatchlist(), ids);
    expect(list.map((r) => r.id)).toEqual(ids);
    expect(dropWatch(list, "openai/whisper-tiny")).toHaveLength(1);
    const many = upsertWatch(
      emptyWatchlist(),
      Array.from({ length: 60 }, (_, i) => `org/m${i}`),
    );
    expect(many).toHaveLength(50);
    expect(WATCHLIST_RULING).toMatch(/Not MEASURED/);
    expect(JSON.stringify(list)).not.toMatch(/"status":"MEASURED"/);
  });

  it("flags a moved sha256 and reads Hub LFS siblings", () => {
    const shaA = "a".repeat(64);
    const shaB = "b".repeat(64);
    const row = applyDigest(
      { id: "org/m", added: "t0", last_sha256: shaA, last_checked: "t0", digest_moved: false },
      shaB,
      "t1",
    );
    expect(row.digest_moved).toBe(true);
    expect(row.last_sha256).toBe(shaB);
    expect(
      digestFromHubModel({
        siblings: [{ rfilename: "x" }, { rfilename: "w.bin", lfs: { sha256: shaA } }],
      }),
    ).toBe(shaA);
    expect(digestFromHubModel({ siblings: [] })).toBeNull();
  });
});
