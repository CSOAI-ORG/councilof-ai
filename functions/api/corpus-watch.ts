// @openapi-not-implemented
import { unavailable } from "./_unavailable";

const reply = () => unavailable(
  "/api/corpus-watch",
  "Return a sourced, current corpus inventory",
);
export const onRequestGet: PagesFunction = async () => reply();
export const onRequestPost: PagesFunction = async () => reply();
