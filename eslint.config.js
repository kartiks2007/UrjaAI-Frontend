import js from "@eslint/js";
import globals from "globals";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default ts.config(
  {
    ignores: [
      "dist",
      "android",
      "android-dist",
      "review-dist",
      "local-dist",
      "integration-dist",
      "integration-results",
      "node_modules",
      "node_modules.corrupt",
      "node_modules.isolated",
      ".pnpm-store-fresh",
      "ai-demo-dist",
      "ai-test-results",
      "playwright-report",
      "test-results",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "react-hooks": hooks },
    rules: { ...hooks.configs.recommended.rules },
  },
  { files: ["**/*.{js,mjs}"], languageOptions: { globals: globals.node } },
);
