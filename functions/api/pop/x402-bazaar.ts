// GET /api/pop/x402-bazaar — one population door. The handler derives the population from the path;
// this file exists so Pages routes the static path and so the manifest test can import it.
export { onRequestGet, onRequestPost } from "../_population_door";
