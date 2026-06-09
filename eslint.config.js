import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist", "Entrega - ACHADOS E PERDIDOS (1)"] },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaVersion: "latest", sourceType: "module" }
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  }
];
