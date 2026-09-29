// functions/api/chat.ts - Ask SOV entry (helpers are _-private modules)
import { onRequestPost as groundedPost } from "./_chatGrounded";
import { recordUsage } from "../_lib/usage";

export { onRequestOptions } from "./_chatGrounded";

/** The reply's state, reduced to the words /api/usage counts (grounded / unknown / needs_input / ...). */
export function chatUsageState(status: number, state: unknown): string {
  if (status >= 400) return "error";
  if (state === "ungrounded") return "unknown";
  return typeof state === "string" && state ? state : "unknown";
}

// Aggregate usage only (functions/_lib/usage.ts): the reply's state word. No question text is kept.
export const onRequestPost: typeof groundedPost = async (ctx) => {
  const res = await groundedPost(ctx);
  const c = ctx as unknown as { request: Request; env?: unknown; waitUntil?: (p: Promise<unknown>) => void };
  if (c.env && c.waitUntil) {
    c.waitUntil(
      res.clone().json()
        .then((j) => { recordUsage(c, "chat_state", chatUsageState(res.status, (j as { state?: unknown })?.state)); })
        .catch(() => { recordUsage(c, "chat_state", chatUsageState(res.status, null)); }),
    );
  }
  return res;
};
