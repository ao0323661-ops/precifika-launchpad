import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { tanstackStartVite } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    TanStackRouterVite(),
    tanstackStartVite(),
    react(),
  ],
  ssr: {
    noExternal: true,
  },
  resolve: {
    alias: {
      "h3-v2": "h3",
    },
  },
});