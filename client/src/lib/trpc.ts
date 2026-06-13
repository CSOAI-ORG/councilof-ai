/**
 * CSOAI Platform - tRPC Client Configuration
 *
 * Type-safe API client for communicating with the CSOAI backend.
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../server/routers';

// Create tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Create tRPC client
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        headers() {
          const token = localStorage.getItem('csoai_token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
