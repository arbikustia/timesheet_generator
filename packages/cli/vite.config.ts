import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";

// Bundles the `timesheet` CLI (Node, ESM) with the shared document code from `src/`.
export default defineConfig({
  publicDir: false,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("../../src", import.meta.url)),
    },
  },
  ssr: {
    noExternal: true,
  },
  build: {
    ssr: fileURLToPath(new URL("./src/main.ts", import.meta.url)),
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    target: "node20",
    minify: false,
    rollupOptions: {
      output: {
        entryFileNames: "timesheet.mjs",
        banner: "#!/usr/bin/env node",
      },
    },
  },
});
