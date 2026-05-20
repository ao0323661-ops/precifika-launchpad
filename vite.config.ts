import { defineConfig } from "vite";
import { defineConfig as lovableConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig((env) => {
  const configFactory = lovableConfig({});
  const baseConfig = typeof configFactory === 'function' ? configFactory(env) : configFactory;
  
  return {
    ...baseConfig,
    ssr: {
      ...baseConfig.ssr,
      noExternal: true,
    },
  };
});