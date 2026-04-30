import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Keep native (Capacitor / Android) packages out of the static web bundle.
      // Use `await import("@capacitor/...")` inside an `isNative()` guard instead.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@capacitor/*", "@capawesome-team/*", "@capawesome/*"],
              message:
                "Do not statically import native modules. Use a dynamic `await import(...)` inside an `isNative()` guard (see src/utils/nativeBridge.ts).",
            },
          ],
        },
      ],
    },
  },
);
