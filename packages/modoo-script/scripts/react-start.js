const chalk = require("chalk");
const webpack = require("webpack");
const paths = require("../config/paths");
const WebpackDevServer = require("webpack-dev-server");

const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls
} = require("react-dev-utils/WebpackDevServerUtils");

const isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(
    `Learn more here: ${chalk.yellow("https://bit.ly/CRA-advanced-config")}`
  );
  console.log();
}

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

choosePort(HOST, DEFAULT_PORT).then(port => {
  if (port == null) {
    // We have not found a port.
    return;
  }
  const protocol = process.env.HTTPS === "true" ? "https" : "http";
  const appName = require(paths.appPackageJson).name;

  // Load proxy config
  const proxySetting = require(paths.appPackageJson).proxy;
  const proxyConfig = prepareProxy(proxySetting, paths.appPublic);

  // Create a webpack compiler that is configured with custom messages.
  const compiler = createCompiler(
    webpack,
    config,
    appName,
    urls,
    true,
    proxyConfig
  );
});

module.exports = ({ dev, post }) => {
  console.log(1, 42312);
};
