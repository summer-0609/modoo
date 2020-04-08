"use strict";

const { execSync } = require("child_process");

function shouldUseYarn() {
  try {
    execSync("yarnpkg --version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  shouldUseYarn,
};
