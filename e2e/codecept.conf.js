const { setHeadlessWhen, setCommonPlugins } = require('@codeceptjs/configure');
// turn on headless mode when running with HEADLESS=true environment variable
// export HEADLESS=true && npx codeceptjs run
setHeadlessWhen(process.env.HEADLESS);

// enable all common plugins https://github.com/codeceptjs/configure#setcommonplugins
setCommonPlugins();
require('dotenv').config(); // dotenvを読み込む

/** @type {CodeceptJS.MainConfig} */
exports.config = {
  tests: "./**/*_test.js",
  output: "./output",
  helpers: {
    Playwright: {
      url: process.env.BASE_URL, // process.env.BASE_URL に環境変数が入っている
      show: true,
      browser: "chromium",
    },
  },
  include: {
    I: "./steps_file.js",
    utils: './utils'
  },
  translation: "en-US",
  vocabularies: ["./vocabularies.json"],
  name: "e2e",
};
