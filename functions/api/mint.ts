// @openapi-not-implemented
import { unavailable } from "./_unavailable";

export const onRequestGet: PagesFunction = async () => unavailable(
  "/api/mint",
  "Mint a signed card from a validated atom",
);
