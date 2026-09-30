// GET /api/pop/ots-proofs — one population door. The handler derives the population from the path;
// this file exists so Pages routes the static path and so the manifest test can import it.
export { onRequestGet, onRequestPost, onRequestHead } from "../_population_door";
