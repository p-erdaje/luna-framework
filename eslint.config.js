// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" }
      ],
      "no-magic-numbers": [
        "warn",
        { ignore: [-1, 0, 1], ignoreArrayIndexes: true }
      ],
      "prefer-const": "error",
      "no-var": "error"
    }
  },
  {
    ignores: ["dist/**", "coverage/**", "node_modules/**", "*.config.*"]
  }
);
