// @openapi-not-implemented
import { unavailable } from "./_unavailable";

const reply = () => unavailable(
  "/api/worker",
  "Return current durable worker-queue and anchor-processing state",
);
export const onRequestGet: PagesFunction = async () => reply();
export const onRequestPost: PagesFunction = async () => reply();
