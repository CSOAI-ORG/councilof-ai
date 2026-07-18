// Day 12 BLOCK 1: vite.config.ts (was missing from the M2 master)
// Configures the @/ path alias + Vite plugin stack + build output.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
});
