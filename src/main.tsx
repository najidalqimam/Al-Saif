import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

// Scrolling the page with the mouse wheel must never change a number box under the pointer: drop its focus first.
document.addEventListener(
  "wheel",
  (event) => {
    const field = document.activeElement;
    if (field instanceof HTMLInputElement && field.type === "number" && event.target === field) field.blur();
  },
  { passive: true },
);

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router base={base}>
      <App />
    </Router>
  </StrictMode>,
);
