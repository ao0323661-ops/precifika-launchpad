import { defineConfig } from "vite";
import { defineConfig as lovableConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig(async (env) => {
  const configFactory = lovableConfig({});
  const baseConfig = await (typeof configFactory === 'function' ? configFactory(env) : configFactory);
  
  return {
    ...baseConfig,
    ssr: {
      ...baseConfig.ssr,
      noExternal: true,
    },
    resolve: {
      ...baseConfig.resolve,
      alias: {
        ...baseConfig.resolve?.alias,
        "h3-v2": "h3",
      },
    },
  } as any;
});