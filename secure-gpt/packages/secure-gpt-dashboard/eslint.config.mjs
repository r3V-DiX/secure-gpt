import nextConfig from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    ignores: [".next/**", ".next-admin/**", "out/**", "build/**", "dist/**", "next-env.d.ts"],
  },
];
