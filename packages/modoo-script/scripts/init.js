"use strict";

process.on("unhandledRejection", err => {
  throw err;
});

const fs = require("fs-extra");
const path = require("path");
const chalk = require("react-dev-utils/chalk");

module.exports = function (
  appPath,
  appName,
  verbose,
  originalDirectory,
  templateName
) {
  const appPackage = require(path.join(appPath, "package.json"));
  const useYarn = fs.existsSync(path.join(appPath, "yarn.lock"));

  if (!templateName) {
    console.log("");
    console.error(
      `A template was not provided. This is likely because you're using an outdated version of ${chalk.cyan(
        "create-modoo-app"
      )}.`
    );
    console.error(
      `Please note that global installs of ${chalk.cyan(
        "create-modoo-app"
      )} are no longer supported.`
    );
    return;
  }

  const templatePath = path.join(
    require.resolve(templateName, { paths: [appPath] }),
    ".."
  );

  console.log(1, templatePath);
};
