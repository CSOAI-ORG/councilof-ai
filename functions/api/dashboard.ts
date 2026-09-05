// @openapi-not-implemented
import { unavailable } from "./_unavailable";

const reply = () => unavailable(
  "/api/dashboard",
  "Legacy aggregate dashboard API; use /api/dashboard/stats for its scoped response",
);
export const onRequestGet: PagesFunction = async () => reply();
export const onRequestPost: PagesFunction = async () => reply();
