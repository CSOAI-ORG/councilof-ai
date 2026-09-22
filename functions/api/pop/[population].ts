// GET /api/pop/<anything else> — the dynamic fallback: a 404 that names the known population ids
// (never the SPA shell, never a settle). Known ids are routed by their static files beside this one.
export { onRequestGet, onRequestPost } from "../_population_door";
