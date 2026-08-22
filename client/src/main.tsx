/**
 * CSOAI Platform - Client Entry Point
 *
 * Council of AI — measured AI governance infrastructure
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, createTRPCClient } from './lib/trpc';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './styles/index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Create tRPC client
const trpcClient = createTRPCClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* Ported pages from the dashboard use react-helmet-async for <title>.
            Without this provider they throw at render, not at build. */}
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>
);
