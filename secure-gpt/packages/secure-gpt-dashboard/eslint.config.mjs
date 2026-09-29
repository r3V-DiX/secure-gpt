import nextConfig from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/components/ui/**",
      "src/components/data-display/data-table.tsx",
      "src/app/(app)/users/components/UserCsvImportModal.tsx",
      "src/app/(app)/team/components/TeamCsvImportModal.tsx",
    ],
    rules: {
      "no-restricted-syntax": ["error",
        { selector: "JSXOpeningElement[name.name='button']", message: "Use the shared Button or IconButton from @/components/ui." },
        { selector: "JSXOpeningElement[name.name='select']", message: "Use the shared Select from @/components/ui." },
        { selector: "JSXOpeningElement[name.name='textarea']", message: "Use the shared Textarea from @/components/ui." },
        { selector: "JSXOpeningElement[name.name='table']", message: "Use the shared Table primitives from @/components/ui." },
        { selector: "JSXOpeningElement[name.name='input']:not(:has(JSXAttribute[name.name='type'][value.value='file']))", message: "Use a shared form or selection control from @/components/ui." },
      ],
    },
  },
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
