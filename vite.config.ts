import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const ssrBundledDependencies = ["h3", "h3-v2", "rou3", "srvx"];
const ssrExternalDependencies = [
  "react",
  "react-dom",
  "react-dom/client",
  "react-dom/server",
  "react/jsx-dev-runtime",
  "react/jsx-runtime",
  "scheduler",
];

export default defineConfig({
  resolve: {
    alias: {
      "h3-v2": "h3",
    },
    noExternal: ssrBundledDependencies,
    external: ssrExternalDependencies,
  },
  ssr: {
    noExternal: ssrBundledDependencies,
    external: ssrExternalDependencies,
  },
});
