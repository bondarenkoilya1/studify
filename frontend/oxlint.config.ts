import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
  },
  plugins: ["eslint", "typescript", "react", "jsx-a11y", "import", "nextjs", "oxc"],
  ignorePatterns: [
    ".next/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ],
  settings: {
    react: {
      version: "19.2",
    },
  },
  rules: {
    eqeqeq: "error",
    "no-debugger": "error",
    "no-duplicate-imports": "error",
    "no-unreachable": "error",
    "no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "prefer-const": "error",
    "typescript/ban-ts-comment": "warn",
    "typescript/no-explicit-any": "warn",
    "typescript/no-extra-non-null-assertion": "error",
    "typescript/no-non-null-asserted-optional-chain": "error",
    "typescript/no-require-imports": "error",
    "react/exhaustive-deps": "warn",
    "react/jsx-key": "error",
    "react/rules-of-hooks": "error",
    "react/react-in-jsx-scope": "off",
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-has-content": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-role": "error",
    "jsx-a11y/heading-has-content": "error",
    "jsx-a11y/html-has-lang": "error",
    "jsx-a11y/iframe-has-title": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error",
    "import/no-duplicates": "error",
  },
});
