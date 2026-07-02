import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    ignores: ["**/dist/**", "**/build/**", "**/node_modules/**", "**/*.config.*", "**/venv/**", "**/.next/**", "**/public/**", "**/.gemini/**"],
  },
  {
    files: ["**/*.mjs", "**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  { 
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/consistent-type-imports": ["warn", { "prefer": "type-imports" }],
      "@typescript-eslint/no-floating-promises": "warn",
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  }
);
