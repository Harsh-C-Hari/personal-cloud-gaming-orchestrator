import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
    {
        ignores: ["dist"],
    },

    js.configs.recommended,

    {
        files: ["**/*.{js,jsx}"],

        languageOptions: {
            globals: globals.browser,

            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",

                ecmaFeatures: {
                    jsx: true,
                },
            },
        },

        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },

        rules: {
            ...reactHooks.configs.recommended.rules,

            "react-hooks/exhaustive-deps": "off",
            "react-refresh/only-export-components": [
                "warn",
                {
                    allowConstantExport: true,
                },
            ],
            "no-unused-vars": "off",
        },
    },

    {
        // frontend/qa/**/*.mjs is a Node-run Playwright QA harness, not
        // browser app code. Its top-level code runs in Node (process,
        // console, etc.) while some callback bodies (e.g. the function
        // passed to `context.addInitScript`) are serialized and executed
        // inside the browser (localStorage, etc.). ESLint can't tell those
        // two contexts apart statically within one file, so this override
        // provides both Node and browser globals for this directory only.
        // Scoped narrowly to avoid weakening linting for `frontend/src/**`.
        files: ["qa/**/*.mjs"],

        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
            },

            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
    },
];