// /api/arena/rounds.jsonl — clean alias for the arena feed (audit rec: no
// legacy prefix in a machine contract). Same KV source; old path kept for
// existing consumers.
export { onRequestGet } from "../sov-arena/rounds.jsonl.js";
