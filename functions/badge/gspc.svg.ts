// GET /badge/gspc.svg — the stable badge URL the model-card block quotes
// (P0.4, CSOAI_FRONTEND_REACH_AGENTS_01Sep2026 · A5). A pure alias of
// GET /api/badge: same handler, same live derivation from the axis arrays
// GET /api/gspc serves, so the count in the image can never drift from the
// board. Query params pass straight through — ?format=shields returns the
// shields.io endpoint JSON ({schemaVersion,label,message,color}) for
// https://img.shields.io/endpoint?url=https%3A%2F%2Fcouncilof.ai%2Fbadge%2Fgspc.svg%3Fformat%3Dshields
// Doctrine: measurement, not certification. No "certified" badge exists.
export { onRequestGet } from "../api/badge";
