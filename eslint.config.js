import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: ["dist", "dist-ssr", "dev-dist", "node_modules", "**/*.cjs", "**/*.config.ts", "**/*.config.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Same two rules the old `plugin:react-hooks/recommended` preset gave us.
      // (v7's `recommended` preset also enables the React Compiler rules, which
      // are a separate, opt-in cleanup and not part of this config migration.)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
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
  },
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
);
