const base = require("@pk-literature/eslint-config");

module.exports = [
  { ignores: [".next/**", ".open-next/**", "next-env.d.ts"] },
  ...base,
  {
    // App Router file-convention exports (metadata, generateMetadata,
    // default page/layout components) trip no-explicit-any/no-unused-vars
    // less often than the NestJS services this shared config was
    // written for, but JSX needs recognizing as a valid file type.
    files: ["**/*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
];
