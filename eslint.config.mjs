import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**/*.mjs",
    "app/components/interior/**",
    "app/components/ui/**",
    "app/hooks/use-toast.ts",
  ]),
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
