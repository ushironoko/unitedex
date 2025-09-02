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
    rollupOptions: {
      output: {
        manualChunks: {
          "pokemon-data": ["./src/data/pokemonMatchupData.ts"],
        },
      },
    },
    // Ensure large arrays are not removed
    minify: "esbuild",
    target: "es2015",
  },
});