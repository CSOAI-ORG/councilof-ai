/**
 * /mcp — the public MCP endpoint.
 *
 * Mostly a transparent proxy to the GSPC MCP worker. TWO methods are handled here
 * instead of upstream:
 *
 *   tools/call name=verify — the upstream implementation answered
 *     {"valid":false,"reason":"unrecognized card family"} to EVERY card family CSOAI
 *     publishes, including the cross-border card that verifies fine under the published
 *     recipe. It looked for a `content_id` on cards that carry `id`. It is served here
 *     from functions/_lib/cardVerify.ts — the same module the browser verifier at
 *     /gspc-verify uses, so the two surfaces can never disagree again.
 *
 *   tools/call name=measure | jail-probe — mill-tool DROPPED. Do not claim a signed
 *     measurement card from this door. Use read-only board_totals / get_axis.
 *     npm csoai-gspc-mcp four tools stay honest: board_totals get_axis verify_card list_cards.
 *     POST /v1/measure is 404; this handler does not implement it.
 *
 * Everything else is forwarded untouched.
 */

import { verifyCard, anchorsFromDid, type Anchor } from "../_lib/cardVerify";
// The ONE tool-definition source, shared byte-for-byte with the stdio server
// (mcp/gspc-server — npm: csoai-gspc-mcp). Neither surface defines these seven
// tools anywhere else, so the two cannot drift.
import GSPC_TOOLS from "./gspc-tools.json";

const UPSTREAM = "https://csoai-gspc-mcp.nicholastempleman.workers.dev/mcp";

/** Card URLs may be fetched only from the estate's own published origins. */
const FETCHABLE_ORIGINS = ["https://councilof.ai/", "https://csoai.org/", "https://www.csoai.org/"];
