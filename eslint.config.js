import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig(
    js.configs.recommended,
    {
        linterOptions: { reportUnusedDisableDirectives: true },
        rules: { "no-undef": "off" }
    }
);
