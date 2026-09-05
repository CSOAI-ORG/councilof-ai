// @openapi-not-implemented
import { unavailable } from "./_unavailable";

const reply = () => unavailable(
  "/api/subscribe",
  "Create and persist an attestation-monitoring subscription",
);
export const onRequestGet: PagesFunction = async () => reply();
export const onRequestPost: PagesFunction = async () => reply();
