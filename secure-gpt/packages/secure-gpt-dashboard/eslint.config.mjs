import nextConfig from "eslint-config-next/index.js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextConfig,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];
