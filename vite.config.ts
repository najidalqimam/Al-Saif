import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
    // The backend API (server/) runs separately; forwarding /api keeps the admin cookie same-origin.
    proxy: {
      "/api": { target: process.env.API_PROXY_TARGET || "http://127.0.0.1:4000", changeOrigin: false },
      // Dashboard uploads come from the API too: Vite only notices files added to public/ a moment later.
      "/uploads": { target: process.env.API_PROXY_TARGET || "http://127.0.0.1:4000", changeOrigin: false },
    },
  },
});
