// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/citas": {
        target: "http://localhost:5092",
        changeOrigin: true,
      },
      "/api/recetas": { 
        target: "http://localhost:5092", 
        changeOrigin: true 
      },
      "/api": {
        target: "http://localhost:5151",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
