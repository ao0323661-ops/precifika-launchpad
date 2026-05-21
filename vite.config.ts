import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const ssrBundledDependencies = ["h3", "h3-v2", "rou3", "srvx"];

export default defineConfig({
  resolve: {
    alias: {
      "h3-v2": "h3",
    },
    noExternal: ssrBundledDependencies,
  },
  ssr: {
    noExternal: ssrBundledDependencies,
  },
});
