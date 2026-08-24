#!/usr/bin/env node
/** Wait until vite preview responds on BASE_URL (default http://127.0.0.1:4173). */
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const maxMs = Number(process.env.PREVIEW_WAIT_MS || 60_000);
const start = Date.now();

async function probe() {
  try {
    const res = await fetch(base, { redirect: "follow" });
    return res.status < 500;
  } catch {
    return false;
  }
}

(async () => {
  while (Date.now() - start < maxMs) {
    if (await probe()) {
      console.log(`[wait-preview] ready ${base} (${Date.now() - start}ms)`);
      process.exit(0);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.error(`[wait-preview] timeout waiting for ${base}`);
  process.exit(1);
})();
