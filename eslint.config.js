const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    // md5.js is a third-party library, and node_modules holds the lint tools
    ignores: ["node_modules/", "public/js/md5.js"],
  },
  js.configs.recommended,
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script",
      globals: globals.browser,
    },
  },
  {
    files: ["eslint.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
];
