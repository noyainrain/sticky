import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig(
  js.configs.recommended,
  // https://prettier.io/docs/rationale
  stylistic.configs.customize({ braceStyle: "1tbs", semi: true, quotes: "double" }),
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    rules: { "no-undef": "off" },
  },
);
