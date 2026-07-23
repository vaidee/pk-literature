const base = require("@pk-literature/eslint-config");

module.exports = [
  ...base,
  {
    files: ["**/*.tsx"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
];
