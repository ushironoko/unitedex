import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: ".",
  server: {
    open: true,
    port: 5173,
  },
  build: {
    minify: "esbuild",
    target: "es2015",
  },
});
