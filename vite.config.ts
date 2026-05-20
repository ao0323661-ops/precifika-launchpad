import { defineConfig } from "vite";
import { defineConfig as lovableConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig(async (env) => {
  const configFactory = lovableConfig({});
  const baseConfig = typeof configFactory === 'function' ? await configFactory(env) : configFactory;
  
  return {
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
  };
});