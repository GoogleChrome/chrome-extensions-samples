/* eslint-env node */
module.exports = {
  extends: ['prettier', 'eslint:recommended', 'plugin:import/recommended'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error'],
    'no-var': ['error'],
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ]
  },
  env: {
    browser: true,
    webextensions: true,
    es2021: true,
    jquery: true,
    serviceworker: true
  },
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  }
};
