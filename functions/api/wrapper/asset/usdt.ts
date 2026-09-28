// GET /api/wrapper/asset/usdt — one per-asset wrapper door. The handler derives the asset from the path;
// this file exists so Pages routes the static path and so the manifest parity test can import it.
export { onRequestGet, onRequestPost, onRequestHead } from "./[asset]";
