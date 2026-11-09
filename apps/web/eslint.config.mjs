import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Enforce React hook dependencies
      "react-hooks/exhaustive-deps": "error",
      // No unused vars (allow _ prefix for intentionally unused)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // No explicit any without justification
      "@typescript-eslint/no-explicit-any": "warn",
      // Prefer const
      "prefer-const": "error",
      // No console.log in production code (warn, allow console.error/warn)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Enforce consistent imports
      "no-duplicate-imports": "error",
    },
  },
  {
    // Test files can use any and console
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
]

export default eslintConfig
