// @ts-check
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const importPlugin = require("eslint-plugin-import");

// Enforces coding-guidelines.md: "A service never imports another
// service's internal modules — only packages/contracts types cross the
// boundary." This is the cheap alternative to adopting Nx just for its
// dependency-graph enforcement (see repository-layout.md's monorepo
// tooling discussion).
const SERVICES = [
  "api-catalog",
  "api-feed",
  "api-search",
  "api-commerce",
  "api-identity",
  "api-publisher-import",
  "publisher-crawler",
  "web",
];

const serviceBoundaryZones = SERVICES.map((service) => ({
  target: `./apps/${service}/src`,
  from: SERVICES.filter((s) => s !== service).map((s) => `./apps/${s}/src`),
  message:
    "A service may not import another service's internal modules. Shared types belong in packages/contracts (see coding-guidelines.md).",
}));

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { import: importPlugin },
    rules: {
      "import/no-restricted-paths": [
        "error",
        { zones: serviceBoundaryZones },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.js.map"],
  },
];
