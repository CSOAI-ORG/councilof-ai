// Keep the slash alias on the same method-specific handlers as the JSON manifest.
import { onRequestGet as manifestGet, onRequestHead as manifestHead } from "../x402.json";

export const onRequestGet: typeof manifestGet = (context) => manifestGet(context);
export const onRequestHead: typeof manifestHead = (context) => manifestHead(context);
