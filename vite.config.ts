import { defineConfig } from "@lovable.dev/vite-tanstack-config";


export default defineConfig({
  ssr: {
    noExternal: true,
  },
  resolve: {
    alias: {
      "h3-v2": "h3",
    },
  },
});
