/* eslint-env node */
module.exports = {
  extends: ["prettier", "eslint:recommended"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": ["error"],
    "no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
  env: {
    browser: true,
    webextensions: true,
    es2021: true,
    jquery: true,
    worker: true,
  },
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
};
