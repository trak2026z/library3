import { defineConfig } from "vitest/config";

export default defineConfig({
  // ✅ sprawia, że JSX nie potrzebuje `React` w scope
  esbuild: {
    jsx: "automatic"
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"]
  }
});