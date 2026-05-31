import { authRouter } from "./auth-router";
import { dataRouter } from "./data-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  data: dataRouter,
});

export type AppRouter = typeof appRouter;
