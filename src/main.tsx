import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { createRouter } from "./router";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento #root nao encontrado.");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={createRouter()} />
  </StrictMode>,
);
