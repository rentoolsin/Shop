module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", "node_modules", "*.cjs", "*.config.ts", "*.config.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    // TS already enforces unused-locals/params (tsconfig: noUnusedLocals/
    // noUnusedParameters) — avoid a second, differently-configured check
    // that would just duplicate tsc's own errors under a different rule.
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "warn",
  },
  overrides: [
    {
      // React context Provider + companion `useX()` hook, exported from the
      // same file, is the standard pattern this codebase already uses
      // (ToastProvider/useToast, AuthProvider/useAuth, ThemeProvider/
      // useTheme). Splitting the hook into its own file for Fast Refresh
      // granularity would hurt readability for a dev-server-only benefit,
      // so this rule is relaxed for these specific files rather than
      // reshaping the pattern.
      files: [
        "src/components/ui/Toast.tsx",
        "src/lib/auth.tsx",
        "src/lib/theme.tsx",
      ],
      rules: {
        "react-refresh/only-export-components": "off",
      },
    },
  ],
};
