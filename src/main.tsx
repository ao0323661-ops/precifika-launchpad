import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import {
  completeSupabaseAuthRedirect,
  normalizeSupabaseAuthCallbackUrl,
} from "./lib/supabase-auth-callback";
import "./styles.css";

async function bootstrap() {
  normalizeSupabaseAuthCallbackUrl();
  await completeSupabaseAuthRedirect();

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Elemento #root nao encontrado.");
  }

  const { createRouter } = await import("./router");

  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={createRouter()} />
    </StrictMode>,
  );
}

void bootstrap();
