import { defineConfig } from "vite";
import { defineConfig as lovableConfig } from "@lovable.dev/vite-tanstack-config";

const baseConfig = lovableConfig({});

export default defineConfig({
  ...baseConfig,
  resolve: {
    ...baseConfig.resolve,
    alias: {
      ...baseConfig.resolve?.alias,
      "h3-v2": "h3",
    },
  },
  ssr: {
    ...baseConfig.ssr,
    noExternal: true,
  },
});