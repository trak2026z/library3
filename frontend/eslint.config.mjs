import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: [".next/**", "node_modules/**", "dist/**", "coverage/**"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  },

  // ✅ Node globals dla Next config
  {
    files: ["next.config.mjs"],
    languageOptions: {
      globals: {
        process: "readonly"
      }
    }
  },

  {
    files: ["**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];