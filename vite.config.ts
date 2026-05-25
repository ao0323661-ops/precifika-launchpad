import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { componentTagger } from "lovable-tagger";
import tsconfigPaths from "vite-tsconfig-paths";

const SUPABASE_URL = "https://duocbjzbksjkywgvcszs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HlW5vrbmR5brW2IpxB6mYw_5kKE5j6f";
const PUBLIC_APP_URL = "https://precifika-launchpad.lovable.app";
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function normalizePublicAppUrl(value?: string) {
  const candidate = value?.trim() || PUBLIC_APP_URL;
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;

  try {
    const url = new URL(withProtocol);

    if (LOCAL_HOSTNAMES.has(url.hostname) || url.hostname.endsWith(".localhost")) {
      return PUBLIC_APP_URL;
    }

    return url.origin;
  } catch {
    return PUBLIC_APP_URL;
  }
}

function spaFallback404(): Plugin {
  let root = process.cwd();
  let outDir = "dist";

  return {
    name: "precifika-spa-fallback-404",
    apply: "build",
    configResolved(config) {
      root = config.root;
      outDir = config.build.outDir;
    },
    closeBundle() {
      const indexPath = resolve(root, outDir, "index.html");
      const fallbackPath = resolve(root, outDir, "404.html");

      if (existsSync(indexPath)) {
        copyFileSync(indexPath, fallbackPath);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || SUPABASE_URL;
  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY;
  const publicAppUrl = normalizePublicAppUrl(
    env.VITE_PUBLIC_APP_URL ||
      env.PUBLIC_APP_URL ||
      env.VITE_SITE_URL ||
      env.SITE_URL ||
      env.APP_URL,
  );

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
      "import.meta.env.VITE_PUBLIC_APP_URL": JSON.stringify(publicAppUrl),
    },
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      mode === "development" && componentTagger(),
      spaFallback404(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    ssr: {
      noExternal: ["h3", "h3-v2", "rou3", "srvx"],
    },
    server: {
      host: "::",
      port: 8080,
    },
  };
});
