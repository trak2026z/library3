const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = [
  { ignores: ["dist/**", "node_modules/**", "coverage/**"] },

  js.configs.recommended,

  // TS lint (bazowy)
  ...tseslint.configs.recommended,

  // Type-aware rules tylko dla src (w tsconfig)
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname
      }
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  },

  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off"
    }
  },

  // ✅ override dla samego pliku konfiguracyjnego ESLint (CJS + Node globals)
  {
    files: ["eslint.config.js"],
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-require-imports": "off"
    }
  }
];