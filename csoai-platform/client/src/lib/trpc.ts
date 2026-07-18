import { createTRPCReact, httpBatchLink } from "@trpc/react-query";

// NOTE: The full AppRouter type lives in server/routers/routers.ts and is
// excluded from the client tsconfig. This client exports a permissive proxy
// so the build can type-check; for full end-to-end type safety the router
// type should be re-exported from shared/types and used here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trpcReact: any = createTRPCReact<any>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trpc = trpcReact as any;

export function createTRPCClient() {
  return trpcReact.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
      }),
    ],
  });
}
