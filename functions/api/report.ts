// @openapi-not-implemented
import { unavailable } from "./_unavailable";

const reply = () => unavailable(
  "/api/report",
  "Persist a correction report and return its durable reference",
);
export const onRequestGet: PagesFunction = async () => reply();
export const onRequestPost: PagesFunction = async () => reply();
